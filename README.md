# 🎵 JIYA - High-Fidelity Music Streaming Platform

> **Designed & Developed with ❤️ by Nirmalya Chowdhury**

[![Live App](https://img.shields.io/badge/Live%20Demo-https%3A%2F%2Fjiya--kappa.vercel.app%2F-blue?style=for-the-badge&logo=vercel)](https://jiya-kappa.vercel.app/)
[![GitHub Repo](https://img.shields.io/badge/GitHub-NirmalyaCh005%2FJIYA--The--Music--App-purple?style=for-the-badge&logo=github)](https://github.com/NirmalyaCh005/JIYA--The-Music-App)

JIYA is a modern, state-of-the-art music streaming web & mobile application built with Next.js 14, React 18, Tailwind CSS, TypeScript, Prisma SQLite, and the YouTube IFrame Audio Engine.

---

## 🌐 Live Production Link

🔗 **Global Live Deployment**: [https://jiya-kappa.vercel.app/](https://jiya-kappa.vercel.app/)  
📁 **GitHub Repository**: [https://github.com/NirmalyaCh005/JIYA--The-Music-App](https://github.com/NirmalyaCh005/JIYA--The-Music-App)

---

## ✨ Full Feature Overview

- **🎧 Universal Audio Streaming Engine**: Instant playback powered by YouTube IFrame API & Client-Side Search Resolution. Play **any song in the world** directly inside the app!
- **🔎 Interactive Live Search Dropdown**: Real-time Spotify, YouTube Music, and iTunes search dropdown popover with 1-click audio playback.
- **📱 Native Mobile App UI**:
  - Floating mini-player capsule card (`bottom-[72px]`).
  - Bottom navigation bar with 5 quick-access tabs (`Home 🏠`, `Explore 🧭`, `Charts 📈`, `Library 📚`, `Liked ❤️`).
  - React Portal full-screen mobile menu drawer (`100% opaque`).
- **🔐 Mandatory Security & Auth**: Multi-channel authentication supporting SMS OTP, Email OTP, and Google Cloud Sign-In with strict session reload protection on `/login`.
- **💾 Prisma SQLite Database Persistence**: Store user accounts, custom playlists, track uploads, and liked songs in `dev.db`.
- **📈 2026 YouTube Music Top Charts Hub**: Live 2026 charts categorizing Global Top 50, India Trending, Punjabi Hits, and Lofi Chill soundscapes.
- **🌌 Ambient Visualizer Mode**: Full-screen dynamic audio reactive modal.
- **❤️ Real-time Liked Songs Sync**: 1-tap heart icon sync across all tracks, updated instantly in Liked Songs.
- **☁️ Custom Song Uploads**: Drag-and-drop file uploader supporting MP3, WAV, and AAC formats.
- **⚖️ Minimalist Footer**: Clean developer credit (`Made with ❤️ by Nirmalya Chowdhury`) & copyright notice.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **State Management**: Zustand with `persist` local storage
- **Database & ORM**: Prisma with SQLite (`dev.db`)
- **Player API**: YouTube IFrame Player API
- **External Metadata APIs**: Spotify Web API & iTunes Search API

---

## 🚀 Environment Variables Setup

When deploying to Vercel or running locally, set the following environment variables:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="jiya_super_secret_jwt_key_2026_production"
YOUTUBE_API_KEY="YOUR_YOUTUBE_DATA_API_V3_KEY"
SPOTIFY_CLIENT_ID="YOUR_SPOTIFY_CLIENT_ID"
SPOTIFY_CLIENT_SECRET="YOUR_SPOTIFY_CLIENT_SECRET"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
```

---

## 💻 Local Development Setup

```bash
# 1. Clone the repository
git clone https://github.com/NirmalyaCh005/JIYA--The-Music-App.git
cd JIYA--The-Music-App

# 2. Install dependencies
npm install

# 3. Setup SQLite Database
npx prisma db push

# 4. Start Development Server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Architecture

```text
├── app/
│   ├── api/             # Next.js API Routes (Auth OTP, Search, Resolve Track, Playlists, Tracks)
│   ├── charts/          # 2026 Top Charts Page
│   ├── explore/         # Genre Explorer Page
│   ├── liked/           # Liked Songs Page
│   ├── library/         # Music Library & Playlists Page
│   ├── login/           # Responsive Authentication Page
│   └── page.tsx         # Home Dashboard
├── components/
│   ├── layout/          # Navbar, Sidebar, MobileNav, MobileDrawer, Footer, AuthGuard
│   ├── player/          # PersistentPlayerBar, YouTubeBridge, AmbientVisualizerModal
│   └── tracks/          # TrackTable, TrackRow
├── lib/
│   ├── auth/            # In-Memory & Global OTP Store
│   ├── constants/       # Featured 2026 Track Datasets
│   ├── store/           # Zustand Audio Player Store
│   └── utils/           # Time & Format Utilities
├── prisma/
│   └── schema.prisma    # Database Schema (User, Track, Playlist, LikedTrack)
└── public/
    └── uploads/         # Local Music Upload Storage
```

---

## 📜 License & Credit

Designed & Developed with ❤️ by **Nirmalya Chowdhury**.  
All rights reserved © 2026 **JIYA Music Engine**.
