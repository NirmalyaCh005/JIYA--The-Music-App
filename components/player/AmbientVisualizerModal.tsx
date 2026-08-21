'use client';

import React, { useEffect, useState } from 'react';
import {
  X,
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
  Sparkles,
  Music2,
  Headphones,
  Maximize2,
} from 'lucide-react';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatTime } from '@/lib/utils/formatTime';

export function AmbientVisualizerModal() {
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

  const {
    isAmbientModeOpen,
    isShuffle,
    repeatMode,
    likedTrackIds,
    toggleAmbientMode,
    toggleQueueDrawer,
    toggleLikeTrack,
  } = usePlayerStore();

  const [visualizerHeights, setVisualizerHeights] = useState<number[]>([]);

  // Generate 32 dynamic equalizer frequency bar heights
  useEffect(() => {
    if (!isAmbientModeOpen) return;

    if (!isPlaying) {
      setVisualizerHeights(Array(32).fill(15));
      return;
    }

    const interval = setInterval(() => {
      const newHeights = Array.from({ length: 32 }, (_, i) => {
        const base = Math.sin((currentTime * 4) + i) * 35 + 45;
        const randomVariation = Math.random() * 30;
        return Math.max(12, Math.min(100, Math.floor(base + randomVariation)));
      });
      setVisualizerHeights(newHeights);
    }, 100);

    return () => clearInterval(interval);
  }, [isPlaying, isAmbientModeOpen, currentTime]);

  if (!isAmbientModeOpen || !currentTrack) {
    return null;
  }

  const isLiked = likedTrackIds.has(currentTrack.id);
  const VolumeIcon = isMuted || volume === 0 ? VolumeX : volume < 0.5 ? Volume1 : Volume2;

  const handleSeekChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = parseFloat(e.target.value);
    seekToTime(val);
  };

  return (
    <div className="fixed inset-0 z-50 overflow-hidden bg-[#070A10] text-white select-none backdrop-blur-3xl animate-in fade-in duration-500 flex flex-col justify-between p-6 sm:p-10">
      {/* Dynamic Animated Ambient Color Aura Mesh */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none opacity-50 blur-[100px] scale-150">
        <div className="absolute top-1/4 left-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-blue-600 to-indigo-600 animate-pulse" />
        <div className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-gradient-to-tr from-pink-600 to-purple-600 animate-pulse delay-1000" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] rounded-full bg-gradient-to-tr from-emerald-500/30 to-cyan-500/30 animate-pulse delay-500" />
      </div>

      {/* Top Close Control */}
      <div className="relative z-10 flex items-center justify-end">
        <button
          onClick={() => toggleAmbientMode(false)}
          className="p-3 rounded-full bg-white/10 hover:bg-white/20 text-white border border-white/20 shadow-2xl transition-transform hover:scale-110 active:scale-95"
          title="Exit Ambient Mode"
        >
          <X className="w-6 h-6" />
        </button>
      </div>

      {/* Center Main Ambient Content (Album Art + Info + Visualizer) */}
      <div className="relative z-10 flex-1 flex flex-col lg:flex-row items-center justify-center gap-10 lg:gap-16 py-8 px-4 max-w-7xl mx-auto w-full">
        {/* Left Column: Glowing Album Art */}
        <div className="relative shrink-0 group">
          <div
            className={`absolute -inset-4 rounded-[48px] bg-gradient-to-tr from-blue-600 via-pink-500 to-purple-600 opacity-60 blur-3xl transition-opacity duration-700 ${
              isPlaying ? 'animate-pulse' : 'opacity-30'
            }`}
          />
          <div
            className={`relative w-72 h-72 sm:w-96 sm:h-96 rounded-[36px] overflow-hidden border border-white/20 bg-slate-950 p-2 shadow-2xl transition-all duration-700 ${
              isPlaying ? 'scale-[1.02] shadow-[0_0_90px_rgba(59,130,246,0.45)]' : ''
            }`}
          >
            <img
              src={currentTrack.coverUrl || '/samples/covers/cyberpunk.jpg'}
              alt={currentTrack.title}
              className="w-full h-full object-cover rounded-[28px]"
            />
          </div>
        </div>

        {/* Right Column: Track Title + Artist + Beat Visualizer */}
        <div className="flex-1 flex flex-col justify-center space-y-6 text-center lg:text-left min-w-0 max-w-2xl">
          <div className="space-y-2">
            <span className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-300 text-xs font-black uppercase tracking-widest">
              <Sparkles className="w-3.5 h-3.5 text-blue-400 animate-spin-slow" /> Now Playing
            </span>
            <h1 className="text-3xl sm:text-5xl lg:text-6xl font-black tracking-tight leading-tight text-white drop-shadow-2xl line-clamp-2">
              {currentTrack.title}
            </h1>
            <p className="text-lg sm:text-2xl text-blue-400 font-extrabold tracking-wide drop-shadow">
              {currentTrack.artist} {currentTrack.album ? `• ${currentTrack.album}` : ''}
            </p>
          </div>

          {/* Beat-Synced Equalizer Frequency Visualizer Bars */}
          <div className="pt-2">
            <div className="h-28 sm:h-36 p-4 rounded-3xl bg-slate-900/60 border border-white/10 backdrop-blur-xl flex items-end justify-between gap-1.5 sm:gap-2 shadow-2xl">
              {visualizerHeights.map((height, i) => (
                <div
                  key={i}
                  className="flex-1 rounded-full bg-gradient-to-t from-blue-600 via-indigo-500 to-pink-500 transition-all duration-100 shadow-[0_0_12px_rgba(59,130,246,0.6)]"
                  style={{
                    height: `${height}%`,
                    opacity: isPlaying ? 0.9 : 0.4,
                  }}
                />
              ))}
            </div>
          </div>
        </div>
      </div>

      {/* Bottom Floating Glassmorphic Player Controls */}
      <div className="relative z-10 w-full max-w-4xl mx-auto p-4 rounded-3xl bg-slate-900/80 border border-white/15 backdrop-blur-2xl shadow-2xl flex flex-col gap-3">
        {/* Progress Seek Bar */}
        <div className="w-full flex items-center gap-3">
          <span className="text-xs font-mono font-bold text-slate-300 min-w-[40px] text-right">
            {formatTime(currentTime)}
          </span>

          <input
            type="range"
            min={0}
            max={duration || 100}
            step={0.1}
            value={currentTime}
            onChange={handleSeekChange}
            className="w-full h-2 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500 focus:outline-none"
          />

          <span className="text-xs font-mono font-bold text-slate-300 min-w-[40px]">
            {formatTime(duration)}
          </span>
        </div>

        {/* Buttons Row */}
        <div className="flex items-center justify-between px-2">
          {/* Like button */}
          <button
            onClick={() => toggleLikeTrack(currentTrack.id)}
            className={`p-2.5 rounded-full border transition-transform active:scale-125 ${
              isLiked
                ? 'bg-red-500/20 text-red-500 border-red-500/40'
                : 'bg-white/5 text-slate-400 hover:text-white border-white/10'
            }`}
          >
            <Heart className={`w-5 h-5 ${isLiked ? 'fill-red-500' : ''}`} />
          </button>

          {/* Center Playback Controls */}
          <div className="flex items-center gap-4 sm:gap-6">
            <button
              onClick={toggleShuffle}
              className={`p-2 rounded-full transition-colors ${
                isShuffle ? 'text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              <Shuffle className="w-5 h-5" />
            </button>

            <button
              onClick={playPrevious}
              className="text-slate-200 hover:text-blue-400 transition-colors active:scale-95"
            >
              <SkipBack className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={togglePlayPause}
              className="w-12 h-12 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-xl hover:scale-105 active:scale-95 transition-transform"
            >
              {isPlaying ? (
                <Pause className="w-6 h-6 fill-white" />
              ) : (
                <Play className="w-6 h-6 fill-white ml-0.5" />
              )}
            </button>

            <button
              onClick={playNext}
              className="text-slate-200 hover:text-blue-400 transition-colors active:scale-95"
            >
              <SkipForward className="w-6 h-6 fill-current" />
            </button>

            <button
              onClick={toggleRepeat}
              className={`p-2 rounded-full transition-colors ${
                repeatMode !== 'off' ? 'text-blue-400' : 'text-slate-400 hover:text-white'
              }`}
            >
              {repeatMode === 'one' ? <Repeat1 className="w-5 h-5" /> : <Repeat className="w-5 h-5" />}
            </button>
          </div>

          {/* Right Volume & Queue */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => toggleQueueDrawer()}
              className="p-2.5 rounded-full bg-white/5 hover:bg-white/10 text-slate-300 border border-white/10"
              title="Queue"
            >
              <ListMusic className="w-5 h-5" />
            </button>

            <div className="hidden sm:flex items-center gap-2">
              <button onClick={toggleMute} className="text-slate-400 hover:text-white">
                <VolumeIcon className="w-5 h-5" />
              </button>
              <input
                type="range"
                min={0}
                max={1}
                step={0.01}
                value={isMuted ? 0 : volume}
                onChange={(e) => setVolume(parseFloat(e.target.value))}
                className="w-20 h-1.5 bg-slate-800 rounded-lg appearance-none cursor-pointer accent-blue-500"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
