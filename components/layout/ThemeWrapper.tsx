'use client';

import React, { useEffect } from 'react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export function ThemeWrapper({ children }: { children: React.ReactNode }) {
  const { theme } = usePlayerStore();

  useEffect(() => {
    const root = document.documentElement;
    if (theme === 'dark') {
      root.classList.add('dark');
      root.classList.remove('light');
    } else {
      root.classList.add('light');
      root.classList.remove('dark');
    }
  }, [theme]);

  return <>{children}</>;
}
