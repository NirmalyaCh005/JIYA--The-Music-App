import { PrismaClient } from '@prisma/client';
import fs from 'fs';
import path from 'path';

const prisma = new PrismaClient();

// Helper to write a basic 44-byte WAV header and PCM audio buffer
function generateSynthWav(
  durationSeconds: number,
  baseFreq: number,
  type: 'synthwave' | 'lofi' | 'ambient' | 'cyberpunk'
): Buffer {
  const sampleRate = 44100;
  const numChannels = 2; // Stereo
  const bytesPerSample = 2; // 16-bit
  const blockAlign = numChannels * bytesPerSample;
  const numSamples = Math.floor(sampleRate * durationSeconds);
  const dataSize = numSamples * blockAlign;
  const buffer = Buffer.alloc(44 + dataSize);

  // RIFF Chunk Descriptor
  buffer.write('RIFF', 0);
  buffer.writeUInt32LE(36 + dataSize, 4);
  buffer.write('WAVE', 8);

  // fmt Sub-chunk
  buffer.write('fmt ', 12);
  buffer.writeUInt32LE(16, 16); // Subchunk1Size
  buffer.writeUInt16LE(1, 20);  // AudioFormat (1 = PCM)
  buffer.writeUInt16LE(numChannels, 22);
  buffer.writeUInt32LE(sampleRate, 24);
  buffer.writeUInt32LE(sampleRate * blockAlign, 28);
  buffer.writeUInt16LE(blockAlign, 32);
  buffer.writeUInt16LE(bytesPerSample * 8, 34);

  // data Sub-chunk
  buffer.write('data', 36);
  buffer.writeUInt32LE(dataSize, 40);

  // Write sample PCM data
  let offset = 44;
  for (let i = 0; i < numSamples; i++) {
    const t = i / sampleRate;
    let sampleL = 0;
    let sampleR = 0;

    if (type === 'synthwave') {
      // Synthwave arpeggio chord (Am7 -> F -> C -> G)
      const chordNotes = [220, 261.63, 329.63, 392.00, 440.00]; // A3, C4, E4, G4, A4
      const noteIndex = Math.floor(t * 8) % chordNotes.length;
      const freq = chordNotes[noteIndex];
      const bassFreq = 110;
      
      const wave = Math.sin(2 * Math.PI * freq * t) * 0.3 + 
                 Math.sin(2 * Math.PI * bassFreq * t) * 0.4 +
                 (Math.random() - 0.5) * 0.02; // subtle analog warmth
      const env = Math.exp(-3 * ((t * 8) % 1));
      
      sampleL = wave * env * 0.7;
      sampleR = wave * env * 0.7;
    } else if (type === 'lofi') {
      // Lofi chill vinyl beat with smooth minor chord pad
      const pad = (Math.sin(2 * Math.PI * baseFreq * t) + Math.sin(2 * Math.PI * (baseFreq * 1.25) * t)) * 0.25;
      const beatCycle = t % 0.5;
      const kick = beatCycle < 0.08 ? Math.sin(2 * Math.PI * 60 * beatCycle) * Math.exp(-20 * beatCycle) * 0.6 : 0;
      const vinylCrackle = (Math.random() - 0.5) * 0.03;
      
      sampleL = pad + kick + vinylCrackle;
      sampleR = pad + kick - vinylCrackle;
    } else if (type === 'ambient') {
      // Warm ethereal ambient pad with slowly modulating frequencies
      const mod = Math.sin(2 * Math.PI * 0.2 * t);
      const wave1 = Math.sin(2 * Math.PI * (baseFreq + mod * 5) * t) * 0.3;
      const wave2 = Math.sin(2 * Math.PI * (baseFreq * 1.5 - mod * 3) * t) * 0.2;
      const wave3 = Math.sin(2 * Math.PI * (baseFreq * 2) * t) * 0.1;

      sampleL = (wave1 + wave2 + wave3) * 0.6;
      sampleR = (wave1 - wave2 + wave3) * 0.6;
    } else {
      // Cyberpunk pulse bass & distorted synth lead
      const bass = Math.sin(2 * Math.PI * 55 * t) * 0.5;
      const distortion = Math.max(-0.4, Math.min(0.4, Math.sin(2 * Math.PI * (baseFreq + (Math.floor(t * 4) % 4) * 40) * t) * 0.8));
      
      sampleL = (bass + distortion) * 0.5;
      sampleR = (bass + distortion) * 0.5;
    }

    // Convert float -1.0..1.0 to 16-bit signed integer
    const intL = Math.max(-32768, Math.min(32767, Math.floor(sampleL * 32767)));
    const intR = Math.max(-32768, Math.min(32767, Math.floor(sampleR * 32767)));

    buffer.writeInt16LE(intL, offset);
    buffer.writeInt16LE(intR, offset + 2);
    offset += 4;
  }

  return buffer;
}

async function main() {
  console.log('Starting seed script...');

  const publicDir = path.join(process.cwd(), 'public');
  const samplesAudioDir = path.join(publicDir, 'samples', 'audio');
  const samplesCoversDir = path.join(publicDir, 'samples', 'covers');

  fs.mkdirSync(samplesAudioDir, { recursive: true });
  fs.mkdirSync(samplesCoversDir, { recursive: true });

  // Generate Sample Audio Files if missing
  const sampleTracksConfig = [
    {
      id: 'track-1',
      title: 'Neon Horizon',
      artist: 'CyberPulse',
      album: 'Synthwave Odyssey',
      genre: 'Synthwave',
      duration: 120,
      filename: 'neon-horizon.wav',
      freq: 220,
      type: 'synthwave' as const,
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'track-2',
      title: 'Midnight Coffee',
      artist: 'Lofi Dreams',
      album: 'Chill Studies Vol. 1',
      genre: 'Lofi',
      duration: 180,
      filename: 'midnight-coffee.wav',
      freq: 174.61,
      type: 'lofi' as const,
      coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'track-3',
      title: 'Celestial Drift',
      artist: 'Aetheria',
      album: 'Cosmic Resonance',
      genre: 'Ambient',
      duration: 210,
      filename: 'celestial-drift.wav',
      freq: 130.81,
      type: 'ambient' as const,
      coverUrl: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?auto=format&fit=crop&w=600&q=80',
    },
    {
      id: 'track-4',
      title: 'Cyber Overdrive',
      artist: 'NeuroRunner',
      album: 'Grid Protocol',
      genre: 'Cyberpunk',
      duration: 150,
      filename: 'cyber-overdrive.wav',
      freq: 110,
      type: 'cyberpunk' as const,
      coverUrl: 'https://images.unsplash.com/photo-1550684848-fac1c5b4e853?auto=format&fit=crop&w=600&q=80',
    },
  ];

  for (const item of sampleTracksConfig) {
    const audioFilePath = path.join(samplesAudioDir, item.filename);
    if (!fs.existsSync(audioFilePath)) {
      console.log(`Generating synthesized sample track: ${item.title}`);
      const wavBuffer = generateSynthWav(15, item.freq, item.type);
      fs.writeFileSync(audioFilePath, wavBuffer);
    }
  }

  // Clear existing tracks
  await prisma.playlistTrack.deleteMany();
  await prisma.likedTrack.deleteMany();
  await prisma.track.deleteMany();
  await prisma.playlist.deleteMany();

  // Create Tracks in DB
  const createdTracks = [];
  for (const item of sampleTracksConfig) {
    const track = await prisma.track.create({
      data: {
        id: item.id,
        title: item.title,
        artist: item.artist,
        album: item.album,
        genre: item.genre,
        duration: item.duration,
        audioUrl: `/samples/audio/${item.filename}`,
        coverUrl: item.coverUrl,
        isLiked: item.id === 'track-1' || item.id === 'track-2',
        playCount: Math.floor(Math.random() * 500) + 100,
      },
    });
    createdTracks.push(track);
  }

  // Create Featured Playlists
  const playlist1 = await prisma.playlist.create({
    data: {
      id: 'playlist-1',
      title: 'Cyberpunk Essentials',
      description: 'Futuristic synthwave and high-octane electronic beats for deep coding sessions.',
      coverUrl: 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80',
      tracks: {
        create: [
          { trackId: createdTracks[0].id, position: 0 },
          { trackId: createdTracks[3].id, position: 1 },
        ],
      },
    },
  });

  const playlist2 = await prisma.playlist.create({
    data: {
      id: 'playlist-2',
      title: 'Late Night Lofi',
      description: 'Mellow chillhop beats, vinyl crackles, and cozy relaxing melodies.',
      coverUrl: 'https://images.unsplash.com/photo-1518609878373-06d740f60d8b?auto=format&fit=crop&w=600&q=80',
      tracks: {
        create: [
          { trackId: createdTracks[1].id, position: 0 },
          { trackId: createdTracks[2].id, position: 1 },
        ],
      },
    },
  });

  console.log('Database seeded successfully with tracks and playlists!');
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
