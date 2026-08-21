'use client';

import React, { useEffect, useState, Suspense } from 'react';
import Link from 'next/link';
import { useSearchParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { Track, Playlist } from '@/types/music';
import { Library, Clock, Heart, PlusSquare, Play, Sparkles, Music2 } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

function LibraryContent() {
  const searchParams = useSearchParams();
  const activeTab = searchParams ? searchParams.get('tab') : null;

  const [tracks, setTracks] = useState<Track[]>([]);
  const [playlists, setPlaylists] = useState<Playlist[]>([]);
  const [loading, setLoading] = useState(true);

  const { likedTrackIds, recentlyPlayed, theme } = usePlayerStore();
  const isDark = theme === 'dark';

  const fetchLibraryData = async () => {
    setLoading(true);
    try {
      const [tracksRes, playlistsRes] = await Promise.all([
        fetch('/api/tracks'),
        fetch('/api/playlists'),
      ]);

      if (tracksRes.ok) {
        setTracks(await tracksRes.json());
      }
      if (playlistsRes.ok) {
        setPlaylists(await playlistsRes.json());
      }
    } catch (err) {
      console.error('Failed to fetch library data:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchLibraryData();
  }, []);

  const createPlaylist = async () => {
    const title = prompt('Enter Playlist Name:');
    if (!title?.trim()) return;

    try {
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ title: title.trim() }),
      });
      if (res.ok) fetchLibraryData();
    } catch (err) {
      console.error(err);
    }
  };

  // If viewing "Recently Played" tab
  if (activeTab === 'recent') {
    return (
      <main className="flex-1 flex flex-col select-none">
        <Navbar />

        <div className="py-8 px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-8">
          {/* Header */}
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow">
              <Clock className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Recently Played
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {recentlyPlayed.length} tracks played in your current session
              </p>
            </div>
          </div>

          {/* Tracks Table */}
          <section
            className={`p-6 rounded-[32px] border transition-colors ${
              isDark
                ? 'bg-[#151D2A] border-white/10 shadow-2xl'
                : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
            }`}
          >
            {recentlyPlayed.length > 0 ? (
              <TrackTable tracks={recentlyPlayed} />
            ) : (
              <div className="py-20 text-center flex flex-col items-center justify-center gap-3">
                <Music2 className="w-10 h-10 text-slate-400" />
                <p className={`font-extrabold text-base ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  No Recently Played Songs
                </p>
                <p className="text-xs text-slate-400 font-medium">
                  Play any song from Billboard Topchart or Search to build your listening history
                </p>
              </div>
            )}
          </section>
        </div>
      </main>
    );
  }

  // Default "Local Files / Library" view
  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar />

      <div className="py-8 px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-12 h-12 rounded-2xl bg-blue-600 text-white flex items-center justify-center shadow-lg">
              <Library className="w-6 h-6 stroke-[2.5]" />
            </div>
            <div>
              <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
                Your Music Library
              </h1>
              <p className="text-xs text-slate-400 font-medium mt-0.5">
                {playlists.length} playlists • {tracks.length} tracks • {likedTrackIds.size} liked
              </p>
            </div>
          </div>

          <button
            onClick={createPlaylist}
            className="flex items-center gap-2 px-4 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold shadow-md transition-all active:scale-95"
          >
            <PlusSquare className="w-4 h-4" />
            New Playlist
          </button>
        </div>

        {/* Liked Songs Quick Card + Playlists */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
          {/* Liked Card */}
          <Link
            href="/liked"
            className={`p-6 rounded-[28px] border shadow-xl group transition-all ${
              isDark
                ? 'bg-gradient-to-br from-pink-900/40 via-slate-900 to-[#151D2A] border-pink-500/30 hover:border-pink-400'
                : 'bg-gradient-to-br from-pink-50 via-white to-pink-50/50 border-pink-200 hover:border-pink-300'
            }`}
          >
            <Heart className="w-10 h-10 text-red-500 fill-red-500 mb-4 group-hover:scale-110 transition-transform" />
            <h3 className={`text-xl font-extrabold ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Liked Songs
            </h3>
            <p className="text-xs text-slate-400 mt-1 font-mono">{likedTrackIds.size} favorite tracks</p>
          </Link>

          {/* User Playlists */}
          {playlists.map((pl) => (
            <div
              key={pl.id}
              className={`p-5 rounded-[28px] border transition-all group relative flex flex-col justify-between ${
                isDark
                  ? 'bg-[#151D2A] border-white/10 hover:border-blue-500/40'
                  : 'bg-white border-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.03)] hover:border-blue-300'
              }`}
            >
              <div className="relative aspect-square rounded-2xl overflow-hidden mb-3">
                <img
                  src={pl.coverUrl || '/samples/covers/lofi.jpg'}
                  alt={pl.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <Link
                    href={`/playlist/${pl.id}`}
                    className="w-11 h-11 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-lg hover:scale-110 transition-transform"
                  >
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </Link>
                </div>
              </div>

              <div>
                <Link
                  href={`/playlist/${pl.id}`}
                  className={`font-bold text-base hover:underline truncate block ${
                    isDark ? 'text-white' : 'text-slate-900'
                  }`}
                >
                  {pl.title}
                </Link>
                <p className="text-xs text-slate-400 mt-0.5">
                  {pl._count?.tracks || pl.tracks?.length || 0} tracks
                </p>
              </div>
            </div>
          ))}
        </div>

        {/* All Tracks */}
        <section
          className={`p-6 rounded-[32px] border transition-colors ${
            isDark
              ? 'bg-[#151D2A] border-white/10 shadow-2xl'
              : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
          }`}
        >
          <h2 className={`text-lg font-black mb-4 ${isDark ? 'text-white' : 'text-slate-900'}`}>
            All Library Tracks
          </h2>
          {loading ? (
            <div className="py-12 text-center text-slate-400 flex items-center justify-center gap-2">
              <Sparkles className="w-4 h-4 animate-spin text-blue-600" />
              <span>Loading library tracks...</span>
            </div>
          ) : (
            <TrackTable tracks={tracks} onTrackDeleted={fetchLibraryData} />
          )}
        </section>
      </div>
    </main>
  );
}

export default function LibraryPage() {
  return (
    <Suspense fallback={<div className="p-8 text-slate-400 text-sm">Loading...</div>}>
      <LibraryContent />
    </Suspense>
  );
}
