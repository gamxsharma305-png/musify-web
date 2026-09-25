import { ChevronRight, Heart, ListMusic, MoreVertical, Pin, Trash2 } from "lucide-react";
import { Artwork } from "./artwork";
import type { Playlist } from "@/lib/musify/types";
import { useMusify } from "@/lib/musify/store";
import { useNavigate } from "@tanstack/react-router";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";

export function PlaylistBar({
  title,
  icon,
  image,
  onClick,
  playlist,
  radius = "none",
  showMenu = false,
}: {
  title: string;
  icon?: React.ReactNode;
  image?: string;
  onClick: () => void;
  playlist?: Playlist;
  radius?: "first" | "last" | "none";
  showMenu?: boolean;
}) {
  const navigate = useNavigate();
  const toggleLikePlaylist = useMusify((s) => s.toggleLikePlaylist);
  const liked = useMusify((s) =>
    playlist ? s.likedPlaylists.some((p) => p.ytid === playlist.ytid) : false,
  );
  const togglePin = useMusify((s) => s.togglePin);
  const pinned = useMusify((s) =>
    playlist ? s.pinnedIds.includes(playlist.ytid) : false,
  );
  const deletePlaylist = useMusify((s) => s.deletePlaylist);

  const radiusClass =
    radius === "first"
      ? "rounded-t-lg"
      : radius === "last"
        ? "rounded-b-lg"
        : "";

  return (
    <div
      className={cn(
        "flex items-center gap-1 bg-surface-low pr-1",
        radiusClass,
      )}
    >
      <button
        type="button"
        onClick={onClick}
        className="flex min-w-0 flex-1 items-center gap-3.5 px-3 py-2.5 text-left"
      >
        {image || playlist?.image ? (
          <Artwork
            src={image || playlist?.image}
            alt={title}
            className="size-[52px] shrink-0"
            radius="rounded-lg"
          />
        ) : (
          <span className="cookie-shape flex size-[52px] shrink-0 items-center justify-center bg-secondary-container text-on-secondary-container">
            {icon ?? <ListMusic className="size-6" />}
          </span>
        )}
        <span className="min-w-0 flex-1 truncate text-[15px] font-semibold text-primary">
          {title}
        </span>
        <ChevronRight className="size-5 shrink-0 text-muted" />
      </button>
      {showMenu && playlist ? (
        <DropdownMenu>
          <DropdownMenuTrigger asChild>
            <button
              type="button"
              className="flex size-11 items-center justify-center text-muted"
              aria-label="More options"
            >
              <MoreVertical className="size-5" />
            </button>
          </DropdownMenuTrigger>
          <DropdownMenuContent align="end">
            <DropdownMenuItem
              onSelect={() =>
                navigate({
                  to: "/playlist/$ytid",
                  params: { ytid: playlist.ytid },
                })
              }
            >
              Open
            </DropdownMenuItem>
            <DropdownMenuItem
              onSelect={() => {
                toggleLikePlaylist(playlist);
              }}
            >
              <Heart className="size-4 text-primary" fill={liked ? "currentColor" : "none"} />
              {liked ? "Remove from liked playlists" : "Add to liked playlists"}
            </DropdownMenuItem>
            <DropdownMenuItem onSelect={() => togglePin(playlist.ytid)}>
              <Pin className="size-4 text-primary" />
              {pinned ? "Unpin" : "Pin to library"}
            </DropdownMenuItem>
            {playlist.source === "user-created" ? (
              <DropdownMenuItem onSelect={() => deletePlaylist(playlist.ytid)}>
                <Trash2 className="size-4 text-primary" />
                Delete playlist
              </DropdownMenuItem>
            ) : null}
          </DropdownMenuContent>
        </DropdownMenu>
      ) : null}
    </div>
  );
}
