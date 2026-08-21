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

  // 1. Dynamically Load YouTube IFrame API Script (NO AUTOPLAY ON INIT)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      playerRef.current = new window.YT.Player('jiya-yt-player', {
        height: '1',
        width: '1',
        videoId: currentTrack?.youtubeId || '',
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

            // Only load/play if user had an active playing session
            if (currentTrack && isPlaying) {
              if (currentTrack.youtubeId) {
                event.target.loadVideoById({
                  videoId: currentTrack.youtubeId,
                  startSeconds: 0,
                });
              } else if (typeof event.target.loadPlaylist === 'function') {
                event.target.loadPlaylist({
                  listType: 'search',
                  list: `${currentTrack.title} ${currentTrack.artist}`,
                  index: 0,
                  startSeconds: 0,
                });
              }
            }
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

  // 2. Dynamic Universal Track Switcher (Triggers ONLY when user selects a track)
  useEffect(() => {
    const player = playerRef.current || usePlayerStore.getState().ytPlayer;
    if (!player || !currentTrack) return;

    try {
      if (currentTrack.youtubeId) {
        if (typeof player.loadVideoById === 'function') {
          player.loadVideoById({
            videoId: currentTrack.youtubeId,
            startSeconds: 0,
          });
          if (isPlaying) setPlaying(true);
        }
      } else {
        if (typeof player.loadPlaylist === 'function') {
          player.loadPlaylist({
            listType: 'search',
            list: `${currentTrack.title} ${currentTrack.artist}`,
            index: 0,
            startSeconds: 0,
          });
          if (isPlaying) setPlaying(true);
        }
      }
    } catch (e) {
      console.warn('Error switching track in YouTubeBridge:', e);
    }
  }, [currentTrack]);

  // 3. Sync Play / Pause State with YT Player
  useEffect(() => {
    const player = playerRef.current || usePlayerStore.getState().ytPlayer;
    if (!player || typeof player.getPlayerState !== 'function') return;

    try {
      const state = player.getPlayerState();
      if (isPlaying) {
        if (state !== 1 && state !== 3) {
          if (typeof player.playVideo === 'function') player.playVideo();
        }
      } else {
        if (state === 1 || state === 3) {
          if (typeof player.pauseVideo === 'function') player.pauseVideo();
        }
      }
    } catch (e) {
      // Ignore transient YT state errors
    }
  }, [isPlaying]);

  // 4. Progress Bar Sync Interval (Poll current time every 250ms)
  useEffect(() => {
    const interval = setInterval(() => {
      const player = playerRef.current || usePlayerStore.getState().ytPlayer;
      if (!player || typeof player.getCurrentTime !== 'function') return;

      try {
        const time = player.getCurrentTime() || 0;
        const dur = player.getDuration() || 0;

        setCurrentTime(time);
        if (dur > 0) {
          setDuration(dur);
        }
      } catch (e) {
        // Player initializing
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
