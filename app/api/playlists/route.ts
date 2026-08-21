import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

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

    return NextResponse.json(playlists);
  } catch (error) {
    console.error('Error fetching playlists:', error);
    return NextResponse.json({ error: 'Failed to fetch playlists' }, { status: 500 });
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
    console.error('Error creating playlist:', error);
    return NextResponse.json({ error: 'Failed to create playlist' }, { status: 500 });
  }
}
