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
      <div className="flex-1 flex min-h-0 relative overflow-hidden">
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
