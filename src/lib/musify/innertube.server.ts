import type { Artist, Playlist, Song } from "./types";
import { parseDuration, thumbFromId } from "./format";

const WEB_CONTEXT = {
  client: {
    clientName: "WEB",
    clientVersion: "2.20250101.00.00",
    hl: "en",
    gl: "US",
  },
};

const INNERTUBE = "https://www.youtube.com/youtubei/v1";

async function innertube<T>(
  endpoint: "search" | "browse" | "next" | "player",
  body: Record<string, unknown>,
): Promise<T> {
  const res = await fetch(`${INNERTUBE}/${endpoint}?prettyPrint=false`, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      "User-Agent":
        "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36",
      Accept: "*/*",
      Origin: "https://www.youtube.com",
      Referer: "https://www.youtube.com/",
    },
    body: JSON.stringify({ context: WEB_CONTEXT, ...body }),
  });
  if (!res.ok) {
    throw new Error(`YouTube ${endpoint} failed (${res.status})`);
  }
  return (await res.json()) as T;
}

function walk(node: unknown, visit: (obj: Record<string, unknown>) => void) {
  if (!node) return;
  if (Array.isArray(node)) {
    for (const item of node) walk(item, visit);
    return;
  }
  if (typeof node === "object") {
    const obj = node as Record<string, unknown>;
    visit(obj);
    for (const value of Object.values(obj)) walk(value, visit);
  }
}

function textOf(value: unknown): string {
  if (!value) return "";
  if (typeof value === "string") return value;
  if (typeof value === "object") {
    const obj = value as Record<string, unknown>;
    if (typeof obj.simpleText === "string") return obj.simpleText;
    if (Array.isArray(obj.runs)) {
      return obj.runs
        .map((r) =>
          r && typeof r === "object" && "text" in r
            ? String((r as { text?: unknown }).text ?? "")
            : "",
        )
        .join("");
    }
  }
  return "";
}

function bestThumb(node: unknown): string {
  if (!node || typeof node !== "object") return "";
  const obj = node as Record<string, unknown>;
  const thumbs =
    (obj.thumbnails as unknown[]) ||
    (obj.thumbnail &&
      typeof obj.thumbnail === "object" &&
      (obj.thumbnail as { thumbnails?: unknown[] }).thumbnails) ||
    [];
  if (!Array.isArray(thumbs) || thumbs.length === 0) return "";
  const last = thumbs[thumbs.length - 1] as { url?: string };
  return last?.url ?? "";
}

function channelIdFrom(node: unknown): string | undefined {
  let id: string | undefined;
  walk(node, (obj) => {
    if (id) return;
    const ep = obj.browseEndpoint as { browseId?: string } | undefined;
    if (ep?.browseId?.startsWith("UC")) id = ep.browseId;
  });
  return id;
}

function songFromVideoRenderer(v: Record<string, unknown>): Song | null {
  const ytid = typeof v.videoId === "string" ? v.videoId : "";
  if (!ytid) return null;
  const title = textOf(v.title);
  if (!title) return null;
  const artist =
    textOf(v.ownerText) ||
    textOf(v.shortBylineText) ||
    textOf(v.longBylineText) ||
    "Unknown";
  const duration = parseDuration(textOf(v.lengthText));
  return {
    ytid,
    title,
    artist,
    artistId: channelIdFrom(v.ownerText || v.shortBylineText),
    duration,
    image: bestThumb(v.thumbnail) || thumbFromId(ytid),
  };
}

function songFromPlaylistVideo(v: Record<string, unknown>): Song | null {
  const ytid = typeof v.videoId === "string" ? v.videoId : "";
  if (!ytid) return null;
  if (v.isPlayable === false) return null;
  const title = textOf(v.title);
  if (!title || title === "[Private video]" || title === "[Deleted video]") {
    return null;
  }
  const lengthSeconds =
    typeof v.lengthSeconds === "string" ? Number(v.lengthSeconds) : undefined;
  return {
    ytid,
    title,
    artist: textOf(v.shortBylineText) || textOf(v.videoInfo) || "Unknown",
    artistId: channelIdFrom(v.shortBylineText),
    duration: Number.isFinite(lengthSeconds)
      ? (lengthSeconds as number)
      : parseDuration(textOf(v.lengthText)),
    image: bestThumb(v.thumbnail) || thumbFromId(ytid),
  };
}

function songFromLockup(v: Record<string, unknown>): Song | null {
  const ytid = typeof v.contentId === "string" ? v.contentId : "";
  if (!ytid || ytid.length !== 11) return null;
  let title = "";
  let artist = "Unknown";
  walk(v.metadata, (obj) => {
    if (!title && typeof obj.content === "string" && obj.content.length > 1) {
      title = obj.content;
    }
  });
  walk(v.metadata, (obj) => {
    const runs = obj.runs as { text?: string }[] | undefined;
    if (Array.isArray(runs) && runs[0]?.text && artist === "Unknown") {
      artist = runs[0].text;
    }
  });
  if (!title) return null;
  return {
    ytid,
    title,
    artist,
    duration: 0,
    image: thumbFromId(ytid),
  };
}

function playlistFromRenderer(p: Record<string, unknown>): Playlist | null {
  const rawId =
    (typeof p.playlistId === "string" && p.playlistId) ||
    (typeof p.playlistId === "object" &&
      p.playlistId &&
      "id" in (p.playlistId as object) &&
      String((p.playlistId as { id: string }).id)) ||
    "";
  const ytid = rawId.replace(/^VL/, "");
  if (!ytid) return null;
  const title = textOf(p.title);
  if (!title) return null;
  return {
    ytid,
    title,
    image: bestThumb(p.thumbnail) || bestThumb(p.thumbnails),
    source: "youtube",
    list: [],
  };
}

function artistFromChannel(c: Record<string, unknown>): Artist | null {
  let browseId = "";
  walk(c, (obj) => {
    if (browseId) return;
    const ep = obj.browseEndpoint as { browseId?: string } | undefined;
    if (ep?.browseId?.startsWith("UC")) browseId = ep.browseId;
  });
  if (!browseId) return null;
  const name = textOf(c.title) || textOf(c.shortBylineText);
  if (!name) return null;
  return {
    id: browseId,
    name,
    image: bestThumb(c.thumbnail),
    subscribers: textOf(c.subscriberCountText) || textOf(c.videoCountText),
  };
}

export async function searchVideos(query: string, limit = 20): Promise<Song[]> {
  const data = await innertube<unknown>("search", {
    query,
    params: "EgIQAQ==",
  });
  const songs: Song[] = [];
  const seen = new Set<string>();
  walk(data, (obj) => {
    if (obj.videoRenderer && typeof obj.videoRenderer === "object") {
      const song = songFromVideoRenderer(
        obj.videoRenderer as Record<string, unknown>,
      );
      if (song && !seen.has(song.ytid)) {
        seen.add(song.ytid);
        songs.push(song);
      }
    }
  });
  return songs.slice(0, limit);
}

export async function searchPlaylistsOnline(
  query: string,
  limit = 12,
): Promise<Playlist[]> {
  const data = await innertube<unknown>("search", {
    query,
    params: "EgIQAw==",
  });
  const playlists: Playlist[] = [];
  const seen = new Set<string>();
  walk(data, (obj) => {
    if (obj.playlistRenderer && typeof obj.playlistRenderer === "object") {
      const p = playlistFromRenderer(
        obj.playlistRenderer as Record<string, unknown>,
      );
      if (p && !seen.has(p.ytid)) {
        seen.add(p.ytid);
        playlists.push(p);
      }
    }
  });
  return playlists.slice(0, limit);
}

export async function searchArtistsOnline(
  query: string,
  limit = 6,
): Promise<Artist[]> {
  const data = await innertube<unknown>("search", {
    query,
    params: "EgIQAg==",
  });
  const artists: Artist[] = [];
  const seen = new Set<string>();
  walk(data, (obj) => {
    if (obj.channelRenderer && typeof obj.channelRenderer === "object") {
      const a = artistFromChannel(obj.channelRenderer as Record<string, unknown>);
      if (a && !seen.has(a.id)) {
        seen.add(a.id);
        artists.push(a);
      }
    }
  });
  return artists.slice(0, limit);
}

export async function fetchPlaylistSongs(
  playlistId: string,
  limit = 80,
): Promise<{ title: string; songs: Song[] }> {
  const browseId = playlistId.startsWith("VL")
    ? playlistId
    : `VL${playlistId}`;
  const data = await innertube<Record<string, unknown>>("browse", { browseId });
  const songs: Song[] = [];
  const seen = new Set<string>();
  walk(data, (obj) => {
    const renderer =
      (obj.playlistVideoRenderer as Record<string, unknown> | undefined) ||
      (obj.playlistPanelVideoRenderer as Record<string, unknown> | undefined);
    if (renderer) {
      const song = songFromPlaylistVideo(renderer);
      if (song && !seen.has(song.ytid)) {
        seen.add(song.ytid);
        songs.push(song);
      }
    }
  });
  let title = "";
  const header = data.header as Record<string, unknown> | undefined;
  if (header) {
    walk(header, (obj) => {
      if (!title && obj.title) title = textOf(obj.title);
    });
  }
  if (!title) {
    const meta = data.metadata as Record<string, unknown> | undefined;
    if (meta) walk(meta, (obj) => {
      if (!title && obj.title) title = textOf(obj.title);
    });
  }
  return { title: title || "Playlist", songs: songs.slice(0, limit) };
}

export async function fetchRelatedSongs(
  videoId: string,
  limit = 15,
): Promise<Song[]> {
  const data = await innertube<unknown>("next", { videoId });
  const songs: Song[] = [];
  const seen = new Set<string>([videoId]);
  walk(data, (obj) => {
    if (obj.compactVideoRenderer && typeof obj.compactVideoRenderer === "object") {
      const song = songFromVideoRenderer(
        obj.compactVideoRenderer as Record<string, unknown>,
      );
      if (song && !seen.has(song.ytid)) {
        seen.add(song.ytid);
        songs.push(song);
      }
    }
    if (obj.lockupViewModel && typeof obj.lockupViewModel === "object") {
      const song = songFromLockup(obj.lockupViewModel as Record<string, unknown>);
      if (song && !seen.has(song.ytid)) {
        seen.add(song.ytid);
        songs.push(song);
      }
    }
  });
  return songs.slice(0, limit);
}

export async function fetchChannelVideos(
  channelId: string,
  limit = 30,
): Promise<{ name: string; image: string; songs: Song[] }> {
  const data = await innertube<Record<string, unknown>>("browse", {
    browseId: channelId,
    params: "EgZ2aWRlb3PyBgQKAjoA",
  });
  const songs: Song[] = [];
  const seen = new Set<string>();
  walk(data, (obj) => {
    if (obj.videoRenderer && typeof obj.videoRenderer === "object") {
      const song = songFromVideoRenderer(
        obj.videoRenderer as Record<string, unknown>,
      );
      if (song && !seen.has(song.ytid)) {
        seen.add(song.ytid);
        songs.push(song);
      }
    }
    if (obj.lockupViewModel && typeof obj.lockupViewModel === "object") {
      const song = songFromLockup(obj.lockupViewModel as Record<string, unknown>);
      if (song && !seen.has(song.ytid)) {
        seen.add(song.ytid);
        songs.push(song);
      }
    }
  });
  let name = "";
  let image = "";
  walk(data.header, (obj) => {
    if (!name && obj.title) name = textOf(obj.title);
    if (!image) {
      const t = bestThumb(obj);
      if (t) image = t;
    }
  });
  return { name: name || "Artist", image, songs: songs.slice(0, limit) };
}

export async function searchSuggestions(query: string): Promise<string[]> {
  if (!query.trim()) return [];
  try {
    const url = `https://suggestqueries.google.com/complete/search?client=firefox&ds=yt&q=${encodeURIComponent(query)}`;
    const res = await fetch(url, {
      headers: { "User-Agent": "Mozilla/5.0" },
    });
    if (!res.ok) return [];
    const data = (await res.json()) as unknown;
    if (Array.isArray(data) && Array.isArray(data[1])) {
      return (data[1] as unknown[]).filter((s) => typeof s === "string") as string[];
    }
  } catch {
    /* ignore */
  }
  return [];
}

export async function fetchLyrics(
  title: string,
  artist: string,
): Promise<string | null> {
  try {
    const url = `https://lrclib.net/api/search?track_name=${encodeURIComponent(title)}&artist_name=${encodeURIComponent(artist)}`;
    const res = await fetch(url, { headers: { "User-Agent": "GMAXWeb/1.0" } });
    if (!res.ok) return null;
    const data = (await res.json()) as Array<{
      plainLyrics?: string | null;
      syncedLyrics?: string | null;
    }>;
    const hit = data.find((d) => d.plainLyrics || d.syncedLyrics);
    if (!hit) return null;
    if (hit.syncedLyrics) {
      return hit.syncedLyrics
        .split("\n")
        .map((line) => line.replace(/\[\d+:\d+[^\]]*\]/g, "").trim())
        .filter(Boolean)
        .join("\n");
    }
    return hit.plainLyrics ?? null;
  } catch {
    return null;
  }
}
