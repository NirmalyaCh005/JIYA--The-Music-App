import { NextRequest, NextResponse } from 'next/server';
import fs from 'fs';
import path from 'path';
import { randomUUID } from 'crypto';

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const audioFile = formData.get('audio') as File | null;
    const coverFile = formData.get('cover') as File | null;

    if (!audioFile) {
      return NextResponse.json({ error: 'No audio file provided' }, { status: 400 });
    }

    // Ensure upload directories exist
    const publicDir = path.join(process.cwd(), 'public');
    const tracksDir = path.join(publicDir, 'uploads', 'tracks');
    const coversDir = path.join(publicDir, 'uploads', 'covers');

    fs.mkdirSync(tracksDir, { recursive: true });
    fs.mkdirSync(coversDir, { recursive: true });

    // Save Audio File
    const audioBytes = await audioFile.arrayBuffer();
    const audioBuffer = Buffer.from(audioBytes);
    const audioExtension = path.extname(audioFile.name) || '.mp3';
    const audioFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${audioExtension}`;
    const audioPath = path.join(tracksDir, audioFilename);
    fs.writeFileSync(audioPath, audioBuffer);

    let coverUrl = '/samples/covers/cyberpunk.jpg';

    // Save Cover File if uploaded
    if (coverFile && coverFile.size > 0) {
      const coverBytes = await coverFile.arrayBuffer();
      const coverBuffer = Buffer.from(coverBytes);
      const coverExtension = path.extname(coverFile.name) || '.jpg';
      const coverFilename = `${Date.now()}-${Math.random().toString(36).substring(2, 8)}${coverExtension}`;
      const coverPath = path.join(coversDir, coverFilename);
      fs.writeFileSync(coverPath, coverBuffer);
      coverUrl = `/uploads/covers/${coverFilename}`;
    }

    const audioUrl = `/uploads/tracks/${audioFilename}`;

    return NextResponse.json({
      success: true,
      audioUrl,
      coverUrl,
      originalFilename: audioFile.name,
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    return NextResponse.json({ error: 'Upload failed' }, { status: 500 });
  }
}
