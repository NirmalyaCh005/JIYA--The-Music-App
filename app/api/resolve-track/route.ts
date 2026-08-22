import { NextRequest, NextResponse } from 'next/server';
import { searchJioSaavnSongs } from '@/lib/utils/jiosaavn';
import { searchInvidiousVideos } from '@/lib/utils/invidious';
import { searchITunesSongs } from '@/lib/utils/itunes';

export const dynamic = 'force-dynamic';

const resolveCache = new Map<string, any>();

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json({ error: 'Query is required' }, { status: 400 });
    }

    const cacheKey = query.toLowerCase();
    if (resolveCache.has(cacheKey)) {
      return NextResponse.json(resolveCache.get(cacheKey));
    }

    // ==========================================
    // Tier 1: JioSaavn Direct 320kbps Stream Match
    // ==========================================
    try {
      const saavnTracks = await searchJioSaavnSongs(query, 10);
      const validSaavn = saavnTracks.find((t) => t.audioUrl && t.audioUrl.startsWith('http'));
      if (validSaavn) {
        const result = {
          audioUrl: validSaavn.audioUrl,
          youtubeId: validSaavn.youtubeId || null,
          source: 'saavn',
        };
        resolveCache.set(cacheKey, result);
        return NextResponse.json(result);
      }
    } catch (err) {}

    // ==========================================
    // Tier 2: Invidious / Piped YouTube Stream Match
    // ==========================================
    try {
      const ytTracks = await searchInvidiousVideos(query, 5);
      if (ytTracks.length > 0 && ytTracks[0].youtubeId) {
        const topMatch = ytTracks[0];
        const result = {
          audioUrl: topMatch.youtubeId,
          youtubeId: topMatch.youtubeId,
          source: 'youtube',
        };
        resolveCache.set(cacheKey, result);
        return NextResponse.json(result);
      }
    } catch (err) {}

    // ==========================================
    // Tier 3: iTunes Search -> Invidious YouTube Match
    // ==========================================
    try {
      const iTunesTracks = await searchITunesSongs(query, 5);
      if (iTunesTracks.length > 0) {
        const topITunes = iTunesTracks[0];
        const ytRetry = await searchInvidiousVideos(`${topITunes.title} ${topITunes.artist}`, 3);
        if (ytRetry.length > 0 && ytRetry[0].youtubeId) {
          const result = {
            audioUrl: ytRetry[0].youtubeId,
            youtubeId: ytRetry[0].youtubeId,
            source: 'youtube',
          };
          resolveCache.set(cacheKey, result);
          return NextResponse.json(result);
        }
      }
    } catch (err) {}

    // Return empty result if no stream resolved — NEVER return a random initial home page song!
    return NextResponse.json({ audioUrl: null, youtubeId: null });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve track' }, { status: 500 });
  }
}
