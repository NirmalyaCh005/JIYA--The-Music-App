'use client';

import React from 'react';
import { X, Play, Pause, Trash2, GripVertical, Music2 } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatTime } from '@/lib/utils/formatTime';

export function RightQueueDrawer() {
  const {
    queue,
    queueIndex,
    currentTrack,
    isPlaying,
    isQueueDrawerOpen,
    theme,
    toggleQueueDrawer,
    removeFromQueue,
    clearQueue,
    setQueue,
    togglePlayPause,
  } = usePlayerStore();

  const isDark = theme === 'dark';

  if (!isQueueDrawerOpen) return null;

  return (
    <aside
      className={`w-80 shrink-0 flex flex-col h-full z-30 shadow-2xl select-none animate-in slide-in-from-right duration-300 border-l transition-colors ${
        isDark
          ? 'bg-[#0E1420]/95 backdrop-blur-xl border-white/10 text-white'
          : 'bg-white/95 backdrop-blur-xl border-slate-200 text-slate-900'
      }`}
    >
      {/* Drawer Header */}
      <div className="p-5 border-b border-inherit flex items-center justify-between">
        <div className="flex items-center gap-2">
          <Music2 className="w-5 h-5 text-blue-600" />
          <h2 className="text-base font-extrabold tracking-wide">Play Queue</h2>
          <span className="text-xs px-2 py-0.5 rounded-full bg-blue-600/10 text-blue-600 font-mono font-bold">
            {queue.length}
          </span>
        </div>
        <button
          onClick={() => toggleQueueDrawer(false)}
          className={`p-1.5 rounded-lg transition-colors ${
            isDark ? 'text-slate-400 hover:text-white hover:bg-white/10' : 'text-slate-500 hover:text-slate-900 hover:bg-slate-100'
          }`}
        >
          <X className="w-5 h-5" />
        </button>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 custom-scrollbar">
        {/* Now Playing Section */}
        {currentTrack ? (
          <div>
            <div className="text-xs font-black text-blue-600 uppercase tracking-wider mb-3">
              Now Playing
            </div>
            <div
              className={`p-3.5 rounded-2xl border ${
                isDark ? 'bg-slate-900/90 border-blue-500/30' : 'bg-slate-50 border-slate-200'
              }`}
            >
              <div className="relative aspect-square rounded-xl overflow-hidden mb-3 group shadow">
                <img
                  src={currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div>
                <h4 className="text-sm font-extrabold truncate">{currentTrack.title}</h4>
                <p className="text-xs text-slate-400 font-medium truncate mt-0.5">
                  {currentTrack.artist}
                </p>
              </div>
            </div>
          </div>
        ) : null}

        {/* Up Next Queue */}
        <div>
          <div className="flex items-center justify-between mb-3">
            <div className="text-xs font-black uppercase tracking-wider text-slate-400">
              Next In Queue
            </div>
            {queue.length > 0 && (
              <button
                onClick={clearQueue}
                className="text-[11px] font-bold text-red-500 hover:underline flex items-center gap-1"
              >
                <Trash2 className="w-3 h-3" /> Clear Queue
              </button>
            )}
          </div>

          <div className="space-y-1.5">
            {queue.map((track, idx) => {
              const isCurrent = idx === queueIndex;
              return (
                <div
                  key={`${track.id}-${idx}`}
                  className={`flex items-center gap-3 p-2.5 rounded-xl border transition-all group ${
                    isCurrent
                      ? 'bg-blue-50/80 dark:bg-blue-600/20 border-blue-500/40'
                      : isDark
                      ? 'bg-white/5 border-transparent hover:bg-white/10'
                      : 'bg-slate-50 border-slate-100 hover:bg-slate-100'
                  }`}
                >
                  <button
                    onClick={() => setQueue(queue, idx)}
                    className="relative w-9 h-9 rounded-lg overflow-hidden flex-shrink-0 bg-slate-800"
                  >
                    <img
                      src={track.coverUrl || '/samples/covers/cyberpunk.jpg'}
                      alt={track.title}
                      className="w-full h-full object-cover"
                    />
                  </button>

                  <div className="flex-1 min-w-0">
                    <p
                      className={`text-xs font-bold truncate ${
                        isCurrent ? 'text-blue-600' : isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      {track.title}
                    </p>
                    <p className="text-[11px] text-slate-400 font-medium truncate mt-0.5">
                      {track.artist}
                    </p>
                  </div>

                  <button
                    onClick={() => removeFromQueue(idx)}
                    className="p-1 rounded-full text-slate-400 hover:text-red-500 opacity-0 group-hover:opacity-100 transition-opacity"
                    title="Remove"
                  >
                    <Trash2 className="w-3.5 h-3.5" />
                  </button>
                </div>
              );
            })}

            {queue.length === 0 && (
              <div className="py-8 text-center text-xs text-slate-400 italic">
                Queue is currently empty
              </div>
            )}
          </div>
        </div>
      </div>
    </aside>
  );
}
