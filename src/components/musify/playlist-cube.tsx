import { Artwork } from "./artwork";
import { cn } from "@/lib/utils";
import type { Playlist } from "@/lib/musify/types";

export function PlaylistCube({
  playlist,
  className,
  showLabel = true,
}: {
  playlist: Playlist;
  className?: string;
  showLabel?: boolean;
}) {
  return (
    <div
      className={cn(
        "relative aspect-square overflow-hidden rounded-lg bg-surface-high",
        className,
      )}
    >
      <Artwork src={playlist.image} alt={playlist.title} className="size-full" radius="rounded-lg" />
      {showLabel && playlist.image ? (
        <span className="absolute top-2.5 right-2.5 rounded-full bg-primary-container/90 px-2.5 py-1 text-[11px] font-bold tracking-wide text-on-primary-container">
          {playlist.isAlbum ? "ALBUM" : "PLAYLIST"}
        </span>
      ) : null}
    </div>
  );
}
