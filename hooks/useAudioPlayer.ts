'use client';

import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { Track } from '@/types/music';

export function useAudioPlayer() {
  const {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isYtReady,
    setCurrentTrack,
    setQueue,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playNext,
    playPrevious,
    togglePlayPause,
    setPlaying,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seekToTime,
  } = usePlayerStore();

  const playTrack = async (track: Track) => {
    if (!track) return;

    if (!track.audioUrl && !track.youtubeId) {
      try {
        const res = await fetch(
          `/api/resolve-track?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.audioUrl || data.youtubeId) {
            track = {
              ...track,
              audioUrl: data.audioUrl || track.audioUrl,
              youtubeId: data.youtubeId || track.youtubeId,
              source: data.source || track.source,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to resolve track audio:', err);
      }
    }

    setCurrentTrack(track);
  };

  const playTrackList = async (tracks: Track[], index: number = 0) => {
    if (!tracks || tracks.length === 0) return;
    const targetTrack = tracks[index];

    if (targetTrack && !targetTrack.audioUrl && !targetTrack.youtubeId) {
      try {
        const res = await fetch(
          `/api/resolve-track?q=${encodeURIComponent(`${targetTrack.title} ${targetTrack.artist}`)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.audioUrl || data.youtubeId) {
            tracks[index] = {
              ...targetTrack,
              audioUrl: data.audioUrl || targetTrack.audioUrl,
              youtubeId: data.youtubeId || targetTrack.youtubeId,
              source: data.source || targetTrack.source,
            };
          }
        }
      } catch (err) {
        console.warn('Failed to resolve track list item audio:', err);
      }
    }

    setQueue(tracks, index);
  };

  return {
    currentTrack,
    queue,
    queueIndex,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    isYtReady,
    playTrack,
    playTrackList,
    addToQueue,
    removeFromQueue,
    reorderQueue,
    clearQueue,
    playNext,
    playPrevious,
    togglePlayPause,
    setPlaying,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seekToTime,
  };
}
