'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { BILLBOARD_TOP_TRACKS, HINDI_TRENDING_TRACKS, PUNJABI_VIRAL_TRACKS } from '@/lib/constants/featuredTracks';
import { Disc, Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export default function AlbumsPage() {
  const { theme, setQueue } = usePlayerStore();
  const isDark = theme === 'dark';

  const albums = [
    {
      id: 'album-1',
      title: 'After Hours',
      artist: 'The Weeknd',
      year: '2020',
      cover: 'https://images.unsplash.com/photo-1614613535308-eb5fbd3d2c17?auto=format&fit=crop&w=600&q=80',
      tracks: BILLBOARD_TOP_TRACKS,
    },
    {
      id: 'album-2',
      title: 'Brahmastra Original Motion Picture Soundtrack',
      artist: 'Pritam & Arijit Singh',
      year: '2022',
      cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?auto=format&fit=crop&w=600&q=80',
      tracks: HINDI_TRENDING_TRACKS,
    },
    {
      id: 'album-3',
      title: 'Ghost',
      artist: 'Diljit Dosanjh',
      year: '2023',
      cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?auto=format&fit=crop&w=600&q=80',
      tracks: PUNJABI_VIRAL_TRACKS,
    },
  ];

  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar />

      <div className="py-8 px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow">
            <Disc className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Featured Albums
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Explore studio albums & high-definition original audio records
            </p>
          </div>
        </div>

        {/* Albums Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {albums.map((album) => (
            <div
              key={album.id}
              className={`p-6 rounded-[32px] border transition-all duration-300 group ${
                isDark
                  ? 'bg-[#151D2A] border-white/10 hover:border-blue-500/40 shadow-2xl'
                  : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:border-blue-300'
              }`}
            >
              <div className="relative aspect-square rounded-[24px] overflow-hidden mb-4 shadow-lg">
                <img
                  src={album.cover}
                  alt={album.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <button
                    onClick={() => setQueue(album.tracks, 0)}
                    className="w-14 h-14 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-2xl hover:scale-110 transition-transform"
                  >
                    <Play className="w-6 h-6 fill-white ml-0.5" />
                  </button>
                </div>
              </div>

              <div className="space-y-1">
                <h3 className={`font-black text-lg truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {album.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 truncate">
                  {album.artist} • {album.year}
                </p>
              </div>

              <div className="mt-4 pt-4 border-t border-inherit">
                <TrackTable tracks={album.tracks.slice(0, 3)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
