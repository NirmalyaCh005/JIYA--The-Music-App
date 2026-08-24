export interface Track {
  id: string;
  title: string;
  artist: string;
  album?: string | null;
  genre?: string | null;
  duration: number; // in seconds
  audioUrl?: string | null;
  coverUrl?: string | null;
  youtubeId?: string | null;
  channelTitle?: string | null;
  isLiked?: boolean;
  playCount?: number;
  createdAt?: string | Date;
  source?: 'saavn' | 'youtube' | 'local';
}

export interface PlaylistTrack {
  id: string;
  playlistId: string;
  trackId: string;
  position: number;
  addedAt: string | Date;
  track: Track;
}

export interface Playlist {
  id: string;
  title: string;
  description?: string | null;
  coverUrl?: string | null;
  isPublic?: boolean;
  createdAt?: string | Date;
  tracks?: PlaylistTrack[];
  _count?: {
    tracks: number;
  };
}

export type RepeatMode = 'off' | 'all' | 'one';

export interface UserProfile {
  name: string;
  email?: string;
  phone?: string;
  avatarUrl?: string;
  isPro?: boolean;
}

export interface PlayerStoreState {
  currentTrack: Track | null;
  queue: Track[];
  queueIndex: number;
  isPlaying: boolean;
  volume: number; // 0.0 to 1.0
  isMuted: boolean;
  isShuffle: boolean;
  repeatMode: RepeatMode;
  currentTime: number;
  duration: number;
  isQueueDrawerOpen: boolean;
  isUploadModalOpen: boolean;
  isAmbientModeOpen: boolean;
  likedTrackIds: Set<string>;
  theme: 'dark' | 'light';
  user: UserProfile | null;
  recentlyPlayed: Track[];
  
  // YouTube Engine State
  ytPlayer: any | null;
  isYtReady: boolean;
  seekTimeRequested: number | null;

  // Actions
  setCurrentTrack: (track: Track | null) => void;
  setQueue: (tracks: Track[], initialIndex?: number) => void;
  addToQueue: (track: Track) => void;
  removeFromQueue: (index: number) => void;
  reorderQueue: (startIndex: number, endIndex: number) => void;
  clearQueue: () => void;
  playNext: () => void;
  playPrevious: () => void;
  togglePlayPause: () => void;
  setPlaying: (playing: boolean) => void;
  setVolume: (volume: number) => void;
  toggleMute: () => void;
  toggleShuffle: () => void;
  toggleRepeat: () => void;
  setCurrentTime: (time: number) => void;
  setDuration: (duration: number) => void;
  toggleQueueDrawer: (open?: boolean) => void;
  toggleUploadModal: (open?: boolean) => void;
  toggleAmbientMode: (open?: boolean) => void;
  toggleLikeTrack: (trackId: string) => void;
  toggleTheme: () => void;
  setUser: (user: UserProfile | null) => void;
  addRecentlyPlayed: (track: Track) => void;

  // Crossfading State & Actions
  isCrossfadeEnabled: boolean;
  crossfadeDuration: number;
  toggleCrossfade: () => void;
  setCrossfadeDuration: (seconds: number) => void;

  // YouTube Engine Actions
  setYtPlayer: (player: any) => void;
  setYtReady: (ready: boolean) => void;
  seekToTime: (seconds: number) => void;
}
