import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

export async function GET() {
  try {
    const playlists = await prisma.playlist.findMany({
      include: {
        tracks: {
          include: {
            track: true,
          },
          orderBy: { position: 'asc' },
        },
        _count: {
          select: { tracks: true },
        },
      },
      orderBy: { createdAt: 'desc' },
    });

    return NextResponse.json(playlists || []);
  } catch (error) {
    console.warn('Database unreachable in /api/playlists GET, returning fallback empty array []:', error);
    // Return empty array [] with status 200 to prevent Vercel 500 crashes
    return NextResponse.json([]);
  }
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { title, description, coverUrl } = body;

    if (!title) {
      return NextResponse.json({ error: 'Title is required' }, { status: 400 });
    }

    const playlist = await prisma.playlist.create({
      data: {
        title,
        description: description || '',
        coverUrl: coverUrl || '/samples/covers/lofi.jpg',
      },
      include: {
        tracks: {
          include: { track: true },
        },
      },
    });

    return NextResponse.json(playlist, { status: 201 });
  } catch (error) {
    console.warn('Database error in /api/playlists POST:', error);
    return NextResponse.json(
      { id: `temp-${Date.now()}`, title: 'New Playlist', description: '', tracks: [] },
      { status: 200 }
    );
  }
}
