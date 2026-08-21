'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  SkipBack,
  SkipForward,
  Shuffle,
  Repeat,
  Repeat1,
  Volume2,
  VolumeX,
  Volume1,
  Heart,
  ListMusic,
  Youtube,
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatTime } from '@/lib/utils/formatTime';

export function PersistentPlayerBar() {
  const {
    currentTrack,
    isPlaying,
    volume,
    isMuted,
    currentTime,
    duration,
    playNext,
    playPrevious,
    togglePlayPause,
    setVolume,
    toggleMute,
    toggleShuffle,
    toggleRepeat,
    seekToTime,
  } = useAudioPlayer();

  const { isShuffle, repeatMode, isQueueDrawerOpen, likedTrackIds, theme, toggleQueueDrawer, toggleLikeTrack, toggleAmbientMode } =
    usePlayerStore();

  const [hoverSeekTime, setHoverSeekTime] = useState<number | null>(null);
  const isDark = theme === 'dark';

  const isLiked = currentTrack
    ? likedTrackIds instanceof Set
      ? likedTrackIds.has(currentTrack.id)
      : Array.isArray(likedTrackIds)
      ? (likedTrackIds as string[]).includes(currentTrack.id)
      : false
    : false;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekToTime(val);
  };

  const handleSeekMouseMove = (e: React.MouseEvent<HTMLInputElement>) => {
    const rect = e.currentTarget.getBoundingClientRect();
    const pos = (e.clientX - rect.left) / rect.width;
    setHoverSeekTime(Math.max(0, Math.min(duration, pos * duration)));
  };

  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  return (
    <footer
      className={`fixed bottom-[72px] left-3 right-3 rounded-2xl border lg:rounded-none lg:border-none lg:fixed-none lg:bottom-0 lg:left-0 lg:right-0 lg:relative h-14 lg:h-24 shrink-0 px-3 lg:px-6 flex items-center justify-between select-none shadow-2xl transition-all duration-300 z-40 ${
        isDark
          ? 'bg-[#0E1420]/95 backdrop-blur-2xl border-white/20 text-slate-100 shadow-black/80'
          : 'bg-white/95 backdrop-blur-2xl border-slate-200/90 text-slate-800 shadow-xl'
      }`}
    >
      {/* 1. Track Info & Cover Art */}
      <div className="flex items-center gap-3 min-w-0 flex-1 lg:flex-none lg:min-w-[240px] lg:max-w-[30%]">
        {currentTrack ? (
          <>
            <div
              onClick={() => toggleAmbientMode(true)}
              className="relative w-11 h-11 lg:w-14 lg:h-14 rounded-xl overflow-hidden shadow-md shrink-0 group cursor-pointer"
              title="Click to open Ambient Visualizer Mode"
            >
              <img
                src={currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg'}
                alt={currentTrack.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute top-1 right-1 p-0.5 rounded bg-red-600 text-white text-[8px] lg:text-[9px] font-bold shadow">
                YT
              </div>
            </div>

            <div className="min-w-0 flex-1">
              <h4
                onClick={() => toggleAmbientMode(true)}
                className={`text-xs lg:text-sm font-bold truncate hover:underline cursor-pointer ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
                title="Click to open Ambient Visualizer Mode"
              >
                {currentTrack.title}
              </h4>
              <p
                onClick={() => toggleAmbientMode(true)}
                className="text-[11px] lg:text-xs text-slate-400 font-medium truncate hover:underline cursor-pointer"
                title="Click to open Ambient Visualizer Mode"
              >
                {currentTrack.artist}
              </p>
            </div>

            <button
              onClick={() => toggleLikeTrack(currentTrack.id)}
              className={`p-1.5 rounded-full transition-transform active:scale-125 ${
                isLiked ? 'text-red-500 hover:text-red-400' : 'text-slate-400 hover:text-slate-600'
              }`}
            >
              <Heart className={`w-4 h-4 lg:w-5 lg:h-5 ${isLiked ? 'fill-red-500' : ''}`} />
            </button>
          </>
        ) : (
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 lg:w-12 lg:h-12 rounded-xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-500 shrink-0">
              <Youtube className="w-5 h-5 lg:w-6 lg:h-6" />
            </div>
            <div className="hidden sm:block">
              <h4 className={`text-xs font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                JIYA Audio Engine
              </h4>
              <p className="text-[11px] text-slate-400 font-medium">Select any song to start streaming</p>
            </div>
          </div>
        )}
      </div>

      {/* Mobile Play/Pause & Mute/Unmute & Queue Controls */}
      <div className="flex lg:hidden items-center gap-1.5 sm:gap-2">
        <button
          onClick={() => toggleQueueDrawer()}
          className={`p-1.5 rounded-xl transition-colors ${
            isQueueDrawerOpen
              ? 'bg-blue-600/20 text-blue-500 border border-blue-500/30'
              : 'text-slate-400 hover:text-white'
          }`}
          title="Play Queue"
        >
          <ListMusic className="w-4 h-4" />
        </button>

        <button
          onClick={toggleMute}
          className={`p-1.5 rounded-full transition-colors ${
            isMuted ? 'text-red-400 bg-red-500/20 border border-red-500/30' : 'text-slate-400 hover:text-white'
          }`}
          title={isMuted ? 'Unmute' : 'Mute'}
        >
          <VolumeIcon className="w-4 h-4" />
        </button>

        <button
          onClick={playPrevious}
          className="text-slate-400 hover:text-white p-1"
          title="Previous Track"
        >
          <SkipBack className="w-4 h-4 fill-current" />
        </button>

        <button
          onClick={togglePlayPause}
          className="w-9 h-9 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg active:scale-95 transition-all"
          title={isPlaying ? 'Pause' : 'Play'}
        >
          {isPlaying ? <Pause className="w-4 h-4 fill-white" /> : <Play className="w-4 h-4 fill-white ml-0.5" />}
        </button>

        <button
          onClick={playNext}
          className="text-slate-400 hover:text-white p-1"
          title="Next Track"
        >
          <SkipForward className="w-4 h-4 fill-current" />
        </button>
      </div>

      {/* 2. Center Controls & Seek Progress (Desktop) */}
      <div className="hidden lg:flex flex-1 max-w-2xl px-4 flex-col items-center gap-2">
        {/* Buttons Row */}
        <div className="flex items-center gap-6">
          <button
            onClick={toggleShuffle}
            className={`p-1.5 rounded-full transition-colors relative ${
              isShuffle ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title="Shuffle"
          >
            <Shuffle className="w-4 h-4" />
          </button>

          <button
            onClick={playPrevious}
            className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors active:scale-95"
            title="Previous"
          >
            <SkipBack className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={togglePlayPause}
            className="w-10 h-10 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-105 active:scale-95 transition-all"
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
            className="text-slate-600 dark:text-slate-300 hover:text-blue-600 transition-colors active:scale-95"
            title="Next"
          >
            <SkipForward className="w-5 h-5 fill-current" />
          </button>

          <button
            onClick={toggleRepeat}
            className={`p-1.5 rounded-full transition-colors relative ${
              repeatMode !== 'off' ? 'text-blue-600' : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
            }`}
            title={`Repeat: ${repeatMode}`}
          >
            {repeatMode === 'one' ? <Repeat1 className="w-4 h-4" /> : <Repeat className="w-4 h-4" />}
          </button>
        </div>

        {/* Progress Seek Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono font-medium text-slate-400 min-w-[36px] text-right">
            {formatTime(currentTime)}
          </span>

          <div className="relative flex-1 flex items-center group">
            {hoverSeekTime !== null && (
              <div
                className="absolute -top-7 text-[10px] font-mono bg-blue-600 text-white px-1.5 py-0.5 rounded shadow-lg pointer-events-none -translate-x-1/2"
                style={{
                  left: `${(hoverSeekTime / (duration || 1)) * 100}%`,
                }}
              >
                {formatTime(hoverSeekTime)}
              </div>
            )}

            <input
              type="range"
              min={0}
              max={duration || 100}
              step={0.1}
              value={currentTime}
              onChange={handleSeekChange}
              onMouseMove={handleSeekMouseMove}
              onMouseLeave={() => setHoverSeekTime(null)}
              className="w-full h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none group-hover:h-2 transition-all"
            />
          </div>

          <span className="text-xs font-mono font-medium text-slate-400 min-w-[36px]">
            {formatTime(duration)}
          </span>
        </div>
      </div>

      {/* 3. Right Volume & Queue Controls (Desktop) */}
      <div className="hidden lg:flex items-center gap-4 min-w-[200px] justify-end">
        <button
          onClick={() => toggleQueueDrawer()}
          className={`p-2 rounded-xl transition-colors ${
            isQueueDrawerOpen
              ? 'bg-blue-50 text-blue-600 dark:bg-blue-600/20 dark:text-blue-400'
              : 'text-slate-400 hover:text-slate-700 dark:hover:text-slate-200'
          }`}
          title="Queue"
        >
          <ListMusic className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 group">
          <button
            onClick={toggleMute}
            className="text-slate-400 hover:text-slate-700 dark:hover:text-slate-200 transition-colors"
            title={isMuted ? 'Unmute' : 'Mute'}
          >
            <VolumeIcon className="w-5 h-5" />
          </button>

          <input
            type="range"
            min={0}
            max={1}
            step={0.01}
            value={isMuted ? 0 : volume}
            onChange={(e) => setVolume(parseFloat(e.target.value))}
            className="w-24 h-1.5 bg-slate-200 dark:bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-600 focus:outline-none group-hover:h-2 transition-all"
          />
        </div>
      </div>
    </footer>
  );
}
