import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';
import { searchSpotifyTracks } from '@/lib/utils/spotify';
import { searchJioSaavnSongs } from '@/lib/utils/jiosaavn';
import { searchInvidiousVideos } from '@/lib/utils/invidious';
import { prisma } from '@/lib/prisma';
import { Track } from '@/types/music';

export const dynamic = 'force-dynamic';

const searchCache = new Map<string, Track[]>();

// Asynchronously persist tracks to Prisma SQLite database (dev.db)
async function persistTracksToDatabase(tracks: Track[]) {
  try {
    for (const t of tracks.slice(0, 10)) {
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
  } catch (err) {
    // Non-blocking database sync
  }
}

// Helper to strictly format track output according to uniform Track schema
function formatUniformTrack(t: Partial<Track>): Track {
  const isSaavn = t.source === 'saavn' || (!!t.audioUrl && t.audioUrl.startsWith('http'));
  const source: 'saavn' | 'youtube' = isSaavn ? 'saavn' : 'youtube';

  const audioUrl =
    t.audioUrl ||
    t.youtubeId ||
    (t.id ? t.id.replace(/^(spotify-|saavn-|yt-|trending-|hindi-|global-|punjabi-|lofi-)/, '') : '');

  return {
    id: t.id || `track-${Math.random().toString(36).substring(7)}`,
    title: t.title || 'Untitled Track',
    artist: t.artist || 'Unknown Artist',
    album: t.album || (source === 'saavn' ? 'Single' : 'YouTube Audio'),
    duration: t.duration && t.duration > 0 ? t.duration : 210,
    coverUrl:
      t.coverUrl ||
      'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    audioUrl: audioUrl || '',
    source,
    youtubeId: t.youtubeId || (source === 'youtube' ? audioUrl : null),
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
    // Tier 1: Spotify Web API + JioSaavn 320kbps Streams
    // ==========================================
    try {
      const [spotifyTracks, saavnTracks] = await Promise.all([
        searchSpotifyTracks(query, 10),
        searchJioSaavnSongs(query, 15),
      ]);

      const validSaavn = saavnTracks.filter((t) => t.audioUrl && t.audioUrl.startsWith('http'));
      const combinedTier1 = [...spotifyTracks, ...validSaavn];

      if (combinedTier1.length > 0) {
        results = combinedTier1.map((t) => formatUniformTrack(t));
      }
    } catch (err) {
      console.warn('Tier 1 Spotify/JioSaavn Search error, proceeding to Tier 2:', err);
    }

    // ==========================================
    // Tier 2: Invidious / Piped Mirrors (YouTube zero-quota fallback)
    // ==========================================
    if (results.length === 0) {
      try {
        const invidiousTracks = await searchInvidiousVideos(query, 20);
        if (invidiousTracks.length > 0) {
          results = invidiousTracks.map((t) => formatUniformTrack(t));
        }
      } catch (err) {
        console.warn('Tier 2 Invidious Search error, proceeding to Tier 3:', err);
      }
    }

    // ==========================================
    // Tier 3: Offline Seeded Catalog (Library & Search Never Empty)
    // ==========================================
    if (results.length === 0) {
      const localMatches = ALL_INITIAL_TRACKS.filter(
        (t) =>
          t.title.toLowerCase().includes(cacheKey) ||
          t.artist.toLowerCase().includes(cacheKey) ||
          (t.album && t.album.toLowerCase().includes(cacheKey)) ||
          (t.genre && t.genre.toLowerCase().includes(cacheKey))
      );

      const fallbackList = localMatches.length > 0 ? localMatches : ALL_INITIAL_TRACKS.slice(0, 10);
      results = fallbackList.map((t) => formatUniformTrack(t));
    }

    // Sync non-empty search results to Prisma SQLite Database asynchronously
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
    const defaultFallback = ALL_INITIAL_TRACKS.slice(0, 8).map((t) => formatUniformTrack(t));
    return NextResponse.json(defaultFallback);
  }
}
