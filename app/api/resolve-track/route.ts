import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const resolveCache = new Map<string, any>();

async function resolveYouTubeVideoId(query: string): Promise<string | null> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(
      query + ' song'
    )}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
    });

    if (!res.ok) return null;

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) return null;

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer
        ?.contents;

    if (contents && Array.isArray(contents)) {
      for (const section of contents) {
        const itemSection = section.itemSectionRenderer?.contents;
        if (itemSection && Array.isArray(itemSection)) {
          for (const item of itemSection) {
            if (item.videoRenderer && item.videoRenderer.videoId) {
              return item.videoRenderer.videoId;
            }
          }
        }
      }
    }
    return null;
  } catch (e) {
    return null;
  }
}

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

    const youtubeId = (await resolveYouTubeVideoId(query)) || 'BddP6PYo2gs';
    const result = {
      youtubeId,
      title: query,
    };

    resolveCache.set(cacheKey, result);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve track' }, { status: 500 });
  }
}
