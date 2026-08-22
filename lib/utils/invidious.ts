import { Track } from '@/types/music';

// Clean title string
function cleanTitle(title: string): string {
  if (!title) return 'Untitled Track';
  return title
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/\[Official Music Video\]/gi, '')
    .replace(/\(Official Music Video\)/gi, '')
    .replace(/\[Official Video\]/gi, '')
    .replace(/\(Official Video\)/gi, '')
    .replace(/\[LYRIC VIDEO\]/gi, '')
    .replace(/\(Official Audio\)/gi, '')
    .trim();
}

// Convert Invidious / Piped video object to standard Track interface
export function mapInvidiousVideoToTrack(item: any): Track | null {
  const videoId =
    item.videoId ||
    item.id ||
    (typeof item.url === 'string' ? item.url.replace('/watch?v=', '') : null);

  if (!videoId || typeof videoId !== 'string' || videoId.length < 5) {
    return null;
  }

  const cleanYtId = videoId.replace('/watch?v=', '').trim();
  const rawTitle = item.title || 'Untitled';
  const title = cleanTitle(rawTitle);
  const artist = item.author || item.uploaderName || item.channelTitle || 'YouTube Music';
  const duration = Number(item.lengthSeconds || item.duration || 210);

  // Cover image extraction
  let coverUrl = `https://i.ytimg.com/vi/${cleanYtId}/hqdefault.jpg`;
  if (Array.isArray(item.videoThumbnails) && item.videoThumbnails.length > 0) {
    const highThumb = item.videoThumbnails.find((t: any) => t.quality === 'high' || t.quality === 'medium');
    coverUrl = highThumb?.url || item.videoThumbnails[0]?.url || coverUrl;
  } else if (item.thumbnail) {
    coverUrl = item.thumbnail;
  }

  return {
    id: `yt-${cleanYtId}`,
    title,
    artist,
    album: 'YouTube Audio',
    duration: isNaN(duration) || duration <= 0 ? 210 : duration,
    coverUrl,
    audioUrl: cleanYtId, // Direct YouTube Video ID for streaming bridge
    youtubeId: cleanYtId,
    source: 'youtube',
  };
}

// Tier 2: Search Invidious & Piped Mirrors for Zero-Quota YouTube Fallback
export async function searchInvidiousVideos(query: string, limit: number = 20): Promise<Track[]> {
  const endpoints = [
    `https://inv.nadeko.net/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    `https://invidious.nerdvpn.de/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    `https://api.piped.video/search?q=${encodeURIComponent(query)}&filter=videos`,
    `https://invidious.flokinet.to/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
    `https://inv.tux.in/api/v1/search?q=${encodeURIComponent(query)}&type=video`,
  ];

  for (const endpoint of endpoints) {
    try {
      const controller = new AbortController();
      const timeoutId = setTimeout(() => controller.abort(), 4000);

      const res = await fetch(endpoint, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          Accept: 'application/json',
        },
        signal: controller.signal,
        next: { revalidate: 3600 },
      });

      clearTimeout(timeoutId);

      if (!res.ok) continue;

      const data = await res.json();
      const rawList = Array.isArray(data) ? data : data?.items || data?.results;

      if (rawList && Array.isArray(rawList) && rawList.length > 0) {
        const tracks: Track[] = [];
        for (const item of rawList) {
          const track = mapInvidiousVideoToTrack(item);
          if (track) tracks.push(track);
          if (tracks.length >= limit) break;
        }

        if (tracks.length > 0) {
          return tracks;
        }
      }
    } catch (err) {
      // Continue to next mirror endpoint
    }
  }

  return [];
}
