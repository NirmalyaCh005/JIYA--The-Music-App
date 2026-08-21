import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';

export const dynamic = 'force-dynamic';

// In-memory search cache (query -> results)
const searchCache = new Map<string, any[]>();

// Helper to convert YouTube duration string "4:15" or "1:02:30" to seconds
function parseDuration(durationStr?: string): number {
  if (!durationStr) return 210;
  const parts = durationStr.split(':').map((p) => parseInt(p, 10));
  if (parts.length === 2) {
    return (parts[0] || 0) * 60 + (parts[1] || 0);
  } else if (parts.length === 3) {
    return (parts[0] || 0) * 3600 + (parts[1] || 0) * 60 + (parts[2] || 0);
  }
  return 210;
}

// 1. Direct YouTube Scraper Engine (Parses ytInitialData from YouTube Search)
async function searchYouTubeDirect(query: string): Promise<any[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query + ' song'
    )}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents;

    const items: any[] = [];
    if (contents && Array.isArray(contents)) {
      for (const section of contents) {
        const itemSection = section.itemSectionRenderer?.contents;
        if (itemSection && Array.isArray(itemSection)) {
          for (const item of itemSection) {
            const vr = item.videoRenderer;
            if (vr && vr.videoId) {
              const videoId = vr.videoId;
              const rawTitle = vr.title?.runs?.[0]?.text || query;
              // Clean up title (remove official video tags for clean music app look)
              const title = rawTitle
                .replace(/\(Official Video\)/gi, '')
                .replace(/\[Official Music Video\]/gi, '')
                .replace(/\(Audio\)/gi, '')
                .replace(/\[Lyrical Video\]/gi, '')
                .trim();

              const artist = vr.ownerText?.runs?.[0]?.text || 'Artist';
              const rawThumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url;
              // Upgrade thumbnail to HQ default if possible
              const coverUrl =
                rawThumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              const duration = parseDuration(vr.lengthText?.simpleText);

              items.push({
                id: `yt-${videoId}`,
                title,
                artist,
                album: 'Single',
                genre: 'YouTube Music',
                duration,
                youtubeId: videoId,
                coverUrl,
              });

              if (items.length >= 15) break;
            }
          }
        }
        if (items.length >= 15) break;
      }
    }

    return items;
  } catch (err) {
    console.warn('YouTube Scraper warning:', err);
    return [];
  }
}

// 2. iTunes Global Search API Engine
async function searchiTunes(query: string): Promise<any[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(
      query
    )}&entity=song&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      const coverUrl = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

      return {
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        genre: item.primaryGenreName || 'Music',
        duration: Math.round(item.trackTimeMillis / 1000) || 210,
        youtubeId: null, // Will resolve dynamically when played
        coverUrl,
      };
    });
  } catch (err) {
    return [];
  }
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

    // A. Match local curated track constants first
    const localMatches = ALL_INITIAL_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(cacheKey) ||
        t.artist.toLowerCase().includes(cacheKey) ||
        (t.album && t.album.toLowerCase().includes(cacheKey))
    );

    // B. Fetch live results from YouTube direct search scraper & iTunes
    const [ytResults, itunesResults] = await Promise.all([
      searchYouTubeDirect(query),
      searchiTunes(query),
    ]);

    // Combine & deduplicate results
    const combined: any[] = [...localMatches];
    const existingIds = new Set(combined.map((t) => t.youtubeId || t.id));

    for (const item of ytResults) {
      if (!existingIds.has(item.youtubeId)) {
        combined.push(item);
        existingIds.add(item.youtubeId);
      }
    }

    for (const item of itunesResults) {
      if (!combined.some((t) => t.title.toLowerCase() === item.title.toLowerCase())) {
        combined.push(item);
      }
    }

    // Cache results in memory
    if (combined.length > 0) {
      searchCache.set(cacheKey, combined);
      if (searchCache.size > 300) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
      }
    }

    return NextResponse.json(combined);
  } catch (error) {
    console.error('Search API Error:', error);
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
