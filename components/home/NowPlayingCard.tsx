'use client';

import React from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Music,
  ListMusic,
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatTime } from '@/lib/utils/formatTime';

export function NowPlayingCard() {
  const {
    currentTrack,
    isPlaying,
    currentTime,
    duration,
    playNext,
    playPrevious,
    togglePlayPause,
    seekToTime,
  } = useAudioPlayer();

  const { queue, isShuffle, repeatMode, theme, toggleShuffle, toggleRepeat, toggleQueueDrawer, toggleAmbientMode } =
    usePlayerStore();

  const isDark = theme === 'dark';

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekToTime(val);
  };

  const remainingTime = Math.max(0, duration - currentTime);

  return (
    <div className="space-y-4 select-none">
      {/* Header Title */}
      <div className="flex items-center justify-between">
        <div>
          <h2
            className={`text-xl font-extrabold tracking-tight ${
              isDark ? 'text-white' : 'text-slate-900'
            }`}
          >
            Now Playing
          </h2>
          <p className="text-xs text-slate-400 font-medium mt-0.5">
            {queue.length > 0 ? `${queue.length} items on the list` : 'No active queue'}
          </p>
        </div>
        <button
          onClick={() => toggleQueueDrawer()}
          className={`p-2 rounded-full transition-colors ${
            isDark ? 'hover:bg-white/10 text-slate-400' : 'hover:bg-slate-200/60 text-slate-600'
          }`}
          title="View Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>
      </div>

      {/* Now Playing Vinyl Card */}
      <div
        className={`p-7 rounded-[32px] border transition-all duration-300 flex flex-col items-center text-center space-y-6 ${
          isDark
            ? 'bg-[#151D2A] border-white/10 shadow-2xl'
            : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
        }`}
      >
        {currentTrack ? (
          <>
            {/* Spinning Vinyl Album Art Disc */}
            <div
              onClick={() => toggleAmbientMode(true)}
              className="relative group cursor-pointer"
              title="Click to open Ambient Visualizer Mode"
            >
              <div
                className={`w-44 h-44 rounded-full overflow-hidden p-2 shadow-2xl transition-all duration-500 border relative flex items-center justify-center ${
                  isDark ? 'border-white/10 bg-slate-900' : 'border-slate-100 bg-slate-50'
                } ${isPlaying ? 'animate-spin-slow' : ''}`}
              >
                <img
                  src={currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg'}
                  alt={currentTrack.title}
                  className="w-full h-full object-cover rounded-full"
                />
                {/* Center Cutout Vinyl Hole */}
                <div
                  className={`w-9 h-9 rounded-full absolute border shadow-inner flex items-center justify-center ${
                    isDark ? 'bg-[#151D2A] border-white/20' : 'bg-white border-slate-200'
                  }`}
                >
                  <div
                    className={`w-3 h-3 rounded-full ${isDark ? 'bg-slate-800' : 'bg-slate-300'}`}
                  />
                </div>
              </div>
            </div>

            {/* Track Title & Artist */}
            <div className="min-w-0 max-w-full px-2">
              <h3
                onClick={() => toggleAmbientMode(true)}
                className={`text-lg font-black truncate tracking-tight cursor-pointer hover:underline ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                title="Click to open Ambient Visualizer Mode"
              >
                {currentTrack.title}
              </h3>
              <p
                onClick={() => toggleAmbientMode(true)}
                className="text-xs font-semibold text-slate-400 truncate mt-1 cursor-pointer hover:underline"
                title="Click to open Ambient Visualizer Mode"
              >
                {currentTrack.artist}
              </p>
            </div>
          </>
        ) : (
          <>
            {/* Offline/Empty Vinyl Ring */}
            <div className="w-44 h-44 rounded-full border-2 border-dashed border-slate-200 dark:border-slate-800 flex flex-col items-center justify-center gap-2">
              <div
                className={`w-12 h-12 rounded-full border flex items-center justify-center ${
                  isDark ? 'bg-white/5 border-white/10' : 'bg-slate-100 border-slate-200'
                }`}
              >
                <Music className="w-5 h-5 text-slate-400" />
              </div>
            </div>

            {/* Empty Title */}
            <div>
              <h3
                className={`text-base font-extrabold tracking-tight ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                No Track Playing
              </h3>
              <p className="text-xs text-slate-400 font-medium mt-1">
                Select any song to start global audio streaming
              </p>
            </div>
          </>
        )}

        {/* Minimalist Progress Bar */}
        <div className="w-full space-y-2 px-1">
          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none"
          />
          <div className="flex items-center justify-between text-[11px] font-mono font-medium text-slate-400">
            <span>{formatTime(currentTime)}</span>
            <span>-{formatTime(remainingTime)}</span>
          </div>
        </div>

        {/* Minimalist Controls */}
        <div className="flex items-center justify-center gap-5 pt-1">
          <button
            onClick={toggleShuffle}
            className={`p-2 rounded-full transition-colors ${
              isShuffle
                ? 'text-blue-600'
                : isDark
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={playPrevious}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Previous"
          >
            <SkipBack className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-700 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
            title={isPlaying ? 'Pause' : 'Play'}
          >
            {isPlaying ? (
              <Pause className="w-5 h-5 fill-white" />
            ) : (
              <Play className="w-5 h-5 fill-white ml-0.5" />
            )}
          </button>

          <button
            onClick={playNext}
            className={`p-2 rounded-full transition-colors ${
              isDark
                ? 'text-slate-300 hover:text-white'
                : 'text-slate-600 hover:text-slate-900'
            }`}
            title="Next"
          >
            <SkipForward className="w-4 h-4 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-2 rounded-full transition-colors ${
              repeatMode !== 'off'
                ? 'text-blue-600'
                : isDark
                ? 'text-slate-500 hover:text-slate-300'
                : 'text-slate-400 hover:text-slate-700'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>
      </div>
    </div>
  );
}
