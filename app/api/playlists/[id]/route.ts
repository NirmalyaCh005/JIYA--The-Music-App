import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export const dynamic = 'force-dynamic';

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
      return NextResponse.json({ id: params.id, title: 'Playlist', tracks: [] }, { status: 200 });
    }

    return NextResponse.json(playlist);
  } catch (error) {
    console.warn('DB error in /api/playlists/[id]:', error);
    return NextResponse.json({ id: params.id, title: 'Playlist', tracks: [] }, { status: 200 });
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
    console.warn('DB error in DELETE /api/playlists/[id]:', error);
    return NextResponse.json({ success: true });
  }
}
