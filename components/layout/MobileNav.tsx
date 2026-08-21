'use client';

import React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Home, Compass, TrendingUp, Folder, Heart } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export function MobileNav() {
  const pathname = usePathname();
  const { theme } = usePlayerStore();
  const isDark = theme === 'dark';

  // Do not render bottom nav on login screen
  if (pathname === '/login') return null;

  const navItems = [
    { label: 'Home', href: '/', icon: Home },
    { label: 'Explore', href: '/explore', icon: Compass },
    { label: 'Charts', href: '/charts', icon: TrendingUp },
    { label: 'Library', href: '/library', icon: Folder },
    { label: 'Liked', href: '/liked', icon: Heart },
  ];

  return (
    <nav
      className={`lg:hidden fixed bottom-0 left-0 right-0 z-50 h-16 border-t px-2 flex items-center justify-around select-none transition-colors duration-300 ${
        isDark
          ? 'bg-[#090D14]/95 backdrop-blur-2xl border-white/10 text-slate-400'
          : 'bg-white/95 backdrop-blur-2xl border-slate-200 text-slate-500 shadow-2xl'
      }`}
    >
      {navItems.map((item) => {
        const Icon = item.icon;
        const isActive = pathname === item.href || (item.href !== '/' && pathname.startsWith(item.href));

        return (
          <Link
            key={item.label}
            href={item.href}
            className={`flex flex-col items-center justify-center gap-0.5 px-3 py-1 rounded-xl transition-all duration-200 ${
              isActive
                ? 'text-blue-500 font-extrabold scale-105'
                : isDark
                ? 'hover:text-white'
                : 'hover:text-slate-900'
            }`}
          >
            <Icon className={`w-5 h-5 ${isActive ? 'text-blue-500 stroke-[2.5px]' : 'stroke-2'}`} />
            <span className="text-[10px] font-bold tracking-tight">{item.label}</span>
          </Link>
        );
      })}
    </nav>
  );
}
