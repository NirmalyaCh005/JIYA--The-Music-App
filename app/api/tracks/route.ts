import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();
    const genre = searchParams.get('genre')?.trim();
    const likedOnly = searchParams.get('liked') === 'true';

    const whereClause: any = {};

    if (query) {
      whereClause.OR = [
        { title: { contains: query } },
        { artist: { contains: query } },
        { album: { contains: query } },
      ];
    }

    if (genre && genre.toLowerCase() !== 'all') {
      whereClause.genre = { contains: genre };
    }

    if (likedOnly) {
      whereClause.isLiked = true;
    }

    const tracks = await prisma.track.findMany({
      where: whereClause,
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(tracks || []);
  } catch (error) {
    console.warn('DB error in /api/tracks GET, returning fallback empty array []:', error);
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, artist, album, genre, duration, audioUrl, coverUrl } = body;

    if (!title || !artist || !audioUrl) {
      return NextResponse.json(
        { error: 'Title, artist, and audioUrl are required fields' },
        { status: 400 }
      );
    }

    const newTrack = await prisma.track.create({
      data: {
        title,
        artist,
        album: album || 'Single',
        genre: genre || 'General',
        duration: Number(duration) || 180,
        audioUrl,
        coverUrl: coverUrl || '/covers/default.png',
      },
    });

    return NextResponse.json(newTrack, { status: 201 });
  } catch (error) {
    console.warn('DB error in /api/tracks POST:', error);
    return NextResponse.json({ error: 'Failed to create track' }, { status: 500 });
  }
}
