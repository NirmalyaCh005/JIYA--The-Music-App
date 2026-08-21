import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';
import { searchJioSaavnSongs } from '@/lib/utils/jiosaavn';
import { Track } from '@/types/music';

export const dynamic = 'force-dynamic';

const searchCache = new Map<string, Track[]>();

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

    // A. Match local initial tracks
    const localMatches = ALL_INITIAL_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(cacheKey) ||
        t.artist.toLowerCase().includes(cacheKey) ||
        (t.album && t.album.toLowerCase().includes(cacheKey))
    );

    // B. Query Unlimited JioSaavn Open API
    const saavnResults = await searchJioSaavnSongs(query, 25);

    // Combine & deduplicate results
    const combined: Track[] = [...saavnResults];
    const existingTitles = new Set(combined.map((t) => t.title.toLowerCase()));

    for (const item of localMatches) {
      if (!existingTitles.has(item.title.toLowerCase())) {
        combined.push(item);
        existingTitles.add(item.title.toLowerCase());
      }
    }

    if (combined.length > 0) {
      searchCache.set(cacheKey, combined);
      if (searchCache.size > 300) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
      }
    }

    return NextResponse.json(combined);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
