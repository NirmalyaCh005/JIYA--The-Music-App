import { NextRequest, NextResponse } from 'next/server';
import { ALL_INITIAL_TRACKS } from '@/lib/constants/featuredTracks';

export const dynamic = 'force-dynamic';

const searchCache = new Map<string, any[]>();
let spotifyTokenCache: { token: string; expiresAt: number } | null = null;

// Helper: Get Spotify Client Access Token
async function getSpotifyAccessToken(clientId: string, clientSecret: string): Promise<string | null> {
  if (spotifyTokenCache && Date.now() < spotifyTokenCache.expiresAt) {
    return spotifyTokenCache.token;
  }

  try {
    const credentials = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const res = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        'Authorization': `Basic ${credentials}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: 'grant_type=client_credentials',
      next: { revalidate: 3500 },
    });

    if (!res.ok) return null;
    const data = await res.json();

    if (data.access_token) {
      spotifyTokenCache = {
        token: data.access_token,
        expiresAt: Date.now() + (data.expires_in - 100) * 1000,
      };
      return data.access_token;
    }
  } catch (e) {
    // Ignore token errors
  }
  return null;
}

// 1. Official Spotify Web API Search Engine
async function searchSpotifyOfficialApi(query: string, clientId: string, clientSecret: string): Promise<any[]> {
  try {
    const token = await getSpotifyAccessToken(clientId, clientSecret);
    if (!token) return [];

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=15`;
    const res = await fetch(url, {
      headers: { 'Authorization': `Bearer ${token}` },
    });

    if (!res.ok) return [];
    const data = await res.json();
    if (!data.tracks || !Array.isArray(data.tracks.items)) return [];

    return data.tracks.items.map((item: any) => {
      const coverUrl = item.album?.images?.[0]?.url || 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
      const artist = item.artists?.map((a: any) => a.name).join(', ') || 'Artist';

      const localMatch = ALL_INITIAL_TRACKS.find(
        (t) =>
          t.title.toLowerCase().includes(item.name.toLowerCase()) ||
          item.name.toLowerCase().includes(t.title.toLowerCase())
      );

      return {
        id: `spotify-${item.id}`,
        title: item.name,
        artist,
        album: item.album?.name || 'Single',
        genre: 'Spotify Music',
        duration: Math.round(item.duration_ms / 1000) || 210,
        youtubeId: localMatch ? localMatch.youtubeId : null,
        coverUrl,
      };
    });
  } catch (e) {
    return [];
  }
}

// 2. Official YouTube Data API v3 Search (With Automatic Zero-Quota Scraper Fallback)
async function searchYouTubeOfficialApi(query: string, apiKey: string): Promise<any[]> {
  try {
    const url = `https://www.googleapis.com/youtube/v3/search?part=snippet&type=video&videoCategoryId=10&maxResults=12&q=${encodeURIComponent(
      query
    )}&key=${apiKey}`;
    const res = await fetch(url);
    if (!res.ok) {
      console.warn('YouTube API Quota Limit Exceeded (403), using direct scraper fallback');
      return searchYouTubeDirect(query);
    }

    const data = await res.json();
    if (!data.items || !Array.isArray(data.items) || data.items.length === 0) {
      return searchYouTubeDirect(query);
    }

    return data.items.map((item: any) => ({
      id: `yt-api-${item.id?.videoId || Math.random()}`,
      title: (item.snippet?.title || query)
        .replace(/&quot;/g, '"')
        .replace(/&#39;/g, "'")
        .replace(/&amp;/g, '&')
        .replace(/\(Official Video\)/gi, '')
        .replace(/\[Official Music Video\]/gi, '')
        .trim(),
      artist: item.snippet?.channelTitle || 'Artist',
      album: 'Single',
      genre: 'YouTube Music',
      duration: 210,
      youtubeId: item.id?.videoId,
      coverUrl: item.snippet?.thumbnails?.high?.url || item.snippet?.thumbnails?.medium?.url,
    }));
  } catch (e) {
    return searchYouTubeDirect(query);
  }
}

// 3. Direct YouTube HTML Scraper Engine
async function searchYouTubeDirect(query: string): Promise<any[]> {
  try {
    const searchUrl = `https://www.youtube.com/results?search_query=${encodeURIComponent(query + ' song')}`;
    const res = await fetch(searchUrl, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
        'Accept-Language': 'en-US,en;q=0.9',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const html = await res.text();
    const match = html.match(/var ytInitialData = ({.*?});<\/script>/);
    if (!match) return [];

    const data = JSON.parse(match[1]);
    const contents =
      data.contents?.twoColumnSearchResultsRenderer?.primaryContents?.sectionListRenderer?.contents;

    const items: any[] = [];
    if (contents && Array.isArray(contents)) {
      for (const section of contents) {
        const itemSection = section.itemSectionRenderer?.contents;
        if (itemSection && Array.isArray(itemSection)) {
          for (const item of itemSection) {
            const vr = item.videoRenderer;
            if (vr && vr.videoId) {
              const videoId = vr.videoId;
              const rawTitle = vr.title?.runs?.[0]?.text || query;
              const title = rawTitle
                .replace(/\(Official Video\)/gi, '')
                .replace(/\[Official Music Video\]/gi, '')
                .replace(/\(Audio\)/gi, '')
                .trim();

              const artist = vr.ownerText?.runs?.[0]?.text || 'Artist';
              const rawThumb = vr.thumbnail?.thumbnails?.slice(-1)[0]?.url;
              const coverUrl = rawThumb || `https://i.ytimg.com/vi/${videoId}/hqdefault.jpg`;
              const duration = 210;

              items.push({
                id: `yt-${videoId}`,
                title,
                artist,
                album: 'Single',
                genre: 'YouTube Music',
                duration,
                youtubeId: videoId,
                coverUrl,
              });

              if (items.length >= 15) break;
            }
          }
        }
        if (items.length >= 15) break;
      }
    }

    return items;
  } catch (err) {
    return [];
  }
}

// 4. iTunes Global Search API Engine
async function searchiTunes(query: string): Promise<any[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&entity=song&limit=10`;
    const res = await fetch(url);
    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results)) return [];

    return data.results.map((item: any) => {
      const coverUrl = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

      const localMatch = ALL_INITIAL_TRACKS.find(
        (t) =>
          t.title.toLowerCase().includes(item.trackName.toLowerCase()) ||
          item.trackName.toLowerCase().includes(t.title.toLowerCase())
      );

      return {
        id: `itunes-${item.trackId}`,
        title: item.trackName,
        artist: item.artistName,
        album: item.collectionName || 'Single',
        genre: item.primaryGenreName || 'Music',
        duration: Math.round(item.trackTimeMillis / 1000) || 210,
        youtubeId: localMatch ? localMatch.youtubeId : null,
        coverUrl,
      };
    });
  } catch (err) {
    return [];
  }
}

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const query = searchParams.get('q')?.trim();

    if (!query) {
      return NextResponse.json([]);
    }

    const cacheKey = query.toLowerCase();
    if (searchCache.has(cacheKey)) {
      return NextResponse.json(searchCache.get(cacheKey));
    }

    const ytApiKey = process.env.YOUTUBE_API_KEY;
    const spotifyClientId = process.env.SPOTIFY_CLIENT_ID;
    const spotifyClientSecret = process.env.SPOTIFY_CLIENT_SECRET;

    // A. Match local initial tracks
    const localMatches = ALL_INITIAL_TRACKS.filter(
      (t) =>
        t.title.toLowerCase().includes(cacheKey) ||
        t.artist.toLowerCase().includes(cacheKey) ||
        (t.album && t.album.toLowerCase().includes(cacheKey))
    );

    // B. Fetch live results from Spotify, YouTube, iTunes
    const [spotifyResults, ytResults, itunesResults] = await Promise.all([
      spotifyClientId && spotifyClientSecret
        ? searchSpotifyOfficialApi(query, spotifyClientId, spotifyClientSecret)
        : Promise.resolve([]),
      ytApiKey
        ? searchYouTubeOfficialApi(query, ytApiKey)
        : searchYouTubeDirect(query),
      searchiTunes(query),
    ]);

    // Combine & deduplicate results
    const combined: any[] = [...localMatches, ...spotifyResults];
    const existingTitles = new Set(combined.map((t) => t.title.toLowerCase()));

    for (const item of ytResults) {
      if (!existingTitles.has(item.title.toLowerCase())) {
        combined.push(item);
        existingTitles.add(item.title.toLowerCase());
      }
    }

    for (const item of itunesResults) {
      if (!existingTitles.has(item.title.toLowerCase())) {
        combined.push(item);
        existingTitles.add(item.title.toLowerCase());
      }
    }

    if (combined.length > 0) {
      searchCache.set(cacheKey, combined);
      if (searchCache.size > 300) {
        const firstKey = searchCache.keys().next().value;
        if (firstKey) searchCache.delete(firstKey);
      }
    }

    return NextResponse.json(combined);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to perform search' }, { status: 500 });
  }
}
