import { useEffect, useState } from "react";
import { ArrowLeft, Heart, Play, Shuffle } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Artwork } from "./artwork";
import { SongBar } from "./song-bar";
import { findCurated } from "@/lib/musify/catalog";
import { playlistSongsFn } from "@/lib/musify/youtube";
import { useMusify } from "@/lib/musify/store";
import type { Song } from "@/lib/musify/types";
import { toast } from "sonner";

export function PlaylistPage({ ytid }: { ytid: string }) {
  const navigate = useNavigate();
  const curated = findCurated(ytid);
  const custom = useMusify((s) => s.customPlaylists.find((p) => p.ytid === ytid));
  const likedPlaylists = useMusify((s) => s.likedPlaylists);
  const likedMeta = likedPlaylists.find((p) => p.ytid === ytid);
  const [title, setTitle] = useState(custom?.title || curated?.title || likedMeta?.title || "Playlist");
  const [image, setImage] = useState(custom?.image || curated?.image || likedMeta?.image || "");
  const [songs, setSongs] = useState<Song[]>(custom?.list ?? []);
  const [loading, setLoading] = useState(!custom);
  const playSongs = useMusify((s) => s.playSongs);
  const toggleLikePlaylist = useMusify((s) => s.toggleLikePlaylist);
  const isLiked = useMusify((s) => s.likedPlaylists.some((p) => p.ytid === ytid));
  const removeFromPlaylist = useMusify((s) => s.removeFromPlaylist);

  useEffect(() => {
    if (custom) {
      setSongs(custom.list);
      setTitle(custom.title);
      setImage(custom.image);
      setLoading(false);
      return;
    }
    let cancelled = false;
    setLoading(true);
    playlistSongsFn({ data: { ytid } })
      .then((res) => {
        if (cancelled) return;
        setSongs(res.songs);
        if (res.title) setTitle(res.title);
      })
      .catch(() => {
        if (!cancelled) toast("Failed to load playlist");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [ytid, custom]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative">
        <div className="h-56 overflow-hidden bg-surface-high">
          <Artwork src={image || songs[0]?.image} alt={title} className="size-full" radius="rounded-none" />
          <div className="absolute inset-0 bg-linear-to-t from-bg via-bg/40 to-black/20" />
        </div>
        <button
          type="button"
          aria-label="Back"
          className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-md bg-surface-highest/80 text-fg"
          onClick={() => window.history.length > 1 ? window.history.back() : navigate({ to: "/library" })}
        >
          <ArrowLeft className="size-5" />
        </button>
      </div>
      <div className="px-4 pt-4">
        <h1 className="text-2xl font-bold text-fg">{title}</h1>
        <p className="mt-1 text-sm text-muted">
          {curated?.isAlbum ? "Album" : "Playlist"} · {songs.length} songs
        </p>
        <div className="mt-4 flex items-center gap-3">
          <button
            type="button"
            className="flex h-12 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-on-primary"
            onClick={() => playSongs(songs, 0)}
            disabled={songs.length === 0}
          >
            <Play className="size-5" fill="currentColor" />
            Play
          </button>
          <button
            type="button"
            className="flex h-12 items-center gap-2 rounded-full bg-secondary-container px-5 font-semibold text-on-secondary-container"
            onClick={() => {
              const shuffled = [...songs].sort(() => Math.random() - 0.5);
              playSongs(shuffled, 0);
            }}
            disabled={songs.length === 0}
          >
            <Shuffle className="size-5" />
            Shuffle
          </button>
          <button
            type="button"
            aria-label="Like playlist"
            className="flex size-12 items-center justify-center text-primary"
            onClick={() =>
              toggleLikePlaylist({
                ytid,
                title,
                image,
                isAlbum: curated?.isAlbum,
                list: songs,
              })
            }
          >
            <Heart className="size-6" fill={isLiked ? "currentColor" : "none"} />
          </button>
        </div>
      </div>
      <div className="mt-4 px-2.5 pb-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 8 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-lg bg-surface-low" />
            ))}
          </div>
        ) : songs.length === 0 ? (
          <p className="py-10 text-center text-sm text-muted">No songs in playlist</p>
        ) : (
          songs.map((song, i) => (
            <SongBar
              key={`${song.ytid}-${i}`}
              song={song}
              index={i}
              songs={songs}
              onRemove={
                custom
                  ? () => {
                      removeFromPlaylist(ytid, song.ytid);
                    }
                  : undefined
              }
            />
          ))
        )}
      </div>
    </div>
  );
}
