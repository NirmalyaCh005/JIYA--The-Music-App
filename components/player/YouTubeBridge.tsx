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

// 1-Second PCM Silent WAV Audio Data URI for Mobile Background Keep-Alive
const SILENT_WAV_URI =
  'data:audio/wav;base64,UklGRiQAAABXQVZFZm10IBAAAAABAAEARKwAAIhYAQACABAAZGF0YQAAAAA=';

export function YouTubeBridge() {
  const playerRef = useRef<any | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const nativeAudioRef = useRef<HTMLAudioElement | null>(null);
  const silentAudioRef = useRef<HTMLAudioElement | null>(null);
  const isPlayingRef = useRef<boolean>(false);
  const activeEngineRef = useRef<'native' | 'iframe'>('native');

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

  // 1. Initialize Primary Native HTML5 Audio Engine with Debugging & Auto-Retry Listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    if (!nativeAudioRef.current) {
      const audio = new Audio();
      audio.preload = 'auto';
      audio.setAttribute('playsinline', 'true');
      audio.setAttribute('webkit-playsinline', 'true');
      audio.setAttribute('x5-playsinline', 'true');
      nativeAudioRef.current = audio;

      audio.onplay = () => {
        setPlaying(true);
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      };

      audio.onplaying = () => {
        console.log("Audio successfully playing!");
      };

      audio.onwaiting = () => {
        console.log("Audio buffering...");
      };

      audio.onpause = () => {
        if (document.hidden && isPlayingRef.current) {
          audio.play().catch(() => {});
        } else {
          setPlaying(false);
          if ('mediaSession' in navigator) {
            navigator.mediaSession.playbackState = 'paused';
          }
        }
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

      audio.onerror = async (e) => {
        console.error("Native Audio Playback Error:", audio.error || e);
        const track = usePlayerStore.getState().currentTrack;
        if (!track) return;

        try {
          const res = await fetch(
            `/api/resolve-track?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`
          );
          if (res.ok) {
            const data = await res.json();
            if (data.audioUrl && data.audioUrl.startsWith('http') && nativeAudioRef.current) {
              nativeAudioRef.current.src = `/api/stream?url=${encodeURIComponent(data.audioUrl)}`;
              nativeAudioRef.current.load();
              if (isPlayingRef.current) {
                nativeAudioRef.current.play().catch(() => {});
              }
            }
          }
        } catch (err) {}
      };
    }

    if (!silentAudioRef.current) {
      const silent = new Audio(SILENT_WAV_URI);
      silent.loop = true;
      silent.volume = 0.0001;
      silent.setAttribute('playsinline', 'true');
      silent.setAttribute('webkit-playsinline', 'true');
      silentAudioRef.current = silent;
    }
  }, [playNext, setCurrentTime, setDuration, setPlaying]);

  // 2. Mobile MediaSession API Integration
  useEffect(() => {
    if (typeof window === 'undefined' || !('mediaSession' in navigator)) return;

    if (currentTrack) {
      const cover = currentTrack.coverUrl || '/logo.png';
      navigator.mediaSession.metadata = new MediaMetadata({
        title: currentTrack.title,
        artist: currentTrack.artist,
        album: currentTrack.album || 'Jiya Music',
        artwork: [
          { src: cover, sizes: '96x96', type: 'image/jpeg' },
          { src: cover, sizes: '128x128', type: 'image/jpeg' },
          { src: cover, sizes: '192x192', type: 'image/jpeg' },
          { src: cover, sizes: '512x512', type: 'image/jpeg' },
        ],
      });
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }

    const setHandler = (action: MediaSessionAction, handler: ((details?: any) => void) | null) => {
      try {
        navigator.mediaSession.setActionHandler(action, handler);
      } catch (e) {}
    };

    setHandler('play', () => {
      setPlaying(true);
      if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
        nativeAudioRef.current.play().catch(() => {});
      } else {
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (player && typeof player.playVideo === 'function') player.playVideo();
      }
      if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
    });

    setHandler('pause', () => {
      setPlaying(false);
      if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
        nativeAudioRef.current.pause();
      } else {
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
      }
      if (silentAudioRef.current) silentAudioRef.current.pause();
      if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
    });

    setHandler('previoustrack', () => playPrevious());
    setHandler('nexttrack', () => playNext());
    setHandler('stop', () => {
      setPlaying(false);
      if (nativeAudioRef.current) nativeAudioRef.current.pause();
      if (silentAudioRef.current) silentAudioRef.current.pause();
    });
    setHandler('seekto', (details: any) => {
      if (details?.seekTime !== undefined && details?.seekTime !== null) {
        seekToTime(details.seekTime);
        if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
          nativeAudioRef.current.currentTime = details.seekTime;
        } else {
          const player = playerRef.current || usePlayerStore.getState().ytPlayer;
          if (player && typeof player.seekTo === 'function') player.seekTo(details.seekTime, true);
        }
      }
    });
    setHandler('seekbackward', (details: any) => {
      const skipTime = details?.seekOffset || 10;
      const { currentTime } = usePlayerStore.getState();
      seekToTime(Math.max(0, currentTime - skipTime));
    });
    setHandler('seekforward', (details: any) => {
      const skipTime = details?.seekOffset || 10;
      const { currentTime, duration } = usePlayerStore.getState();
      seekToTime(Math.min(duration, currentTime + skipTime));
    });
  }, [currentTrack, isPlaying, playNext, playPrevious, seekToTime, setPlaying]);

  // 3. Mobile Background & Screen Off Playback Event Listeners
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const handleBackgroundPlayback = () => {
      const { isPlaying } = usePlayerStore.getState();
      if (isPlaying) {
        if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
          nativeAudioRef.current.play().catch(() => {});
        }
        if (silentAudioRef.current) {
          silentAudioRef.current.play().catch(() => {});
        }
        if ('mediaSession' in navigator) {
          navigator.mediaSession.playbackState = 'playing';
        }
      }
    };

    document.addEventListener('visibilitychange', handleBackgroundPlayback);
    window.addEventListener('pagehide', handleBackgroundPlayback);
    window.addEventListener('blur', handleBackgroundPlayback);

    return () => {
      document.removeEventListener('visibilitychange', handleBackgroundPlayback);
      window.removeEventListener('pagehide', handleBackgroundPlayback);
      window.removeEventListener('blur', handleBackgroundPlayback);
    };
  }, []);

  const fadeIntervalRef = useRef<NodeJS.Timeout | null>(null);

  const applyVolumeFaded = (vol: number) => {
    const { isMuted } = usePlayerStore.getState();
    if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
      nativeAudioRef.current.volume = isMuted ? 0 : Math.max(0, Math.min(1, vol));
    } else {
      const player = playerRef.current || usePlayerStore.getState().ytPlayer;
      if (player && typeof player.setVolume === 'function') {
        try {
          player.setVolume(isMuted ? 0 : Math.max(0, Math.min(100, vol * 100)));
        } catch (err) {}
      }
    }
  };

  const crossfadeTrackChange = (loadTrackFn: () => void) => {
    const { volume, isMuted } = usePlayerStore.getState();

    if (fadeIntervalRef.current) {
      clearInterval(fadeIntervalRef.current);
      fadeIntervalRef.current = null;
    }

    loadTrackFn();

    if (isMuted || volume === 0) {
      applyVolumeFaded(0);
      return;
    }

    let currentVol = 0.1 * volume;
    applyVolumeFaded(currentVol);

    const steps = 6;
    const stepAmount = (volume - currentVol) / steps;
    const stepTime = 30;

    fadeIntervalRef.current = setInterval(() => {
      currentVol += stepAmount;
      if (currentVol >= volume) {
        currentVol = volume;
        if (fadeIntervalRef.current) {
          clearInterval(fadeIntervalRef.current);
          fadeIntervalRef.current = null;
        }
      }
      applyVolumeFaded(currentVol);
    }, stepTime);
  };

  // 4. Universal Track Audio Engine (Handles Direct Stream, Resolved Stream & YouTube IDs)
  useEffect(() => {
    if (!currentTrack) return;

    let isCancelled = false;

    const loadTrackAudio = async () => {
      const isPreviewUrl =
        currentTrack.audioUrl &&
        (currentTrack.audioUrl.includes('itunes.apple.com') ||
          currentTrack.audioUrl.includes('preview') ||
          currentTrack.audioUrl.includes('p.scdn.co'));

      const isDirectAudioUrl =
        currentTrack.audioUrl &&
        !isPreviewUrl &&
        (currentTrack.audioUrl.startsWith('http://') ||
          currentTrack.audioUrl.startsWith('https://') ||
          currentTrack.audioUrl.startsWith('/'));

      // Step 1: Track has direct HTTP audio stream URL
      if (isDirectAudioUrl && currentTrack.audioUrl) {
        if (!isCancelled && nativeAudioRef.current) {
          activeEngineRef.current = 'native';
          const finalSrc = currentTrack.audioUrl.startsWith('http')
            ? `/api/stream?url=${encodeURIComponent(currentTrack.audioUrl)}`
            : currentTrack.audioUrl;
          nativeAudioRef.current.src = finalSrc;
          nativeAudioRef.current.load();
          nativeAudioRef.current.volume = isMuted ? 0 : volume;

          const player = playerRef.current || usePlayerStore.getState().ytPlayer;
          if (player && typeof player.pauseVideo === 'function') {
            try { player.pauseVideo(); } catch (err) {}
          }

          if (isPlayingRef.current) {
            nativeAudioRef.current.play().catch((err) => {
              console.warn('Native audio play error:', err);
            });
            if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
          }
          return;
        }
      }

      // Step 2: Resolve track via /api/resolve-track
      try {
        const res = await fetch(
          `/api/resolve-track?q=${encodeURIComponent(`${currentTrack.title} ${currentTrack.artist}`)}`
        );
        if (res.ok) {
          const data = await res.json();

          // A. Resolved direct HTTP audio stream (JioSaavn 320kbps / proxy)
          if (data.audioUrl && data.audioUrl.startsWith('http') && nativeAudioRef.current) {
            if (!isCancelled) {
              activeEngineRef.current = 'native';
              nativeAudioRef.current.src = `/api/stream?url=${encodeURIComponent(data.audioUrl)}`;
              nativeAudioRef.current.load();
              nativeAudioRef.current.volume = isMuted ? 0 : volume;
              if (isPlayingRef.current) {
                nativeAudioRef.current.play().catch((err) => {
                  console.warn('Resolved native audio play error:', err);
                });
                if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
              }
              return;
            }
          }

          // B. Resolved YouTube Video ID
          const ytId = sanitizeYouTubeId(data.youtubeId || data.audioUrl);
          const player = playerRef.current || usePlayerStore.getState().ytPlayer;
          if (ytId && player && !isCancelled) {
            activeEngineRef.current = 'iframe';
            if (nativeAudioRef.current) nativeAudioRef.current.pause();
            try {
              if (typeof player.loadVideoById === 'function') {
                player.loadVideoById({
                  videoId: ytId,
                  startSeconds: 0,
                });
                if (typeof player.playVideo === 'function') {
                  try { player.playVideo(); } catch (err) {}
                }
                if (isPlayingRef.current && silentAudioRef.current) {
                  silentAudioRef.current.play().catch(() => {});
                }
              }
            } catch (e) {
              console.warn('YouTube IFrame load error:', e);
            }
            return;
          }
        }
      } catch (err) {
        console.warn('Track resolution failed, attempting direct YouTube ID load:', err);
      }

      // Step 3: Direct YouTube ID on currentTrack object fallback
      if (!isCancelled) {
        let cleanYtId = sanitizeYouTubeId(currentTrack.youtubeId || currentTrack.audioUrl);
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;

        if (player && cleanYtId) {
          activeEngineRef.current = 'iframe';
          if (nativeAudioRef.current) nativeAudioRef.current.pause();

          try {
            if (typeof player.loadVideoById === 'function') {
              player.loadVideoById({
                videoId: cleanYtId,
                startSeconds: 0,
              });
              if (typeof player.playVideo === 'function') {
                try { player.playVideo(); } catch (err) {}
              }
              if (isPlayingRef.current && silentAudioRef.current) {
                silentAudioRef.current.play().catch(() => {});
              }
            }
          } catch (e) {
            console.warn('YouTube IFrame load error:', e);
          }
        }
      }
    };

    crossfadeTrackChange(() => {
      if (!isCancelled) {
        loadTrackAudio();
      }
    });

    return () => {
      isCancelled = true;
      if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
    };
  }, [currentTrack]);

  // 5. Sync Play/Pause State & Volume across Audio Engine & Background Keep-Alive
  useEffect(() => {
    if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
      nativeAudioRef.current.volume = isMuted ? 0 : volume;
      if (isPlaying) {
        nativeAudioRef.current.play().catch(() => {});
        if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
      } else {
        nativeAudioRef.current.pause();
        if (silentAudioRef.current) silentAudioRef.current.pause();
      }
    } else {
      const player = playerRef.current || usePlayerStore.getState().ytPlayer;
      if (player && typeof player.getPlayerState === 'function') {
        try {
          player.setVolume(isMuted ? 0 : volume * 100);
          const state = player.getPlayerState();
          if (isPlaying) {
            if (state !== 1 && state !== 3 && typeof player.playVideo === 'function') {
              player.playVideo();
            }
            if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
          } else {
            if ((state === 1 || state === 3) && typeof player.pauseVideo === 'function') {
              player.pauseVideo();
            }
            if (silentAudioRef.current) silentAudioRef.current.pause();
          }
        } catch (e) {}
      }
    }

    if ('mediaSession' in navigator) {
      navigator.mediaSession.playbackState = isPlaying ? 'playing' : 'paused';
    }
  }, [isPlaying, volume, isMuted]);

  // 6. Dynamically Load YouTube IFrame API Script
  useEffect(() => {
    if (typeof window === 'undefined') return;

    const initPlayer = () => {
      if (!window.YT || !window.YT.Player) return;
      if (playerRef.current) return;

      const currentOrigin =
        typeof window !== 'undefined' && window.location.origin
          ? window.location.origin
          : 'https://jiya-kappa.vercel.app';

      playerRef.current = new window.YT.Player('jiya-yt-player', {
        height: '1',
        width: '1',
        videoId: sanitizeYouTubeId(currentTrack?.youtubeId) || '',
        host: 'https://www.youtube-nocookie.com',
        playerVars: {
          autoplay: 1,
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
              if (event.data === 1) { // PLAYING
                setPlaying(true);
                if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
                if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'playing';
              } else if (event.data === 2) { // PAUSED
                if (!document.hidden) {
                  setPlaying(false);
                  if ('mediaSession' in navigator) navigator.mediaSession.playbackState = 'paused';
                } else {
                  if (isPlayingRef.current && silentAudioRef.current) {
                    silentAudioRef.current.play().catch(() => {});
                  }
                }
              } else if (event.data === 0) { // ENDED
                setPlaying(false);
                playNext();
              }
            }
          },
          onError: (err: any) => {
            console.warn('YouTube Player Error on WebView:', err);
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

  // 7. Progress Bar & MediaSession Position Sync Interval
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

  // 8. Android WebView 1.5-Second Stalled Playback Watchdog
  useEffect(() => {
    let watchdogTimer: NodeJS.Timeout | null = null;

    if (isPlaying && currentTrack) {
      watchdogTimer = setTimeout(async () => {
        const time = usePlayerStore.getState().currentTime;
        const isStillPlaying = usePlayerStore.getState().isPlaying;

        if (time === 0 && isStillPlaying) {
          console.warn('Playback stalled at 0:00 on Android WebView. Forcing direct stream fallback...');

          try {
            const res = await fetch(
              `/api/resolve-track?q=${encodeURIComponent(`${currentTrack.title} ${currentTrack.artist}`)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.audioUrl && data.audioUrl.startsWith('http') && nativeAudioRef.current) {
                activeEngineRef.current = 'native';
                nativeAudioRef.current.src = `/api/stream?url=${encodeURIComponent(data.audioUrl)}`;
                nativeAudioRef.current.load();
                nativeAudioRef.current.volume = usePlayerStore.getState().isMuted ? 0 : usePlayerStore.getState().volume;
                nativeAudioRef.current.play().catch((err) => {
                  console.error('Watchdog fallback audio play error:', err);
                });
                if (silentAudioRef.current) silentAudioRef.current.play().catch(() => {});
              }
            }
          } catch (err) {}
        }
      }, 1500);
    }

    return () => {
      if (watchdogTimer) clearTimeout(watchdogTimer);
    };
  }, [isPlaying, currentTrack]);

  return (
    <div
      ref={containerRef}
      className="fixed -left-[9999px] -top-[9999px] w-1 h-1 overflow-hidden opacity-0 pointer-events-none z-[-1]"
    >
      <div id="jiya-yt-player" />
    </div>
  );
}
