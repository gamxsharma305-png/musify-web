import { ArrowLeft, CloudOff, Heart, History, Play } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { SongBar } from "./song-bar";
import { useMusify } from "@/lib/musify/store";

export function UserSongsPage({ kind }: { kind: string }) {
  const navigate = useNavigate();
  const liked = useMusify((s) => s.likedSongs);
  const recents = useMusify((s) => s.recentlyPlayed);
  const playSongs = useMusify((s) => s.playSongs);

  const isLiked = kind === "liked";
  const isOffline = kind === "offline";
  const title = isLiked ? "Liked songs" : isOffline ? "Offline songs" : "Recently played";
  const Icon = isLiked ? Heart : isOffline ? CloudOff : History;
  const songs = isLiked ? liked : isOffline ? [] : recents;

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center gap-1 px-2">
        <button
          type="button"
          aria-label="Back"
          className="flex size-11 items-center justify-center text-muted"
          onClick={() => navigate({ to: "/library" })}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="musify-title flex-1 text-center text-[26px] text-primary">{title}</h1>
        <span className="size-11" />
      </header>
      <div className="px-2.5 pb-6">
        {isOffline ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <CloudOff className="size-10" />
            </span>
            <p className="mt-4 text-lg font-semibold">Offline mode</p>
            <p className="mt-2 text-sm text-muted">
              Offline downloads stay on the Android app. Liked and recently played tracks are saved in this browser.
            </p>
          </div>
        ) : songs.length === 0 ? (
          <div className="flex flex-col items-center px-6 py-16 text-center">
            <span className="flex size-20 items-center justify-center rounded-full bg-primary-container text-on-primary-container">
              <Icon className="size-10" />
            </span>
            <p className="mt-4 text-sm text-muted">No songs in playlist</p>
          </div>
        ) : (
          <>
            <button
              type="button"
              className="mb-2 flex h-12 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-on-primary"
              onClick={() => playSongs(songs, 0)}
            >
              <Play className="size-5" fill="currentColor" />
              Play
            </button>
            {songs.map((song, i) => (
              <SongBar
                key={song.ytid}
                song={song}
                index={i}
                songs={songs}
                isRecent={!isLiked}
              />
            ))}
          </>
        )}
      </div>
    </div>
  );
}
