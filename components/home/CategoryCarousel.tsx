'use client';

import React from 'react';
import Link from 'next/link';
import { Play, Music, Sparkles } from 'lucide-react';
import { Playlist } from '@/types/music';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

interface CategoryCarouselProps {
  playlists: Playlist[];
}

export function CategoryCarousel({ playlists }: CategoryCarouselProps) {
  const { setQueue } = usePlayerStore();

  const handlePlayPlaylist = (playlist: Playlist) => {
    if (playlist.tracks && playlist.tracks.length > 0) {
      const tracks = playlist.tracks.map((pt) => pt.track);
      setQueue(tracks, 0);
    }
  };

  return (
    <div className="mb-10">
      <div className="flex items-center justify-between mb-4">
        <h2 className="text-xl font-bold text-white flex items-center gap-2">
          <Sparkles className="w-5 h-5 text-brand-primary" />
          Featured Playlists
        </h2>
        <Link href="/explore" className="text-xs font-semibold text-brand-primary hover:underline">
          See All
        </Link>
      </div>

      <div className="flex items-center gap-5 overflow-x-auto pb-4 custom-scrollbar">
        {playlists.map((playlist) => (
          <div
            key={playlist.id}
            className="w-48 flex-shrink-0 p-4 rounded-2xl bg-dark-surface/60 border border-dark-border hover:border-brand-primary/40 hover:bg-slate-900/90 transition-all duration-300 group cursor-pointer"
          >
            <div className="relative aspect-square rounded-xl overflow-hidden mb-3">
              <img
                src={playlist.coverUrl || '/samples/covers/lofi.jpg'}
                alt={playlist.title}
                className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
              />
              <div className="absolute inset-0 bg-slate-950/40 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center">
                <button
                  onClick={() => handlePlayPlaylist(playlist)}
                  className="w-11 h-11 rounded-full bg-brand-primary text-slate-950 flex items-center justify-center shadow-neon hover:scale-110 active:scale-95 transition-transform"
                >
                  <Play className="w-5 h-5 fill-slate-950 ml-0.5" />
                </button>
              </div>
            </div>

            <h3 className="font-bold text-white text-sm truncate">{playlist.title}</h3>
            <p className="text-xs text-slate-400 line-clamp-2 mt-1">
              {playlist.description || `${playlist._count?.tracks || 0} tracks`}
            </p>
          </div>
        ))}

        {playlists.length === 0 && (
          <div className="w-full py-8 text-center text-slate-500 text-xs italic">
            No featured playlists available yet.
          </div>
        )}
      </div>
    </div>
  );
}
