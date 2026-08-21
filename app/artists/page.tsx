'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { BILLBOARD_TOP_TRACKS, HINDI_TRENDING_TRACKS, PUNJABI_VIRAL_TRACKS } from '@/lib/constants/featuredTracks';
import { Users, Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export default function ArtistsPage() {
  const { theme, setQueue } = usePlayerStore();
  const isDark = theme === 'dark';

  const artists = [
    {
      name: 'Arijit Singh',
      role: 'Bollywood Playback Legend',
      avatar: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=600&q=80',
      tracks: HINDI_TRENDING_TRACKS,
    },
    {
      name: 'The Weeknd',
      role: 'Global Pop & R&B Superstar',
      avatar: 'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?auto=format&fit=crop&w=600&q=80',
      tracks: BILLBOARD_TOP_TRACKS,
    },
    {
      name: 'Diljit Dosanjh',
      role: 'Punjabi Music Icon',
      avatar: 'https://images.unsplash.com/photo-1500648767791-00dcc994a43e?auto=format&fit=crop&w=600&q=80',
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
            <Users className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              Featured Artists
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Discover top global performers and stream popular discographies
            </p>
          </div>
        </div>

        {/* Artists Grid */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
          {artists.map((artist) => (
            <div
              key={artist.name}
              className={`p-6 rounded-[32px] border text-center flex flex-col items-center transition-all duration-300 group ${
                isDark
                  ? 'bg-[#151D2A] border-white/10 hover:border-blue-500/40 shadow-2xl'
                  : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:border-blue-300'
              }`}
            >
              <div className="relative w-32 h-32 rounded-full overflow-hidden mb-4 shadow-xl border-2 border-blue-500/30">
                <img
                  src={artist.avatar}
                  alt={artist.name}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
              </div>

              <h3 className={`font-black text-xl ${isDark ? 'text-white' : 'text-slate-900'}`}>
                {artist.name}
              </h3>
              <p className="text-xs font-semibold text-slate-400 mt-0.5 mb-4">{artist.role}</p>

              <button
                onClick={() => setQueue(artist.tracks, 0)}
                className="inline-flex items-center gap-2 px-5 py-2 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-extrabold text-xs shadow-md transition-transform active:scale-95 mb-4"
              >
                <Play className="w-4 h-4 fill-white" />
                Play Popular Tracks
              </button>

              <div className="w-full text-left pt-4 border-t border-inherit">
                <TrackTable tracks={artist.tracks.slice(0, 3)} />
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
