'use client';

import React from 'react';
import { Navbar } from '@/components/layout/Navbar';
import { BILLBOARD_TOP_TRACKS, HINDI_TRENDING_TRACKS, PUNJABI_VIRAL_TRACKS } from '@/lib/constants/featuredTracks';
import { Film, Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export default function VideosPage() {
  const { theme, setCurrentTrack } = usePlayerStore();
  const isDark = theme === 'dark';

  const videos = [
    ...HINDI_TRENDING_TRACKS.slice(0, 3),
    ...BILLBOARD_TOP_TRACKS.slice(0, 3),
    ...PUNJABI_VIRAL_TRACKS.slice(0, 3),
  ];

  return (
    <main className="flex-1 flex flex-col select-none">
      <Navbar />

      <div className="py-8 px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-10">
        {/* Header */}
        <div className="flex items-center gap-3">
          <div className="w-12 h-12 rounded-2xl bg-blue-600/10 border border-blue-500/20 flex items-center justify-center text-blue-600 shadow">
            <Film className="w-6 h-6 stroke-[2.5]" />
          </div>
          <div>
            <h1 className={`text-2xl font-black ${isDark ? 'text-white' : 'text-slate-900'}`}>
              High-Fidelity Music Videos
            </h1>
            <p className="text-xs text-slate-400 font-medium mt-0.5">
              Watch official music videos powered by YouTube IFrame engine
            </p>
          </div>
        </div>

        {/* Videos Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
          {videos.map((track) => (
            <div
              key={track.id}
              onClick={() => setCurrentTrack(track)}
              className={`p-4 rounded-[28px] border cursor-pointer transition-all duration-300 group ${
                isDark
                  ? 'bg-[#151D2A] border-white/10 hover:border-blue-500/40 shadow-2xl'
                  : 'bg-white border-slate-100 shadow-[0_15px_35px_rgba(0,0,0,0.04)] hover:border-blue-300'
              }`}
            >
              <div className="relative aspect-video rounded-[20px] overflow-hidden mb-3 shadow-md">
                <img
                  src={track.coverUrl || '/samples/covers/lofi.jpg'}
                  alt={track.title}
                  className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
                />
                <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                  <div className="w-12 h-12 rounded-full bg-blue-600 text-white flex items-center justify-center shadow-xl group-hover:scale-110 transition-transform">
                    <Play className="w-5 h-5 fill-white ml-0.5" />
                  </div>
                </div>
                <span className="absolute bottom-2 right-2 px-2 py-0.5 rounded bg-black/80 text-white text-[10px] font-mono font-bold">
                  {track.duration ? `${Math.floor(track.duration / 60)}:${String(Math.floor(track.duration % 60)).padStart(2, '0')}` : '3:45'}
                </span>
              </div>

              <div>
                <h3 className={`font-extrabold text-base truncate ${isDark ? 'text-white' : 'text-slate-900'}`}>
                  {track.title}
                </h3>
                <p className="text-xs font-semibold text-slate-400 truncate mt-0.5">
                  {track.artist} • Official Music Video
                </p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </main>
  );
}
