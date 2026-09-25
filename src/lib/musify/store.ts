import { create } from "zustand";
import { persist } from "zustand/middleware";
import type {
  AudioQuality,
  CustomPlaylist,
  ListeningStats,
  Playlist,
  RepeatMode,
  Song,
  ThemeMode,
} from "./types";
import { monthKey, uid } from "./format";
import { applyMusifyTheme } from "./theme";

type PlayerSource = "youtube" | "radio";

type MusifyState = {
  accent: string;
  themeMode: ThemeMode;
  pureBlack: boolean;
  audioQuality: AudioQuality;
  listeningStatsEnabled: boolean;
  searchHistory: string[];
  likedSongs: Song[];
  recentlyPlayed: Song[];
  likedPlaylists: Playlist[];
  customPlaylists: CustomPlaylist[];
  pinnedIds: string[];
  listeningStats: ListeningStats;

  queue: Song[];
  index: number;
  isPlaying: boolean;
  position: number;
  duration: number;
  shuffle: boolean;
  repeat: RepeatMode;
  volume: number;
  nowPlayingOpen: boolean;
  source: PlayerSource;
  radioId: string | null;
  radioName: string | null;
  radioImage: string | null;
  radioUrl: string | null;
  lyrics: string | null;
  lyricsOpen: boolean;
  seekRequest: number | null;

  setAccent: (hex: string) => void;
  setThemeMode: (mode: ThemeMode) => void;
  setPureBlack: (v: boolean) => void;
  setAudioQuality: (q: AudioQuality) => void;
  setListeningStatsEnabled: (v: boolean) => void;

  addSearchQuery: (q: string) => void;
  removeSearchQuery: (q: string) => void;
  clearSearchHistory: () => void;

  toggleLikeSong: (song: Song) => void;
  isLiked: (ytid: string) => boolean;
  recordPlayed: (song: Song, seconds?: number) => void;
  clearRecentlyPlayed: () => void;
  removeRecentlyPlayed: (ytid: string) => void;

  toggleLikePlaylist: (playlist: Playlist) => void;
  isPlaylistLiked: (ytid: string) => boolean;
  createPlaylist: (name: string, image?: string) => CustomPlaylist;
  addToPlaylist: (playlistId: string, song: Song) => boolean;
  removeFromPlaylist: (playlistId: string, ytid: string) => void;
  deletePlaylist: (playlistId: string) => void;
  togglePin: (ytid: string) => void;

  playSongs: (songs: Song[], startIndex?: number) => void;
  playRadio: (station: {
    id: string;
    name: string;
    image: string;
    streamUrl: string;
  }) => void;
  togglePlay: () => void;
  setPlaying: (v: boolean) => void;
  next: () => void;
  prev: () => void;
  seek: (seconds: number) => void;
  setPosition: (seconds: number) => void;
  setDuration: (seconds: number) => void;
  toggleShuffle: () => void;
  cycleRepeat: () => void;
  setNowPlayingOpen: (v: boolean) => void;
  playNext: (song: Song) => void;
  addToQueue: (song: Song) => void;
  removeFromQueue: (i: number) => void;
  jumpTo: (i: number) => void;
  setLyrics: (text: string | null) => void;
  setLyricsOpen: (v: boolean) => void;
  currentSong: () => Song | null;
};

const emptyStats: ListeningStats = { months: {} };

export const useMusify = create<MusifyState>()(
  persist(
    (set, get) => ({
      accent: "#009688",
      themeMode: "dark",
      pureBlack: false,
      audioQuality: "high",
      listeningStatsEnabled: true,
      searchHistory: [],
      likedSongs: [],
      recentlyPlayed: [],
      likedPlaylists: [],
      customPlaylists: [],
      pinnedIds: [],
      listeningStats: emptyStats,

      queue: [],
      index: 0,
      isPlaying: false,
      position: 0,
      duration: 0,
      shuffle: false,
      repeat: "all",
      volume: 1,
      nowPlayingOpen: false,
      source: "youtube",
      radioId: null,
      radioName: null,
      radioImage: null,
      radioUrl: null,
      lyrics: null,
      lyricsOpen: false,
      seekRequest: null,

      setAccent: (hex) => {
        set({ accent: hex });
        const s = get();
        applyMusifyTheme({
          accent: hex,
          mode: s.themeMode,
          pureBlack: s.pureBlack,
        });
      },
      setThemeMode: (mode) => {
        set({ themeMode: mode });
        const s = get();
        applyMusifyTheme({
          accent: s.accent,
          mode,
          pureBlack: s.pureBlack,
        });
      },
      setPureBlack: (v) => {
        set({ pureBlack: v });
        const s = get();
        applyMusifyTheme({
          accent: s.accent,
          mode: s.themeMode,
          pureBlack: v,
        });
      },
      setAudioQuality: (q) => set({ audioQuality: q }),
      setListeningStatsEnabled: (v) => set({ listeningStatsEnabled: v }),

      addSearchQuery: (q) => {
        const query = q.trim();
        if (!query) return;
        set((s) => ({
          searchHistory: [
            query,
            ...s.searchHistory.filter((x) => x !== query),
          ].slice(0, 30),
        }));
      },
      removeSearchQuery: (q) =>
        set((s) => ({
          searchHistory: s.searchHistory.filter((x) => x !== q),
        })),
      clearSearchHistory: () => set({ searchHistory: [] }),

      toggleLikeSong: (song) =>
        set((s) => {
          const exists = s.likedSongs.some((x) => x.ytid === song.ytid);
          return {
            likedSongs: exists
              ? s.likedSongs.filter((x) => x.ytid !== song.ytid)
              : [song, ...s.likedSongs],
          };
        }),
      isLiked: (ytid) => get().likedSongs.some((s) => s.ytid === ytid),
      recordPlayed: (song, seconds = 0) =>
        set((s) => {
          const recentlyPlayed = [
            song,
            ...s.recentlyPlayed.filter((x) => x.ytid !== song.ytid),
          ].slice(0, 80);
          if (!s.listeningStatsEnabled) return { recentlyPlayed };
          const key = monthKey();
          const month = s.listeningStats.months[key] ?? {
            minutes: 0,
            songs: {},
          };
          const addMin = Math.max(0, seconds) / 60;
          const next: ListeningStats = {
            months: {
              ...s.listeningStats.months,
              [key]: {
                minutes: month.minutes + addMin,
                songs: {
                  ...month.songs,
                  [song.ytid]: (month.songs[song.ytid] ?? 0) + 1,
                },
              },
            },
          };
          return { recentlyPlayed, listeningStats: next };
        }),
      clearRecentlyPlayed: () => set({ recentlyPlayed: [] }),
      removeRecentlyPlayed: (ytid) =>
        set((s) => ({
          recentlyPlayed: s.recentlyPlayed.filter((x) => x.ytid !== ytid),
        })),

      toggleLikePlaylist: (playlist) =>
        set((s) => {
          const exists = s.likedPlaylists.some((p) => p.ytid === playlist.ytid);
          return {
            likedPlaylists: exists
              ? s.likedPlaylists.filter((p) => p.ytid !== playlist.ytid)
              : [{ ...playlist, source: "liked" }, ...s.likedPlaylists],
          };
        }),
      isPlaylistLiked: (ytid) =>
        get().likedPlaylists.some((p) => p.ytid === ytid),
      createPlaylist: (name, image) => {
        const playlist: CustomPlaylist = {
          ytid: uid("pl"),
          title: name.trim() || "Playlist",
          image: image || "",
          source: "user-created",
          list: [],
        };
        set((s) => ({ customPlaylists: [playlist, ...s.customPlaylists] }));
        return playlist;
      },
      addToPlaylist: (playlistId, song) => {
        const state = get();
        const pl = state.customPlaylists.find((p) => p.ytid === playlistId);
        if (!pl) return false;
        if (pl.list.some((s) => s.ytid === song.ytid)) return false;
        set({
          customPlaylists: state.customPlaylists.map((p) =>
            p.ytid === playlistId ? { ...p, list: [...p.list, song] } : p,
          ),
        });
        return true;
      },
      removeFromPlaylist: (playlistId, ytid) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.map((p) =>
            p.ytid === playlistId
              ? { ...p, list: p.list.filter((x) => x.ytid !== ytid) }
              : p,
          ),
        })),
      deletePlaylist: (playlistId) =>
        set((s) => ({
          customPlaylists: s.customPlaylists.filter((p) => p.ytid !== playlistId),
          pinnedIds: s.pinnedIds.filter((id) => id !== playlistId),
        })),
      togglePin: (ytid) =>
        set((s) => {
          if (s.pinnedIds.includes(ytid)) {
            return { pinnedIds: s.pinnedIds.filter((id) => id !== ytid) };
          }
          if (s.pinnedIds.length >= 5) return {};
          return { pinnedIds: [...s.pinnedIds, ytid] };
        }),

      playSongs: (songs, startIndex = 0) => {
        if (!songs.length) return;
        const list = get().shuffle ? shuffleAround(songs, startIndex) : songs;
        const index = get().shuffle
          ? 0
          : Math.max(0, Math.min(startIndex, list.length - 1));
        // Multi-song queue → keep playing next songs without stopping
        const multi = list.length > 1;
        const prevRepeat = get().repeat;
        set({
          queue: list,
          index,
          isPlaying: true,
          position: 0,
          duration: list[index]?.duration ?? 0,
          source: "youtube",
          radioId: null,
          radioUrl: null,
          radioName: null,
          radioImage: null,
          lyrics: null,
          lyricsOpen: false,
          ...(multi && prevRepeat === "off" ? { repeat: "all" as const } : {}),
        });
        get().recordPlayed(list[index]!);
      },
      playRadio: (station) =>
        set({
          source: "radio",
          radioId: station.id,
          radioName: station.name,
          radioImage: station.image,
          radioUrl: station.streamUrl,
          isPlaying: true,
          queue: [],
          index: 0,
          position: 0,
          duration: 0,
          lyrics: null,
          nowPlayingOpen: false,
        }),
      togglePlay: () => set((s) => ({ isPlaying: !s.isPlaying })),
      setPlaying: (v) => set({ isPlaying: v }),
      next: () => {
        const s = get();
        if (s.source !== "youtube" || s.queue.length === 0) return;
        if (s.repeat === "one") {
          set({ position: 0, isPlaying: true, seekRequest: 0 });
          return;
        }
        const last = s.index >= s.queue.length - 1;
        if (last && s.repeat !== "all") {
          set({ isPlaying: false, position: 0 });
          return;
        }
        const nextIndex = last ? 0 : s.index + 1;
        const song = s.queue[nextIndex];
        set({
          index: nextIndex,
          position: 0,
          isPlaying: true,
          duration: song?.duration ?? 0,
          lyrics: null,
          lyricsOpen: false,
        });
        if (song) s.recordPlayed(song);
      },
      prev: () => {
        const s = get();
        if (s.source !== "youtube" || s.queue.length === 0) return;
        if (s.position > 3) {
          set({ position: 0, seekRequest: 0 });
          return;
        }
        const nextIndex = s.index <= 0 ? s.queue.length - 1 : s.index - 1;
        const song = s.queue[nextIndex];
        set({
          index: nextIndex,
          position: 0,
          isPlaying: true,
          duration: song?.duration ?? 0,
          lyrics: null,
        });
        if (song) s.recordPlayed(song);
      },
      seek: (seconds) =>
        set({
          position: Math.max(0, seconds),
          seekRequest: Math.max(0, seconds),
        }),
      setPosition: (seconds) => set({ position: seconds }),
      setDuration: (seconds) => set({ duration: seconds }),
      toggleShuffle: () => set((s) => ({ shuffle: !s.shuffle })),
      cycleRepeat: () =>
        set((s) => ({
          repeat:
            s.repeat === "off" ? "all" : s.repeat === "all" ? "one" : "off",
        })),
      setNowPlayingOpen: (v) => set({ nowPlayingOpen: v }),
      playNext: (song) =>
        set((s) => {
          if (s.queue.length === 0) {
            return {
              queue: [song],
              index: 0,
              isPlaying: true,
              source: "youtube" as const,
            };
          }
          const next = [...s.queue];
          next.splice(s.index + 1, 0, song);
          return { queue: next };
        }),
      addToQueue: (song) =>
        set((s) => {
          if (s.queue.length === 0) {
            return {
              queue: [song],
              index: 0,
              isPlaying: true,
              source: "youtube" as const,
            };
          }
          return { queue: [...s.queue, song] };
        }),
      removeFromQueue: (i) =>
        set((s) => {
          const queue = s.queue.filter((_, idx) => idx !== i);
          let index = s.index;
          if (i < s.index) index = Math.max(0, index - 1);
          if (index >= queue.length) index = Math.max(0, queue.length - 1);
          return { queue, index, isPlaying: queue.length > 0 && s.isPlaying };
        }),
      jumpTo: (i) => {
        const s = get();
        const song = s.queue[i];
        if (!song) return;
        set({
          index: i,
          position: 0,
          isPlaying: true,
          duration: song.duration,
          lyrics: null,
        });
        s.recordPlayed(song);
      },
      setLyrics: (text) => set({ lyrics: text }),
      setLyricsOpen: (v) => set({ lyricsOpen: v }),
      currentSong: () => {
        const s = get();
        return s.queue[s.index] ?? null;
      },
    }),
    {
      name: "musify-web",
      partialize: (s) => ({
        accent: s.accent,
        themeMode: s.themeMode,
        pureBlack: s.pureBlack,
        audioQuality: s.audioQuality,
        listeningStatsEnabled: s.listeningStatsEnabled,
        searchHistory: s.searchHistory,
        likedSongs: s.likedSongs,
        recentlyPlayed: s.recentlyPlayed,
        likedPlaylists: s.likedPlaylists,
        customPlaylists: s.customPlaylists,
        pinnedIds: s.pinnedIds,
        listeningStats: s.listeningStats,
        volume: s.volume,
        shuffle: s.shuffle,
        repeat: s.repeat,
      }),
    },
  ),
);

function shuffleAround(songs: Song[], startIndex: number): Song[] {
  const first = songs[startIndex];
  const rest = songs.filter((_, i) => i !== startIndex);
  for (let i = rest.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1));
    [rest[i], rest[j]] = [rest[j]!, rest[i]!];
  }
  return first ? [first, ...rest] : rest;
}

export function useCurrentSong(): Song | null {
  return useMusify((s) => s.queue[s.index] ?? null);
}
