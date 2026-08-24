'use client';

import React, { useState, useRef, useEffect } from 'react';
import { Search, X, Loader2, Play } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { usePathname } from 'next/navigation';

export function BottomSearchBar() {
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);
  const pathname = usePathname();

  const { theme } = usePlayerStore();
  const { playTrack } = useAudioPlayer();
  const isDark = theme === 'dark';

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);

    if (!val.trim()) {
      setSearchResults([]);
      setShowSearchDropdown(false);
      return;
    }

    setShowSearchDropdown(true);
    setIsSearching(true);
    try {
      const res = await fetch(`/api/search?q=${encodeURIComponent(val)}`);
      if (res.ok) {
        const data = await res.json();
        setSearchResults(Array.isArray(data) ? data : []);
      }
    } catch (err) {
      console.error('Search error:', err);
    } finally {
      setIsSearching(false);
    }
  };

  if (pathname === '/login') return null;

  return (
    <div className="fixed bottom-20 left-4 right-4 z-40 lg:hidden" ref={searchRef}>
      <div className="relative">
        <Search className="w-4 h-4 absolute left-4 top-1/2 -translate-y-1/2 text-slate-400" />
        <input
          type="text"
          value={searchQuery}
          onChange={handleSearchChange}
          onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
          placeholder="Search songs..."
          className={`w-full pl-10 pr-4 py-3 rounded-2xl text-sm font-bold transition-all shadow-2xl ${
            isDark
              ? 'bg-[#0F1623]/90 backdrop-blur-3xl border border-white/15 text-white placeholder-slate-400'
              : 'bg-white/90 backdrop-blur-3xl border border-slate-200 text-slate-900 placeholder-slate-400'
          }`}
        />

        {showSearchDropdown && (
          <div
            className={`absolute bottom-full mb-3 left-0 right-0 max-h-80 overflow-y-auto custom-scrollbar rounded-2xl border shadow-2xl p-3 z-[90] animate-in fade-in slide-in-from-bottom-2 duration-200 ${
              isDark
                ? 'bg-[#0B0F17]/95 backdrop-blur-2xl border-white/15 text-white'
                : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-900'
            }`}
          >
            {isSearching ? (
              <div className="py-6 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-bold">
                <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                <span>Searching...</span>
              </div>
            ) : searchResults.length === 0 ? (
              <div className="py-6 text-center text-slate-400 text-xs font-medium">
                No matching tracks found.
              </div>
            ) : (
              <div className="space-y-1">
                {searchResults.map((track) => (
                  <div
                    key={track.id}
                    onClick={() => {
                      playTrack(track);
                      setShowSearchDropdown(false);
                      setSearchQuery('');
                    }}
                    className="p-2 rounded-xl hover:bg-blue-600/15 border border-transparent hover:border-blue-500/20 flex items-center justify-between gap-3 cursor-pointer transition-all active:scale-[0.98]"
                  >
                    <div className="flex items-center gap-3 min-w-0 flex-1">
                      <div className="w-10 h-10 rounded-lg overflow-hidden border border-white/10 shrink-0">
                        <img src={track.coverUrl || '/logo.png'} alt="" className="w-full h-full object-cover" />
                      </div>
                      <div className="min-w-0 flex-1">
                        <p className="text-xs font-bold truncate">{track.title}</p>
                        <p className="text-[10px] text-slate-400 truncate">{track.artist}</p>
                      </div>
                    </div>
                    <button className="w-8 h-8 rounded-full bg-blue-600 text-white flex items-center justify-center shrink-0">
                      <Play className="w-3 h-3 fill-white ml-0.5" />
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
