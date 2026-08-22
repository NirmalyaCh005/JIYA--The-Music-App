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

  const isPreviewUrl = (url?: string | null) =>
    !!url && (url.includes('itunes.apple.com') || url.includes('preview') || url.includes('p.scdn.co'));

  // Prime / unlock HTML5 Audio context synchronously inside user gesture callstack for Android WebView
  const primeUserGestureAudio = () => {
    if (typeof window === 'undefined') return;
    try {
      if ('mediaSession' in navigator) {
        navigator.mediaSession.playbackState = 'playing';
      }
      const dummy = new Audio();
      dummy.volume = 0.001;
      const playPromise = dummy.play();
      if (playPromise !== undefined) {
        playPromise.catch(() => {
          // Silently catch NotAllowedError / autoplay rejection on first gesture
        });
      }
    } catch (e) {}
  };

  const playTrack = async (track: Track) => {
    if (!track) return;

    // Execute gesture priming & setPlaying directly inside user click callstack
    primeUserGestureAudio();
    setPlaying(true);

    if (!track.audioUrl || isPreviewUrl(track.audioUrl) || (!track.youtubeId && !track.audioUrl?.startsWith('http'))) {
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

    // Execute gesture priming & setPlaying directly inside user click callstack
    primeUserGestureAudio();
    setPlaying(true);

    if (targetTrack && (!targetTrack.audioUrl || isPreviewUrl(targetTrack.audioUrl) || (!targetTrack.youtubeId && !targetTrack.audioUrl?.startsWith('http')))) {
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

  const handleTogglePlayPause = () => {
    primeUserGestureAudio();
    togglePlayPause();
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
    togglePlayPause: handleTogglePlayPause,
    setPlaying,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seekToTime,
  };
}
