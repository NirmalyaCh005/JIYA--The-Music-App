'use client';

import React, { useEffect, useState } from 'react';
import { usePathname, useRouter } from 'next/navigation';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { Loader2 } from 'lucide-react';

export function AuthGuard({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, setUser } = usePlayerStore();
  const [isCheckingAuth, setIsCheckingAuth] = useState(true);
  const [isAuthenticated, setIsAuthenticated] = useState(false);

  useEffect(() => {
    // Check authentication token and stored user
    const token = typeof window !== 'undefined' ? localStorage.getItem('jiya_auth_token') : null;
    const hasValidToken = Boolean(token && token.trim().length > 5);
    const hasValidUser = Boolean(user && (user.email || user.phone || user.name));

    const isValid = hasValidToken && hasValidUser;

    setIsAuthenticated(isValid);
    setIsCheckingAuth(false);

    if (!isValid) {
      // Clear any invalid or stale session
      if (typeof window !== 'undefined') {
        localStorage.removeItem('jiya_auth_token');
        document.cookie = 'jiya_auth_token=; path=/; expires=Thu, 01 Jan 1970 00:00:00 GMT';
      }
      if (user) {
        setUser(null);
      }
      if (pathname !== '/login') {
        router.replace('/login');
      }
    } else if (isValid && pathname === '/login') {
      router.replace('/');
    }
  }, [user, pathname, router, setUser]);

  // While checking auth status on page load, show clean loading screen
  if (isCheckingAuth) {
    return (
      <div className="h-screen w-screen bg-[#070A10] flex flex-col items-center justify-center text-white gap-3 select-none">
        <div className="relative w-12 h-12 rounded-2xl overflow-hidden border border-white/20 bg-slate-950 p-1 shadow-xl flex items-center justify-center">
          <img src="/logo.png" alt="JIYA Logo" className="w-full h-full object-cover rounded-xl" />
        </div>
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  // If unauthenticated and trying to view protected pages, block rendering
  if (!isAuthenticated && pathname !== '/login') {
    return (
      <div className="h-screen w-screen bg-[#070A10] flex flex-col items-center justify-center text-white gap-3 select-none">
        <Loader2 className="w-6 h-6 text-blue-500 animate-spin" />
      </div>
    );
  }

  return <>{children}</>;
}
