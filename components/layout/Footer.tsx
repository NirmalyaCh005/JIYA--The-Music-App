'use client';

import React from 'react';
import { Heart } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full mt-auto py-6 px-4 border-t border-white/5 text-center text-xs font-semibold text-slate-500 select-none space-y-1.5">
      <p className="flex items-center justify-center gap-1.5 text-slate-400">
        <span>Made with</span>
        <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse shrink-0 inline-block" />
        <span>by</span>
        <span className="font-extrabold text-white tracking-wide">Nirmalya Chowdhury</span>
      </p>
      <p className="text-[11px] text-slate-600 font-mono">
        © {new Date().getFullYear()} JIYA Music Engine • All Rights Reserved
      </p>
    </footer>
  );
}
