# 🎵 JIYA - High-Fidelity Music Streaming Engine

> **Made with ❤️ by Nirmalya Chowdhury**

JIYA is a modern, high-performance web & mobile music streaming platform powered by Next.js 14, React 18, Tailwind CSS, TypeScript, Prisma SQLite, and the YouTube IFrame Audio Engine.

---

## ✨ Features

- **🎧 Lossless Audio Streaming Engine**: Instant playback powered by YouTube Audio Engine.
- **📱 Fully Responsive Mobile App UI**: Floating persistent player bar, bottom navigation bar with 5 quick-access tabs, and React Portal mobile menu drawer.
- **🔐 Secure Authentication**: Multi-channel login supporting SMS OTP verification, Email OTP, and Google Cloud Sign-In.
- **💾 Database State Persistence**: Built-in Prisma SQLite database storing user profiles, custom playlists, track uploads, and liked songs.
- **📈 2026 YouTube Music Top Charts**: Live 2026 charts categorizing Global Top 50, India Trending, Punjabi Hits, and Lofi Chill soundscapes.
- **🌌 Ambient Visualizer Mode**: Immersive full-screen visualizer modal with dynamic audio reactive background.
- **❤️ Real-time Liked Songs**: 1-tap heart icon sync across all tracks, updated instantly in Liked Songs collection.
- **☁️ Custom Song Uploads**: Drag-and-drop file uploader supporting MP3, WAV, and AAC formats.

---

## 🛠️ Tech Stack

- **Framework**: Next.js 14 (App Router)
- **Language**: TypeScript
- **Styling**: Tailwind CSS & Lucide Icons
- **State Management**: Zustand with `persist` local storage
- **Database**: Prisma ORM with SQLite (`dev.db`)
- **Player API**: YouTube IFrame Player API

---

## 🚀 Getting Started

### 1. Prerequisites
- Node.js 18+ 
- npm or pnpm

### 2. Installation

Clone the repository and install dependencies:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/jiya-music-app.git
cd jiya-music-app
npm install
```

### 3. Setup Environment Variables

Create a `.env` file in the root directory:

```env
DATABASE_URL="file:./dev.db"
JWT_SECRET="jiya_super_secret_jwt_key_2026"
NEXT_PUBLIC_GOOGLE_CLIENT_ID="YOUR_GOOGLE_CLIENT_ID.apps.googleusercontent.com"
```

### 4. Initialize Database

Run Prisma migrations/db push to create the SQLite database:

```bash
npx prisma db push
```

### 5. Start Development Server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## 📂 Project Structure

```text
├── app/
│   ├── api/             # Next.js API Routes (Auth OTP, Playlists, Tracks)
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
│   ├── auth/            # In-Memory/Global OTP Store & Token utils
│   ├── constants/       # Featured 2026 Track Datasets
│   ├── store/           # Zustand Audio Player Store
│   └── utils/           # Time & Helper Utilities
├── prisma/
│   └── schema.prisma    # Database Models (User, Track, Playlist, LikedTrack)
└── public/
    └── uploads/         # Local Music Upload Storage
```

---

## 📜 License

Created with ❤️ by **Nirmalya Chowdhury**. All rights reserved © 2026.
