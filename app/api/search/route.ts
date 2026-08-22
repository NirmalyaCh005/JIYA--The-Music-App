import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';
import { searchSpotifyTracks } from '@/lib/utils/spotify';
import { searchJioSaavnSongs } from '@/lib/utils/jiosaavn';
import { searchITunesSongs } from '@/lib/utils/itunes';
import { searchInvidiousVideos } from '@/lib/utils/invidious';
import { prisma } from '@/lib/prisma';
import { Track } from '@/types/music';

export const dynamic = 'force-dynamic';

const searchCache = new Map<string, Track[]>();

// Asynchronously persist tracks to Prisma SQLite database
async function persistTracksToDatabase(tracks: Track[]) {
  try {
    for (const t of tracks.slice(0, 15)) {
      if (!t.title || !t.artist || !t.id) continue;
      const audioUrl = t.audioUrl || t.youtubeId || '';

      await prisma.track.upsert({
        where: { id: t.id },
        update: {
          title: t.title,
          artist: t.artist,
          album: t.album || 'Single',
          duration: t.duration || 210,
          coverUrl: t.coverUrl || '',
          audioUrl: audioUrl,
        },
        create: {
          id: t.id,
          title: t.title,
          artist: t.artist,
          album: t.album || 'Single',
          genre: t.genre || 'General',
          duration: t.duration || 210,
          coverUrl: t.coverUrl || '',
          audioUrl: audioUrl,
        },
      });
    }
  } catch (err) {}
}

// Helper to strictly format track output according to uniform Track schema
function formatUniformTrack(t: Partial<Track>): Track {
  const isDirectHttp = !!t.audioUrl && t.audioUrl.startsWith('http');
  const source: 'saavn' | 'youtube' = isDirectHttp ? 'saavn' : 'youtube';

  return {
    id: t.id || `track-${Math.random().toString(36).substring(7)}`,
    title: t.title || 'Untitled Track',
    artist: t.artist || 'Unknown Artist',
    album: t.album || (source === 'saavn' ? 'Single' : 'YouTube Audio'),
    genre: t.genre || 'Music',
    duration: t.duration && t.duration > 0 ? t.duration : 210,
    coverUrl:
      t.coverUrl ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    audioUrl: isDirectHttp ? t.audioUrl! : null,
    source,
    youtubeId: t.youtubeId || null,
  };
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json([]);
    }

    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
      return NextResponse.json(searchCache.get(cacheKey));
    }

    let results: Track[] = [];

    // ==========================================
    // Tier 1: JioSaavn + iTunes + Spotify APIs (Parallel Fetch)
    // ==========================================
    try {
      const [saavnTracks, iTunesTracks, spotifyTracks] = await Promise.all([
        searchJioSaavnSongs(query, 20).catch(() => []),
        searchITunesSongs(query, 15).catch(() => []),
        searchSpotifyTracks(query, 15).catch(() => []),
      ]);

      const combinedMap = new Map<string, Track>();

      // A. Prefer JioSaavn direct 320kbps tracks
      for (const item of saavnTracks) {
        const key = `${item.title.toLowerCase()}-${item.artist.toLowerCase()}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, formatUniformTrack(item));
        }
      }

      // B. Merge iTunes tracks
      for (const item of iTunesTracks) {
        const key = `${item.title.toLowerCase()}-${item.artist.toLowerCase()}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, formatUniformTrack(item));
        }
      }

      // C. Merge Spotify tracks
      for (const item of spotifyTracks) {
        const key = `${item.title.toLowerCase()}-${item.artist.toLowerCase()}`;
        if (!combinedMap.has(key)) {
          combinedMap.set(key, formatUniformTrack(item));
        }
      }

      results = Array.from(combinedMap.values());
    } catch (err) {
      console.warn('Tier 1 Search error:', err);
    }

    // ==========================================
    // Tier 2: Invidious / Piped Mirrors
    // ==========================================
    if (results.length === 0) {
      try {
        const invidiousTracks = await searchInvidiousVideos(query, 20);
        if (invidiousTracks.length > 0) {
          results = invidiousTracks.map((t) => formatUniformTrack(t));
        }
      } catch (err) {
        console.warn('Tier 2 Invidious Search error:', err);
      }
    }

    // ==========================================
    // Tier 3: Local Catalog Search
    // ==========================================
    if (results.length === 0) {
      const localMatches = ALL_INITIAL_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(cacheKey) ||
          t.artist.toLowerCase().includes(cacheKey) ||
          (t.album && t.album.toLowerCase().includes(cacheKey)) ||
          (t.genre && t.genre.toLowerCase().includes(cacheKey))
      );

      if (localMatches.length > 0) {
        results = localMatches.map((t) => formatUniformTrack(t));
      }
    }

    if (results.length > 0) {
      persistTracksToDatabase(results).catch(() => {});
      searchCache.set(cacheKey, results);

      if (searchCache.size > 300) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    return NextResponse.json([]);
  }
}
