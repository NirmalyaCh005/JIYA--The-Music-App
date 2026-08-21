'use client';

import React from 'react';
import { Heart, Globe } from 'lucide-react';

export function Footer() {
  return (
    <footer className="w-full mt-auto py-6 px-4 border-t border-white/5 text-center text-xs font-semibold text-slate-500 select-none space-y-2">
      <p className="flex items-center justify-center gap-1.5 text-slate-400">
        <span>Made with</span>
        <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 animate-pulse shrink-0 inline-block" />
        <span>by</span>
        <span className="font-extrabold text-white tracking-wide">Nirmalya Chowdhury</span>
      </p>
      <p className="text-[11px] text-slate-400 flex items-center justify-center gap-1.5">
        <Globe className="w-3 h-3 text-blue-400" />
        <span>Live Production App:</span>
        <a
          href="https://jiya-kappa.vercel.app/"
          target="_blank"
          rel="noopener noreferrer"
          className="text-blue-400 hover:text-blue-300 underline font-bold transition-colors"
        >
          jiya-kappa.vercel.app
        </a>
      </p>
      <p className="text-[11px] text-slate-600 font-mono">
        © {new Date().getFullYear()} JIYA Music Engine • All Rights Reserved
      </p>
    </footer>
  );
}
