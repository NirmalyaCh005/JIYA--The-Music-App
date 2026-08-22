import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';
import { searchJioSaavnSongs } from '@/lib/utils/jiosaavn';
import { searchInvidiousVideos } from '@/lib/utils/invidious';
import { Track } from '@/types/music';

export const dynamic = 'force-dynamic';

const searchCache = new Map<string, Track[]>();

// Helper to strictly format track output according to uniform Track schema
function formatUniformTrack(t: Partial<Track>): Track {
  const isSaavn = t.source === 'saavn' || (!!t.audioUrl && t.audioUrl.startsWith('http'));
  const source: 'saavn' | 'youtube' = isSaavn ? 'saavn' : 'youtube';

  const audioUrl =
    t.audioUrl ||
    t.youtubeId ||
    (t.id ? t.id.replace(/^(saavn-|yt-|trending-|hindi-|global-|punjabi-|lofi-)/, '') : '');

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
    // Tier 1: JioSaavn Mirrors (Direct 320kbps streams)
    // ==========================================
    try {
      const saavnTracks = await searchJioSaavnSongs(query, 20);
      const validSaavn = saavnTracks.filter((t) => t.audioUrl && t.audioUrl.startsWith('http'));
      if (validSaavn.length > 0) {
        results = validSaavn.map((t) => formatUniformTrack(t));
      }
    } catch (err) {
      console.warn('Tier 1 JioSaavn Search failed, proceeding to Tier 2:', err);
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
        console.warn('Tier 2 Invidious Search failed, proceeding to Tier 3:', err);
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

    // Cache non-empty results (LRU limit 300 entries)
    if (results.length > 0) {
      searchCache.set(cacheKey, results);
      if (searchCache.size > 300) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
      }
    }

    return NextResponse.json(results);
  } catch (error) {
    // Ultimate fallback if any error occurs: return pre-seeded tracks so search never fails
    const defaultFallback = ALL_INITIAL_TRACKS.slice(0, 8).map((t) => formatUniformTrack(t));
    return NextResponse.json(defaultFallback);
  }
}
