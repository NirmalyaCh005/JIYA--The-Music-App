'use client';

import React, { useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import {
  HINDI_TRENDING_TRACKS,
  BILLBOARD_TOP_TRACKS,
  PUNJABI_VIRAL_TRACKS,
  LOFI_CHILL_BEATS,
} from '@/lib/constants/featuredTracks';
import { Compass, Disc } from 'lucide-react';

export default function ExplorePage() {
  const [selectedGenre, setSelectedGenre] = useState('All');
  const { theme } = usePlayerStore();
  const isDark = theme === 'dark';

  const genresConfig = [
    {
      name: 'Bollywood',
      gradient: isDark
        ? 'from-purple-950/90 via-slate-900 to-pink-950/90 border-purple-500/30 text-white'
        : 'from-purple-600 to-pink-600 border-purple-400 text-white shadow-lg shadow-purple-500/20',
      description: 'Trending Hindi romance, party hits, and Arijit Singh classics',
      tracks: HINDI_TRENDING_TRACKS,
      image: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Pop / Global',
      gradient: isDark
        ? 'from-cyan-950/90 via-slate-900 to-blue-950/90 border-cyan-500/30 text-white'
        : 'from-cyan-600 to-blue-600 border-cyan-400 text-white shadow-lg shadow-cyan-500/20',
      description: 'Billboard Hot 100 toppers, synthpop, and international charts',
      tracks: BILLBOARD_TOP_TRACKS,
      image: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Punjabi',
      gradient: isDark
        ? 'from-amber-950/90 via-slate-900 to-orange-950/90 border-amber-500/30 text-white'
        : 'from-amber-600 to-orange-600 border-amber-400 text-white shadow-lg shadow-amber-500/20',
      description: 'High octane Punjabi beats, hip-hop, and viral anthems',
      tracks: PUNJABI_VIRAL_TRACKS,
      image: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    },
    {
      name: 'Lofi Chill',
      gradient: isDark
        ? 'from-teal-950/90 via-slate-900 to-emerald-950/90 border-emerald-500/30 text-white'
        : 'from-teal-600 to-emerald-600 border-emerald-400 text-white shadow-lg shadow-emerald-500/20',
      description: 'Cosy ambient beats, study background soundscapes, and rain lofi',
      tracks: LOFI_CHILL_BEATS,
      image: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    },
  ];

  let displayTracks = [
    ...HINDI_TRENDING_TRACKS,
    ...BILLBOARD_TOP_TRACKS,
    ...PUNJABI_VIRAL_TRACKS,
    ...LOFI_CHILL_BEATS,
  ];

  if (selectedGenre.toLowerCase() === 'bollywood' || selectedGenre.toLowerCase() === 'synthwave') {
    displayTracks = HINDI_TRENDING_TRACKS;
  } else if (selectedGenre.toLowerCase() === 'pop / global' || selectedGenre.toLowerCase() === 'cyberpunk') {
    displayTracks = BILLBOARD_TOP_TRACKS;
  } else if (selectedGenre.toLowerCase() === 'punjabi') {
    displayTracks = PUNJABI_VIRAL_TRACKS;
  } else if (selectedGenre.toLowerCase() === 'lofi chill' || selectedGenre.toLowerCase() === 'lofi') {
    displayTracks = LOFI_CHILL_BEATS;
  }

  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar
        selectedGenre={selectedGenre}
        onGenreSelect={(g) => setSelectedGenre(g)}
      />

      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-6 sm:space-y-8">
        {/* Explore Header Hero Banner */}
        <div
          className={`p-6 sm:p-8 rounded-3xl border flex items-center justify-between transition-colors shadow-2xl ${
            isDark
              ? 'bg-gradient-to-r from-purple-950/80 via-slate-900 to-slate-950 border-white/15'
              : 'bg-gradient-to-r from-blue-600/10 via-indigo-500/10 to-purple-500/10 border-slate-200/80'
          }`}
        >
          <div className="space-y-3">
            <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-blue-600 text-white text-[11px] font-black uppercase tracking-widest shadow-md">
              <Compass className="w-3.5 h-3.5" /> Genre Explorer
            </div>
            <h1 className={`text-2xl sm:text-4xl font-black tracking-tight ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Explore Sounds & Charts
            </h1>
            <p className={`text-xs sm:text-sm font-semibold leading-relaxed max-w-xl ${isDark ? 'text-slate-300' : 'text-slate-600'}`}>
              Stream millions of high-fidelity tracks powered by YouTube Audio Engine. Discover curated top charts across Bollywood, Billboard, Punjabi, and Lo-Fi.
            </p>
          </div>
          <Disc className={`hidden md:block w-24 h-24 shrink-0 animate-spin-slow ${isDark ? 'text-blue-500/20' : 'text-blue-600/20'}`} />
        </div>

        {/* Genre Cards Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 sm:gap-6">
          {genresConfig.map((genre) => {
            const isSelected = selectedGenre.toLowerCase() === genre.name.toLowerCase();
            return (
              <div
                key={genre.name}
                onClick={() => setSelectedGenre(genre.name)}
                className={`relative rounded-3xl overflow-hidden border p-6 cursor-pointer transition-all duration-300 group min-h-[140px] flex flex-col justify-between bg-gradient-to-br ${
                  genre.gradient
                } ${
                  isSelected ? 'ring-4 ring-blue-500/60 scale-[1.02]' : 'hover:scale-[1.01]'
                }`}
              >
                <div className="relative z-10 space-y-2 max-w-[78%]">
                  <h3 className="text-xl sm:text-2xl font-black text-white tracking-tight drop-shadow-md">{genre.name}</h3>
                  <p className="text-xs font-semibold leading-relaxed text-white/90 drop-shadow">
                    {genre.description}
                  </p>
                </div>

                <div className="w-24 h-24 rounded-2xl overflow-hidden absolute -bottom-3 -right-3 transform rotate-6 group-hover:rotate-0 group-hover:scale-110 transition-transform duration-300 border-2 border-white/25 shadow-2xl shrink-0 pointer-events-none">
                  <img src={genre.image} alt={genre.name} className="w-full h-full object-cover" />
                </div>
              </div>
            );
          })}
        </div>

        {/* Track List Section */}
        <section
          className={`p-5 sm:p-7 rounded-3xl border transition-colors ${
            isDark
              ? 'bg-[#151D2A] border-white/10 shadow-2xl'
              : 'bg-white border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
          }`}
        >
          <div className="flex items-center justify-between mb-5">
            <h2 className={`text-lg sm:text-xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              {selectedGenre === 'All' ? 'All Curated YouTube Tracks' : `${selectedGenre} Selection`}
            </h2>
            <span className="text-xs text-slate-400 font-mono font-bold px-3 py-1 rounded-full bg-white/5 border border-white/10">
              {displayTracks.length} Tracks
            </span>
          </div>

          <TrackTable tracks={displayTracks} />
        </section>
      </div>
    </main>
  );
}
