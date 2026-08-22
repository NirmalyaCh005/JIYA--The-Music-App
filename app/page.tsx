'use client';

import React, { useEffect, useState, useRef } from 'react';
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
  ALL_INITIAL_TRACKS,
} from '@/lib/constants/featuredTracks';
import { Sparkles, Music2, Play, ChevronLeft, ChevronRight, Heart, Flame, Clock } from 'lucide-react';

interface DynamicCard {
  track: Track;
  type: 'liked' | 'recent' | 'trending';
  label: string;
  badgeBg: string;
}

export default function HomePage() {
  const [searchResults, setSearchResults] = useState<Track[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [isSearching, setIsSearching] = useState(false);
  const [liveTrending, setLiveTrending] = useState<Track[]>([]);

  const { playTrackList, playTrack } = useAudioPlayer();
  const { theme, likedTrackIds, recentlyPlayed } = usePlayerStore();
  const isDark = theme === 'dark';

  const scrollContainerRef = useRef<HTMLDivElement>(null);

  // Fetch live trending tracks from API on mount
  useEffect(() => {
    async function fetchTrending() {
      try {
        const res = await fetch('/api/trending?language=hindi');
        if (res.ok) {
          const data = await res.json();
          if (data?.tracks && Array.isArray(data.tracks)) {
            setLiveTrending(data.tracks);
          }
        }
      } catch (err) {
        console.warn('Failed to fetch live trending tracks:', err);
      }
    }
    fetchTrending();
  }, []);

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

  // Build Auto Dynamic Cards (Liked Songs + Recently Played + Live Trending)
  const likedSet =
    likedTrackIds instanceof Set
      ? likedTrackIds
      : new Set(Array.isArray(likedTrackIds) ? likedTrackIds : []);

  const dynamicCards: DynamicCard[] = [];
  const addedIds = new Set<string>();

  // 1. Add User's Auto Liked Songs
  const allAvailableTracks = [...ALL_INITIAL_TRACKS, ...(recentlyPlayed || []), ...(liveTrending || [])];
  for (const t of allAvailableTracks) {
    if (likedSet.has(t.id) && !addedIds.has(t.id)) {
      addedIds.add(t.id);
      dynamicCards.push({
        track: t,
        type: 'liked',
        label: '❤️ Liked',
        badgeBg: 'bg-red-600/90 text-white border-red-400/40 shadow-red-500/20',
      });
    }
  }

  // 2. Add User's Recently Played Songs
  if (recentlyPlayed && Array.isArray(recentlyPlayed)) {
    for (const t of recentlyPlayed) {
      if (!addedIds.has(t.id)) {
        addedIds.add(t.id);
        dynamicCards.push({
          track: t,
          type: 'recent',
          label: '🕒 Recent',
          badgeBg: 'bg-blue-600/90 text-white border-blue-400/40 shadow-blue-500/20',
        });
      }
    }
  }

  // 3. Add Live Trending Songs
  const trendingSource = liveTrending.length > 0 ? liveTrending : BILLBOARD_TOP_TRACKS;
  for (const t of trendingSource) {
    if (!addedIds.has(t.id)) {
      addedIds.add(t.id);
      dynamicCards.push({
        track: t,
        type: 'trending',
        label: '🔥 Trending',
        badgeBg: 'bg-gradient-to-r from-orange-600 to-pink-600 text-white border-orange-400/40 shadow-orange-500/20',
      });
    }
    if (dynamicCards.length >= 12) break;
  }

  // Ensure at least 5 fallback cards if list is small
  if (dynamicCards.length < 5) {
    for (const t of HINDI_TRENDING_TRACKS) {
      if (!addedIds.has(t.id)) {
        addedIds.add(t.id);
        dynamicCards.push({
          track: t,
          type: 'trending',
          label: '🔥 Live Top',
          badgeBg: 'bg-indigo-600/90 text-white border-indigo-400/40 shadow-indigo-500/20',
        });
      }
      if (dynamicCards.length >= 6) break;
    }
  }

  const cardTracksList = dynamicCards.map((c) => c.track);

  // Horizontal Scroll Handler for Cards Carousel
  const handleScroll = (direction: 'left' | 'right') => {
    if (scrollContainerRef.current) {
      const scrollAmount = direction === 'left' ? -350 : 350;
      scrollContainerRef.current.scrollBy({ left: scrollAmount, behavior: 'smooth' });
    }
  };

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
            {/* Auto Liked, Recently Played & Live Trending Section (Replaces Static Billboard) */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2.5">
                  <Flame className="w-5 h-5 text-orange-500 fill-orange-500 animate-pulse" />
                  <h2
                    className={`text-xl font-extrabold tracking-tight ${
                      isDark ? 'text-white' : 'text-slate-900'
                    }`}
                  >
                    Your Mix & Live Trending
                  </h2>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={() => handleScroll('left')}
                    className={`p-2 rounded-full border transition-all active:scale-90 ${
                      isDark
                        ? 'border-white/10 hover:bg-white/10 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
                    }`}
                    title="Scroll Left"
                  >
                    <ChevronLeft className="w-4 h-4" />
                  </button>
                  <button
                    onClick={() => handleScroll('right')}
                    className={`p-2 rounded-full border transition-all active:scale-90 ${
                      isDark
                        ? 'border-white/10 hover:bg-white/10 text-slate-300'
                        : 'border-slate-200 hover:bg-slate-100 text-slate-700 shadow-sm'
                    }`}
                    title="Scroll Right"
                  >
                    <ChevronRight className="w-4 h-4" />
                  </button>
                </div>
              </div>

              {/* Dynamic Scrollable Card Carousel */}
              <div
                ref={scrollContainerRef}
                className="flex items-center gap-5 overflow-x-auto no-scrollbar pb-3 pt-1 scroll-smooth"
              >
                {dynamicCards.map((item, idx) => (
                  <div
                    key={`${item.track.id}-${idx}`}
                    onClick={() => playTrackList(cardTracksList, idx)}
                    className="group cursor-pointer space-y-3 shrink-0 w-44 sm:w-52"
                  >
                    <div className="relative aspect-square rounded-[28px] overflow-hidden shadow-xl group-hover:shadow-2xl transition-all duration-300 transform group-hover:-translate-y-1.5 border border-white/10">
                      <img
                        src={item.track.coverUrl || '/samples/covers/cyberpunk.jpg'}
                        alt={item.track.title}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                      />

                      {/* Top Dynamic Badge Tag (❤️ Liked, 🕒 Recent, 🔥 Trending) */}
                      <div className="absolute top-3 left-3 z-10">
                        <span
                          className={`text-[10px] font-black tracking-wide px-2.5 py-1 rounded-full border backdrop-blur-md shadow-md ${item.badgeBg}`}
                        >
                          {item.label}
                        </span>
                      </div>

                      {/* Hover Glassmorphism Play Button Overlay */}
                      <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center backdrop-blur-[2px]">
                        <div className="w-13 h-13 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl group-hover:scale-110 active:scale-95 transition-transform border border-white/30">
                          <Play className="w-6 h-6 fill-white ml-0.5" />
                        </div>
                      </div>
                    </div>

                    <div>
                      <h3
                        className={`font-black text-sm truncate tracking-tight group-hover:text-blue-500 transition-colors ${
                          isDark ? 'text-white' : 'text-slate-900'
                        }`}
                      >
                        {item.track.title}
                      </h3>
                      <p
                        className={`text-xs font-semibold truncate mt-0.5 ${
                          isDark ? 'text-slate-400' : 'text-slate-600'
                        }`}
                      >
                        {item.track.artist}
                      </p>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Bottom Split Grid: Most Popular Tracklist (2/3 width) + Original Now Playing Card (1/3 width) */}
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

              {/* Right Column: Original Now Playing Card */}
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
