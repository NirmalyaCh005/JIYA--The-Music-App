'use client';

import React, { Suspense } from 'react';
import { usePathname } from 'next/navigation';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightQueueDrawer } from '@/components/layout/RightQueueDrawer';
import { PersistentPlayerBar } from '@/components/player/PersistentPlayerBar';
import { AmbientVisualizerModal } from '@/components/player/AmbientVisualizerModal';
import { UploadModal } from '@/components/upload/UploadModal';
import { YouTubeBridge } from '@/components/player/YouTubeBridge';
import { MobileNav } from '@/components/layout/MobileNav';
import { Footer } from '@/components/layout/Footer';

export function AppShell({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const isLoginPage = pathname === '/login';

  if (isLoginPage) {
    return <div className="h-screen w-screen overflow-y-auto">{children}</div>;
  }

  return (
    <>
      {/* Aesthetic Blurred Background Image Layer */}
      <div className="fixed inset-0 pointer-events-none z-0 overflow-hidden select-none">
        <div
          className="absolute -inset-10 bg-cover bg-center bg-no-repeat blur-[45px] scale-110 opacity-45 dark:opacity-40 transition-all duration-700 brightness-95 contrast-105"
          style={{ backgroundImage: `url('/bg-hero.jpg')` }}
        />
        {/* Soft Ambient Dark Overlay for High-End Glassmorphism & Text Clarity */}
        <div className="absolute inset-0 bg-slate-950/60 dark:bg-[#0B0F17]/75 backdrop-blur-md" />
      </div>

      <div className="flex-1 flex min-h-0 relative z-10 overflow-hidden">
        {/* Persistent Left Sidebar */}
        <Suspense fallback={<div className="w-64 shrink-0 h-full border-r border-slate-200 dark:border-white/10" />}>
          <Sidebar />
        </Suspense>

        {/* Center Main Content Canvas */}
        <div className="flex-1 flex flex-col min-w-0 overflow-y-auto custom-scrollbar pb-36 lg:pb-10">
          {children}
          <Footer />
        </div>

        {/* Collapsible Right Queue Drawer */}
        <RightQueueDrawer />
      </div>

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav />

      {/* Global Persistent Bottom Player Bar / Footer */}
      <PersistentPlayerBar />

      {/* Global Drag & Drop Upload Modal */}
      <UploadModal />

      {/* Full Screen Ambient Visualizer Mode Modal */}
      <AmbientVisualizerModal />

      {/* YouTube IFrame Player API Bridge Container */}
      <YouTubeBridge />
    </>
  );
}
