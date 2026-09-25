import { useEffect, useMemo, useRef, useState } from "react";
import { Search, X } from "lucide-react";
import { Input } from "@/components/ui/input";
import { SongBar } from "./song-bar";
import { SectionHeader } from "./section-header";
import { PlaylistBar } from "./playlist-bar";
import { Artwork } from "./artwork";
import { useMusify } from "@/lib/musify/store";
import {
  searchArtistsFn,
  searchPlaylistsFn,
  searchSongsFn,
  suggestFn,
} from "@/lib/musify/youtube";
import { searchCatalogPlaylists, searchRadio } from "@/lib/musify/catalog";
import type { Artist, Playlist, RadioStation, Song } from "@/lib/musify/types";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";

export function SearchPage() {
  const [query, setQuery] = useState("");
  const [suggestions, setSuggestions] = useState<string[]>([]);
  const [songs, setSongs] = useState<Song[]>([]);
  const [artists, setArtists] = useState<Artist[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(false);
  const [hasSearched, setHasSearched] = useState(false);
  const history = useMusify((s) => s.searchHistory);
  const addSearchQuery = useMusify((s) => s.addSearchQuery);
  const removeSearchQuery = useMusify((s) => s.removeSearchQuery);
  const playRadio = useMusify((s) => s.playRadio);
  const navigate = useNavigate();
  const debounce = useRef<number | null>(null);

  const catalogHits = useMemo(
    () => (query.trim() ? searchCatalogPlaylists(query) : []),
    [query],
  );
  const radioHits = useMemo(
    () => (query.trim() ? searchRadio(query) : []),
    [query],
  );

  useEffect(() => {
    if (debounce.current) window.clearTimeout(debounce.current);
    const q = query.trim();
    if (!q || hasSearched) {
      setSuggestions([]);
      return;
    }
    debounce.current = window.setTimeout(() => {
      suggestFn({ data: { q } })
        .then(setSuggestions)
        .catch(() => setSuggestions([]));
    }, 220);
    return () => {
      if (debounce.current) window.clearTimeout(debounce.current);
    };
  }, [query, hasSearched]);

  async function runSearch(raw: string) {
    const q = raw.trim();
    if (!q) return;
    setQuery(q);
    setHasSearched(true);
    setSuggestions([]);
    setLoading(true);
    addSearchQuery(q);
    try {
      const [s, a, p] = await Promise.all([
        searchSongsFn({ data: { q } }),
        searchArtistsFn({ data: { q } }),
        searchPlaylistsFn({ data: { q } }),
      ]);
      setSongs(s);
      setArtists(a);
      setPlaylists(p);
    } catch {
      toast("An error occurred. Check logs or try again.");
      setSongs([]);
      setArtists([]);
      setPlaylists([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="flex min-h-full flex-col">
      <header className="flex h-16 items-center justify-center">
        <h1 className="musify-title text-[30px] text-primary">Search</h1>
      </header>
      <div className="px-2.5 pb-4">
        <div className="relative">
          <Search className="pointer-events-none absolute top-1/2 left-3.5 size-5 -translate-y-1/2 text-muted" />
          <Input
            value={query}
            placeholder="Search songs, artists, playlists..."
            className="pl-11 pr-11"
            onChange={(e) => {
              setQuery(e.target.value);
              setHasSearched(false);
            }}
            onKeyDown={(e) => {
              if (e.key === "Enter") void runSearch(query);
            }}
          />
          {query ? (
            <button
              type="button"
              aria-label="Clear"
              className="absolute top-1/2 right-2 flex size-9 -translate-y-1/2 items-center justify-center text-muted"
              onClick={() => {
                setQuery("");
                setHasSearched(false);
                setSongs([]);
                setArtists([]);
                setPlaylists([]);
              }}
            >
              <X className="size-4" />
            </button>
          ) : null}
        </div>

        {!hasSearched && suggestions.length > 0 ? (
          <ul className="mt-2 overflow-hidden rounded-xl bg-surface-low">
            {suggestions.slice(0, 8).map((s) => (
              <li key={s}>
                <button
                  type="button"
                  className="flex w-full items-center gap-3 px-4 py-3 text-left text-sm text-fg"
                  onClick={() => void runSearch(s)}
                >
                  <Search className="size-4 text-muted" />
                  {s}
                </button>
              </li>
            ))}
          </ul>
        ) : null}

        {!hasSearched && !query && history.length > 0 ? (
          <div className="mt-4">
            <SectionHeader title="Recent searches" />
            <div className="overflow-hidden rounded-xl bg-surface-low">
              {history.slice(0, 12).map((item) => (
                <div key={item} className="flex items-center">
                  <button
                    type="button"
                    className="min-w-0 flex-1 px-4 py-3 text-left text-sm text-fg"
                    onClick={() => void runSearch(item)}
                  >
                    {item}
                  </button>
                  <button
                    type="button"
                    aria-label="Remove"
                    className="flex size-11 items-center justify-center text-muted"
                    onClick={() => removeSearchQuery(item)}
                  >
                    <X className="size-4" />
                  </button>
                </div>
              ))}
            </div>
          </div>
        ) : null}

        {loading ? (
          <div className="mt-6 space-y-2">
            {Array.from({ length: 6 }).map((_, i) => (
              <div key={i} className="h-[76px] animate-pulse rounded-lg bg-surface-low" />
            ))}
          </div>
        ) : null}

        {hasSearched && !loading ? (
          <div className="mt-2">
            {songs.length > 0 ? (
              <section>
                <SectionHeader title="Songs" />
                {songs.map((song, i) => (
                  <SongBar key={song.ytid} song={song} index={i} songs={songs} />
                ))}
              </section>
            ) : null}
            {artists.length > 0 ? (
              <section>
                <SectionHeader title="Artists" />
                {artists.map((artist) => (
                  <button
                    key={artist.id}
                    type="button"
                    className="flex w-full items-center gap-3 rounded-lg px-2.5 py-3 text-left"
                    onClick={() =>
                      navigate({
                        to: "/artist/$id",
                        params: { id: artist.id },
                        search: { name: artist.name },
                      })
                    }
                  >
                    <Artwork
                      src={artist.image}
                      alt={artist.name}
                      className="size-14"
                      radius="rounded-full"
                    />
                    <span>
                      <span className="block font-bold text-primary">{artist.name}</span>
                      <span className="text-sm text-muted">{artist.subscribers || "Artist"}</span>
                    </span>
                  </button>
                ))}
              </section>
            ) : null}
            {catalogHits.length + playlists.length > 0 ? (
              <section>
                <SectionHeader title="Playlists" />
                <div className="overflow-hidden rounded-xl">
                  {[...catalogHits.slice(0, 6), ...playlists].slice(0, 10).map((p, i, arr) => (
                    <PlaylistBar
                      key={p.ytid}
                      title={p.title}
                      playlist={p}
                      image={p.image}
                      radius={i === 0 ? "first" : i === arr.length - 1 ? "last" : "none"}
                      onClick={() =>
                        navigate({ to: "/playlist/$ytid", params: { ytid: p.ytid } })
                      }
                    />
                  ))}
                </div>
              </section>
            ) : null}
            {radioHits.length > 0 ? (
              <section>
                <SectionHeader title="Radio Stations" />
                <div className="grid grid-cols-2 gap-3">
                  {radioHits.map((station: RadioStation) => (
                    <button
                      key={station.id}
                      type="button"
                      className="overflow-hidden rounded-xl bg-surface-low text-left"
                      onClick={() => playRadio(station)}
                    >
                      <Artwork src={station.image} alt={station.name} className="aspect-square w-full" />
                      <span className="block px-3 py-2 text-sm font-semibold text-primary">
                        {station.name}
                      </span>
                    </button>
                  ))}
                </div>
              </section>
            ) : null}
            {songs.length === 0 &&
            artists.length === 0 &&
            playlists.length === 0 &&
            catalogHits.length === 0 ? (
              <p className="py-10 text-center text-sm text-muted">No results</p>
            ) : null}
          </div>
        ) : null}
      </div>
    </div>
  );
}
