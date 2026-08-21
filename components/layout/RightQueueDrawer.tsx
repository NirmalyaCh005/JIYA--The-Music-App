'use client';

import React from 'react';
import {
  X,
  Play,
  Pause,
  Trash2,
  Music2,
  ChevronUp,
  ChevronDown,
  Shuffle,
  Sparkles,
  Heart,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export function RightQueueDrawer() {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    isQueueDrawerOpen,
    isShuffle,
    theme,
    likedTrackIds,
    toggleQueueDrawer,
    removeFromQueue,
    clearQueue,
    setQueue,
    togglePlayPause,
    reorderQueue,
    toggleShuffle,
    toggleLikeTrack,
  } = usePlayerStore();

  const isDark = theme === 'dark';

  if (!isQueueDrawerOpen) return null;

  const isLiked = currentTrack
    ? likedTrackIds instanceof Set
      ? likedTrackIds.has(currentTrack.id)
      : Array.isArray(likedTrackIds)
      ? (likedTrackIds as string[]).includes(currentTrack.id)
      : false
    : false;

  const upcomingCount = Math.max(0, queue.length - (queueIndex >= 0 ? queueIndex + 1 : 0));

  return (
    <>
      {/* Mobile Backdrop Overlay */}
      <div
        className="fixed inset-0 bg-black/70 backdrop-blur-md z-40 lg:hidden animate-in fade-in duration-200"
        onClick={() => toggleQueueDrawer(false)}
      />

      {/* Drawer Panel Container */}
      <aside
        className={`fixed inset-y-0 right-0 z-50 w-full sm:w-96 lg:static lg:z-30 lg:w-80 xl:w-96 lg:h-full shrink-0 flex flex-col shadow-2xl select-none animate-in slide-in-from-right duration-300 border-l transition-colors ${
          isDark
            ? 'bg-[#0E1420]/95 backdrop-blur-2xl border-white/10 text-slate-100'
            : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-800'
        }`}
      >
        {/* Mobile Grab Handle Indicator */}
        <div className="w-12 h-1.5 bg-slate-700/50 rounded-full mx-auto mt-3 lg:hidden" />

        {/* Drawer Header */}
        <div className="p-4 sm:p-5 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500">
              <Music2 className="w-4 h-4" />
            </div>
            <div>
              <h2 className="text-base font-extrabold tracking-wide flex items-center gap-2">
                Play Queue
                <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/15 text-blue-500 border border-blue-500/20 font-mono font-bold">
                  {queue.length}
                </span>
              </h2>
            </div>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => toggleQueueDrawer(false)}
              className={`p-2 rounded-xl transition-colors ${
                isDark
                  ? 'text-slate-400 hover:text-white hover:bg-white/10'
                  : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
              }`}
              title="Close Queue"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Scrollable Queue Content */}
        <div className="flex-1 overflow-y-auto p-4 space-y-5 custom-scrollbar pb-44 lg:pb-16">
          {/* Compact Professional Now Playing Card */}
          {currentTrack && (
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[11px] font-black text-blue-500 uppercase tracking-widest flex items-center gap-1.5">
                  <span className="w-2 h-2 rounded-full bg-blue-500 animate-pulse" />
                  Now Playing
                </span>
                {isPlaying && (
                  <div className="flex items-end gap-0.5 h-3">
                    <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_100ms] h-full" />
                    <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_300ms] h-2/3" />
                    <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_200ms] h-4/5" />
                  </div>
                )}
              </div>

              <div
                className={`p-3 rounded-2xl border transition-all ${
                  isDark
                    ? 'bg-slate-900/90 border-blue-500/30 shadow-lg shadow-blue-500/5'
                    : 'bg-blue-50/70 border-blue-200 shadow-md'
                }`}
              >
                <div className="flex items-center gap-3">
                  <div className="relative w-14 h-14 rounded-xl overflow-hidden shrink-0 shadow-md group">
                    <img
                      src={currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg'}
                      alt={currentTrack.title}
                      className="w-full h-full object-cover"
                    />
                    <button
                      onClick={togglePlayPause}
                      className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity"
                    >
                      {isPlaying ? (
                        <Pause className="w-5 h-5 text-white fill-white" />
                      ) : (
                        <Play className="w-5 h-5 text-white fill-white ml-0.5" />
                      )}
                    </button>
                  </div>

                  <div className="flex-1 min-w-0">
                    <h4
                      className={`text-sm font-extrabold truncate ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {currentTrack.title}
                    </h4>
                    <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                      {currentTrack.artist}
                    </p>
                  </div>

                  <div className="flex items-center gap-1">
                    <button
                      onClick={() => toggleLikeTrack(currentTrack.id)}
                      className={`p-2 rounded-full transition-transform active:scale-125 ${
                        isLiked ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-slate-600'
                      }`}
                      title={isLiked ? 'Liked' : 'Like'}
                    >
                      <Heart className={`w-4 h-4 ${isLiked ? 'fill-red-500' : ''}`} />
                    </button>

                    <button
                      onClick={togglePlayPause}
                      className={`w-9 h-9 rounded-full flex items-center justify-center shrink-0 shadow-md transition-all active:scale-95 ${
                        isPlaying
                          ? 'bg-blue-600 text-white hover:bg-blue-500'
                          : 'bg-blue-600/20 text-blue-500 hover:bg-blue-600/30'
                      }`}
                      title={isPlaying ? 'Pause' : 'Play'}
                    >
                      {isPlaying ? (
                        <Pause className="w-4 h-4 fill-white" />
                      ) : (
                        <Play className="w-4 h-4 fill-white ml-0.5" />
                      )}
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Up Next Queue Header & Controls */}
          <div>
            <div className="flex items-center justify-between mb-3 pt-1">
              <div className="flex items-center gap-2">
                <span className="text-xs font-black uppercase tracking-wider text-slate-400">
                  Next In Queue
                </span>
                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-300 border border-slate-700">
                  {upcomingCount} upcoming
                </span>
              </div>

              <div className="flex items-center gap-2">
                {queue.length > 1 && (
                  <button
                    onClick={toggleShuffle}
                    className={`p-1.5 rounded-lg text-xs font-bold transition-colors ${
                      isShuffle
                        ? 'text-blue-500 bg-blue-500/10 border border-blue-500/20'
                        : 'text-slate-400 hover:text-white'
                    }`}
                    title="Shuffle Queue"
                  >
                    <Shuffle className="w-3.5 h-3.5" />
                  </button>
                )}

                {queue.length > 0 && (
                  <button
                    onClick={clearQueue}
                    className="text-[11px] font-bold text-red-400 hover:text-red-300 hover:bg-red-500/10 px-2.5 py-1 rounded-lg transition-colors flex items-center gap-1 border border-red-500/20"
                    title="Clear Queue"
                  >
                    <Trash2 className="w-3 h-3" /> Clear
                  </button>
                )}
              </div>
            </div>

            {/* Queue List Items */}
            <div className="space-y-1.5">
              {queue.map((track, idx) => {
                const isCurrent = idx === queueIndex;
                return (
                  <div
                    key={`${track.id}-${idx}`}
                    className={`group relative flex items-center gap-2.5 p-2 rounded-xl border transition-all ${
                      isCurrent
                        ? isDark
                          ? 'bg-blue-600/20 border-blue-500/40 text-white shadow-sm'
                          : 'bg-blue-50 border-blue-300 text-slate-900 shadow-sm'
                        : isDark
                        ? 'bg-white/5 border-white/5 hover:bg-white/10 hover:border-white/10'
                        : 'bg-slate-50/80 border-slate-200/80 hover:bg-slate-100 hover:border-slate-300'
                    }`}
                  >
                    {/* Reorder Up/Down controls */}
                    <div className="flex flex-col opacity-0 group-hover:opacity-100 transition-opacity">
                      <button
                        disabled={idx === 0}
                        onClick={() => reorderQueue(idx, idx - 1)}
                        className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20 transition-colors"
                        title="Move Up"
                      >
                        <ChevronUp className="w-3 h-3" />
                      </button>
                      <button
                        disabled={idx === queue.length - 1}
                        onClick={() => reorderQueue(idx, idx + 1)}
                        className="p-0.5 text-slate-400 hover:text-blue-500 disabled:opacity-20 transition-colors"
                        title="Move Down"
                      >
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </div>

                    {/* Index or Animated Playing Equalizer */}
                    <div className="w-5 text-center shrink-0">
                      {isCurrent && isPlaying ? (
                        <div className="flex items-end justify-center gap-0.5 h-3">
                          <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_100ms] h-full" />
                          <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_300ms] h-2/3" />
                          <span className="w-0.5 bg-blue-500 animate-[bounce_1s_infinite_200ms] h-4/5" />
                        </div>
                      ) : (
                        <span
                          className={`text-[11px] font-mono font-semibold ${
                            isCurrent ? 'text-blue-500 font-bold' : 'text-slate-500'
                          }`}
                        >
                          {String(idx + 1).padStart(2, '0')}
                        </span>
                      )}
                    </div>

                    {/* Artwork Thumbnail */}
                    <button
                      onClick={() => setQueue(queue, idx)}
                      className="relative w-10 h-10 rounded-lg overflow-hidden shrink-0 bg-slate-800 group/thumb"
                    >
                      <img
                        src={track.coverUrl || '/samples/covers/cyberpunk.jpg'}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/40 flex items-center justify-center opacity-0 group-hover/thumb:opacity-100 transition-opacity">
                        {isCurrent && isPlaying ? (
                          <Pause className="w-4 h-4 text-white fill-white" />
                        ) : (
                          <Play className="w-4 h-4 text-white fill-white ml-0.5" />
                        )}
                      </div>
                    </button>

                    {/* Track Details */}
                    <div
                      onClick={() => setQueue(queue, idx)}
                      className="flex-1 min-w-0 cursor-pointer"
                    >
                      <p
                        className={`text-xs font-bold truncate ${
                          isCurrent ? 'text-blue-500' : isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {track.title}
                      </p>
                      <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                        {track.artist}
                      </p>
                    </div>

                    {/* Remove Track Button */}
                    <button
                      onClick={() => removeFromQueue(idx)}
                      className="p-1.5 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-500/10 opacity-0 group-hover:opacity-100 transition-all shrink-0"
                      title="Remove from queue"
                    >
                      <Trash2 className="w-3.5 h-3.5" />
                    </button>
                  </div>
                );
              })}

              {queue.length === 0 && (
                <div className="py-12 px-4 text-center border-2 border-dashed border-slate-800 rounded-2xl">
                  <Music2 className="w-8 h-8 mx-auto text-slate-600 mb-2" />
                  <p className="text-xs font-bold text-slate-400">Queue is currently empty</p>
                  <p className="text-[11px] text-slate-500 mt-1">Play any track or playlist to populate the queue</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </aside>
    </>
  );
}

