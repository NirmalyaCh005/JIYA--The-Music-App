'use client';

import React, { useEffect, useState } from 'react';
import { createPortal } from 'react-dom';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import {
  X,
  Home,
  Compass,
  TrendingUp,
  Folder,
  Heart,
  UploadCloud,
  LogOut,
  Globe,
  ExternalLink,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

interface MobileDrawerProps {
  isOpen: boolean;
  onClose: () => void;
  onOpenUpload: () => void;
}

export function MobileDrawer({ isOpen, onClose, onOpenUpload }: MobileDrawerProps) {
  const router = useRouter();
  const { user, setUser } = usePlayerStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    setMounted(true);
  }, []);

  if (!isOpen || !mounted) return null;

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jiya_auth_token');
      localStorage.removeItem('jiya-player-storage');
      document.cookie = 'jiya_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setUser(null);
    onClose();
    router.replace('/login');
  };

  const navLinks = [
    { label: 'Home Dashboard', href: '/', icon: Home },
    { label: 'Browse & Genres', href: '/explore', icon: Compass },
    { label: 'Top Charts', href: '/charts', icon: TrendingUp },
    { label: 'Your Music Library', href: '/library', icon: Folder },
    { label: 'Liked Songs', href: '/liked', icon: Heart },
  ];

  const drawerContent = (
    <div className="fixed inset-0 z-[99999] lg:hidden flex select-none">
      {/* Solid Dark Semi-Black Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-black/90 backdrop-blur-2xl animate-in fade-in duration-200"
      />

      {/* 100% Opaque Solid Dark Drawer Panel */}
      <div className="relative w-80 max-w-[85vw] h-screen bg-[#070A10] border-r border-white/15 text-white flex flex-col p-6 z-10 shadow-[0_0_80px_rgba(0,0,0,1)] animate-in slide-in-from-left duration-300">
        {/* Drawer Header Branding */}
        <div className="flex items-center justify-between pb-5 border-b border-white/15 shrink-0">
          <div className="flex items-center gap-3">
            <div className="relative shrink-0">
              <div className="absolute -inset-1 rounded-2xl bg-gradient-to-r from-red-500 via-pink-500 to-purple-600 opacity-80 blur-sm" />
              <div className="relative w-11 h-11 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 p-0.5 shadow-xl flex items-center justify-center">
                <img src="/logo.png" alt="JIYA Logo" className="w-full h-full object-cover rounded-xl" />
              </div>
            </div>
            <div className="min-w-0">
              <h2 className="font-black text-2xl tracking-tight leading-none text-white">JIYA</h2>
              <p className="text-xs font-bold text-pink-400 flex items-center gap-1 mt-1.5 leading-none whitespace-nowrap">
                Made with <Heart className="w-3.5 h-3.5 fill-red-500 text-red-500 shrink-0 inline-block animate-pulse" /> for her
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full bg-white/10 hover:bg-white/20 text-white transition-colors active:scale-90 shrink-0"
            title="Close Menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Navigation Items List */}
        <nav className="flex-1 py-6 space-y-2 overflow-y-auto custom-scrollbar">
          {navLinks.map((item) => {
            const Icon = item.icon;
            return (
              <Link
                key={item.label}
                href={item.href}
                onClick={onClose}
                className="flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-extrabold text-xs text-slate-200 hover:text-white hover:bg-white/10 bg-white/5 border border-white/5 transition-all duration-200 active:scale-95"
              >
                <Icon className="w-4.5 h-4.5 text-blue-400 shrink-0" />
                <span className="truncate">{item.label}</span>
              </Link>
            );
          })}

          <button
            onClick={() => {
              onClose();
              onOpenUpload();
            }}
            className="w-full mt-4 flex items-center gap-3.5 px-4 py-3.5 rounded-2xl font-extrabold text-xs bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white shadow-xl shadow-blue-600/30 hover:scale-[1.02] active:scale-95 transition-all border border-blue-400/30"
          >
            <UploadCloud className="w-4.5 h-4.5 text-white shrink-0" />
            <span>Upload Custom Songs</span>
          </button>

          <a
            href="https://jiya-kappa.vercel.app/"
            target="_blank"
            rel="noopener noreferrer"
            onClick={onClose}
            className="w-full mt-2.5 flex items-center justify-between px-4 py-3 rounded-2xl font-extrabold text-xs bg-blue-600/20 hover:bg-blue-600/30 text-blue-300 border border-blue-500/30 transition-all group active:scale-95"
          >
            <span className="flex items-center gap-3">
              <Globe className="w-4 h-4 text-blue-400 group-hover:rotate-12 transition-transform" />
              <span>Live App Deployment</span>
            </span>
            <ExternalLink className="w-3.5 h-3.5 opacity-70 group-hover:opacity-100" />
          </a>
        </nav>

        {/* User Account & Sign Out Section */}
        {user ? (
          <div className="pt-4 border-t border-white/15 shrink-0 space-y-3">
            <div className="p-3.5 rounded-2xl bg-slate-950 border border-white/15 flex items-center justify-between gap-3 shadow-2xl">
              <div className="flex items-center gap-3 min-w-0">
                <div className="w-10 h-10 rounded-full border border-blue-500/40 bg-gradient-to-br from-blue-600 to-indigo-600 flex items-center justify-center text-white text-sm font-black shrink-0 shadow-md">
                  {user.avatarUrl ? (
                    <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover rounded-full" />
                  ) : (
                    user.name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <p className="text-xs font-black text-white truncate leading-tight">{user.name}</p>
                  <p className="text-[11px] text-slate-400 truncate leading-tight mt-0.5">{user.email || user.phone}</p>
                </div>
              </div>
            </div>

            <button
              onClick={handleSignOut}
              className="w-full py-3.5 rounded-2xl bg-red-500/20 hover:bg-red-500/30 border border-red-500/40 text-red-300 font-extrabold text-xs transition-all flex items-center justify-center gap-2 active:scale-95 shadow-lg"
            >
              <LogOut className="w-4 h-4" />
              <span>Sign Out of Account</span>
            </button>
          </div>
        ) : (
          <div className="pt-4 border-t border-white/15 shrink-0">
            <Link
              href="/login"
              onClick={onClose}
              className="w-full py-3.5 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/30 flex items-center justify-center gap-2"
            >
              <span>Sign In / Register</span>
            </Link>
          </div>
        )}
      </div>
    </div>
  );

  return createPortal(drawerContent, document.body);
}
