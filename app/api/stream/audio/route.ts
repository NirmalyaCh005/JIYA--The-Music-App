import { NextRequest, NextResponse } from 'next/server';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const audioUrl = searchParams.get('url')?.trim();

    if (!audioUrl || !audioUrl.startsWith('http')) {
      return NextResponse.json({ error: 'Valid audio URL is required' }, { status: 400 });
    }

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
    responseHeaders.set('Content-Type', res.headers.get('content-type') || 'audio/mpeg');
    
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
