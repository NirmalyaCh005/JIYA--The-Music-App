'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { usePathname, useSearchParams } from 'next/navigation';
import {
  Home,
  Compass,
  Disc,
  Users,
  Film,
  Clock,
  Folder,
  Heart,
  Plus,
  Music2,
  Radio,
  TrendingUp,
  UploadCloud,
  User,
  Sparkles,
  ShieldCheck,
  Headphones,
  X,
  ListPlus,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { CreatePlaylistModal } from '@/components/playlists/CreatePlaylistModal';

export function Sidebar() {
  const [showLogoModal, setShowLogoModal] = useState(false);
  const [isCreatePlaylistOpen, setIsCreatePlaylistOpen] = useState(false);
  const [userPlaylists, setUserPlaylists] = useState<any[]>([]);

  const pathname = usePathname();
  const searchParams = useSearchParams();
  const { theme, user, setUser, toggleUploadModal } = usePlayerStore();
  const isDark = theme === 'dark';

  const fetchPlaylists = async () => {
    try {
      const res = await fetch('/api/playlists');
      if (res.ok) {
        const data = await res.json();
        if (Array.isArray(data)) {
          setUserPlaylists(data);
        }
      }
    } catch (err) {
      console.error('Failed to fetch playlists:', err);
    }
  };

  useEffect(() => {
    fetchPlaylists();
  }, []);

  const isItemActive = (href: string) => {
    const tabParam = searchParams?.get('tab');
    if (href.includes('?tab=')) {
      const targetTab = href.split('?tab=')[1];
      return pathname === '/library' && tabParam === targetTab;
    }
    if (href === '/library') {
      return pathname === '/library' && !tabParam;
    }
    return pathname === href;
  };

  const discoverNav = [
    { name: 'Home', href: '/', icon: Home },
    { name: 'Browse & Genres', href: '/explore', icon: Compass },
    { name: 'Top Charts', href: '/charts', icon: TrendingUp },
    { name: 'Albums', href: '/albums', icon: Disc },
    { name: 'Artists', href: '/artists', icon: Users },
    { name: 'Music Videos', href: '/videos', icon: Film },
    { name: 'Radio & Stations', href: '/explore', icon: Radio },
  ];

  const myCollectionNav = [
    { name: 'Recently Played', href: '/library?tab=recent', icon: Clock },
    { name: 'Local Files', href: '/library', icon: Folder },
    { name: 'Liked Songs', href: '/liked', icon: Heart },
    { name: 'Uploaded Tracks', href: '/library', icon: UploadCloud },
  ];



  return (
    <>
      <aside
        className={`hidden lg:flex w-64 xl:w-72 shrink-0 flex-col h-full select-none z-30 transition-colors duration-300 border-r ${
          isDark
            ? 'bg-[#0E1420]/95 backdrop-blur-xl border-white/10 text-slate-200'
            : 'bg-white border-slate-200/80 text-slate-700 shadow-[2px_0_15px_rgba(0,0,0,0.02)]'
        }`}
      >
        {/* Top Branding & Logo Header (Clickable for Full Screen Pop-Out) */}
        <div className="p-4 border-b border-inherit flex items-center">
          <div
            onClick={() => setShowLogoModal(true)}
            className="flex items-center gap-3 group min-w-0 cursor-pointer"
            title="Tap to pop out logo"
          >
            {/* Glowing Squircle Logo Container */}
            <div className="relative shrink-0 group-hover:scale-105 transition-transform duration-300">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-rose-500 opacity-75 blur-md group-hover:opacity-100 transition-opacity animate-pulse" />
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 p-0.5 shadow-xl flex items-center justify-center">
                <img
                  src="/logo.png"
                  alt="JIYA Logo"
                  className="w-full h-full object-cover rounded-xl"
                />
              </div>
            </div>

            <div className="min-w-0">
              <h1 className={`font-black text-xl tracking-tight leading-none ${isDark ? 'text-white' : 'text-slate-900'}`}>
                JIYA
              </h1>
              <p className="text-[11px] font-bold text-pink-500 dark:text-pink-400 flex items-center gap-1 mt-1 whitespace-nowrap leading-none">
                <span>Made with</span>
                <Heart className="w-3 h-3 fill-red-500 text-red-500 animate-pulse shrink-0 inline-block" />
                <span>for her</span>
              </p>
            </div>
          </div>
        </div>

      {/* Scrollable Navigation Sections */}
      <div className="flex-1 overflow-y-auto custom-scrollbar px-4 py-4 space-y-6">
        {/* DISCOVER & STREAM */}
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            Discover
          </div>
          <nav className="space-y-0.5">
            {discoverNav.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 font-extrabold bg-blue-50/80 dark:bg-blue-600/15 shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* MY COLLECTION */}
        <div className="space-y-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2">
            My Collection
          </div>
          <nav className="space-y-0.5">
            {myCollectionNav.map((item) => {
              const Icon = item.icon;
              const isActive = isItemActive(item.href);
              return (
                <Link
                  key={item.name}
                  href={item.href}
                  className={`flex items-center gap-3 px-3.5 py-2.5 rounded-xl font-bold text-xs transition-all duration-150 ${
                    isActive
                      ? 'text-blue-600 font-extrabold bg-blue-50/80 dark:bg-blue-600/15 shadow-sm'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <Icon className={`w-4 h-4 shrink-0 ${isActive ? 'text-blue-600' : 'text-slate-400'}`} />
                  <span>{item.name}</span>
                </Link>
              );
            })}
          </nav>
        </div>

        {/* PLAYLISTS */}
        <div className="space-y-1 pt-1">
          <div className="px-4 text-[10px] font-black uppercase tracking-wider text-slate-400 mb-2 flex items-center justify-between">
            <span>Playlists</span>
            <button
              onClick={() => setIsCreatePlaylistOpen(true)}
              className="p-1 rounded hover:bg-blue-600/20 text-slate-400 hover:text-blue-500 transition-colors"
              title="Create New Playlist"
            >
              <Plus className="w-4 h-4" />
            </button>
          </div>

          <div className="space-y-0.5 max-h-60 overflow-y-auto custom-scrollbar">
            {/* User Created Playlists */}
            {userPlaylists.map((pl) => {
              const trackCount = pl._count?.tracks ?? pl.tracks?.length ?? 0;
              return (
                <Link
                  key={pl.id}
                  href={`/playlist/${pl.id}`}
                  className={`flex items-center justify-between px-3.5 py-2 rounded-xl text-xs font-semibold group transition-colors ${
                    pathname === `/playlist/${pl.id}`
                      ? 'bg-blue-50/80 dark:bg-blue-600/15 text-blue-600 font-extrabold'
                      : isDark
                      ? 'text-slate-300 hover:text-white hover:bg-white/5'
                      : 'text-slate-600 hover:text-slate-900 hover:bg-slate-100'
                  }`}
                >
                  <div className="flex items-center gap-2.5 min-w-0">
                    <ListPlus className="w-3.5 h-3.5 text-blue-500 shrink-0" />
                    <span className="truncate">{pl.title}</span>
                  </div>
                  <span className="text-[10px] font-mono text-slate-400 opacity-0 group-hover:opacity-100 transition-opacity">
                    {trackCount} {trackCount === 1 ? 'track' : 'tracks'}
                  </span>
                </Link>
              );
            })}

            {/* Empty State when no playlists have been created yet */}
            {userPlaylists.length === 0 && (
              <div className="px-3 py-3 rounded-xl border border-dashed border-white/10 text-center text-xs text-slate-400 font-medium space-y-1 my-1">
                <p className="text-[11px] text-slate-400">No playlists created yet.</p>
                <button
                  onClick={() => setIsCreatePlaylistOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-bold text-blue-400 hover:text-blue-300 transition-colors"
                >
                  <Plus className="w-3 h-3" /> Create Playlist
                </button>
              </div>
            )}
          </div>
        </div>
      </div>

      </aside>

      {/* Full-Screen Pop-Out Logo Dedicated Modal */}
      {showLogoModal && (
        <div
          onClick={() => setShowLogoModal(false)}
          className="fixed inset-0 z-50 bg-black/85 backdrop-blur-2xl flex flex-col items-center justify-center p-6 animate-in fade-in duration-300 select-none cursor-pointer"
        >
          {/* Top Close Button */}
          <button
            onClick={() => setShowLogoModal(false)}
            className="absolute top-6 right-6 p-3 rounded-full bg-white/10 hover:bg-white/20 text-white transition-all transform hover:scale-110 active:scale-95 border border-white/10 shadow-2xl"
            title="Close"
          >
            <X className="w-6 h-6" />
          </button>

          {/* Pop-Out Card Container */}
          <div
            onClick={(e) => e.stopPropagation()}
            className="relative flex flex-col items-center text-center max-w-lg w-full cursor-default"
          >
            {/* Pulsing Ambient Backdrop Glow */}
            <div className="absolute -inset-8 rounded-[60px] bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 opacity-65 blur-3xl animate-pulse" />

            {/* Glowing Logo Card */}
            <div className="relative w-56 h-56 sm:w-64 sm:h-64 rounded-[44px] overflow-hidden border-2 border-white/30 bg-slate-950 p-2 shadow-[0_0_80px_rgba(236,72,153,0.55)] transform hover:scale-105 transition-transform duration-500 group">
              <img
                src="/logo.png"
                alt="JIYA Logo Full Screen"
                className="w-full h-full object-cover rounded-[36px] group-hover:scale-110 transition-transform duration-700"
              />
            </div>

            {/* Specially For You Text Content */}
            <div className="relative mt-8 space-y-3">
              <div className="inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-gradient-to-r from-pink-500/20 to-red-500/20 border border-pink-500/40 text-pink-300 text-xs font-black uppercase tracking-widest shadow-lg">
                <Sparkles className="w-4 h-4 text-pink-400 animate-spin-slow" /> Dedicated Experience
              </div>

              <h2 className="text-4xl sm:text-5xl font-black tracking-tight text-transparent bg-clip-text bg-gradient-to-r from-pink-300 via-rose-200 to-purple-300 drop-shadow-lg">
                Specially For You ❤️
              </h2>

              <p className="text-sm sm:text-base text-slate-300 font-semibold max-w-md mx-auto leading-relaxed drop-shadow">
                Crafted with endless love & devotion. Every melody, every song, made to fill your heart with joy.
              </p>
            </div>

            {/* Close Button */}
            <button
              onClick={() => setShowLogoModal(false)}
              className="relative mt-8 px-6 py-2.5 rounded-full bg-white/10 hover:bg-white/20 text-white font-bold text-xs border border-white/20 shadow-lg hover:scale-105 active:scale-95 transition-all"
            >
              Close Memory
            </button>
          </div>
        </div>
      )}

      {/* Create New Playlist & Add Tracks Modal */}
      <CreatePlaylistModal
        isOpen={isCreatePlaylistOpen}
        onClose={() => setIsCreatePlaylistOpen(false)}
        onPlaylistCreated={fetchPlaylists}
      />
    </>
  );
}

