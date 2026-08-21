import { NextRequest, NextResponse } from 'next/server';
import { sanitizeYouTubeId } from '@/lib/utils/youtube';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const rawId = searchParams.get('id')?.trim();

    if (!rawId) {
      return NextResponse.json({ error: 'Video ID is required' }, { status: 400 });
    }

    const videoId = sanitizeYouTubeId(rawId);

    if (!videoId) {
      return NextResponse.json({ error: 'Invalid YouTube Video ID' }, { status: 400 });
    }

    // Direct YouTube IFrame API playback is used. Return 200 JSON payload with sanitized 11-char videoId.
    return NextResponse.json({
      success: true,
      videoId,
      directYouTube: true,
      message: 'Direct YouTube IFrame engine active',
    });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to resolve audio stream' }, { status: 500 });
  }
}
