import { useEffect, useState } from "react";
import { Heart, List } from "lucide-react";
import { Link } from "@tanstack/react-router";
import { SectionHeader } from "./section-header";
import { PlaylistCube } from "./playlist-cube";
import { SongBar } from "./song-bar";
import { shuffledSuggested } from "@/lib/musify/catalog";
import { recommendedSongsFn } from "@/lib/musify/youtube";
import { useMusify } from "@/lib/musify/store";
import type { Playlist, Song } from "@/lib/musify/types";
import { monthKey, formatMonthLabel } from "@/lib/musify/format";

export function HomePage() {
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [recommended, setRecommended] = useState<Song[]>([]);
  const [loadingRec, setLoadingRec] = useState(true);
  const likedPlaylists = useMusify((s) => s.likedPlaylists);
  const recentlyPlayed = useMusify((s) => s.recentlyPlayed);
  const stats = useMusify((s) => s.listeningStats);
  const statsEnabled = useMusify((s) => s.listeningStatsEnabled);

  useEffect(() => {
    setPlaylists(shuffledSuggested(8));
  }, []);

  useEffect(() => {
    let cancelled = false;
    setLoadingRec(true);
    const seeds = recentlyPlayed.slice(0, 5).map((s) => s.ytid);
    recommendedSongsFn({ data: { seedIds: seeds } })
      .then((songs) => {
        if (!cancelled) setRecommended(songs);
      })
      .catch(() => {
        if (!cancelled) setRecommended([]);
      })
      .finally(() => {
        if (!cancelled) setLoadingRec(false);
      });
    return () => {
      cancelled = true;
    };
  }, [recentlyPlayed]);

  const key = monthKey();
  const month = stats.months[key];
  const minutes = Math.round(month?.minutes ?? 0);
  const recapSongs = recommended.slice(0, 5);

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-center">
        <h1 className="musify-title text-[30px] text-primary">Musify.</h1>
      </header>
      <div className="flex-1 space-y-2 px-2.5 pb-4">
        {playlists.length > 0 ? (
          <section>
            <SectionHeader title="Suggested playlists" icon={List} />
            <PlaylistCarousel playlists={playlists} />
          </section>
        ) : null}

        {likedPlaylists.length > 0 ? (
          <section>
            <SectionHeader title="Back to favorites" icon={Heart} />
            <PlaylistCarousel playlists={likedPlaylists.slice(0, 8)} />
          </section>
        ) : null}

        {statsEnabled && (minutes > 0 || recapSongs.length > 0) ? (
          <section>
            <SectionHeader title="Time Machine" />
            <div className="rounded-xl bg-surface-low p-4">
              <p className="text-sm font-medium text-muted">{formatMonthLabel(key)}</p>
              <p className="mt-1 text-3xl font-semibold tabular-nums text-primary">
                {minutes}
                <span className="ml-2 text-base font-medium text-muted">minutes listened</span>
              </p>
            </div>
          </section>
        ) : null}

        <section>
          <SectionHeader title="Recommended for you" />
          {loadingRec ? (
            <div className="space-y-2">
              {Array.from({ length: 6 }).map((_, i) => (
                <div key={i} className="h-[76px] animate-pulse rounded-lg bg-surface-low" />
              ))}
            </div>
          ) : recommended.length === 0 ? (
            <p className="px-2 py-6 text-center text-sm text-muted">
              Search a song to start building recommendations.
            </p>
          ) : (
            recommended.map((song, i) => (
              <SongBar key={song.ytid} song={song} index={i} songs={recommended} />
            ))
          )}
        </section>
      </div>
    </div>
  );
}

function PlaylistCarousel({ playlists }: { playlists: Playlist[] }) {
  return (
    <div className="no-scrollbar flex h-[168px] snap-x snap-mandatory gap-2 overflow-x-auto pb-1">
      {playlists.map((playlist, i) => {
        const flex =
          i === 0 ? "min-w-[58%]" : i === 1 ? "min-w-[32%]" : "min-w-[22%]";
        return (
          <Link
            key={playlist.ytid}
            to="/playlist/$ytid"
            params={{ ytid: playlist.ytid }}
            className={`snap-start ${flex}`}
          >
            <PlaylistCube playlist={playlist} className="h-full w-full" />
          </Link>
        );
      })}
    </div>
  );
}
