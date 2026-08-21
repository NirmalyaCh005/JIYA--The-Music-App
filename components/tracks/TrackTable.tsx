'use client';

import React, { useState } from 'react';
import { Play, Pause, Heart, MoreHorizontal, Plus, Clock, Music } from 'lucide-react';
import { Track } from '@/types/music';
import { usePlayerStore } from '@/lib/store/usePlayerStore';
import { formatTime } from '@/lib/utils/formatTime';

interface TrackTableProps {
  tracks: Track[];
  onTrackDeleted?: () => void;
}

export function TrackTable({ tracks, onTrackDeleted }: TrackTableProps) {
  const {
    currentTrack,
    isPlaying,
    likedTrackIds,
    theme,
    setQueue,
    togglePlayPause,
    addToQueue,
    toggleLikeTrack,
    toggleAmbientMode,
  } = usePlayerStore();

  const [menuTrackId, setMenuTrackId] = useState<string | null>(null);
  const isDark = theme === 'dark';

  const handlePlayTrack = (track: Track, index: number) => {
    if (currentTrack?.id === track.id) {
      togglePlayPause();
    } else {
      setQueue(tracks, index);
    }
  };

  const handleOpenAmbientTrack = (track: Track, index: number) => {
    handlePlayTrack(track, index);
    toggleAmbientMode(true);
  };

  const handleDeleteTrack = async (id: string) => {
    if (!confirm('Are you sure you want to delete this track?')) return;
    try {
      const res = await fetch(`/api/tracks/${id}`, { method: 'DELETE' });
      if (res.ok && onTrackDeleted) {
        onTrackDeleted();
      }
    } catch (err) {
      console.error('Failed to delete track:', err);
    }
  };

  return (
    <div className="w-full overflow-x-auto custom-scrollbar select-none">
      <table className="w-full text-left border-collapse">
        <thead>
          <tr
            className={`border-b text-xs font-extrabold uppercase tracking-wider ${
              isDark ? 'border-white/10 text-slate-400' : 'border-slate-200 text-slate-500'
            }`}
          >
            <th className="py-3 px-4 w-12 text-center">#</th>
            <th className="py-3 px-4">Title</th>
            <th className="py-3 px-4 hidden md:table-cell">Album</th>
            <th className="py-3 px-4 text-right w-20">Time</th>
            <th className="py-3 px-4 text-center w-16">Like</th>
          </tr>
        </thead>
        <tbody className={`divide-y ${isDark ? 'divide-white/5' : 'divide-slate-100'}`}>
          {tracks.map((track, idx) => {
            const isCurrent = currentTrack?.id === track.id;
            const isLiked = likedTrackIds instanceof Set
              ? likedTrackIds.has(track.id)
              : Array.isArray(likedTrackIds)
              ? (likedTrackIds as string[]).includes(track.id)
              : false;
            const indexFormatted = (idx + 1).toString().padStart(2, '0');

            return (
              <tr
                key={track.id}
                onClick={() => handlePlayTrack(track, idx)}
                className={`group cursor-pointer transition-colors rounded-xl ${
                  isCurrent
                    ? 'bg-blue-50/90 dark:bg-blue-600/15'
                    : isDark
                    ? 'hover:bg-white/5'
                    : 'hover:bg-slate-50'
                }`}
              >
                {/* Index / Play Button */}
                <td className={`py-3 px-4 text-center text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-500'}`}>
                  <div className="flex items-center justify-center">
                    {isCurrent && isPlaying ? (
                      <div className="flex items-end gap-0.5 h-3.5">
                        <span className="w-1 bg-blue-600 animate-pulse rounded-full h-full" />
                        <span className="w-1 bg-blue-500 animate-pulse rounded-full h-3/4" />
                        <span className="w-1 bg-blue-400 animate-pulse rounded-full h-1/2" />
                      </div>
                    ) : (
                      <>
                        <span className="group-hover:hidden">{indexFormatted}</span>
                        <button
                          onClick={() => handlePlayTrack(track, idx)}
                          className="hidden group-hover:block text-blue-600 transition-colors"
                        >
                          {isCurrent && isPlaying ? (
                            <Pause className="w-4 h-4 fill-blue-600" />
                          ) : (
                            <Play className="w-4 h-4 fill-blue-600" />
                          )}
                        </button>
                      </>
                    )}
                  </div>
                </td>

                {/* Track Title & Cover (Clickable for Ambient Mode) */}
                <td className="py-3 px-4">
                  <div className="flex items-center gap-3.5">
                    <div
                      onClick={() => handleOpenAmbientTrack(track, idx)}
                      className="w-9 h-9 rounded-xl overflow-hidden flex-shrink-0 bg-slate-900 shadow cursor-pointer group-hover:scale-105 transition-transform"
                      title="Click to open Ambient Visualizer Mode"
                    >
                      <img
                        src={track.coverUrl || '/samples/covers/cyberpunk.jpg'}
                        alt={track.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                    <div className="min-w-0">
                      <p
                        onClick={() => handleOpenAmbientTrack(track, idx)}
                        className={`text-xs font-black truncate cursor-pointer hover:underline ${
                          isCurrent
                            ? 'text-blue-600 font-black'
                            : isDark
                            ? 'text-white'
                            : 'text-slate-900'
                        }`}
                        title="Click to open Ambient Visualizer Mode"
                      >
                        {track.title}
                      </p>
                      <p
                        onClick={() => handleOpenAmbientTrack(track, idx)}
                        className={`text-[11px] font-semibold truncate cursor-pointer hover:underline ${isDark ? 'text-slate-400' : 'text-slate-600'}`}
                        title="Click to open Ambient Visualizer Mode"
                      >
                        {track.artist}
                      </p>
                    </div>
                  </div>
                </td>

                {/* Album */}
                <td className={`py-3 px-4 hidden md:table-cell text-xs font-semibold truncate max-w-[150px] ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {track.album || 'Single'}
                </td>

                {/* Duration */}
                <td className={`py-3 px-4 text-right text-xs font-mono font-bold ${isDark ? 'text-slate-400' : 'text-slate-600'}`}>
                  {formatTime(track.duration)}
                </td>

                {/* Like Button */}
                <td className="py-3 px-4 text-center">
                  <button
                    onClick={() => toggleLikeTrack(track.id)}
                    className="p-1 rounded-full transition-transform active:scale-125"
                  >
                    <Heart
                      className={`w-4 h-4 ${
                        isLiked
                          ? 'text-red-500 fill-red-500'
                          : isDark
                          ? 'text-slate-500 hover:text-red-400'
                          : 'text-slate-400 hover:text-red-500'
                      }`}
                    />
                  </button>
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {tracks.length === 0 && (
        <div className="py-12 text-center text-xs text-slate-400 font-medium italic">
          No tracks found. Try searching or uploading a song!
        </div>
      )}
    </div>
  );
}
