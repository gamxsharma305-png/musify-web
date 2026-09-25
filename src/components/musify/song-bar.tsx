import {
  Heart,
  MoreVertical,
  ListPlus,
  ListMusic,
  User,
  Trash2,
} from "lucide-react";
import { toast } from "sonner";
import { Artwork } from "./artwork";
import { formatDuration } from "@/lib/musify/format";
import { useMusify } from "@/lib/musify/store";
import type { Song } from "@/lib/musify/types";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { useNavigate } from "@tanstack/react-router";

export function SongBar({
  song,
  index,
  songs,
  isRecent = false,
  onRemove,
}: {
  song: Song;
  index: number;
  songs: Song[];
  isRecent?: boolean;
  onRemove?: () => void;
}) {
  const playSongs = useMusify((s) => s.playSongs);
  const toggleLikeSong = useMusify((s) => s.toggleLikeSong);
  const liked = useMusify((s) => s.likedSongs.some((x) => x.ytid === song.ytid));
  const playNext = useMusify((s) => s.playNext);
  const addToQueue = useMusify((s) => s.addToQueue);
  const customPlaylists = useMusify((s) => s.customPlaylists);
  const addToPlaylist = useMusify((s) => s.addToPlaylist);
  const createPlaylist = useMusify((s) => s.createPlaylist);
  const removeRecentlyPlayed = useMusify((s) => s.removeRecentlyPlayed);
  const navigate = useNavigate();

  return (
    <div className="flex items-center gap-3 rounded-lg px-2.5 py-3">
      <button
        type="button"
        className="flex min-w-0 flex-1 items-center gap-3 text-left"
        onClick={() => playSongs(songs, index)}
      >
        <Artwork
          src={song.image}
          alt={song.title}
          className="size-14 shrink-0"
          radius="rounded-lg"
        />
        <div className="min-w-0 flex-1">
          <p className="truncate text-[15px] font-bold text-primary">{song.title}</p>
          <p className="truncate text-sm text-muted">
            {song.artist}
            {song.duration > 0 ? ` • ${formatDuration(song.duration)}` : ""}
          </p>
        </div>
      </button>
      <button
        type="button"
        aria-label={liked ? "Remove from liked songs" : "Add to liked songs"}
        className="flex size-11 items-center justify-center text-primary"
        onClick={() => {
          toggleLikeSong(song);
          toast(liked ? "Removed from liked songs" : "Added to liked songs");
        }}
      >
        <Heart className="size-5" fill={liked ? "currentColor" : "none"} />
      </button>
      <DropdownMenu>
        <DropdownMenuTrigger asChild>
          <button
            type="button"
            aria-label="More options"
            className="flex size-11 items-center justify-center text-muted"
          >
            <MoreVertical className="size-5" />
          </button>
        </DropdownMenuTrigger>
        <DropdownMenuContent align="end">
          <DropdownMenuItem onSelect={() => playNext(song)}>
            <ListMusic className="size-4 text-primary" />
            Play next
          </DropdownMenuItem>
          {song.artist ? (
            <DropdownMenuItem
              onSelect={() =>
                navigate({
                  to: "/artist/$id",
                  params: { id: song.artistId || song.artist },
                  search: { name: song.artist },
                })
              }
            >
              <User className="size-4 text-primary" />
              Go to artist
            </DropdownMenuItem>
          ) : null}
          <DropdownMenuItem onSelect={() => addToQueue(song)}>
            <ListPlus className="size-4 text-primary" />
            Add to queue
          </DropdownMenuItem>
          <DropdownMenuItem
            onSelect={() => {
              toggleLikeSong(song);
              toast(liked ? "Removed from liked songs" : "Added to liked songs");
            }}
          >
            <Heart className="size-4 text-primary" fill={liked ? "currentColor" : "none"} />
            {liked ? "Remove from liked songs" : "Add to liked songs"}
          </DropdownMenuItem>
          {customPlaylists.length === 0 ? (
            <DropdownMenuItem
              onSelect={() => {
                const pl = createPlaylist("My playlist");
                addToPlaylist(pl.ytid, song);
                toast("Added successfully");
              }}
            >
              <ListPlus className="size-4 text-primary" />
              Add to playlist
            </DropdownMenuItem>
          ) : (
            customPlaylists.slice(0, 6).map((pl) => (
              <DropdownMenuItem
                key={pl.ytid}
                onSelect={() => {
                  const ok = addToPlaylist(pl.ytid, song);
                  toast(ok ? "Song added" : "Song is already in the playlist");
                }}
              >
                <ListPlus className="size-4 text-primary" />
                {pl.title}
              </DropdownMenuItem>
            ))
          )}
          {isRecent ? (
            <DropdownMenuItem onSelect={() => removeRecentlyPlayed(song.ytid)}>
              <Trash2 className="size-4 text-primary" />
              Remove from recently played
            </DropdownMenuItem>
          ) : null}
          {onRemove ? (
            <DropdownMenuItem onSelect={onRemove}>
              <Trash2 className="size-4 text-primary" />
              Remove from playlist
            </DropdownMenuItem>
          ) : null}
        </DropdownMenuContent>
      </DropdownMenu>
    </div>
  );
}
