'use client';

import React, { useState, useRef, useEffect } from 'react';
import Link from 'next/link';
import { useRouter, usePathname } from 'next/navigation';
import {
  Search,
  Bell,
  Settings,
  Sun,
  Moon,
  UploadCloud,
  X,
  CheckCircle2,
  Sparkles,
  Volume2,
  ChevronLeft,
  ChevronRight,
  LogOut,
  User,
  Menu,
  Play,
  Loader2,
  Music,
} from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { useAudioPlayer } from '@/hooks/useAudioPlayer';
import { MobileDrawer } from '@/components/layout/MobileDrawer';

interface NavbarProps {
  onSearch?: (query: string) => void;
  selectedGenre?: string;
  onGenreSelect?: (genre: string) => void;
}

export function Navbar({ onSearch, selectedGenre = 'All', onGenreSelect }: NavbarProps) {
  const [searchQuery, setSearchQuery] = useState('');
  const [showNotifications, setShowNotifications] = useState(false);
  const [showSettings, setShowSettings] = useState(false);
  const [showProfileDropdown, setShowProfileDropdown] = useState(false);
  const [showMobileDrawer, setShowMobileDrawer] = useState(false);
  const [hasUnreadNotifications, setHasUnreadNotifications] = useState(true);

  // Settings State
  const [audioQuality, setAudioQuality] = useState('FLAC 96kHz 24-bit');
  const [equalizerPreset, setEqualizerPreset] = useState('Bass Boost');
  const [autoplay, setAutoplay] = useState(true);
  const [saveToast, setSaveToast] = useState(false);

  const router = useRouter();
  const pathname = usePathname();
  const { theme, toggleTheme, toggleUploadModal, user, setUser } = usePlayerStore();
  const isDark = theme === 'dark';

  const [searchResults, setSearchResults] = useState<any[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [showSearchDropdown, setShowSearchDropdown] = useState(false);
  const searchRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (searchRef.current && !searchRef.current.contains(event.target as Node)) {
        setShowSearchDropdown(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const { playTrack } = useAudioPlayer();

  const handleSearchChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const val = e.target.value;
    setSearchQuery(val);
    if (onSearch) onSearch(val);

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

  const navPills = [
    { label: 'All', genre: 'All', href: '/' },
    { label: 'Bollywood', genre: 'Bollywood', href: '/explore' },
    { label: 'Pop / Global', genre: 'Pop / Global', href: '/explore' },
    { label: 'Punjabi', genre: 'Punjabi', href: '/explore' },
    { label: 'Lofi Chill', genre: 'Lofi Chill', href: '/explore' },
    { label: 'Library', href: '/library' },
    { label: 'Liked', href: '/liked' },
  ];

  const handlePillClick = (item: { label: string; genre?: string; href: string }) => {
    if (item.genre && onGenreSelect) {
      onGenreSelect(item.genre);
    }
    if (pathname !== item.href && !(pathname === '/' && item.href === '/explore' && onGenreSelect)) {
      if (item.genre && item.href === '/explore') {
        router.push(`/explore?genre=${encodeURIComponent(item.genre)}`);
      } else {
        router.push(item.href);
      }
    }
  };

  const initialNotifications = [
    {
      id: 1,
      title: 'Welcome to Jiya Audio Engine',
      message: 'High-fidelity YouTube audio stream bridge is initialized and active.',
      time: 'Just now',
      unread: true,
    },
    {
      id: 2,
      title: 'Made with ❤️ for her',
      message: 'Tap on any song title or artwork to open Full-Screen Ambient Mode.',
      time: '2m ago',
      unread: true,
    },
    {
      id: 3,
      title: 'FLAC Audio Quality Active',
      message: 'Original lossless audio rendering engine connected.',
      time: '15m ago',
      unread: false,
    },
  ];

  const [notifications, setNotifications] = useState(initialNotifications);

  const handleMarkAllAsRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, unread: false })));
    setHasUnreadNotifications(false);
  };

  const handleSaveSettings = () => {
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 2500);
    setShowSettings(false);
  };

  const handleSignOut = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('jiya_auth_token');
      localStorage.removeItem('jiya-player-storage');
      document.cookie = 'jiya_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
    }
    setUser(null);
    setShowProfileDropdown(false);
    setShowMobileDrawer(false);
    router.replace('/login');
  };

  return (
    <header
      className={`h-16 lg:h-20 sticky top-0 z-20 w-full px-4 lg:px-10 flex items-center justify-between gap-3 select-none transition-colors duration-300 ${
        isDark
          ? 'bg-[#0B0F17]/95 backdrop-blur-xl border-b border-white/10 shadow-lg shadow-black/20'
          : 'bg-white/95 backdrop-blur-xl border-b border-slate-200/80 shadow-md shadow-slate-900/5'
      }`}
    >
      {/* Mobile Hamburger & Mobile Branding Logo */}
      <div className="flex items-center gap-2.5 lg:hidden shrink-0">
        <button
          onClick={() => setShowMobileDrawer(true)}
          className={`p-2 rounded-xl border transition-colors ${
            isDark
              ? 'bg-slate-900/90 border-white/10 text-white hover:bg-slate-800'
              : 'bg-slate-100 border-slate-200 text-slate-800 hover:bg-slate-200'
          }`}
          title="Open Navigation Menu"
        >
          <Menu className="w-5 h-5" />
        </button>

        <Link href="/" className="flex items-center gap-2">
          <div className="w-8 h-8 rounded-xl overflow-hidden border border-white/20 bg-slate-950 p-0.5 shadow-md shrink-0">
            <img src="/logo.png" alt="JIYA Logo" className="w-full h-full object-cover rounded-lg" />
          </div>
          <span className="font-black text-lg tracking-tight text-white hidden sm:inline">JIYA</span>
        </Link>
      </div>

      {/* Navigation History Controls (< Back / > Forward) & Search Input */}
      <div className="flex items-center gap-2 flex-1 max-w-sm lg:max-w-md shrink-0 min-w-0">
        <div className="hidden sm:flex items-center gap-1.5 shrink-0">
          <button
            onClick={() => router.back()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border active:scale-90 ${
              isDark
                ? 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title="Go Back"
          >
            <ChevronLeft className="w-5 h-5" />
          </button>

          <button
            onClick={() => router.forward()}
            className={`w-9 h-9 rounded-full flex items-center justify-center transition-all border active:scale-90 ${
              isDark
                ? 'bg-slate-900/90 border-white/10 text-slate-300 hover:text-white hover:bg-slate-800'
                : 'bg-white border-slate-200 text-slate-700 hover:bg-slate-100 shadow-sm'
            }`}
            title="Go Forward"
          >
            <ChevronRight className="w-5 h-5" />
          </button>
        </div>

        <div className="relative flex-1 min-w-0" ref={searchRef}>
          <Search className="w-4 h-4 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
          <input
            type="text"
            value={searchQuery}
            onChange={handleSearchChange}
            onFocus={() => searchQuery.trim() && setShowSearchDropdown(true)}
            placeholder="Search songs..."
            className={`w-full pl-9 pr-3 py-2 sm:py-2.5 rounded-full text-xs font-medium transition-all ${
              isDark
                ? 'bg-slate-900/90 border border-white/10 text-white placeholder-slate-400 focus:border-blue-500'
                : 'bg-slate-100 border border-slate-200 text-slate-800 placeholder-slate-400 focus:border-blue-500 shadow-sm'
            }`}
          />

          {/* Interactive Live Search Results Dropdown (Mobile-responsive fixed overlay / Desktop absolute dropdown) */}
          {showSearchDropdown && (
            <div
              className={`fixed left-3 right-3 top-[68px] sm:absolute sm:left-0 sm:right-auto sm:top-full sm:mt-2.5 sm:w-[420px] max-h-[75vh] sm:max-h-96 overflow-y-auto custom-scrollbar rounded-2xl border shadow-2xl p-3.5 z-[90] animate-in fade-in slide-in-from-top-2 duration-200 ${
                isDark
                  ? 'bg-[#0B0F17]/95 backdrop-blur-2xl border-white/15 text-white shadow-blue-950/40'
                  : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-900 shadow-slate-900/15'
              }`}
            >
              <div className="flex items-center justify-between px-1 pb-2.5 mb-2 border-b border-white/10">
                <div className="flex items-center gap-2">
                  <span className="relative flex h-2 w-2">
                    <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-blue-400 opacity-75"></span>
                    <span className="relative inline-flex rounded-full h-2 w-2 bg-blue-500"></span>
                  </span>
                  <span className="text-xs font-black uppercase tracking-wider text-slate-300">
                    Live Search Results
                  </span>
                  <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-blue-500/20 text-blue-400 border border-blue-500/30">
                    {searchResults.length}
                  </span>
                </div>
                <button
                  onClick={() => setShowSearchDropdown(false)}
                  className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-white/10 transition-colors"
                  title="Close Quick Search"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              {isSearching ? (
                <div className="py-8 text-center text-slate-400 flex items-center justify-center gap-2 text-xs font-bold">
                  <Loader2 className="w-4 h-4 animate-spin text-blue-500" />
                  <span>Searching music database...</span>
                </div>
              ) : searchResults.length === 0 ? (
                <div className="py-8 text-center text-slate-400 text-xs font-medium">
                  No matching tracks found for "{searchQuery}"
                </div>
              ) : (
                <div className="space-y-1">
                  {searchResults.map((track) => (
                    <div
                      key={track.id}
                      onClick={() => {
                        playTrack(track);
                        setShowSearchDropdown(false);
                      }}
                      className="p-2.5 rounded-xl hover:bg-blue-600/15 border border-transparent hover:border-blue-500/20 flex items-center justify-between gap-3 cursor-pointer transition-all group active:scale-[0.99]"
                    >
                      <div className="flex items-center gap-3 min-w-0 flex-1">
                        <div className="relative w-11 h-11 rounded-xl overflow-hidden border border-white/10 bg-slate-950 shrink-0 shadow-sm group-hover:scale-105 transition-transform duration-200">
                          <img
                            src={track.coverUrl || '/samples/covers/cyberpunk.jpg'}
                            alt={track.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0 flex-1">
                          <p className="text-xs font-bold text-slate-100 truncate group-hover:text-blue-400 transition-colors">
                            {track.title}
                          </p>
                          <p className="text-[11px] font-medium text-slate-400 truncate mt-0.5">
                            {track.artist}
                          </p>
                        </div>
                      </div>

                      <button className="w-8.5 h-8.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white flex items-center justify-center shadow-lg shadow-blue-600/30 hover:scale-110 active:scale-95 transition-all shrink-0">
                        <Play className="w-3.5 h-3.5 fill-white ml-0.5" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          )}
        </div>
      </div>

      {/* Center Section & Category Navigation Pills */}
      <div className="hidden md:flex items-center gap-1.5 overflow-x-auto py-1 custom-scrollbar max-w-2xl px-2">
        {navPills.map((pill) => {
          const isActive =
            (pill.genre && selectedGenre.toLowerCase() === pill.genre.toLowerCase() && (pathname === '/' || pathname === '/explore')) ||
            (!pill.genre && pathname === pill.href);

          return (
            <button
              key={pill.label}
              onClick={() => handlePillClick(pill)}
              className={`px-3.5 py-1.5 rounded-full text-xs font-extrabold whitespace-nowrap transition-all duration-200 ${
                isActive
                  ? 'bg-blue-600 text-white shadow-md shadow-blue-500/20 scale-105'
                  : isDark
                  ? 'bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white border border-white/5'
                  : 'bg-white hover:bg-slate-100 text-slate-600 hover:text-slate-900 border border-slate-200 shadow-sm'
              }`}
            >
              {pill.label}
            </button>
          );
        })}
      </div>

      {/* Right Action Icons & Upload Button */}
      <div className="flex items-center gap-2.5 shrink-0 relative">
        {/* Dark / Light Mode Switcher */}
        <button
          onClick={toggleTheme}
          className={`p-2.5 rounded-full transition-transform active:scale-95 border ${
            isDark
              ? 'bg-slate-800 text-yellow-400 border-white/10 hover:bg-slate-700'
              : 'bg-white text-slate-700 border-slate-200 hover:bg-slate-100 shadow-sm'
          }`}
          title={`Switch to ${isDark ? 'Light' : 'Dark'} Mode`}
        >
          {isDark ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4 text-slate-700" />}
        </button>

        {/* Notifications Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowNotifications(!showNotifications);
              setShowSettings(false);
            }}
            className={`p-2.5 rounded-full transition-colors relative ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            } ${showNotifications ? 'bg-blue-600/20 text-blue-500' : ''}`}
            title="Notifications"
          >
            <Bell className="w-4 h-4" />
            {hasUnreadNotifications && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2 animate-ping" />
            )}
            {hasUnreadNotifications && (
              <span className="w-2 h-2 rounded-full bg-red-500 absolute top-2 right-2" />
            )}
          </button>

          {/* Notifications Dropdown Panel */}
          {showNotifications && (
            <div
              className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border shadow-2xl p-5 z-50 animate-in fade-in slide-in-from-top-3 duration-200 ${
                isDark
                  ? 'bg-[#0F1623] border-white/15 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-3 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <Bell className="w-4 h-4 text-blue-500" />
                  <h3 className="font-extrabold text-sm tracking-tight">Notifications</h3>
                </div>
                {hasUnreadNotifications && (
                  <button
                    onClick={handleMarkAllAsRead}
                    className="text-[11px] font-bold text-blue-500 hover:underline"
                  >
                    Mark as read
                  </button>
                )}
              </div>

              <div className="py-2 space-y-3 max-h-72 overflow-y-auto custom-scrollbar">
                {notifications.map((n) => (
                  <div
                    key={n.id}
                    className={`p-3 rounded-2xl border transition-colors ${
                      n.unread
                        ? isDark
                          ? 'bg-blue-600/10 border-blue-500/30'
                          : 'bg-blue-50 border-blue-200'
                        : isDark
                        ? 'bg-white/5 border-white/5'
                        : 'bg-slate-50 border-slate-100'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <h4 className="text-xs font-bold">{n.title}</h4>
                      <span className="text-[10px] text-slate-400 font-mono">{n.time}</span>
                    </div>
                    <p className="text-[11px] text-slate-400 font-medium mt-1 leading-snug">
                      {n.message}
                    </p>
                  </div>
                ))}
              </div>

              <div className="pt-2 text-center border-t border-inherit">
                <button
                  onClick={() => setShowNotifications(false)}
                  className="text-xs font-bold text-slate-400 hover:text-white"
                >
                  Close Notifications
                </button>
              </div>
            </div>
          )}
        </div>

        {/* Settings Button */}
        <div className="relative">
          <button
            onClick={() => {
              setShowSettings(!showSettings);
              setShowNotifications(false);
            }}
            className={`p-2.5 rounded-full transition-colors ${
              isDark ? 'text-slate-400 hover:text-white' : 'text-slate-500 hover:text-slate-900'
            } ${showSettings ? 'bg-blue-600/20 text-blue-500' : ''}`}
            title="Settings"
          >
            <Settings className="w-4 h-4" />
          </button>

          {/* Settings Modal Popover */}
          {showSettings && (
            <div
              className={`absolute right-0 mt-3 w-80 sm:w-96 rounded-3xl border shadow-2xl p-6 z-50 animate-in fade-in slide-in-from-top-3 duration-200 ${
                isDark
                  ? 'bg-[#0F1623] border-white/15 text-white'
                  : 'bg-white border-slate-200 text-slate-900'
              }`}
            >
              <div className="flex items-center justify-between pb-4 border-b border-inherit">
                <div className="flex items-center gap-2">
                  <Settings className="w-4 h-4 text-blue-500" />
                  <h3 className="font-extrabold text-base tracking-tight">Audio & App Settings</h3>
                </div>
                <button
                  onClick={() => setShowSettings(false)}
                  className="p-1 rounded-full hover:bg-white/10 text-slate-400 hover:text-white"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>

              <div className="py-4 space-y-5">
                {/* Audio Quality Selection */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Audio Streaming Quality
                  </label>
                  <select
                    value={audioQuality}
                    onChange={(e) => setAudioQuality(e.target.value)}
                    className={`w-full p-2.5 rounded-xl text-xs font-bold border transition-colors ${
                      isDark
                        ? 'bg-slate-900 border-white/10 text-white'
                        : 'bg-slate-50 border-slate-200 text-slate-900'
                    }`}
                  >
                    <option value="FLAC 96kHz 24-bit">FLAC 96kHz 24-bit (Ultra Lossless)</option>
                    <option value="320kbps High Quality">320kbps High Quality AAC</option>
                    <option value="192kbps Standard Quality">192kbps Standard Quality MP3</option>
                  </select>
                </div>

                {/* Equalizer Presets */}
                <div className="space-y-2">
                  <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                    Equalizer Preset
                  </label>
                  <div className="grid grid-cols-2 gap-2">
                    {['Bass Boost', 'Vocal Clarity', 'Electronic', 'Flat'].map((eq) => (
                      <button
                        key={eq}
                        onClick={() => setEqualizerPreset(eq)}
                        className={`p-2 rounded-xl text-xs font-bold border transition-all ${
                          equalizerPreset === eq
                            ? 'bg-blue-600 text-white border-blue-500 shadow-md'
                            : isDark
                            ? 'bg-white/5 border-white/10 text-slate-300 hover:bg-white/10'
                            : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                        }`}
                      >
                        {eq}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Autoplay Toggle */}
                <div className="flex items-center justify-between pt-2">
                  <div>
                    <h4 className="text-xs font-bold">Autoplay Next Track</h4>
                    <p className="text-[11px] text-slate-400 font-medium">Keep playing similar tracks when queue ends</p>
                  </div>
                  <button
                    onClick={() => setAutoplay(!autoplay)}
                    className={`w-11 h-6 rounded-full p-1 transition-colors ${
                      autoplay ? 'bg-blue-600' : 'bg-slate-700'
                    }`}
                  >
                    <div
                      className={`w-4 h-4 rounded-full bg-white transition-transform ${
                        autoplay ? 'translate-x-5' : 'translate-x-0'
                      }`}
                    />
                  </button>
                </div>
              </div>

              {/* Footer Save Button */}
              <div className="pt-4 border-t border-inherit flex items-center justify-end gap-2">
                <button
                  onClick={handleSaveSettings}
                  className="w-full py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center justify-center gap-1.5"
                >
                  <CheckCircle2 className="w-4 h-4" /> Save Preferences
                </button>
              </div>
            </div>
          )}
        </div>

        {/* User Profile Avatar & Sign Out Dropdown */}
        {user ? (
          <div className="relative ml-1">
            <button
              onClick={() => {
                setShowProfileDropdown(!showProfileDropdown);
                setShowNotifications(false);
                setShowSettings(false);
              }}
              className={`flex items-center gap-2 p-1.5 pr-3 rounded-full border transition-all ${
                isDark
                  ? 'bg-slate-900 border-white/10 hover:border-white/20 text-white'
                  : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900 shadow-sm'
              }`}
              title="User Account Menu"
            >
              <div className="w-7 h-7 rounded-full overflow-hidden border border-blue-500/40 bg-blue-600 flex items-center justify-center text-white text-xs font-black shrink-0">
                {user.avatarUrl ? (
                  <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                ) : (
                  user.name.charAt(0).toUpperCase()
                )}
              </div>
              <span className="text-xs font-bold truncate max-w-[100px] hidden sm:inline">
                {user.name}
              </span>
            </button>

            {/* Profile Dropdown */}
            {showProfileDropdown && (
              <div
                className={`absolute right-0 mt-3 w-64 rounded-3xl border shadow-2xl p-4 z-50 animate-in fade-in slide-in-from-top-3 duration-200 ${
                  isDark
                    ? 'bg-[#0F1623] border-white/15 text-white'
                    : 'bg-white border-slate-200 text-slate-900'
                }`}
              >
                <div className="flex items-center gap-3 pb-3 border-b border-inherit">
                  <div className="w-10 h-10 rounded-full overflow-hidden border border-blue-500/40 bg-blue-600 flex items-center justify-center text-white text-sm font-black shrink-0">
                    {user.avatarUrl ? (
                      <img src={user.avatarUrl} alt={user.name} className="w-full h-full object-cover" />
                    ) : (
                      user.name.charAt(0).toUpperCase()
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-xs font-extrabold truncate">{user.name}</h4>
                    <p className="text-[10px] text-slate-400 truncate">{user.email || user.phone}</p>
                    <span className="inline-block mt-1 text-[9px] font-black uppercase tracking-wider px-2 py-0.5 rounded-full bg-blue-600/20 text-blue-400 border border-blue-500/30">
                      PRO Streamer
                    </span>
                  </div>
                </div>

                <div className="pt-3">
                  <button
                    onClick={handleSignOut}
                    className="w-full py-2.5 px-3 rounded-2xl bg-red-500/10 hover:bg-red-500/20 text-red-400 font-extrabold text-xs transition-colors flex items-center justify-center gap-2 border border-red-500/20"
                  >
                    <LogOut className="w-4 h-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </div>
            )}
          </div>
        ) : (
          <Link
            href="/login"
            className="ml-1 px-4 py-2 rounded-full whitespace-nowrap bg-blue-600 hover:bg-blue-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 transition-all flex items-center gap-1.5"
          >
            <User className="w-4 h-4" />
            <span>Sign In</span>
          </Link>
        )}

        {/* Upload Music Button */}
        <button
          onClick={() => toggleUploadModal(true)}
          className="ml-1 px-4 py-2 rounded-full whitespace-nowrap bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 text-white font-extrabold text-xs shadow-lg shadow-blue-500/20 border border-blue-400/30 hover:scale-105 active:scale-95 transition-all duration-200 flex items-center gap-2"
        >
          <UploadCloud className="w-4 h-4 text-white shrink-0" />
          <span className="hidden sm:inline">Upload Music</span>
        </button>

        {/* Save Confirmation Toast */}
        {saveToast && (
          <div className="fixed bottom-6 right-6 z-50 bg-emerald-600 text-white px-5 py-3 rounded-2xl shadow-2xl flex items-center gap-2.5 font-bold text-xs animate-in fade-in slide-in-from-bottom-5">
            <CheckCircle2 className="w-4 h-4" /> Settings Preferences Saved Successfully!
          </div>
        )}
      </div>

      {/* Mobile Slide-Over Navigation Drawer Overlay */}
      <MobileDrawer
        isOpen={showMobileDrawer}
        onClose={() => setShowMobileDrawer(false)}
        onOpenUpload={() => toggleUploadModal(true)}
      />
    </header>
  );
}

