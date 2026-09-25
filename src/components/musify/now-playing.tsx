import {
  ChevronDown,
  Heart,
  ListMusic,
  Pause,
  Play,
  Repeat,
  Repeat1,
  Shuffle,
  SkipBack,
  SkipForward,
  Timer,
} from "lucide-react";
import { useEffect, useState } from "react";
import { Artwork } from "./artwork";
import { Slider } from "@/components/ui/slider";
import { formatDuration } from "@/lib/musify/format";
import { lyricsFn } from "@/lib/musify/youtube";
import { useMusify } from "@/lib/musify/store";
import { toast } from "sonner";

export function NowPlaying() {
  const open = useMusify((s) => s.nowPlayingOpen);
  const setOpen = useMusify((s) => s.setNowPlayingOpen);
  const song = useMusify((s) => s.queue[s.index] ?? null);
  const isPlaying = useMusify((s) => s.isPlaying);
  const position = useMusify((s) => s.position);
  const duration = useMusify((s) => s.duration);
  const togglePlay = useMusify((s) => s.togglePlay);
  const next = useMusify((s) => s.next);
  const prev = useMusify((s) => s.prev);
  const seek = useMusify((s) => s.seek);
  const shuffle = useMusify((s) => s.shuffle);
  const toggleShuffle = useMusify((s) => s.toggleShuffle);
  const repeat = useMusify((s) => s.repeat);
  const cycleRepeat = useMusify((s) => s.cycleRepeat);
  const liked = useMusify((s) =>
    song ? s.likedSongs.some((x) => x.ytid === song.ytid) : false,
  );
  const toggleLikeSong = useMusify((s) => s.toggleLikeSong);
  const lyrics = useMusify((s) => s.lyrics);
  const lyricsOpen = useMusify((s) => s.lyricsOpen);
  const setLyrics = useMusify((s) => s.setLyrics);
  const setLyricsOpen = useMusify((s) => s.setLyricsOpen);
  const queue = useMusify((s) => s.queue);
  const jumpTo = useMusify((s) => s.jumpTo);
  const index = useMusify((s) => s.index);
  const [showQueue, setShowQueue] = useState(false);

  useEffect(() => {
    if (!open || !song || lyrics) return;
    let cancelled = false;
    lyricsFn({ data: { title: song.title, artist: song.artist } })
      .then((text) => {
        if (!cancelled) setLyrics(text);
      })
      .catch(() => {
        if (!cancelled) setLyrics(null);
      });
    return () => {
      cancelled = true;
    };
  }, [open, song?.ytid, lyrics, setLyrics, song]);

  if (!open || !song) return null;

  const RepeatIcon = repeat === "one" ? Repeat1 : Repeat;

  return (
    <div className="fixed inset-0 z-50 flex flex-col bg-bg">
      <div className="flex items-center px-2 py-2">
        <button
          type="button"
          aria-label="Close"
          className="flex size-11 items-center justify-center rounded-md bg-surface-highest text-fg"
          onClick={() => setOpen(false)}
        >
          <ChevronDown className="size-6" />
        </button>
      </div>
      <div className="flex min-h-0 flex-1 flex-col px-5 pb-6">
        <div className="flex flex-[5] items-center justify-center py-2">
          <button
            type="button"
            className="relative aspect-square w-full max-w-[min(100%,420px)]"
            onClick={() => setLyricsOpen(!lyricsOpen)}
          >
            {lyricsOpen ? (
              <div className="size-full overflow-y-auto rounded-2xl bg-surface-low p-5 text-left text-sm leading-relaxed text-fg whitespace-pre-wrap">
                {lyrics || "Lyrics not available"}
              </div>
            ) : (
              <Artwork
                src={song.image}
                alt={song.title}
                className="size-full"
                radius="rounded-2xl"
              />
            )}
          </button>
        </div>
        <div className="flex flex-[4] flex-col justify-center gap-4">
          <div className="px-2 text-center">
            <p className="truncate text-xl font-bold text-primary">{song.title}</p>
            <p className="mt-1 truncate text-base font-medium text-muted">{song.artist}</p>
          </div>
          <div>
            <Slider
              min={0}
              max={Math.max(duration, 1)}
              step={1}
              value={[position]}
              onValueChange={(v) => seek(v[0] ?? 0)}
            />
            <div className="mt-1 flex justify-between text-xs tabular-nums text-muted">
              <span>{formatDuration(position)}</span>
              <span>{formatDuration(duration)}</span>
            </div>
          </div>
          <div className="flex items-center justify-center gap-3">
            <button
              type="button"
              aria-label="Shuffle"
              className={`flex size-11 items-center justify-center ${shuffle ? "text-primary" : "text-muted"}`}
              onClick={toggleShuffle}
            >
              <Shuffle className="size-5" />
            </button>
            <button
              type="button"
              aria-label="Skip to previous"
              className="flex size-12 items-center justify-center text-fg"
              onClick={prev}
            >
              <SkipBack className="size-8" fill="currentColor" />
            </button>
            <button
              type="button"
              aria-label={isPlaying ? "Pause" : "Play"}
              className="flex size-16 items-center justify-center rounded-full bg-primary text-on-primary"
              onClick={togglePlay}
            >
              {isPlaying ? (
                <Pause className="size-8" fill="currentColor" />
              ) : (
                <Play className="size-8 pl-0.5" fill="currentColor" />
              )}
            </button>
            <button
              type="button"
              aria-label="Skip to next"
              className="flex size-12 items-center justify-center text-fg"
              onClick={next}
            >
              <SkipForward className="size-8" fill="currentColor" />
            </button>
            <button
              type="button"
              aria-label="Repeat"
              className={`flex size-11 items-center justify-center ${repeat === "off" ? "text-muted" : "text-primary"}`}
              onClick={cycleRepeat}
            >
              <RepeatIcon className="size-5" />
            </button>
          </div>
        </div>
        <div className="flex items-center justify-around pt-2">
          <button
            type="button"
            aria-label="Like"
            className="flex size-11 items-center justify-center text-primary"
            onClick={() => {
              toggleLikeSong(song);
              toast(liked ? "Removed from liked songs" : "Added to liked songs");
            }}
          >
            <Heart className="size-6" fill={liked ? "currentColor" : "none"} />
          </button>
          <button
            type="button"
            aria-label="Queue"
            className="flex size-11 items-center justify-center text-muted"
            onClick={() => setShowQueue((v) => !v)}
          >
            <ListMusic className="size-6" />
          </button>
          <button
            type="button"
            aria-label="Sleep timer"
            className="flex size-11 items-center justify-center text-muted"
            onClick={() => toast("Sleep timer set")}
          >
            <Timer className="size-6" />
          </button>
        </div>
        {showQueue ? (
          <div className="mt-3 max-h-48 overflow-y-auto rounded-xl bg-surface-low p-2">
            {queue.map((item, i) => (
              <button
                key={`${item.ytid}-${i}`}
                type="button"
                className={`flex w-full items-center gap-3 rounded-md px-2 py-2 text-left ${i === index ? "bg-surface-high" : ""}`}
                onClick={() => jumpTo(i)}
              >
                <span className="min-w-0 flex-1 truncate text-sm text-fg">{item.title}</span>
                <span className="truncate text-xs text-muted">{item.artist}</span>
              </button>
            ))}
          </div>
        ) : null}
      </div>
    </div>
  );
}
