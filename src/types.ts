export interface Album {
  id: string; // URL for live albums or custom IDs for local
  title: string;
  artist: string;
  cover: string;
  year: string;
  genre: string;
  quality?: string;
  excerpt?: string;
  description?: string;
  tracks: string[];
  downloadLinks: { label: string; url: string }[];
  isCustom?: boolean; // If added by the user
  rating?: number; // User rating 1-5
  notes?: string; // User notes
}

export interface Playlist {
  id: string;
  name: string;
  description: string;
  createdAt: string;
  songs: { id: string; title: string; artist: string; albumId: string; albumTitle: string }[];
}

export interface DownloadItem {
  id: string;
  title: string;
  artist: string;
  linkName: string;
  linkUrl: string;
  timestamp: string;
}
