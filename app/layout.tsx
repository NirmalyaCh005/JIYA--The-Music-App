import type { Metadata } from 'next';
import { Nunito } from 'next/font/google';
import './globals.css';
import { Sidebar } from '@/components/layout/Sidebar';
import { RightQueueDrawer } from '@/components/layout/RightQueueDrawer';
import { PersistentPlayerBar } from '@/components/player/PersistentPlayerBar';
import { AmbientVisualizerModal } from '@/components/player/AmbientVisualizerModal';
import { UploadModal } from '@/components/upload/UploadModal';
import { YouTubeBridge } from '@/components/player/YouTubeBridge';
import { ThemeWrapper } from '@/components/layout/ThemeWrapper';
import { AuthGuard } from '@/components/layout/AuthGuard';

const nunito = Nunito({ subsets: ['latin'], variable: '--font-nunito' });

export const metadata: Metadata = {
  title: 'Jiya - High Fidelity Music Streaming & Storage',
  description:
    'Jiya is a full-stack, production-ready music streaming and storage platform built with Next.js 14, Tailwind CSS, Zustand, and YouTube IFrame Audio Engine.',
  icons: {
    icon: '/logo.png',
  },
};

import React, { Suspense } from 'react';
import { AppShell } from '@/components/layout/AppShell';

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className="light">
      <body className={`${nunito.variable} font-sans h-screen w-screen overflow-hidden flex flex-col antialiased`}>
        <ThemeWrapper>
          <AuthGuard>
            <AppShell>{children}</AppShell>
          </AuthGuard>
        </ThemeWrapper>
      </body>
    </html>
  );
}
