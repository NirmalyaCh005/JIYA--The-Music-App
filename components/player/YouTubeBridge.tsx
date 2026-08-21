'use client';

import React, { useEffect, useRef } from 'react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { sanitizeYouTubeId } from '@/lib/utils/youtube';

declare global {
  interface Window {
    YT: any;
    onYouTubeIframeAPIReady: (() => void) | undefined;
  }
}

export function YouTubeBridge() {
  const playerRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const activeEngineRef = useRef<'native' | 'iframe'>('iframe');

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

  useEffect(() => {
    isPlayingRef.current = isPlaying;
  }, [isPlaying]);

  // 1. Initialize Native HTML5 Audio Element for Uninterrupted Mobile Background Streaming
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!nativeAudioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.crossOrigin = 'anonymous';
      nativeAudioRef.current = audio;

      audio.onplay = () => {
        setPlaying(true);
      };
      audio.onpause = () => {
        if (!document.hidden) setPlaying(false);
      };
      audio.onended = () => {
        setPlaying(false);
        playNext();
      };
      audio.ontimeupdate = () => {
        if (activeEngineRef.current === 'native') {
          setCurrentTime(audio.currentTime || 0);
          if (audio.duration && !isNaN(audio.duration)) {
            setDuration(audio.duration);
          }
        }
      };
      audio.onerror = (e) => {
        console.warn('Native HTML5 Audio error, falling back to YouTube IFrame:', e);
        activeEngineRef.current = 'iframe';
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (player && typeof player.playVideo === 'function') {
          player.playVideo();
        }
      };
    }
  }, [playNext, setCurrentTime, setDuration, setPlaying]);

  // 2. Mobile MediaSession API Integration (Lock Screen & Background Notification Center Controls)
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'JIYA Music Engine',
        artwork: [
          {
            src: currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg',
            sizes: '512x512',
            type: 'image/jpeg',
          },
        ],
      });

      try {
        navigator.mediaSession.setActionHandler('play', () => {
          setPlaying(true);
          if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
            nativeAudioRef.current.play().catch(() => {});
          } else {
            const player = playerRef.current || usePlayerStore.getState().ytPlayer;
            if (player && typeof player.playVideo === 'function') player.playVideo();
          }
        });

        navigator.mediaSession.setActionHandler('pause', () => {
          setPlaying(false);
          if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
            nativeAudioRef.current.pause();
          } else {
            const player = playerRef.current || usePlayerStore.getState().ytPlayer;
            if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
          }
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
            if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
              nativeAudioRef.current.currentTime = details.seekTime;
            }
          }
        });
      } catch (e) {
        // Ignored
      }
    }
  }, [currentTrack, playNext, playPrevious, seekToTime, setPlaying]);

  // 3. Direct YouTube IFrame & Native Audio Engine Switcher
  useEffect(() => {
    if (!currentTrack) return;

    let isCancelled = false;

    const loadTrackAudio = async () => {
      // 1. If track has custom audio URL (e.g. user uploaded MP3/WAV file)
      if (currentTrack.audioUrl) {
        if (!isCancelled) {
          activeEngineRef.current = 'native';
          if (nativeAudioRef.current) {
            nativeAudioRef.current.src = currentTrack.audioUrl;
            nativeAudioRef.current.volume = isMuted ? 0 : volume;

            // Pause YouTube IFrame if active
            const player = playerRef.current || usePlayerStore.getState().ytPlayer;
            if (player && typeof player.pauseVideo === 'function') {
              try { player.pauseVideo(); } catch (err) {}
            }

            if (isPlayingRef.current) {
              nativeAudioRef.current.play().catch(() => {});
            }
          }
        }
        return;
      }

      // 2. Direct YouTube IFrame Player Engine (Sanitizes 11-char Video ID to prevent Error Code 2)
      if (!isCancelled) {
        activeEngineRef.current = 'iframe';
        if (nativeAudioRef.current) nativeAudioRef.current.pause();

        const cleanYtId = sanitizeYouTubeId(currentTrack.youtubeId);

        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        const isReady = usePlayerStore.getState().isYtReady;

        if (player && isReady) {
          try {
            if (cleanYtId) {
              if (typeof player.loadVideoById === 'function') {
                player.loadVideoById({
                  videoId: cleanYtId,
                  startSeconds: 0,
                });
              }
            } else {
              if (typeof player.loadPlaylist === 'function') {
                player.loadPlaylist({
                  listType: 'search',
                  list: `${currentTrack.title} ${currentTrack.artist}`,
                  index: 0,
                  startSeconds: 0,
                });
              }
            }
          } catch (e) {
            console.warn('Error loading video into YouTube IFrame:', e);
          }
        }
      }
    };

    loadTrackAudio();

    return () => {
      isCancelled = true;
    };
  }, [currentTrack]);

  // 4. Sync Play / Pause & Volume with Active Audio Engine
  useEffect(() => {
    if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
      nativeAudioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        nativeAudioRef.current.play().catch(() => {});
      } else {
        nativeAudioRef.current.pause();
      }
    } else {
      const player = playerRef.current || usePlayerStore.getState().ytPlayer;
      const isReady = usePlayerStore.getState().isYtReady;
      if (player && isReady && typeof player.getPlayerState === 'function') {
        try {
          player.setVolume(isMuted ? 0 : volume * 100);
          const state = player.getPlayerState();
          if (isPlaying) {
            if (state !== 1 && state !== 3 && typeof player.playVideo === 'function') {
              player.playVideo();
            }
          } else {
            if ((state === 1 || state === 3) && typeof player.pauseVideo === 'function') {
              player.pauseVideo();
            }
          }
        } catch (e) {}
      }
    }
  }, [isPlaying, volume, isMuted]);

  // 5. Dynamically Load YouTube IFrame API Script (Fallback Engine)
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      const currentOrigin = window.location.origin;

      playerRef.current = new window.YT.Player('jiya-yt-player', {
        height: '1',
        width: '1',
        videoId: sanitizeYouTubeId(currentTrack?.youtubeId) || '',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 0,
          controls: 0,
          disablekb: 1,
          fs: 0,
          modestbranding: 1,
          rel: 0,
          playsinline: 1,
          enablejsapi: 1,
          iv_load_policy: 3,
          cc_load_policy: 0,
          origin: currentOrigin,
          widget_referrer: currentOrigin,
        },
        events: {
          onReady: (event: any) => {
            setYtReady(true);
            setYtPlayer(event.target);
            try {
              event.target.setVolume(isMuted ? 0 : volume * 100);
            } catch (err) {}
          },
          onStateChange: (event: any) => {
            if (activeEngineRef.current === 'iframe') {
              if (event.data === 1) {
                setPlaying(true);
              } else if (event.data === 2) {
                if (!document.hidden) setPlaying(false);
              } else if (event.data === 0) {
                setPlaying(false);
                playNext();
              }
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
      tag.src = 'https://www.youtube-nocookie.com/iframe_api';
      const firstScriptTag = document.getElementsByTagName('script')[0];
      firstScriptTag?.parentNode?.insertBefore(tag, firstScriptTag);
      window.onYouTubeIframeAPIReady = initPlayer;
    } else {
      initPlayer();
    }
  }, []);

  // 6. Progress Bar & MediaSession Sync Interval for YouTube IFrame Fallback
  useEffect(() => {
    const interval = setInterval(() => {
      if (activeEngineRef.current === 'iframe') {
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (!player || typeof player.getCurrentTime !== 'function') return;

        try {
          const time = player.getCurrentTime() || 0;
          const dur = player.getDuration() || 0;

          setCurrentTime(time);
          if (dur > 0) {
            setDuration(dur);
            if ('mediaSession' in navigator && 'setPositionState' in navigator.mediaSession) {
              try {
                navigator.mediaSession.setPositionState({
                  duration: dur,
                  playbackRate: 1,
                  position: Math.min(time, dur),
                });
              } catch (err) {}
            }
          }
        } catch (e) {}
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
