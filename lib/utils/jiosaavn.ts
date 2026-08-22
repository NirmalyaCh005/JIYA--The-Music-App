import { Track } from '@/types/music';

// Clean HTML entities from string
function cleanText(text: string): string {
  if (!text) return '';
  return text
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/&amp;/g, '&')
    .replace(/&lt;/g, '<')
    .replace(/&gt;/g, '>')
    .replace(/\(From &quot;.*?&quot;\)/gi, '')
    .replace(/\(From ".*?"\)/gi, '')
    .trim();
}

// Upgrade thumbnail image URL to 500x500 high resolution
function upgradeCoverUrl(url: string | null | undefined): string {
  if (!url) return 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
  return url
    .replace('150x150', '500x500')
    .replace('50x50', '500x500')
    .replace('http://', 'https://');
}

// Map raw JioSaavn API song object to clean app Track object with FULL-LENGTH 320kbps / 160kbps audioUrl
export function mapJioSaavnSongToTrack(item: any): Track {
  const title = cleanText(item.song || item.name || item.title || 'Untitled Track');
  const artist = cleanText(
    item.primary_artists ||
      item.singers ||
      item.music ||
      (typeof item.artist === 'string' ? item.artist : item.artist?.name) ||
      'Artist'
  );
  const album = cleanText(
    typeof item.album === 'object' ? item.album?.name : item.album || 'Single'
  );

  const duration = item.duration ? Number(item.duration) : 210;
  
  let rawCover = item.image;
  if (Array.isArray(item.image)) {
    rawCover = item.image[2]?.link || item.image[2]?.url || item.image[1]?.link || item.image[0]?.link || item.image[0]?.url;
  }
  const coverUrl = upgradeCoverUrl(rawCover || item.coverUrl);

  // Extract FULL-LENGTH audio URL from downloadUrl (downloadUrl[4] = 320kbps, downloadUrl[3] = 160kbps)
  let fullAudioUrl: string | null = null;
  const dUrls = item.downloadUrl || item.download_url;

  if (Array.isArray(dUrls) && dUrls.length > 0) {
    fullAudioUrl =
      dUrls[4]?.url ||
      dUrls[4]?.link ||
      dUrls[3]?.url ||
      dUrls[3]?.link ||
      dUrls[dUrls.length - 1]?.url ||
      dUrls[dUrls.length - 1]?.link ||
      dUrls[0]?.url ||
      dUrls[0]?.link ||
      null;
  } else if (typeof dUrls === 'string') {
    fullAudioUrl = dUrls;
  }

  // Ensure we NEVER select preview or jiotunepreview
  if (fullAudioUrl && (fullAudioUrl.includes('jiotunepreview.jio.com') || fullAudioUrl.includes('_96_p.mp4'))) {
    fullAudioUrl = null;
  }

  return {
    id: `saavn-${item.id || Math.random().toString(36).substring(7)}`,
    title,
    artist,
    album,
    genre: item.language ? `${item.language.toUpperCase()} Music` : 'JioSaavn Music',
    duration,
    coverUrl,
    audioUrl: fullAudioUrl,
    youtubeId: item.youtubeId || null,
    source: 'saavn',
  };
}

// 1. Unified Search Songs via JioSaavn API Endpoints
export async function searchJioSaavnSongs(query: string, limit: number = 20): Promise<Track[]> {
  const endpoints = [
    `https://saavn.dev/api/search/songs?query=${encodeURIComponent(query)}&page=1&limit=${limit}`,
    `https://jiosaavn-api-privatecvc2.vercel.app/search?query=${encodeURIComponent(query)}`,
    `https://saavn.me/search/songs?query=${encodeURIComponent(query)}`,
    `https://saavn.me/api/search/songs?query=${encodeURIComponent(query)}&limit=${limit}`,
    `https://www.jiosaavn.com/api.php?__call=search.getResults&_format=json&_marker=0&p=1&n=${limit}&q=${encodeURIComponent(query)}`,
  ];

  for (const endpoint of endpoints) {
    try {
      const res = await fetch(endpoint, {
        headers: {
          'User-Agent':
            'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
          'Accept-Language': 'en-US,en;q=0.9',
        },
        next: { revalidate: 3600 },
      });

      if (!res.ok) continue;

      const data = await res.json();
      const results = data?.data?.results || data?.results || data;

      if (results && Array.isArray(results) && results.length > 0) {
        const mapped = results.map(mapJioSaavnSongToTrack);
        if (mapped.some((t) => t.audioUrl)) return mapped;
      }
    } catch (err) {
      // Try next endpoint
    }
  }

  return [];
}

// 2. Fetch Featured Trending Playlists / Charts
export async function getJioSaavnTrendingCharts(): Promise<{ id: string; title: string; tracks: Track[] }[]> {
  try {
    const url = `https://www.jiosaavn.com/api.php?__call=content.getFeaturedPlaylists&_format=json&_marker=0&p=1&n=12`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!Array.isArray(data)) return [];

    const chartPromises = data.slice(0, 4).map(async (playlistItem: any) => {
      const listId = playlistItem.listid;
      const title = cleanText(playlistItem.listname || playlistItem.title || 'Trending Charts');

      if (!listId) return null;

      try {
        const pUrl = `https://www.jiosaavn.com/api.php?__call=playlist.getDetails&_format=json&listid=${listId}`;
        const pRes = await fetch(pUrl, {
          headers: { 'User-Agent': 'Mozilla/5.0' },
          next: { revalidate: 3600 },
        });

        if (pRes.ok) {
          const pData = await pRes.json();
          if (pData?.songs && Array.isArray(pData.songs)) {
            const tracks = pData.songs.map(mapJioSaavnSongToTrack);
            return { id: `saavn-pl-${listId}`, title, tracks };
          }
        }
      } catch (e) {}

      return null;
    });

    const charts = await Promise.all(chartPromises);
    return charts.filter(Boolean) as { id: string; title: string; tracks: Track[] }[];
  } catch (err) {
    console.warn('JioSaavn charts error:', err);
    return [];
  }
}
