'use client';

import React from 'react';
import { Play, Plus, Flame, Radio } from 'lucide-react';
import { Track } from '@/types/music';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

interface HeroBannerProps {
  featuredTrack?: Track | null;
}

export function HeroBanner({ featuredTrack }: HeroBannerProps) {
  const { setCurrentTrack, addToQueue } = usePlayerStore();

  if (!featuredTrack) return null;

  return (
    <div className="relative rounded-3xl overflow-hidden mb-8 border border-white/10 bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 p-8 flex flex-col md:flex-row items-center justify-between gap-8 shadow-2xl">
      {/* Background Neon Blur Glows */}
      <div className="absolute -top-24 -left-24 w-72 h-72 rounded-full bg-brand-primary/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-brand-accent/20 blur-3xl pointer-events-none" />

      {/* Track Content */}
      <div className="relative z-10 flex-1 space-y-4">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-brand-primary/10 border border-brand-primary/30 text-brand-primary text-xs font-semibold uppercase tracking-widest">
          <Flame className="w-3.5 h-3.5" /> Spotlight Track
        </div>

        <div>
          <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">
            {featuredTrack.title}
          </h1>
          <p className="text-lg text-slate-300 font-medium mt-1">
            by <span className="text-brand-secondary">{featuredTrack.artist}</span>
          </p>
        </div>

        <p className="text-xs sm:text-sm text-slate-400 max-w-xl line-clamp-2">
          Experience ultra-high fidelity audio streaming. {featuredTrack.album ? `Album: ${featuredTrack.album}.` : ''} Packed with immersive soundscapes and crystal-clear mastering.
        </p>

        {/* Hero Actions */}
        <div className="flex items-center gap-4 pt-2">
          <button
            onClick={() => setCurrentTrack(featuredTrack)}
            className="flex items-center gap-2.5 px-6 py-3 rounded-2xl bg-gradient-to-r from-brand-primary via-brand-secondary to-brand-accent text-slate-950 font-bold text-sm shadow-neon hover:scale-105 active:scale-95 transition-all"
          >
            <Play className="w-5 h-5 fill-slate-950" />
            Play Now
          </button>

          <button
            onClick={() => addToQueue(featuredTrack)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-white/10 hover:bg-white/15 border border-white/10 text-white font-medium text-sm transition-all"
          >
            <Plus className="w-4 h-4 text-brand-primary" />
            Add to Queue
          </button>
        </div>
      </div>

      {/* Featured Cover Art */}
      <div className="relative z-10 w-48 h-48 sm:w-56 sm:h-56 rounded-2xl overflow-hidden border-2 border-white/10 shadow-glass flex-shrink-0 group">
        <img
          src={featuredTrack.coverUrl || '/samples/covers/cyberpunk.jpg'}
          alt={featuredTrack.title}
          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-500"
        />
        <div className="absolute inset-0 bg-gradient-to-t from-slate-950/80 via-transparent to-transparent" />
        <div className="absolute bottom-3 left-3 right-3 text-center">
          <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-widest bg-slate-950/80 px-2 py-0.5 rounded-full border border-emerald-500/30">
            24-Bit / 96kHz Lossless
          </span>
        </div>
      </div>
    </div>
  );
}
