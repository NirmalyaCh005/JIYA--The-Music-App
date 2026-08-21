import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

const streamCache = new Map<string, { streamUrl: string; expiresAt: number }>();

const PIPED_INSTANCES = [
  'https://pipedapi.kavin.rocks',
  'https://api.piped.privacydev.net',
  'https://pipedapi.tokhmi.xyz',
  'https://pipedapi.moomoo.me',
];

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const videoId = searchParams.get('id')?.trim();

    if (!videoId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    if (streamCache.has(videoId)) {
      const cached = streamCache.get(videoId)!;
      if (Date.now() < cached.expiresAt) {
        return NextResponse.json({ streamUrl: cached.streamUrl });
      }
    }

    // Try fetching audio stream from Piped instances
    for (const instance of PIPED_INSTANCES) {
      try {
        const res = await fetch(`${instance}/streams/${videoId}`, {
          headers: { 'Accept': 'application/json' },
          next: { revalidate: 3600 },
        });

        if (res.ok) {
          const data = await res.json();
          if (data && Array.isArray(data.audioStreams) && data.audioStreams.length > 0) {
            // Sort by highest bitrate audio stream
            const bestAudio = data.audioStreams.sort(
              (a: any, b: any) => (b.bitrate || 0) - (a.bitrate || 0)
            )[0];

            if (bestAudio && bestAudio.url) {
              const streamUrl = bestAudio.url;
              streamCache.set(videoId, {
                streamUrl,
                expiresAt: Date.now() + 3 * 3600 * 1000, // 3 hour cache
              });
              return NextResponse.json({ streamUrl });
            }
          }
        }
      } catch (err) {
        // Try next instance
      }
    }

    return NextResponse.json({ error: 'Audio stream unavailable' }, { status: 404 });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve audio stream' }, { status: 500 });
  }
}
