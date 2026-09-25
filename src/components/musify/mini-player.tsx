import { Pause, Play, SkipForward } from "lucide-react";
import { Artwork } from "./artwork";
import { useMusify } from "@/lib/musify/store";

export function MiniPlayer() {
  const source = useMusify((s) => s.source);
  const song = useMusify((s) => s.queue[s.index] ?? null);
  const radioName = useMusify((s) => s.radioName);
  const radioImage = useMusify((s) => s.radioImage);
  const isPlaying = useMusify((s) => s.isPlaying);
  const togglePlay = useMusify((s) => s.togglePlay);
  const next = useMusify((s) => s.next);
  const setNowPlayingOpen = useMusify((s) => s.setNowPlayingOpen);
  const queue = useMusify((s) => s.queue);
  const index = useMusify((s) => s.index);

  const visible = source === "radio" ? Boolean(radioName) : Boolean(song);
  if (!visible) return null;

  const title = source === "radio" ? radioName : song?.title;
  const subtitle = source === "radio" ? "Live radio" : song?.artist;
  const image = source === "radio" ? radioImage : song?.image;
  const hasNext = source === "youtube" && index < queue.length - 1;

  return (
    <div className="px-2 pb-2">
      <button
        type="button"
        onClick={() => source === "youtube" && setNowPlayingOpen(true)}
        className="flex w-full items-center gap-3 rounded-xl bg-surface-high px-2.5 py-2 text-left shadow-mini"
      >
        <Artwork
          src={image}
          alt={title ?? "Now playing"}
          className="size-[52px] shrink-0"
          radius="rounded-xl"
        />
        <span className="min-w-0 flex-1">
          <span className="block truncate text-sm font-semibold text-fg">{title}</span>
          <span className="block truncate text-xs text-muted">{subtitle}</span>
        </span>
        <span className="flex items-center">
          {source === "youtube" ? (
            <span
              role="button"
              tabIndex={0}
              aria-label="Skip to next"
              className={`flex size-11 items-center justify-center ${hasNext ? "text-fg" : "text-muted/40"}`}
              onClick={(e) => {
                e.stopPropagation();
                if (hasNext) next();
              }}
            >
              <SkipForward className="size-6" fill="currentColor" />
            </span>
          ) : null}
          <span
            role="button"
            tabIndex={0}
            aria-label={isPlaying ? "Pause" : "Play"}
            className="flex size-11 items-center justify-center text-fg"
            onClick={(e) => {
              e.stopPropagation();
              togglePlay();
            }}
          >
            {isPlaying ? (
              <Pause className="size-7" fill="currentColor" />
            ) : (
              <Play className="size-7" fill="currentColor" />
            )}
          </span>
        </span>
      </button>
    </div>
  );
}
