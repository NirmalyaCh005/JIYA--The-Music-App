'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { NowPlayingCard } from '@/components/home/NowPlayingCard';
import { Track } from '@/types/music';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import {
  HINDI_TRENDING_TRACKS,
  BILLBOARD_TOP_TRACKS,
  PUNJABI_VIRAL_TRACKS,
  LOFI_CHILL_BEATS,
} from '@/lib/constants/featuredTracks';
import { Sparkles, Music2, Play, ChevronLeft, ChevronRight } from 'lucide-react';

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);

  const { playTrackList } = useAudioPlayer();
  const { theme } = usePlayerStore();
  const isDark = theme === 'dark';

  // Live Search via /api/search
  useEffect(() => {
    if (!searchQuery?.trim()) {
      setSearchResults([]);
      setIsSearching(false);
      return;
    }

    const timer = setTimeout(async () => {
      setIsSearching(true);
      try {
        const res = await fetch(`/api/search?q=${encodeURIComponent(searchQuery.trim())}`);
        if (res.ok) {
          const data = await res.json();
          setSearchResults(data);
        }
      } catch (err) {
        console.error('Search Error:', err);
      } finally {
        setIsSearching(false);
      }
    }, 350);

    return () => clearTimeout(timer);
  }, [searchQuery]);

  const topchartTracks = BILLBOARD_TOP_TRACKS.slice(0, 5);
  const popularTracks = [
    ...HINDI_TRENDING_TRACKS,
    ...BILLBOARD_TOP_TRACKS,
    ...PUNJABI_VIRAL_TRACKS,
  ];

  const [selectedGenre, setSelectedGenre] = useState('All');

  // Filter popular tracks based on Navbar genre pill selection
  let filteredPopularTracks = popularTracks;
  if (selectedGenre === 'Bollywood') {
    filteredPopularTracks = HINDI_TRENDING_TRACKS;
  } else if (selectedGenre === 'Pop / Global') {
    filteredPopularTracks = BILLBOARD_TOP_TRACKS;
  } else if (selectedGenre === 'Punjabi') {
    filteredPopularTracks = PUNJABI_VIRAL_TRACKS;
  } else if (selectedGenre === 'Lofi Chill') {
    filteredPopularTracks = LOFI_CHILL_BEATS;
  }

  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar
        onSearch={(q) => setSearchQuery(q)}
        selectedGenre={selectedGenre}
        onGenreSelect={(g) => setSelectedGenre(g)}
      />

      <div className="py-8 px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-10">
        {/* If searching, render Live Search Results */}
        {searchQuery ? (
          <section className="space-y-6 animate-in fade-in duration-200">
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
              <h2
                className={`text-lg sm:text-2xl font-extrabold flex items-center gap-2.5 flex-wrap ${
                  isDark ? 'text-white' : 'text-slate-900'
                }`}
              >
                <Music2 className="w-5 h-5 sm:w-6 sm:h-6 text-blue-600 shrink-0" />
                <span>Search Results for</span>
                <span className="text-blue-600">"{searchQuery}"</span>
              </h2>
              <span
                className={`self-start sm:self-auto text-xs font-mono px-3 py-1 rounded-full border shrink-0 ${
                  isDark
                    ? 'bg-white/5 border-white/10 text-slate-400'
                    : 'bg-white border-slate-200 text-slate-600 shadow-sm'
                }`}
              >
                {searchResults.length} Audio Tracks Found
              </span>
            </div>

            {isSearching ? (
              <div
                className={`py-20 text-center rounded-3xl border flex flex-col items-center justify-center gap-3 ${
                  isDark
                    ? 'bg-[#151D2A] border-white/10 text-slate-400'
                    : 'bg-white border-slate-200/80 text-slate-500 shadow-sm'
                }`}
              >
                <Sparkles className="w-8 h-8 text-blue-600 animate-spin" />
                <p className={`font-semibold ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  Searching Music Engine...
                </p>
              </div>
            ) : searchResults.length > 0 ? (
              <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
                <div
                  className={`lg:col-span-2 p-6 rounded-3xl border shadow-sm ${
                    isDark ? 'bg-[#151D2A] border-white/10' : 'bg-white border-slate-200/80'
                  }`}
                >
                  <TrackTable tracks={searchResults} />
                </div>
                <div>
                  <NowPlayingCard />
                </div>
              </div>
            ) : (
              <div
                className={`py-20 text-center rounded-3xl border flex flex-col items-center justify-center gap-3 ${
                  isDark
                    ? 'bg-[#151D2A] border-white/10 text-slate-400'
                    : 'bg-white border-slate-200/80 text-slate-500 shadow-sm'
                }`}
              >
                <Music2 className="w-10 h-10 text-slate-400" />
                <p className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No tracks found for "{searchQuery}"
                </p>
              </div>
            )}
          </section>
        ) : (
          <>
            {/* Top Billboard Topchart Section (Matching Reference Screenshot) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <h2
                  className={`text-xl font-extrabold tracking-tight ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  Billboard Topchart
                </h2>
                <div className="flex items-center gap-2">
                  <button
                    className={`p-1.5 rounded-full border transition-colors ${
                      isDark
                        ? 'border-white/10 hover:bg-white/10 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    className={`p-1.5 rounded-full border transition-colors ${
                      isDark
                        ? 'border-white/10 hover:bg-white/10 text-slate-400'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-600'
                    }`}
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Album Cards Grid */}
              <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-5 gap-5">
                {topchartTracks.map((track, idx) => (
                  <div
                    key={track.id}
                    onClick={() => playTrackList(topchartTracks, idx)}
                    className="group cursor-pointer space-y-3"
                  >
                    <div className="relative aspect-square rounded-[28px] overflow-hidden shadow-lg group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1">
                      <img
                        src={track.coverUrl || '/samples/covers/cyberpunk.jpg'}
                        alt={track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />
                      <div className="absolute inset-0 bg-slate-950/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                        <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                          <Play className="w-5 h-5 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`font-black text-sm truncate tracking-tight ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {track.title}
                      </h3>
                      <p className={`text-xs font-semibold truncate mt-0.5 ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                        {track.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom Split Grid: Most Popular Tracklist (2/3 width) + Now Playing Card (1/3 width) */}
            <section className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              {/* Left Column: Most Popular Tracklist */}
              <div className="lg:col-span-2 space-y-4">
                <div className="flex items-center justify-between">
                  <div>
                    <h2
                      className={`text-xl font-extrabold tracking-tight ${
                        isDark ? 'text-white' : 'text-slate-900'
                      }`}
                    >
                      Most Popular
                    </h2>
                    <p className="text-xs text-slate-400 font-medium mt-0.5">
                      {filteredPopularTracks.length} Songs
                    </p>
                  </div>
                </div>

                <div
                  className={`p-6 rounded-[32px] border max-h-[480px] overflow-y-auto custom-scrollbar transition-colors duration-300 ${
                    isDark
                      ? 'bg-[#151D2A] border-white/10 shadow-2xl'
                      : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
                  }`}
                >
                  <TrackTable tracks={filteredPopularTracks} />
                </div>
              </div>

              {/* Right Column: Now Playing Card */}
              <div className="lg:col-span-1 sticky top-24">
                <NowPlayingCard />
              </div>
            </section>
          </>
        )}
      </div>
    </main>
  );
}
