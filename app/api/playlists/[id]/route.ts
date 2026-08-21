import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const playlist = await prisma.playlist.findUnique({
      where: { id: params.id },
      include: {
        tracks: {
          include: { track: true },
          orderBy: { position: 'asc' },
        },
      },
    });

    if (!playlist) {
      return NextResponse.json({ error: 'Playlist not found' }, { status: 404 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to fetch playlist' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.playlist.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete playlist' }, { status: 500 });
  }
}
