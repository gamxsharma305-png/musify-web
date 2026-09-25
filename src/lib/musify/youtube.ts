import { createServerFn } from "@tanstack/react-start";
import { z } from "zod";
import type { Artist, Playlist, Song } from "./types";

export const searchSongsFn = createServerFn({ method: "POST" })
  .validator(z.object({ q: z.string() }))
  .handler(async ({ data }): Promise<Song[]> => {
    const q = data.q.trim();
    if (!q) return [];
    const { searchVideos } = await import("./innertube.server");
    return searchVideos(q, 20);
  });

export const searchPlaylistsFn = createServerFn({ method: "POST" })
  .validator(z.object({ q: z.string() }))
  .handler(async ({ data }): Promise<Playlist[]> => {
    const q = data.q.trim();
    if (!q) return [];
    const { searchPlaylistsOnline } = await import("./innertube.server");
    return searchPlaylistsOnline(q, 12);
  });

export const searchArtistsFn = createServerFn({ method: "POST" })
  .validator(z.object({ q: z.string() }))
  .handler(async ({ data }): Promise<Artist[]> => {
    const q = data.q.trim();
    if (!q) return [];
    const { searchArtistsOnline } = await import("./innertube.server");
    return searchArtistsOnline(q, 6);
  });

export const suggestFn = createServerFn({ method: "POST" })
  .validator(z.object({ q: z.string() }))
  .handler(async ({ data }): Promise<string[]> => {
    const q = data.q.trim();
    if (!q) return [];
    const { searchSuggestions } = await import("./innertube.server");
    return searchSuggestions(q);
  });

export const playlistSongsFn = createServerFn({ method: "POST" })
  .validator(z.object({ ytid: z.string() }))
  .handler(async ({ data }): Promise<{ title: string; songs: Song[] }> => {
    const { fetchPlaylistSongs } = await import("./innertube.server");
    return fetchPlaylistSongs(data.ytid, 80);
  });

export const relatedSongsFn = createServerFn({ method: "POST" })
  .validator(z.object({ ytid: z.string() }))
  .handler(async ({ data }): Promise<Song[]> => {
    const { fetchRelatedSongs } = await import("./innertube.server");
    return fetchRelatedSongs(data.ytid, 15);
  });

export const artistSongsFn = createServerFn({ method: "POST" })
  .validator(z.object({ id: z.string() }))
  .handler(
    async ({
      data,
    }): Promise<{ name: string; image: string; songs: Song[] }> => {
      const { fetchChannelVideos } = await import("./innertube.server");
      return fetchChannelVideos(data.id, 30);
    },
  );

export const lyricsFn = createServerFn({ method: "POST" })
  .validator(z.object({ title: z.string(), artist: z.string() }))
  .handler(async ({ data }): Promise<string | null> => {
    const { fetchLyrics } = await import("./innertube.server");
    return fetchLyrics(data.title, data.artist);
  });

export const recommendedSongsFn = createServerFn({ method: "POST" })
  .validator(
    z.object({ seedIds: z.array(z.string()).optional() }).optional(),
  )
  .handler(async ({ data }): Promise<Song[]> => {
    const { fetchPlaylistSongs, fetchRelatedSongs, searchVideos } =
      await import("./innertube.server");
    const seeds = data?.seedIds?.filter(Boolean) ?? [];
    if (seeds.length > 0) {
      const related = await Promise.all(
        seeds.slice(0, 3).map((id) => fetchRelatedSongs(id, 8).catch(() => [])),
      );
      const map = new Map<string, Song>();
      for (const list of related) {
        for (const song of list) map.set(song.ytid, song);
      }
      const out = [...map.values()].slice(0, 15);
      if (out.length > 0) return out;
    }
    try {
      const pl = await fetchPlaylistSongs(
        "PLgzTt0k8mXzEk586ze4BjvDXR7c-TUSnx",
        15,
      );
      if (pl.songs.length > 0) return pl.songs;
    } catch {
      /* fall through */
    }
    return searchVideos("top hits 2026 official audio", 15);
  });
