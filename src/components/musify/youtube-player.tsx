import { useEffect, useRef } from "react";
import { useMusify } from "@/lib/musify/store";

declare global {
  interface Window {
    YT?: {
      Player: new (
        el: HTMLElement | string,
        opts: Record<string, unknown>,
      ) => YtPlayer;
      PlayerState: { PLAYING: number; PAUSED: number; ENDED: number; BUFFERING: number };
    };
    onYouTubeIframeAPIReady?: () => void;
  }
}

type YtPlayer = {
  loadVideoById: (id: string, start?: number) => void;
  playVideo: () => void;
  pauseVideo: () => void;
  seekTo: (seconds: number, allowSeekAhead: boolean) => void;
  getCurrentTime: () => number;
  getDuration: () => number;
  getPlayerState: () => number;
  setVolume: (v: number) => void;
  destroy: () => void;
};

let apiPromise: Promise<void> | null = null;

function loadApi() {
  if (window.YT?.Player) return Promise.resolve();
  if (apiPromise) return apiPromise;
  apiPromise = new Promise((resolve) => {
    const existing = document.querySelector('script[src*="youtube.com/iframe_api"]');
    if (!existing) {
      const tag = document.createElement("script");
      tag.src = "https://www.youtube.com/iframe_api";
      document.head.appendChild(tag);
    }
    const prev = window.onYouTubeIframeAPIReady;
    window.onYouTubeIframeAPIReady = () => {
      prev?.();
      resolve();
    };
    if (window.YT?.Player) resolve();
  });
  return apiPromise;
}

export function PlaybackEngine() {
  const hostRef = useRef<HTMLDivElement>(null);
  const playerRef = useRef<YtPlayer | null>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);
  const readyRef = useRef(false);
  const lastIdRef = useRef<string | null>(null);
  const seekFlag = useRef(false);
  const wantPlayRef = useRef(false);

  const source = useMusify((s) => s.source);
  const isPlaying = useMusify((s) => s.isPlaying);
  const index = useMusify((s) => s.index);
  const queue = useMusify((s) => s.queue);
  const radioUrl = useMusify((s) => s.radioUrl);
  const volume = useMusify((s) => s.volume);
  const seekRequest = useMusify((s) => s.seekRequest);
  const song = queue[index] ?? null;

  useEffect(() => {
    wantPlayRef.current = isPlaying;
  }, [isPlaying]);

  useEffect(() => {
    let cancelled = false;
    loadApi().then(() => {
      if (cancelled || !hostRef.current || playerRef.current) return;
      const mount = document.createElement("div");
      hostRef.current.appendChild(mount);
      playerRef.current = new window.YT!.Player(mount, {
        width: 200,
        height: 113,
        host: "https://www.youtube-nocookie.com",
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          origin: window.location.origin,
        },
        events: {
          onReady: () => {
            readyRef.current = true;
            playerRef.current?.setVolume(Math.round(useMusify.getState().volume * 100));
            const current = useMusify.getState().queue[useMusify.getState().index];
            if (current && useMusify.getState().source === "youtube") {
              lastIdRef.current = current.ytid;
              playerRef.current?.loadVideoById(current.ytid);
            }
          },
          onStateChange: (e: { data: number }) => {
            const YT = window.YT;
            if (!YT) return;
            if (e.data === YT.PlayerState.ENDED) {
              useMusify.getState().next();
            } else if (e.data === YT.PlayerState.PLAYING) {
              useMusify.getState().setPlaying(true);
              try {
                if ("mediaSession" in navigator) {
                  navigator.mediaSession.playbackState = "playing";
                }
              } catch {
                /* */
              }
              const dur = playerRef.current?.getDuration() ?? 0;
              if (dur > 0) useMusify.getState().setDuration(dur);
            } else if (e.data === YT.PlayerState.PAUSED) {
              if (!wantPlayRef.current) {
                useMusify.getState().setPlaying(false);
                try {
                  if ("mediaSession" in navigator) {
                    navigator.mediaSession.playbackState = "paused";
                  }
                } catch {
                  /* */
                }
              } else {
                // Browser paused us (background) — try resume
                try {
                  playerRef.current?.playVideo();
                } catch {
                  /* */
                }
              }
            }
          },
        },
      });
    });
    return () => {
      cancelled = true;
    };
  }, []);

  useEffect(() => {
    if (source !== "youtube" || !song) {
      playerRef.current?.pauseVideo();
      return;
    }
    if (!readyRef.current || !playerRef.current) return;
    if (lastIdRef.current !== song.ytid) {
      lastIdRef.current = song.ytid;
      playerRef.current.loadVideoById(song.ytid);
    }
  }, [source, song?.ytid]);

  useEffect(() => {
    if (!readyRef.current || !playerRef.current || source !== "youtube") return;
    if (isPlaying) playerRef.current.playVideo();
    else playerRef.current.pauseVideo();
  }, [isPlaying, source, song?.ytid]);

  useEffect(() => {
    playerRef.current?.setVolume(Math.round(volume * 100));
    if (audioRef.current) audioRef.current.volume = volume;
  }, [volume]);

  useEffect(() => {
    if (source !== "youtube" || !playerRef.current || !readyRef.current) return;
    if (seekRequest == null) return;
    playerRef.current.seekTo(seekRequest, true);
    useMusify.setState({ seekRequest: null });
  }, [seekRequest, source]);

  useEffect(() => {
    const id = window.setInterval(() => {
      const p = playerRef.current;
      if (!p || !readyRef.current || seekFlag.current) return;
      if (useMusify.getState().source !== "youtube") return;
      if (!useMusify.getState().isPlaying) return;
      try {
        const t = p.getCurrentTime();
        const d = p.getDuration();
        if (Number.isFinite(t)) useMusify.setState({ position: t });
        if (Number.isFinite(d) && d > 0) useMusify.getState().setDuration(d);
        if ("mediaSession" in navigator && Number.isFinite(d) && d > 0) {
          try {
            navigator.mediaSession.setPositionState({
              duration: d,
              position: Math.min(t, d),
              playbackRate: 1,
            });
          } catch {
            /* */
          }
        }
        // Keep alive if stalled while user wants play
        if (wantPlayRef.current) {
          const st = p.getPlayerState();
          const YT = window.YT;
          if (YT && (st === YT.PlayerState.PAUSED || st === YT.PlayerState.BUFFERING)) {
            p.playVideo();
          }
        }
      } catch {
        /* player not ready */
      }
    }, 400);
    return () => window.clearInterval(id);
  }, []);

  // Background / swipe-away: resume when tab visible again + periodic kick
  useEffect(() => {
    const resumeIfNeeded = () => {
      if (!wantPlayRef.current) return;
      const st = useMusify.getState();
      if (!st.isPlaying) return;
      if (st.source === "youtube" && playerRef.current && readyRef.current) {
        try {
          playerRef.current.playVideo();
        } catch {
          /* */
        }
      }
      if (st.source === "radio" && audioRef.current && st.radioUrl) {
        void audioRef.current.play().catch(() => {});
      }
    };

    const onVis = () => {
      if (document.visibilityState === "visible") resumeIfNeeded();
      else if (wantPlayRef.current) resumeIfNeeded();
    };

    document.addEventListener("visibilitychange", onVis);
    window.addEventListener("pageshow", resumeIfNeeded);
    window.addEventListener("focus", resumeIfNeeded);
    window.addEventListener("online", resumeIfNeeded);

    const kick = window.setInterval(() => {
      if (!wantPlayRef.current) return;
      resumeIfNeeded();
    }, 3500);

    return () => {
      document.removeEventListener("visibilitychange", onVis);
      window.removeEventListener("pageshow", resumeIfNeeded);
      window.removeEventListener("focus", resumeIfNeeded);
      window.removeEventListener("online", resumeIfNeeded);
      window.clearInterval(kick);
    };
  }, []);

  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;
    if (source !== "radio" || !radioUrl) {
      audio.pause();
      return;
    }
    if (audio.src !== radioUrl) audio.src = radioUrl;
    if (isPlaying) void audio.play().catch(() => useMusify.getState().setPlaying(false));
    else audio.pause();
  }, [source, radioUrl, isPlaying]);

  useEffect(() => {
    const songNow = useMusify.getState().queue[useMusify.getState().index];
    const radioName = useMusify.getState().radioName;
    if (!("mediaSession" in navigator)) return;
    if (useMusify.getState().source === "radio" && radioName) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: radioName,
        artist: "Radio",
      });
      navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
      return;
    }
    if (!songNow) return;
    navigator.mediaSession.metadata = new MediaMetadata({
      title: songNow.title,
      artist: songNow.artist,
      artwork: songNow.image
        ? [{ src: songNow.image, sizes: "512x512", type: "image/jpeg" }]
        : [],
    });
    navigator.mediaSession.playbackState = isPlaying ? "playing" : "paused";
    navigator.mediaSession.setActionHandler("play", () =>
      useMusify.getState().setPlaying(true),
    );
    navigator.mediaSession.setActionHandler("pause", () =>
      useMusify.getState().setPlaying(false),
    );
    navigator.mediaSession.setActionHandler("previoustrack", () =>
      useMusify.getState().prev(),
    );
    navigator.mediaSession.setActionHandler("nexttrack", () =>
      useMusify.getState().next(),
    );
  }, [song?.ytid, source, radioUrl, isPlaying]);

  return (
    <div className="pointer-events-none absolute h-0 w-0 overflow-hidden opacity-0" aria-hidden>
      <div ref={hostRef} />
      <audio ref={audioRef} crossOrigin="anonymous" playsInline />
    </div>
  );
}
