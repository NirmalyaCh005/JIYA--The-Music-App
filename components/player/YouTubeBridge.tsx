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
  const keepAliveAudioRef = useRef<HTMLAudioElement | null>(null);

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
    playPrevious,
    seekToTime,
  } = usePlayerStore();

  // 1. Initialize Silent Background Keep-Alive Audio Element for Mobile Browsers
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!keepAliveAudioRef.current) {
      const audio = new Audio();
      // Silent 1-second PCM WAV loop
      audio.src = 'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';
      audio.loop = true;
      audio.volume = 0.001; // Silent output to hold OS audio session focus
      keepAliveAudioRef.current = audio;
    }
  }, []);

  // 2. Mobile MediaSession API Integration (Lock Screen & Background Notification Center Controls)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'JIYA Music',
        artwork: [
          {
            src: currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      // Media Session Action Handlers for Background Playback
      try {
        navigator.mediaSession.setActionHandler('play', () => {
          setPlaying(true);
          const player = playerRef.current || usePlayerStore.getState().ytPlayer;
          if (player && typeof player.playVideo === 'function') player.playVideo();
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          setPlaying(false);
          const player = playerRef.current || usePlayerStore.getState().ytPlayer;
          if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
        });

        navigator.mediaSession.setActionHandler('previoustrack', () => {
          playPrevious();
        });

        navigator.mediaSession.setActionHandler('nexttrack', () => {
          playNext();
        });

        navigator.mediaSession.setActionHandler('seekto', (details) => {
          if (details.seekTime !== undefined) {
            seekToTime(details.seekTime);
          }
        });
      } catch (e) {
        // Fallback if browser doesn't support specific action
      }
    }
  }, [currentTrack, playNext, playPrevious, seekToTime, setPlaying]);

  // 3. Keep-Alive Audio Sync on Play / Pause (Prevents OS from suspending audio on screen off)
  useEffect(() => {
    const keepAlive = keepAliveAudioRef.current;
    if (!keepAlive) return;

    if (isPlaying && currentTrack) {
      keepAlive.play().catch(() => {
        // Auto-play policy handled on touch interaction
      });
    } else {
      keepAlive.pause();
    }
  }, [isPlaying, currentTrack]);

  // 4. Background Visibility Change Handler (Re-enforces playback when switching tabs or locking screen)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleVisibilityChange = () => {
      if (document.hidden && isPlaying && currentTrack) {
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (player && typeof player.playVideo === 'function') {
          player.playVideo();
        }
        if (keepAliveAudioRef.current) {
          keepAliveAudioRef.current.play().catch(() => {});
        }
      }
    };

    document.addEventListener('visibilitychange', handleVisibilityChange);
    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
    };
  }, [isPlaying, currentTrack]);

  // 5. Dynamically Load YouTube IFrame API Script
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
              if (keepAliveAudioRef.current) {
                keepAliveAudioRef.current.play().catch(() => {});
              }
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

  // 6. Dynamic Universal Track Switcher
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

  // 7. Sync Play / Pause State with YT Player
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

  // 8. Progress Bar & Position State Sync Interval (Poll current time every 250ms & update MediaSession position state)
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

          // Sync position state with Mobile Lock Screen / Control Center media controls
          if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
            try {
              navigator.mediaSession.setPositionState({
                duration: dur,
                playbackRate: 1,
                position: Math.min(time, dur),
              });
            } catch (err) {
              // Ignore position state errors
            }
          }
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
