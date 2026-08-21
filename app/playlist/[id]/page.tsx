'use client';

import React, { useEffect, useState } from 'react';
import { useParams } from 'next/navigation';
import { Navbar } from '@/components/layout/Navbar';
import { TrackTable } from '@/components/tracks/TrackTable';
import { Playlist, Track } from '@/types/music';
import { Music, Play, Sparkles, Trash2 } from 'lucide-react';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

export default function PlaylistDetailsPage() {
  const params = useParams();
  const playlistId = params.id as string;

  const [playlist, setPlaylist] = useState<Playlist | null>(null);
  const [loading, setLoading] = useState(true);
  const { setQueue, theme } = usePlayerStore();
  const isDark = theme === 'dark';

  const fetchPlaylistDetails = async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/playlists/${playlistId}`);
      if (res.ok) {
        const data = await res.json();
        setPlaylist(data);
      }
    } catch (err) {
      console.error('Error loading playlist details:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (playlistId) {
      fetchPlaylistDetails();
    }
  }, [playlistId]);

  const playlistTracks: Track[] =
    playlist?.tracks?.map((pt) => pt.track).filter(Boolean) || [];

  const handlePlayAll = () => {
    if (playlistTracks.length > 0) {
      setQueue(playlistTracks, 0);
    }
  };

  const handleDeletePlaylist = async () => {
    if (!confirm('Are you sure you want to delete this playlist?')) return;
    try {
      const res = await fetch(`/api/playlists/${playlistId}`, { method: 'DELETE' });
      if (res.ok) {
        window.location.href = '/library';
      }
    } catch (err) {
      console.error('Failed to delete playlist:', err);
    }
  };

  return (
    <main className="flex-1 flex flex-col">
      <Navbar />

      <div className="py-8 px-6 lg:px-10 w-full max-w-[1700px] mx-auto space-y-8">
        {playlist ? (
          <>
            {/* Playlist Header Banner */}
            <div className="p-8 rounded-3xl bg-gradient-to-r from-slate-900 via-slate-900/90 to-slate-950 border border-white/10 flex flex-col sm:flex-row items-center gap-6 shadow-2xl">
              <div className="w-36 h-36 rounded-2xl overflow-hidden border border-white/10 shadow-lg flex-shrink-0">
                <img
                  src={playlist.coverUrl || '/samples/covers/lofi.jpg'}
                  alt={playlist.title}
                  className="w-full h-full object-cover"
                />
              </div>

              <div className="space-y-2 text-center sm:text-left flex-1">
                <span className="text-xs font-bold text-brand-primary uppercase tracking-widest">
                  Playlist
                </span>
                <h1 className="text-3xl sm:text-4xl font-extrabold text-white">
                  {playlist.title}
                </h1>
                <p className="text-xs sm:text-sm text-slate-400 max-w-lg">
                  {playlist.description || 'Custom user created playlist.'} • {playlistTracks.length} tracks
                </p>

                <div className="flex items-center gap-3 pt-2 justify-center sm:justify-start">
                  {playlistTracks.length > 0 && (
                    <button
                      onClick={handlePlayAll}
                      className="inline-flex items-center gap-2.5 px-6 py-2.5 rounded-full bg-brand-primary text-slate-950 font-bold text-sm shadow-neon hover:scale-105 transition-transform"
                    >
                      <Play className="w-4 h-4 fill-slate-950" />
                      Play Playlist
                    </button>
                  )}

                  <button
                    onClick={handleDeletePlaylist}
                    className="p-2.5 rounded-full bg-white/5 hover:bg-red-500/20 text-slate-400 hover:text-red-400 border border-white/10 transition-colors"
                    title="Delete Playlist"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            </div>

            {/* Playlist Tracks Table */}
            <section
              className={`p-6 rounded-[32px] border transition-colors ${
                isDark
                  ? 'bg-[#151D2A] border-white/10 shadow-2xl'
                  : 'bg-white border-slate-200/80 shadow-[0_15px_35px_rgba(0,0,0,0.04)]'
              }`}
            >
              <TrackTable tracks={playlistTracks} onTrackDeleted={fetchPlaylistDetails} />
            </section>
          </>
        ) : loading ? (
          <div className="py-24 text-center text-slate-500 flex items-center justify-center gap-2">
            <Sparkles className="w-5 h-5 animate-spin text-brand-primary" />
            <span>Loading playlist...</span>
          </div>
        ) : (
          <div className="py-24 text-center text-slate-500">
            <Music className="w-10 h-10 mx-auto mb-2 text-slate-600" />
            <p>Playlist not found.</p>
          </div>
        )}
      </div>
    </main>
  );
}
