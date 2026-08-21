'use client';

import React, { useEffect, useState } from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { Track } from '@/types/music';
import { Heart, Play, Sparkles, Music } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import {
  HINDI_TRENDING_TRACKS,
  BILLBOARD_TOP_TRACKS,
  PUNJABI_VIRAL_TRACKS,
  LOFI_CHILL_BEATS,
} from '@/lib/constants/featuredTracks';

export default function LikedSongsPage() {
  const [tracks, setTracks] = useState<Track[]>([]);
  const [loading, setLoading] = useState(true);
  const { likedTrackIds, theme } = usePlayerStore();
  const { playTrackList } = useAudioPlayer();
  const isDark = theme === 'dark';

  const ALL_FEATURED_TRACKS = [
    ...HINDI_TRENDING_TRACKS,
    ...BILLBOARD_TOP_TRACKS,
    ...PUNJABI_VIRAL_TRACKS,
    ...LOFI_CHILL_BEATS,
  ];

  const isTrackLiked = (id: string, isLikedInDb?: boolean) => {
    if (isLikedInDb) return true;
    if (likedTrackIds instanceof Set) {
      return likedTrackIds.has(id);
    }
    if (Array.isArray(likedTrackIds)) {
      return (likedTrackIds as string[]).includes(id);
    }
    return false;
  };

  const fetchLikedTracks = async () => {
    setLoading(true);
    try {
      let dbTracks: Track[] = [];
      const res = await fetch('/api/tracks');
      if (res.ok) {
        dbTracks = await res.json();
      }

      // Combine Database tracks and Featured tracks with deduplication
      const trackMap = new Map<string, Track>();
      [...ALL_FEATURED_TRACKS, ...dbTracks].forEach((track) => {
        trackMap.set(track.id, track);
      });

      const combinedTracks = Array.from(trackMap.values());
      const filtered = combinedTracks.filter((t) => isTrackLiked(t.id, t.isLiked));

      setTracks(filtered);
    } catch (err) {
      console.error('Error fetching liked tracks:', err);
      // Fallback filtering on featured tracks
      const filtered = ALL_FEATURED_TRACKS.filter((t) => isTrackLiked(t.id));
      setTracks(filtered);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLikedTracks();
  }, [likedTrackIds]);

  const handlePlayAll = () => {
    if (tracks.length > 0) {
      playTrackList(tracks, 0);
    }
  };

  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar />

      <div className="py-6 sm:py-8 px-4 sm:px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-6 sm:space-y-8">
        {/* Liked Hero Banner */}
        <div className="p-6 sm:p-10 rounded-3xl bg-gradient-to-r from-red-950 via-pink-950 to-slate-950 border border-red-500/30 flex flex-col sm:flex-row items-center gap-6 shadow-2xl relative overflow-hidden">
          <div className="absolute top-0 right-0 w-80 h-80 bg-red-500/10 rounded-full blur-3xl pointer-events-none" />

          <div className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl bg-gradient-to-tr from-red-600 to-pink-500 flex items-center justify-center shadow-xl shrink-0">
            <Heart className="w-12 h-12 sm:w-14 sm:h-14 text-white fill-white animate-pulse" />
          </div>

          <div className="space-y-2 text-center sm:text-left flex-1 relative z-10">
            <span className="text-[11px] font-black text-red-400 uppercase tracking-widest px-3 py-1 rounded-full bg-red-500/20 border border-red-500/30 inline-block">
              Your Playlist
            </span>
            <h1 className="text-3xl sm:text-5xl font-black text-white tracking-tight">Liked Songs</h1>
            <p className="text-xs sm:text-sm font-semibold text-slate-300">
              Your personal collection of favorite tracks • {tracks.length} {tracks.length === 1 ? 'track' : 'tracks'}
            </p>

            {tracks.length > 0 && (
              <div className="pt-2">
                <button
                  onClick={handlePlayAll}
                  className="inline-flex items-center gap-2.5 px-6 py-3 rounded-full bg-red-500 hover:bg-red-600 text-white font-black text-xs shadow-lg shadow-red-500/30 hover:scale-105 active:scale-95 transition-all cursor-pointer"
                >
                  <Play className="w-4 h-4 fill-white" />
                  <span>Play Liked Songs ({tracks.length})</span>
                </button>
              </div>
            )}
          </div>
        </div>

        {/* Tracks Table Container */}
        <section
          className={`p-5 sm:p-8 rounded-3xl border transition-colors ${
            isDark
              ? 'bg-[#151D2A] border-white/10 shadow-2xl'
              : 'bg-white border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
          }`}
        >
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2 font-bold text-xs">
              <Sparkles className="w-4 h-4 animate-spin text-red-500" />
              <span>Loading liked tracks...</span>
            </div>
          ) : tracks.length === 0 ? (
            <div className="py-16 text-center text-slate-400 space-y-3">
              <div className="w-14 h-14 rounded-full bg-white/5 border border-white/10 flex items-center justify-center mx-auto text-slate-500">
                <Music className="w-6 h-6" />
              </div>
              <p className="text-sm font-extrabold text-white">No Liked Songs Yet</p>
              <p className="text-xs text-slate-400 max-w-sm mx-auto">
                Tap the heart icon on any song from Home, Explore, or Charts to add it to your Liked Songs collection.
              </p>
            </div>
          ) : (
            <TrackTable tracks={tracks} onTrackDeleted={fetchLikedTracks} />
          )}
        </section>
      </div>
    </main>
  );
}
