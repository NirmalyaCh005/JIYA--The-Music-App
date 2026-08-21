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
      audio.onerror = async (e) => {
        console.warn('Native HTML5 Audio error, attempting YouTube fallback:', e);
        const track = usePlayerStore.getState().currentTrack;
        if (!track) return;

        activeEngineRef.current = 'iframe';
        let cleanYtId = sanitizeYouTubeId(track.youtubeId);

        if (!cleanYtId) {
          try {
            const res = await fetch(
              `/api/resolve-track?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.youtubeId) cleanYtId = sanitizeYouTubeId(data.youtubeId);
            }
          } catch (err) {}
        }

        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (player && cleanYtId && typeof player.loadVideoById === 'function') {
          try {
            player.loadVideoById({
              videoId: cleanYtId,
              startSeconds: 0,
            });
            if (typeof player.playVideo === 'function') {
              player.playVideo();
            }
          } catch (err) {}
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
        album: currentTrack.album || 'Jiya Music',
        artwork: [
          { src: currentTrack.coverUrl || '', sizes: '96x96', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '', sizes: '128x128', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '', sizes: '192x192', type: 'image/jpeg' },
          { src: currentTrack.coverUrl || '', sizes: '512x512', type: 'image/jpeg' },
        ],
      });
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
    });

    setHandler('pause', () => {
      setPlaying(false);
      if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
        nativeAudioRef.current.pause();
      } else {
        const player = playerRef.current || usePlayerStore.getState().ytPlayer;
        if (player && typeof player.pauseVideo === 'function') player.pauseVideo();
      }
    });

    setHandler('previoustrack', () => playPrevious());
    setHandler('nexttrack', () => playNext());
    setHandler('seekto', (details: any) => {
      if (details?.seekTime !== undefined && details?.seekTime !== null) {
        seekToTime(details.seekTime);
        if (activeEngineRef.current === 'native' && nativeAudioRef.current) {
          nativeAudioRef.current.currentTime = details.seekTime;
        }
      }
    });
  }, [currentTrack, playNext, playPrevious, seekToTime, setPlaying]);

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
    const { isCrossfadeEnabled, crossfadeDuration, volume, isMuted } = usePlayerStore.getState();

    // If crossfade is disabled, muted, or no previous track was playing, load directly
    if (!isCrossfadeEnabled || isMuted || volume === 0 || !isPlayingRef.current) {
      loadTrackFn();
      applyVolumeFaded(volume);
      return;
    }

    if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);

    const durationMs = (crossfadeDuration || 2) * 1000;
    const fadeSteps = 12;
    const stepTime = Math.max(25, Math.floor((durationMs / 2) / fadeSteps));
    let currentVol = volume;
    const stepAmount = volume / fadeSteps;

    // Phase 1: Smooth Fade-Out of outgoing track
    fadeIntervalRef.current = setInterval(() => {
      currentVol -= stepAmount;
      if (currentVol <= 0) {
        if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
        applyVolumeFaded(0);

        // Phase 2: Load incoming track
        loadTrackFn();

        // Phase 3: Smooth Fade-In of incoming track
        let fadeInVol = 0;
        const fadeInStep = volume / fadeSteps;
        fadeIntervalRef.current = setInterval(() => {
          fadeInVol += fadeInStep;
          if (fadeInVol >= volume) {
            fadeInVol = volume;
            if (fadeIntervalRef.current) clearInterval(fadeIntervalRef.current);
          }
          applyVolumeFaded(fadeInVol);
        }, stepTime);
      } else {
        applyVolumeFaded(currentVol);
      }
    }, stepTime);
  };

  // 3. Direct YouTube IFrame & Native Audio Engine Switcher with Crossfading
  useEffect(() => {
    if (!currentTrack) return;

    let isCancelled = false;

    const loadTrackAudio = async () => {
      // 1. If track has custom audio URL (e.g. user uploaded MP3/WAV file)
      if (currentTrack.audioUrl) {
        if (!isCancelled) {
          activeEngineRef.current = 'native';
          if (nativeAudioRef.current) {
            const finalSrc = currentTrack.audioUrl.startsWith('http')
              ? `/api/stream?url=${encodeURIComponent(currentTrack.audioUrl)}`
              : currentTrack.audioUrl;
            nativeAudioRef.current.src = finalSrc;
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

      // 2. Direct YouTube IFrame Player Engine
      if (!isCancelled) {
        activeEngineRef.current = 'iframe';
        if (nativeAudioRef.current) nativeAudioRef.current.pause();

        let cleanYtId = sanitizeYouTubeId(currentTrack.youtubeId);

        if (!cleanYtId && !currentTrack.audioUrl) {
          try {
            const res = await fetch(
              `/api/resolve-track?q=${encodeURIComponent(`${currentTrack.title} ${currentTrack.artist}`)}`
            );
            if (res.ok) {
              const data = await res.json();
              if (data.youtubeId) {
                cleanYtId = sanitizeYouTubeId(data.youtubeId);
              }
            }
          } catch (e) {}
        }

        const player = playerRef.current || usePlayerStore.getState().ytPlayer;

        if (player && cleanYtId) {
          try {
            if (typeof player.loadVideoById === 'function') {
              player.loadVideoById({
                videoId: cleanYtId,
                startSeconds: 0,
              });
              if (typeof player.playVideo === 'function') {
                try { player.playVideo(); } catch (err) {}
              }
            }
          } catch (e) {
            console.warn('Error loading video into YouTube IFrame:', e);
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
      if (player && typeof player.getPlayerState === 'function') {
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

            // Immediately resolve & load active track when player becomes ready
            const track = usePlayerStore.getState().currentTrack;
            if (track && !track.audioUrl) {
              const loadReadyTrack = async () => {
                let cleanYtId = sanitizeYouTubeId(track.youtubeId);
                if (!cleanYtId) {
                  try {
                    const res = await fetch(
                      `/api/resolve-track?q=${encodeURIComponent(`${track.title} ${track.artist}`)}`
                    );
                    if (res.ok) {
                      const data = await res.json();
                      if (data.youtubeId) cleanYtId = sanitizeYouTubeId(data.youtubeId);
                    }
                  } catch (e) {}
                }

                if (cleanYtId && typeof event.target.loadVideoById === 'function') {
                  try {
                    event.target.loadVideoById({
                      videoId: cleanYtId,
                      startSeconds: 0,
                    });
                    if (typeof event.target.playVideo === 'function') {
                      event.target.playVideo();
                    }
                  } catch (err) {}
                }
              };
              loadReadyTrack();
            }
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
      tag.src = 'https://www.youtube.com/iframe_api';
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
