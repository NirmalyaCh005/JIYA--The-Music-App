'use client';

import React, { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  X,
  Plus,
  Music2,
  Check,
  Search,
  Sparkles,
  ListPlus,
  FolderPlus,
  Image as ImageIcon,
} from 'lucide-react';
import { Track } from '@/types/music';
import { usePlayerStore } from '@/lib/store/usePlayerStore';

interface CreatePlaylistModalProps {
  isOpen: boolean;
  onClose: () => void;
  onPlaylistCreated?: () => void;
}

const PRESET_COVERS = [
  '/samples/covers/lofi.jpg',
  '/samples/covers/cyberpunk.jpg',
  '/samples/covers/bollywood.jpg',
];

export function CreatePlaylistModal({ isOpen, onClose, onPlaylistCreated }: CreatePlaylistModalProps) {
  const router = useRouter();
  const { theme } = usePlayerStore();
  const isDark = theme === 'dark';

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [selectedCover, setSelectedCover] = useState(PRESET_COVERS[0]);
  
  const [allTracks, setAllTracks] = useState<Track[]>([]);
  const [selectedTrackIds, setSelectedTrackIds] = useState<Set<string>>(new Set());
  const [trackSearch, setTrackSearch] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Fetch available tracks when modal opens
  useEffect(() => {
    if (isOpen) {
      fetch('/api/tracks')
        .then((res) => res.json())
        .then((data) => {
          if (Array.isArray(data)) {
            setAllTracks(data);
          }
        })
        .catch((err) => console.error('Failed to load tracks:', err));
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const toggleTrackSelect = (id: string) => {
    const next = new Set(selectedTrackIds);
    if (next.has(id)) {
      next.delete(id);
    } else {
      next.add(id);
    }
    setSelectedTrackIds(next);
  };

  const filteredTracks = allTracks.filter(
    (t) =>
      t.title.toLowerCase().includes(trackSearch.toLowerCase()) ||
      t.artist.toLowerCase().includes(trackSearch.toLowerCase())
  );

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!title.trim()) return;

    setIsSubmitting(true);
    try {
      // 1. Create Playlist
      const res = await fetch('/api/playlists', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          title: title.trim(),
          description: description.trim(),
          coverUrl: selectedCover,
        }),
      });

      if (!res.ok) throw new Error('Failed to create playlist');
      const playlist = await res.json();

      // 2. Add selected tracks to playlist
      if (selectedTrackIds.size > 0) {
        const trackPromises = Array.from(selectedTrackIds).map((trackId) =>
          fetch(`/api/playlists/${playlist.id}/tracks`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ trackId }),
          })
        );
        await Promise.all(trackPromises);
      }

      if (onPlaylistCreated) {
        onPlaylistCreated();
      }

      // Reset form
      setTitle('');
      setDescription('');
      setSelectedTrackIds(new Set());
      onClose();

      // Navigate to newly created playlist page
      router.push(`/playlist/${playlist.id}`);
    } catch (err) {
      console.error('Error creating playlist:', err);
      alert('Failed to create playlist. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      onClick={onClose}
      className="fixed inset-0 z-50 bg-black/80 backdrop-blur-xl flex items-center justify-center p-4 select-none animate-in fade-in duration-200"
    >
      <div
        onClick={(e) => e.stopPropagation()}
        className={`w-full max-w-2xl rounded-3xl border shadow-2xl overflow-hidden flex flex-col max-h-[90vh] animate-in zoom-in-95 duration-200 ${
          isDark
            ? 'bg-[#0F1623] border-white/15 text-white'
            : 'bg-white border-slate-200 text-slate-900'
        }`}
      >
        {/* Modal Header */}
        <div className="p-6 border-b border-inherit flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-blue-600/20 border border-blue-500/30 flex items-center justify-center text-blue-500 shadow-md">
              <FolderPlus className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-lg font-black tracking-tight">Create New Playlist</h2>
              <p className="text-xs text-slate-400 font-medium">
                Organize your favorite songs & custom audio mixes
              </p>
            </div>
          </div>

          <button
            onClick={onClose}
            className="p-2 rounded-full hover:bg-white/10 text-slate-400 hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Modal Body */}
        <form onSubmit={handleSubmit} className="p-6 space-y-6 overflow-y-auto custom-scrollbar flex-1">
          {/* Step 1: Title & Description */}
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-6">
            {/* Cover Image Selector */}
            <div className="space-y-2">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <ImageIcon className="w-3.5 h-3.5" /> Cover Art
              </label>
              <div className="w-full aspect-square rounded-2xl overflow-hidden border border-white/20 relative group bg-slate-950 shadow-lg">
                <img src={selectedCover} alt="Cover Preview" className="w-full h-full object-cover" />
              </div>
              <div className="flex items-center justify-between gap-2 pt-1">
                {PRESET_COVERS.map((cov, i) => (
                  <button
                    key={cov}
                    type="button"
                    onClick={() => setSelectedCover(cov)}
                    className={`w-10 h-10 rounded-xl overflow-hidden border-2 transition-transform hover:scale-105 ${
                      selectedCover === cov ? 'border-blue-500 ring-2 ring-blue-500/40' : 'border-transparent'
                    }`}
                  >
                    <img src={cov} alt={`Preset ${i}`} className="w-full h-full object-cover" />
                  </button>
                ))}
              </div>
            </div>

            {/* Inputs */}
            <div className="sm:col-span-2 space-y-4">
              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Playlist Title <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  required
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  placeholder="e.g. Late Night Vibe, Romantic Classics..."
                  className={`w-full px-4 py-3 rounded-2xl text-xs font-bold border transition-all ${
                    isDark
                      ? 'bg-slate-900/90 border-white/10 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
              </div>

              <div className="space-y-1.5">
                <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider">
                  Description (Optional)
                </label>
                <textarea
                  rows={3}
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  placeholder="Give your playlist a story or vibe description..."
                  className={`w-full px-4 py-2.5 rounded-2xl text-xs font-medium border transition-all resize-none ${
                    isDark
                      ? 'bg-slate-900/90 border-white/10 text-white placeholder-slate-500 focus:border-blue-500'
                      : 'bg-slate-50 border-slate-200 text-slate-900 placeholder-slate-400 focus:border-blue-500'
                  }`}
                />
              </div>
            </div>
          </div>

          {/* Step 2: Add Tracks to Playlist */}
          <div className="space-y-3 pt-2">
            <div className="flex items-center justify-between">
              <label className="text-xs font-extrabold uppercase text-slate-400 tracking-wider flex items-center gap-1.5">
                <ListPlus className="w-3.5 h-3.5 text-blue-500" /> Add Initial Tracks ({selectedTrackIds.size} Selected)
              </label>
              {selectedTrackIds.size > 0 && (
                <button
                  type="button"
                  onClick={() => setSelectedTrackIds(new Set())}
                  className="text-[11px] font-bold text-red-400 hover:underline"
                >
                  Clear Selection
                </button>
              )}
            </div>

            {/* Track Search */}
            <div className="relative">
              <Search className="w-3.5 h-3.5 absolute left-3.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                value={trackSearch}
                onChange={(e) => setTrackSearch(e.target.value)}
                placeholder="Search tracks to add..."
                className={`w-full pl-9 pr-4 py-2 rounded-xl text-xs font-medium border transition-all ${
                  isDark
                    ? 'bg-slate-900/90 border-white/10 text-white placeholder-slate-500'
                    : 'bg-slate-50 border-slate-200 text-slate-800 placeholder-slate-400'
                }`}
              />
            </div>

            {/* Track List Selectable Box */}
            <div className="max-h-48 overflow-y-auto custom-scrollbar border rounded-2xl divide-y divide-inherit p-1">
              {filteredTracks.length > 0 ? (
                filteredTracks.map((tr) => {
                  const isSelected = selectedTrackIds.has(tr.id);
                  return (
                    <div
                      key={tr.id}
                      onClick={() => toggleTrackSelect(tr.id)}
                      className={`p-2.5 rounded-xl flex items-center justify-between cursor-pointer transition-colors ${
                        isSelected
                          ? 'bg-blue-600/20 text-white border border-blue-500/30'
                          : isDark
                          ? 'hover:bg-white/5 text-slate-300'
                          : 'hover:bg-slate-100 text-slate-700'
                      }`}
                    >
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="w-8 h-8 rounded-lg overflow-hidden shrink-0 bg-slate-950">
                          <img
                            src={tr.coverUrl || '/samples/covers/cyberpunk.jpg'}
                            alt={tr.title}
                            className="w-full h-full object-cover"
                          />
                        </div>
                        <div className="min-w-0">
                          <p className="text-xs font-bold truncate">{tr.title}</p>
                          <p className="text-[10px] text-slate-400 truncate">{tr.artist}</p>
                        </div>
                      </div>

                      <div
                        className={`w-5 h-5 rounded-md border flex items-center justify-center transition-all ${
                          isSelected
                            ? 'bg-blue-600 border-blue-500 text-white'
                            : 'border-slate-500/40 text-transparent'
                        }`}
                      >
                        <Check className="w-3.5 h-3.5" />
                      </div>
                    </div>
                  );
                })
              ) : (
                <div className="p-4 text-center text-xs text-slate-400 font-medium">
                  No matching tracks found to add.
                </div>
              )}
            </div>
          </div>

          {/* Footer Submit Button */}
          <div className="pt-4 border-t border-inherit flex items-center justify-end gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-5 py-2.5 rounded-full text-xs font-bold text-slate-400 hover:text-white transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting || !title.trim()}
              className="px-6 py-2.5 rounded-full bg-blue-600 hover:bg-blue-500 disabled:opacity-50 text-white font-extrabold text-xs shadow-lg shadow-blue-500/25 transition-all flex items-center gap-2"
            >
              <Plus className="w-4 h-4" /> {isSubmitting ? 'Creating...' : 'Create Playlist'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
