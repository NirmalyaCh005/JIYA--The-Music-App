import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';
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
      const saavnTracks = await searchJioSaavnSongs(query, 5);
      const validSaavn = saavnTracks.find((t) => t.audioUrl && t.audioUrl.startsWith('http'));
      if (validSaavn) {
        const result = {
          audioUrl: validSaavn.audioUrl,
          youtubeId: validSaavn.youtubeId || null,
          title: validSaavn.title,
          artist: validSaavn.artist,
          coverUrl: validSaavn.coverUrl,
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
          title: topMatch.title,
          artist: topMatch.artist,
          coverUrl: topMatch.coverUrl,
          source: 'youtube',
        };
        resolveCache.set(cacheKey, result);
        return NextResponse.json(result);
      }
    } catch (err) {}

    // ==========================================
    // Tier 3: iTunes Metadata -> YouTube Stream Match
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
            title: topITunes.title,
            artist: topITunes.artist,
            coverUrl: topITunes.coverUrl,
            source: 'youtube',
          };
          resolveCache.set(cacheKey, result);
          return NextResponse.json(result);
        }
      }
    } catch (err) {}

    // ==========================================
    // Tier 4: Local Initial Tracks Match
    // ==========================================
    const localMatch = ALL_INITIAL_TRACKS.find(
      (t) =>
        t.title.toLowerCase().includes(cacheKey) ||
        cacheKey.includes(t.title.toLowerCase()) ||
        t.artist.toLowerCase().includes(cacheKey)
    );

    if (localMatch) {
      const result = {
        audioUrl: localMatch.audioUrl || null,
        youtubeId: localMatch.youtubeId || null,
        title: localMatch.title,
        artist: localMatch.artist,
        coverUrl: localMatch.coverUrl,
        source: localMatch.audioUrl ? 'saavn' : 'youtube',
      };
      resolveCache.set(cacheKey, result);
      return NextResponse.json(result);
    }

    // Return error status if audio cannot be resolved — NEVER return hardcoded Aashiqui 2!
    return NextResponse.json({ error: 'Could not resolve track stream' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve track' }, { status: 500 });
  }
}
