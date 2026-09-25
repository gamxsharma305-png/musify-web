export type Song = {
  ytid: string;
  title: string;
  artist: string;
  artistId?: string;
  duration: number;
  image: string;
  album?: string;
};

export type Playlist = {
  ytid: string;
  title: string;
  image: string;
  isAlbum?: boolean;
  source?: "curated" | "youtube" | "user-created" | "user-youtube" | "liked";
  list: Song[];
  description?: string;
};

export type Artist = {
  id: string;
  name: string;
  image: string;
  subscribers?: string;
};

export type RadioStation = {
  id: string;
  name: string;
  image: string;
  streamUrl: string;
  genre: string;
};

export type RepeatMode = "off" | "all" | "one";
export type ThemeMode = "system" | "light" | "dark";
export type AudioQuality = "low" | "medium" | "high";

export type ListeningStats = {
  months: Record<string, { minutes: number; songs: Record<string, number> }>;
};

export type CustomPlaylist = Playlist & {
  source: "user-created" | "user-youtube";
};
