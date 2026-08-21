'use client';

import { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export function useAudioController() {
  const audioRef = useRef<HTMLAudioElement | null>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    playNext,
    setPlaying,
    setCurrentTime,
    setDuration,
  } = usePlayerStore();

  // Initialize single HTML5 Audio element on client
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!audioRef.current) {
      const audio = new Audio();
      audio.preload = 'metadata';
      audioRef.current = audio;
    }

    const audio = audioRef.current;

    const handleTimeUpdate = () => {
      setCurrentTime(audio.currentTime);
    };

    const handleLoadedMetadata = () => {
      setDuration(audio.duration || 0);
    };

    const handleEnded = () => {
      playNext();
    };

    const handlePlay = () => {
      setPlaying(true);
    };

    const handlePause = () => {
      setPlaying(false);
    };

    const handleError = (e: Event) => {
      console.warn('Audio playback error encountered:', e);
      setPlaying(false);
    };

    audio.addEventListener('timeupdate', handleTimeUpdate);
    audio.addEventListener('loadedmetadata', handleLoadedMetadata);
    audio.addEventListener('ended', handleEnded);
    audio.addEventListener('play', handlePlay);
    audio.addEventListener('pause', handlePause);
    audio.addEventListener('error', handleError);

    return () => {
      audio.removeEventListener('timeupdate', handleTimeUpdate);
      audio.removeEventListener('loadedmetadata', handleLoadedMetadata);
      audio.removeEventListener('ended', handleEnded);
      audio.removeEventListener('play', handlePlay);
      audio.removeEventListener('pause', handlePause);
      audio.removeEventListener('error', handleError);
    };
  }, [playNext, setCurrentTime, setDuration, setPlaying]);

  // Handle Track Source Changes
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    if (currentTrack?.audioUrl) {
      if (audio.src !== currentTrack.audioUrl) {
        audio.src = currentTrack.audioUrl;
        audio.currentTime = 0;
        if (isPlaying) {
          audio.play().catch((err) => {
            console.warn('Autoplay error:', err);
            setPlaying(false);
          });
        }
      }
    } else {
      audio.pause();
      audio.src = '';
    }
  }, [currentTrack, isPlaying, setPlaying]);

  // Sync Play / Pause status
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio || !currentTrack) return;

    if (isPlaying) {
      if (audio.paused) {
        audio.play().catch((err) => {
          console.warn('Play error:', err);
          setPlaying(false);
        });
      }
    } else {
      if (!audio.paused) {
        audio.pause();
      }
    }
  }, [isPlaying, currentTrack, setPlaying]);

  // Sync Volume & Mute
  useEffect(() => {
    const audio = audioRef.current;
    if (!audio) return;

    audio.volume = isMuted ? 0 : volume;
  }, [volume, isMuted]);

  // Handle Manual Seeking
  const seekTo = (seconds: number) => {
    const audio = audioRef.current;
    if (!audio) return;
    audio.currentTime = seconds;
    setCurrentTime(seconds);
  };

  return {
    audioRef,
    seekTo,
  };
}
