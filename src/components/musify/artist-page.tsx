import { useEffect, useState } from "react";
import { ArrowLeft, Play } from "lucide-react";
import { useNavigate } from "@tanstack/react-router";
import { Artwork } from "./artwork";
import { SongBar } from "./song-bar";
import { artistSongsFn, searchSongsFn } from "@/lib/musify/youtube";
import type { Song } from "@/lib/musify/types";
import { useMusify } from "@/lib/musify/store";
import { toast } from "sonner";

export function ArtistPage({ id, name }: { id: string; name?: string }) {
  const navigate = useNavigate();
  const [title, setTitle] = useState(name || "Artist");
  const [image, setImage] = useState("");
  const [songs, setSongs] = useState<Song[]>([]);
  const [loading, setLoading] = useState(true);
  const playSongs = useMusify((s) => s.playSongs);

  useEffect(() => {
    let cancelled = false;
    setLoading(true);
    const load = id.startsWith("UC")
      ? artistSongsFn({ data: { id } })
      : searchSongsFn({ data: { q: name || id } }).then((list) => ({
          name: name || id,
          image: list[0]?.image ?? "",
          songs: list,
        }));
    load
      .then((res) => {
        if (cancelled) return;
        setTitle(res.name || name || "Artist");
        setImage(res.image);
        setSongs(res.songs);
      })
      .catch(() => {
        if (!cancelled) toast("Artist not found. Check logs or try again.");
      })
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => {
      cancelled = true;
    };
  }, [id, name]);

  return (
    <div className="flex min-h-full flex-col">
      <div className="relative h-52 overflow-hidden bg-surface-high">
        <Artwork src={image} alt={title} className="size-full" radius="rounded-none" />
        <div className="absolute inset-0 bg-linear-to-t from-bg to-black/10" />
        <button
          type="button"
          aria-label="Back"
          className="absolute top-3 left-3 flex size-11 items-center justify-center rounded-md bg-surface-highest/80 text-fg"
          onClick={() => navigate({ to: "/search" })}
        >
          <ArrowLeft className="size-5" />
        </button>
        <h1 className="absolute bottom-4 left-4 text-3xl font-bold text-fg">{title}</h1>
      </div>
      <div className="px-4 py-4">
        <button
          type="button"
          className="flex h-12 items-center gap-2 rounded-full bg-primary px-5 font-semibold text-on-primary"
          onClick={() => playSongs(songs, 0)}
          disabled={songs.length === 0}
        >
          <Play className="size-5" fill="currentColor" />
          Play
        </button>
      </div>
      <div className="px-2.5 pb-6">
        {loading ? (
          <div className="space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-lg bg-surface-low" />
            ))}
          </div>
        ) : (
          songs.map((song, i) => (
            <SongBar key={song.ytid} song={song} index={i} songs={songs} />
          ))
        )}
      </div>
    </div>
  );
}
