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

    if (!track.youtubeId) {
      try {
        const res = await fetch(
          `/api/resolve-track?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.youtubeId) {
            track = { ...track, youtubeId: data.youtubeId };
          }
        }
      } catch (err) {
        console.warn('Failed to resolve youtubeId for track:', err);
      }
    }

    setCurrentTrack(track);
  };

  const playTrackList = async (tracks: Track[], index: number = 0) => {
    if (!tracks || tracks.length === 0) return;
    const targetTrack = tracks[index];

    if (targetTrack && !targetTrack.youtubeId) {
      try {
        const res = await fetch(
          `/api/resolve-track?q=${encodeURIComponent(`${targetTrack.title} ${targetTrack.artist}`)}`
        );
        if (res.ok) {
          const data = await res.json();
          if (data.youtubeId) {
            tracks[index] = { ...targetTrack, youtubeId: data.youtubeId };
          }
        }
      } catch (err) {
        console.warn('Failed to resolve youtubeId:', err);
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
