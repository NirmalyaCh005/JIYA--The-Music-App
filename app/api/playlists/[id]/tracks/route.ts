import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id;
    const { trackId } = await request.json();

    if (!trackId) {
      return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
    }

    // Check if track is already in playlist
    const existing = await prisma.playlistTrack.findUnique({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    if (existing) {
      return NextResponse.json({ message: 'Track already in playlist' });
    }

    const count = await prisma.playlistTrack.count({
      where: { playlistId },
    });

    const playlistTrack = await prisma.playlistTrack.create({
      data: {
        playlistId,
        trackId,
        position: count,
      },
      include: { track: true },
    });

    return NextResponse.json(playlistTrack, { status: 201 });
  } catch (error) {
    console.error('Error adding track to playlist:', error);
    return NextResponse.json({ error: 'Failed to add track' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlistId = params.id;
    const { searchParams } = new URL(request.url);
    const trackId = searchParams.get('trackId');

    if (!trackId) {
      return NextResponse.json({ error: 'trackId is required' }, { status: 400 });
    }

    await prisma.playlistTrack.delete({
      where: {
        playlistId_trackId: {
          playlistId,
          trackId,
        },
      },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to remove track' }, { status: 500 });
  }
}
