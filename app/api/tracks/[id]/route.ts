import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const track = await prisma.track.findUnique({
      where: { id: params.id },
    });

    if (!track) {
      return NextResponse.json({ error: 'Track not found' }, { status: 404 });
    }

    return NextResponse.json(track);
  } catch (error) {
    return NextResponse.json({ error: 'Internal Server Error' }, { status: 500 });
  }
}

export async function PATCH(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const body = await request.json();
    const updatedTrack = await prisma.track.update({
      where: { id: params.id },
      data: body,
    });

    return NextResponse.json(updatedTrack);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update track' }, { status: 500 });
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.track.delete({
      where: { id: params.id },
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete track' }, { status: 500 });
  }
}
