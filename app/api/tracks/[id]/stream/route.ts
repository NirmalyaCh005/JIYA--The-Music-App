import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { prisma } from '@/lib/prisma';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const trackId = params.id;
    const track = await prisma.track.findUnique({
      where: { id: trackId },
    });

    if (!track) {
      return new NextResponse('Track not found', { status: 404 });
    }

    let filePath: string;
    if (track.audioUrl.startsWith('/')) {
      filePath = path.join(process.cwd(), 'public', track.audioUrl);
    } else {
      // If external remote URL, redirect or fetch stream
      return NextResponse.redirect(track.audioUrl);
    }

    if (!fs.existsSync(filePath)) {
      return new NextResponse('Audio file missing on disk', { status: 404 });
    }

    const stat = fs.statSync(filePath);
    const fileSize = stat.size;
    const range = request.headers.get('range');

    const ext = path.extname(filePath).toLowerCase();
    let contentType = 'audio/mpeg';
    if (ext === '.wav') contentType = 'audio/wav';
    if (ext === '.flac') contentType = 'audio/flac';
    if (ext === '.ogg') contentType = 'audio/ogg';

    if (range) {
      const parts = range.replace(/bytes=/, '').split('-');
      const start = parseInt(parts[0], 10);
      const end = parts[1] ? parseInt(parts[1], 10) : fileSize - 1;

      if (start >= fileSize || end >= fileSize) {
        return new NextResponse('Requested range not satisfiable', {
          status: 416,
          headers: { 'Content-Range': `bytes */${fileSize}` },
        });
      }

      const chunksize = end - start + 1;
      const fileStream = fs.createReadStream(filePath, { start, end });

      // Convert Node readable stream to Web ReadableStream
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 206, // Partial Content
        headers: {
          'Content-Range': `bytes ${start}-${end}/${fileSize}`,
          'Accept-Ranges': 'bytes',
          'Content-Length': chunksize.toString(),
          'Content-Type': contentType,
        },
      });
    } else {
      const fileStream = fs.createReadStream(filePath);
      const stream = new ReadableStream({
        start(controller) {
          fileStream.on('data', (chunk) => controller.enqueue(chunk));
          fileStream.on('end', () => controller.close());
          fileStream.on('error', (err) => controller.error(err));
        },
      });

      return new NextResponse(stream as any, {
        status: 200,
        headers: {
          'Content-Length': fileSize.toString(),
          'Content-Type': contentType,
          'Accept-Ranges': 'bytes',
        },
      });
    }
  } catch (error) {
    console.error('Error streaming track:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}
