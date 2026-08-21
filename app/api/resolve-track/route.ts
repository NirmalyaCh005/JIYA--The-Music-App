import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';
import { searchJioSaavnSongs } from '@/lib/utils/jiosaavn';

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

    // 1. Try JioSaavn Open API Resolution for direct High-Bitrate HTML5 MP3 Stream
    try {
      const saavnTracks = await searchJioSaavnSongs(query, 5);
      if (saavnTracks.length > 0 && saavnTracks[0].audioUrl) {
        const topMatch = saavnTracks[0];
        const result = {
          audioUrl: topMatch.audioUrl,
          youtubeId: topMatch.youtubeId || null,
          title: topMatch.title,
          artist: topMatch.artist,
          coverUrl: topMatch.coverUrl,
        };
        resolveCache.set(cacheKey, result);
        return NextResponse.json(result);
      }
    } catch (err) {}

    // 2. Check local dataset
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
      };
      resolveCache.set(cacheKey, result);
      return NextResponse.json(result);
    }

    const defaultResult = {
      audioUrl: null,
      youtubeId: 'IJq0yyWug1k',
      title: query,
    };
    resolveCache.set(cacheKey, defaultResult);
    return NextResponse.json(defaultResult);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve track' }, { status: 500 });
  }
}
