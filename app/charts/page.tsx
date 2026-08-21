'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import {
  BILLBOARD_TOP_TRACKS,
  HINDI_TRENDING_TRACKS,
  PUNJABI_VIRAL_TRACKS,
  LOFI_CHILL_BEATS,
} from '@/lib/constants/featuredTracks';
import { TrendingUp, Play, Flame, Trophy, Radio, Music, Sparkles } from 'lucide-react';
import { Track } from '@/types/music';

export default function ChartsPage() {
  const { playTrackList } = useAudioPlayer();
  const { theme } = usePlayerStore();
  const isDark = theme === 'dark';

  const [activeTab, setActiveTab] = useState<'global' | 'india' | 'viral' | 'lofi'>('global');

  // Chart Lists
  const globalCharts = BILLBOARD_TOP_TRACKS;
  const indiaCharts = HINDI_TRENDING_TRACKS;
  const viralCharts = PUNJABI_VIRAL_TRACKS;
  const lofiCharts = LOFI_CHILL_BEATS;

  let activeTrackList: Track[] = globalCharts;
  let activeTitle = 'Global Top 50 (2026 YouTube Music)';

  if (activeTab === 'india') {
    activeTrackList = indiaCharts;
    activeTitle = 'India Trending 50 (2026 YouTube Music)';
  } else if (activeTab === 'viral') {
    activeTrackList = viralCharts;
    activeTitle = 'Punjabi & Viral Hits (2026 Charts)';
  } else if (activeTab === 'lofi') {
    activeTrackList = lofiCharts;
    activeTitle = 'Lofi & Chill Soundscapes Top 2026';
  }

  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar />

      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-6 sm:space-y-8">
        {/* Top Charts Hero Banner */}
        <div
          className={`p-6 sm:p-10 rounded-3xl border relative overflow-hidden transition-all shadow-2xl ${
            isDark
              ? 'bg-gradient-to-r from-blue-950 via-indigo-950 to-purple-950 border-blue-500/30'
              : 'bg-gradient-to-r from-blue-600 via-indigo-600 to-purple-600 border-blue-400 text-white shadow-blue-500/20'
          }`}
        >
          {/* Background Aura Glow */}
          <div className="absolute top-0 right-0 w-96 h-96 bg-blue-500/20 rounded-full blur-3xl pointer-events-none" />

          <div className="relative z-10 space-y-4 max-w-2xl">
            <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-blue-500/20 border border-blue-400/30 text-blue-200 text-xs font-bold tracking-wide backdrop-blur-md">
              <Flame className="w-4 h-4 text-orange-400 fill-orange-400 shrink-0" />
              <span>YouTube Music Charts • 2026 Edition</span>
            </div>

            <h1 className="text-3xl sm:text-5xl font-black tracking-tight text-white leading-tight">
              Top Trending Charts 2026
            </h1>

            <p className="text-xs sm:text-sm font-semibold leading-relaxed text-blue-100/90">
              Real-time YouTube Music streaming charts updated for 2026. Explore top global Billboard tracks, Bollywood blockbusters, and Punjabi viral anthems.
            </p>

            <div className="pt-2 flex items-center gap-3">
              <button
                onClick={() => playTrackList(activeTrackList, 0)}
                className="px-6 py-3.5 rounded-2xl bg-white text-slate-900 font-black text-xs shadow-2xl hover:bg-slate-100 hover:scale-105 active:scale-95 transition-all flex items-center gap-2.5 cursor-pointer"
              >
                <Play className="w-4 h-4 fill-slate-900" />
                <span>Play Top 50 Charts</span>
              </button>
            </div>
          </div>
        </div>

        {/* Charts Selector Tabs */}
        <div className="grid grid-cols-2 sm:grid-cols-4 p-1.5 rounded-2xl bg-slate-950/90 border border-white/10 text-xs font-extrabold gap-1.5 shadow-inner">
          <button
            onClick={() => setActiveTab('global')}
            className={`py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'global'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Trophy className="w-4 h-4 text-yellow-400" />
            <span>Global Top 50</span>
          </button>

          <button
            onClick={() => setActiveTab('india')}
            className={`py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'india'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Flame className="w-4 h-4 text-orange-400" />
            <span>India Trending</span>
          </button>

          <button
            onClick={() => setActiveTab('viral')}
            className={`py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'viral'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Radio className="w-4 h-4 text-pink-400" />
            <span>Punjabi Hits</span>
          </button>

          <button
            onClick={() => setActiveTab('lofi')}
            className={`py-3.5 px-4 rounded-xl transition-all duration-200 flex items-center justify-center gap-2 ${
              activeTab === 'lofi'
                ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-500/30 scale-[1.02]'
                : 'text-slate-400 hover:text-white hover:bg-white/5'
            }`}
          >
            <Sparkles className="w-4 h-4 text-emerald-400" />
            <span>Lofi & Chill</span>
          </button>
        </div>

        {/* Active Charts Table Container */}
        <section
          className={`p-5 sm:p-8 rounded-3xl border transition-colors ${
            isDark
              ? 'bg-[#151D2A] border-white/10 shadow-2xl'
              : 'bg-white border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
          }`}
        >
          <div className="mb-6">
            <h2 className={`text-lg sm:text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {activeTitle}
            </h2>
          </div>

          <TrackTable tracks={activeTrackList} />
        </section>
      </div>
    </main>
  );
}
