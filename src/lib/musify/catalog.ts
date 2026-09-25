import { CURATED_ALBUMS } from "./catalog-albums";
import { CURATED_PLAYLISTS } from "./catalog-playlists";
import { RADIO_STATIONS } from "./catalog-radio";
import type { Playlist, RadioStation } from "./types";

export const ACCENT_COLORS = [
  "#009688",
  "#2196F3",
  "#BA68C8",
  "#00BCD4",
  "#00FA9A",
  "#4CAF50",
  "#9ACD32",
  "#CDDC39",
  "#F08080",
  "#E9967A",
  "#FFC0CB",
  "#6495ED",
  "#A6C8FF",
  "#FF9800",
  "#F8C733",
  "#BDB76B",
  "#C4A092",
  "#E2C09F",
  "#91cef4",
  "#AABBCC",
] as const;

export function allCuratedPlaylists(): Playlist[] {
  return CURATED_PLAYLISTS.map((p) => ({
    ytid: p.ytid,
    title: p.title,
    image: p.image,
    source: "curated" as const,
    list: [],
  }));
}

export function allCuratedAlbums(): Playlist[] {
  return CURATED_ALBUMS.map((p) => ({
    ytid: p.ytid,
    title: p.title,
    image: p.image,
    isAlbum: true,
    source: "curated" as const,
    list: [],
  }));
}

export function findCurated(ytid: string): Playlist | undefined {
  return [...allCuratedPlaylists(), ...allCuratedAlbums()].find(
    (p) => p.ytid === ytid,
  );
}

export function shuffledSuggested(count = 8): Playlist[] {
  const copy = [...allCuratedPlaylists()];
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [copy[i], copy[j]] = [copy[j]!, copy[i]!];
  }
  return copy.slice(0, count);
}

export function radioStations(): RadioStation[] {
  return RADIO_STATIONS.map((r) => ({ ...r }));
}

export function searchCatalogPlaylists(query: string): Playlist[] {
  const q = query.toLowerCase();
  return [...allCuratedPlaylists(), ...allCuratedAlbums()].filter((p) =>
    p.title.toLowerCase().includes(q),
  );
}

export function searchRadio(query: string): RadioStation[] {
  const q = query.toLowerCase();
  return radioStations().filter(
    (r) =>
      r.name.toLowerCase().includes(q) || r.genre.toLowerCase().includes(q),
  );
}
