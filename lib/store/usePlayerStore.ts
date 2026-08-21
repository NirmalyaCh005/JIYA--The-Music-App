import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { Track, RepeatMode, PlayerStoreState } from '@/types/music';

export const usePlayerStore = create<PlayerStoreState>()(
  persist(
    (set, get) => ({
      currentTrack: null,
      queue: [],
      queueIndex: -1,
      isPlaying: false,
      volume: 0.8,
      isMuted: false,
      isShuffle: false,
      repeatMode: 'off',
      currentTime: 0,
      duration: 0,
      isQueueDrawerOpen: false,
      isUploadModalOpen: false,
      isAmbientModeOpen: false,
      likedTrackIds: new Set<string>(),
      theme: 'light',
      user: null,
      recentlyPlayed: [],

      isCrossfadeEnabled: true,
      crossfadeDuration: 2,
      toggleCrossfade: () => set((state) => ({ isCrossfadeEnabled: !state.isCrossfadeEnabled })),
      setCrossfadeDuration: (dur) => set({ crossfadeDuration: Math.max(1, Math.min(10, dur)) }),

      setUser: (user) => set({ user }),
      toggleTheme: () => set((state) => ({ theme: state.theme === 'dark' ? 'light' : 'dark' })),
      toggleAmbientMode: (open) => {
        const current = get().isAmbientModeOpen;
        set({ isAmbientModeOpen: open !== undefined ? open : !current });
      },
      addRecentlyPlayed: (track) => {
        if (!track) return;
        set((state) => {
          const filtered = state.recentlyPlayed.filter((t) => t.id !== track.id);
          return { recentlyPlayed: [track, ...filtered].slice(0, 30) };
        });
      },

      // YouTube Player Engine State
      ytPlayer: null,
      isYtReady: false,
      seekTimeRequested: null,

      setYtPlayer: (player) => set({ ytPlayer: player }),
      setYtReady: (ready) => set({ isYtReady: ready }),

      seekToTime: (seconds) => {
        const { ytPlayer } = get();
        if (ytPlayer && typeof ytPlayer.seekTo === 'function') {
          ytPlayer.seekTo(seconds, true);
        }
        set({ currentTime: seconds, seekTimeRequested: seconds });
      },

      setCurrentTrack: (track) => {
        if (track) {
          get().addRecentlyPlayed(track);
        }
        const { queue } = get();
        let index = queue.findIndex((t) => t.id === track?.id);

        if (track && index === -1) {
          set({
            currentTrack: track,
            queue: [track, ...queue],
            queueIndex: 0,
            isPlaying: true,
            currentTime: 0,
          });
        } else {
          set({
            currentTrack: track,
            queueIndex: index >= 0 ? index : 0,
            isPlaying: !!track,
            currentTime: 0,
          });
        }
      },

      setQueue: (tracks, initialIndex = 0) => {
        if (!tracks || tracks.length === 0) return;
        const validIndex = Math.max(0, Math.min(initialIndex, tracks.length - 1));
        const activeTrack = tracks[validIndex];
        if (activeTrack) {
          get().addRecentlyPlayed(activeTrack);
        }
        set({
          queue: tracks,
          queueIndex: validIndex,
          currentTrack: activeTrack,
          isPlaying: true,
          currentTime: 0,
        });
      },

      addToQueue: (track) => {
        const { queue, currentTrack } = get();
        const exists = queue.some((t) => t.id === track.id);
        if (exists) return;

        const updatedQueue = [...queue, track];
        if (!currentTrack) {
          set({
            queue: updatedQueue,
            queueIndex: 0,
            currentTrack: track,
            isPlaying: true,
            currentTime: 0,
          });
        } else {
          set({ queue: updatedQueue });
        }
      },

      removeFromQueue: (index) => {
        const { queue, queueIndex, currentTrack } = get();
        if (index < 0 || index >= queue.length) return;

        const updatedQueue = queue.filter((_, i) => i !== index);
        let newIndex = queueIndex;
        let newTrack = currentTrack;

        if (index === queueIndex) {
          if (updatedQueue.length > 0) {
            newIndex = Math.min(queueIndex, updatedQueue.length - 1);
            newTrack = updatedQueue[newIndex];
          } else {
            newIndex = -1;
            newTrack = null;
          }
        } else if (index < queueIndex) {
          newIndex = queueIndex - 1;
        }

        set({
          queue: updatedQueue,
          queueIndex: newIndex,
          currentTrack: newTrack,
          isPlaying: updatedQueue.length > 0 ? get().isPlaying : false,
        });
      },

      reorderQueue: (startIndex, endIndex) => {
        const { queue, queueIndex } = get();
        if (
          startIndex < 0 ||
          startIndex >= queue.length ||
          endIndex < 0 ||
          endIndex >= queue.length
        )
          return;

        const result = Array.from(queue);
        const [removed] = result.splice(startIndex, 1);
        result.splice(endIndex, 0, removed);

        let newQueueIndex = queueIndex;
        if (queueIndex === startIndex) {
          newQueueIndex = endIndex;
        } else if (startIndex < queueIndex && endIndex >= queueIndex) {
          newQueueIndex = queueIndex - 1;
        } else if (startIndex > queueIndex && endIndex <= queueIndex) {
          newQueueIndex = queueIndex + 1;
        }

        set({
          queue: result,
          queueIndex: newQueueIndex,
        });
      },

      clearQueue: () => {
        const { ytPlayer } = get();
        if (ytPlayer && typeof ytPlayer.stopVideo === 'function') {
          ytPlayer.stopVideo();
        }
        set({
          queue: [],
          queueIndex: -1,
          currentTrack: null,
          isPlaying: false,
          currentTime: 0,
          duration: 0,
        });
      },

      playNext: () => {
        const { queue, queueIndex, repeatMode } = get();
        if (queue.length === 0) return;

        if (repeatMode === 'one' && queueIndex >= 0) {
          get().seekToTime(0);
          set({ isPlaying: true });
          return;
        }

        let nextIndex = queueIndex + 1;
        if (nextIndex >= queue.length) {
          if (repeatMode === 'all') {
            nextIndex = 0;
          } else {
            set({ isPlaying: false });
            return;
          }
        }

        const nextTrack = queue[nextIndex];
        if (nextTrack) {
          get().addRecentlyPlayed(nextTrack);
        }

        set({
          queueIndex: nextIndex,
          currentTrack: nextTrack,
          isPlaying: true,
          currentTime: 0,
        });
      },

      playPrevious: () => {
        const { queue, queueIndex, currentTime } = get();
        if (queue.length === 0) return;

        if (currentTime > 3) {
          get().seekToTime(0);
          return;
        }

        let prevIndex = queueIndex - 1;
        if (prevIndex < 0) {
          prevIndex = queue.length - 1;
        }

        const prevTrack = queue[prevIndex];
        if (prevTrack) {
          get().addRecentlyPlayed(prevTrack);
        }

        set({
          queueIndex: prevIndex,
          currentTrack: prevTrack,
          isPlaying: true,
          currentTime: 0,
        });
      },

      togglePlayPause: () => {
        const { isPlaying, currentTrack, queue, ytPlayer } = get();
        if (!currentTrack && queue.length > 0) {
          set({
            currentTrack: queue[0],
            queueIndex: 0,
            isPlaying: true,
          });
          return;
        }

        if (!currentTrack) return;

        const nextState = !isPlaying;
        if (ytPlayer) {
          if (nextState) {
            if (typeof ytPlayer.playVideo === 'function') ytPlayer.playVideo();
          } else {
            if (typeof ytPlayer.pauseVideo === 'function') ytPlayer.pauseVideo();
          }
        }

        set({ isPlaying: nextState });
      },

      setPlaying: (playing) => set({ isPlaying: playing }),

      setVolume: (vol) => {
        const targetVol = Math.max(0, Math.min(1, vol));
        const { ytPlayer } = get();
        if (ytPlayer && typeof ytPlayer.setVolume === 'function') {
          ytPlayer.setVolume(targetVol * 100);
        }
        set({ volume: targetVol, isMuted: targetVol === 0 });
      },

      toggleMute: () => {
        const { isMuted, volume, ytPlayer } = get();
        if (ytPlayer) {
          if (isMuted) {
            if (typeof ytPlayer.unMute === 'function') ytPlayer.unMute();
            if (typeof ytPlayer.setVolume === 'function') ytPlayer.setVolume(volume * 100);
          } else {
            if (typeof ytPlayer.mute === 'function') ytPlayer.mute();
          }
        }
        set({ isMuted: !isMuted });
      },

      toggleShuffle: () => {
        const { isShuffle } = get();
        set({ isShuffle: !isShuffle });
      },

      toggleRepeat: () => {
        const { repeatMode } = get();
        const modes: RepeatMode[] = ['off', 'all', 'one'];
        const nextMode = modes[(modes.indexOf(repeatMode) + 1) % modes.length];
        set({ repeatMode: nextMode });
      },

      setCurrentTime: (time) => set({ currentTime: time }),

      setDuration: (duration) => set({ duration: duration }),

      toggleQueueDrawer: (open) => {
        const current = get().isQueueDrawerOpen;
        set({ isQueueDrawerOpen: open !== undefined ? open : !current });
      },

      toggleUploadModal: (open) => {
        const current = get().isUploadModalOpen;
        set({ isUploadModalOpen: open !== undefined ? open : !current });
      },

      toggleLikeTrack: (trackId) => {
        const { likedTrackIds } = get();
        const currentIds = likedTrackIds instanceof Set
          ? Array.from(likedTrackIds)
          : Array.isArray(likedTrackIds)
          ? likedTrackIds
          : [];

        const updatedSet = new Set(currentIds);
        if (updatedSet.has(trackId)) {
          updatedSet.delete(trackId);
        } else {
          updatedSet.add(trackId);
        }
        set({ likedTrackIds: updatedSet });
      },
    }),
    {
      name: 'jiya-player-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({
        volume: state.volume,
        isMuted: state.isMuted,
        isShuffle: state.isShuffle,
        repeatMode: state.repeatMode,
        isCrossfadeEnabled: state.isCrossfadeEnabled,
        crossfadeDuration: state.crossfadeDuration,
        likedTrackIds: Array.from(
          state.likedTrackIds instanceof Set
            ? state.likedTrackIds
            : new Set(Array.isArray(state.likedTrackIds) ? state.likedTrackIds : [])
        ),
        theme: state.theme,
        user: state.user,
      }),
      onRehydrateStorage: () => (state) => {
        if (state) {
          if (Array.isArray(state.likedTrackIds)) {
            state.likedTrackIds = new Set(state.likedTrackIds);
          } else if (!(state.likedTrackIds instanceof Set)) {
            state.likedTrackIds = new Set();
          }
        }
      },
    }
  )
);
