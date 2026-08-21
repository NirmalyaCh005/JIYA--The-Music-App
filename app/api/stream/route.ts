import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url')?.trim();
    const videoId = searchParams.get('id')?.trim();

    // 1. If audioUrl is provided, proxy full high-bitrate audio stream
    if (audioUrl && audioUrl.startsWith('http')) {
      const range = request.headers.get('range');
      const fetchHeaders: Record<string, string> = {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      };

      if (range) {
        fetchHeaders['Range'] = range;
      }

      const res = await fetch(audioUrl, {
        headers: fetchHeaders,
      });

      if (!res.ok && res.status !== 206) {
        return NextResponse.json({ error: 'Failed to fetch audio stream' }, { status: res.status });
      }

      const responseHeaders = new Headers();
      responseHeaders.set('Access-Control-Allow-Origin', '*');
      responseHeaders.set('Access-Control-Allow-Methods', 'GET, HEAD, OPTIONS');
      responseHeaders.set('Access-Control-Allow-Headers', '*');
      
      const upstreamType = res.headers.get('content-type');
      responseHeaders.set(
        'Content-Type',
        upstreamType && !upstreamType.includes('text') ? upstreamType : 'audio/mp4'
      );

      if (res.headers.get('content-length')) {
        responseHeaders.set('Content-Length', res.headers.get('content-length')!);
      }
      if (res.headers.get('content-range')) {
        responseHeaders.set('Content-Range', res.headers.get('content-range')!);
      }
      if (res.headers.get('accept-ranges')) {
        responseHeaders.set('Accept-Ranges', res.headers.get('accept-ranges')!);
      } else {
        responseHeaders.set('Accept-Ranges', 'bytes');
      }

      return new NextResponse(res.body, {
        status: res.status === 206 ? 206 : 200,
        headers: responseHeaders,
      });
    }

    // 2. Video ID fallback payload
    if (videoId) {
      return NextResponse.json({
        success: true,
        videoId,
        directYouTube: true,
      });
    }

    return NextResponse.json({ error: 'Audio URL or ID parameter required' }, { status: 400 });
  } catch (error) {
    return NextResponse.json({ error: 'Audio streaming proxy error' }, { status: 500 });
  }
}

export async function OPTIONS() {
  return new NextResponse(null, {
    status: 204,
    headers: {
      'Access-Control-Allow-Origin': '*',
      'Access-Control-Allow-Methods': 'GET, HEAD, OPTIONS',
      'Access-Control-Allow-Headers': '*',
    },
  });
}
