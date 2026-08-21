'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function YouTubeBridge() {
  const playerRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);

  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    setYtPlayer,
    setYtReady,
    setPlaying,
    setCurrentTime,
    setDuration,
    playNext,
  } = usePlayerStore();

  // 1. Dynamically Load YouTube IFrame API Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;

      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('jiya-yt-player', {
        height: '1',
        width: '1',
        videoId: currentTrack?.youtubeId || 'BddP6PYo2gs',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
        },
        events: {
          onReady: (event: any) => {
            setYtReady(true);
            setYtPlayer(event.target);
            event.target.setVolume(isMuted ? 0 : volume * 100);
          },
          onStateChange: (event: any) => {
            // YT.PlayerState: UNSTARTED (-1), ENDED (0), PLAYING (1), PAUSED (2), BUFFERING (3)
            if (event.data === 1) {
              setPlaying(true);
            } else if (event.data === 2) {
              setPlaying(false);
            } else if (event.data === 0) {
              setPlaying(false);
              playNext();
            }
          },
          onError: (err: any) => {
            console.warn('YouTube Player Error:', err);
            // Skip broken video on error after brief delay
            setTimeout(() => {
              playNext();
            }, 1000);
          },
        },
      });
    };

    if (!window.YT) {
      const tag = document.createElement('script');
      tag.src = 'https://www.youtube.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  // 2. Load New Track Video on Track Change
  useEffect(() => {
    const player = playerRef.current;
    if (!player || !currentTrack) return;

    const targetVidId = currentTrack.youtubeId || 'BddP6PYo2gs';
    try {
      if (typeof player.loadVideoById === 'function') {
        player.loadVideoById({
          videoId: targetVidId,
          startSeconds: 0,
        });
        setPlaying(true);
      }
    } catch (e) {
      console.warn('Error loading video by ID:', e);
    }
  }, [currentTrack]);

  // 3. Sync Play / Pause State with YT Player
  useEffect(() => {
    const player = playerRef.current;
    if (!player || typeof player.getPlayerState !== 'function') return;

    try {
      const state = player.getPlayerState();
      if (isPlaying) {
        if (state !== 1 && state !== 3) {
          player.playVideo();
        }
      } else {
        if (state === 1 || state === 3) {
          player.pauseVideo();
        }
      }
    } catch (e) {
      // Ignore transient YT state errors
    }
  }, [isPlaying]);

  // 4. Progress Bar Sync Interval (Poll current time every 250ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current;
      if (!player || typeof player.getCurrentTime !== 'function') return;

      try {
        const time = player.getCurrentTime() || 0;
        const dur = player.getDuration() || 0;

        setCurrentTime(time);
        if (dur > 0) {
          setDuration(dur);
        }
      } catch (e) {
        // Player not ready yet
      }
    }, 250);

    return () => clearInterval(interval);
  }, [setCurrentTime, setDuration]);

  return (
    <div
      ref={containerRef}
      className="fixed -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none z-[-1]"
    >
      <div id="jiya-yt-player" />
    </div>
  );
}
