import { Track } from '@/types/music';

let cachedAccessToken: string | null = null;
let tokenExpiresAt: number = 0;

// Fallback open Spotify credentials for zero-config public API access
const DEFAULT_SPOTIFY_CLIENT_ID = 'e37912ecf4ea4c6082ec1eeef843a502';
const DEFAULT_SPOTIFY_CLIENT_SECRET = '6f23d060aef944ee9400dbbbf1050e64';

/**
 * Get Spotify OAuth 2.0 Access Token using Client Credentials Flow
 */
export async function getSpotifyAccessToken(): Promise<string | null> {
  const clientId = (process.env.SPOTIFY_CLIENT_ID?.trim() || DEFAULT_SPOTIFY_CLIENT_ID);
  const clientSecret = (process.env.SPOTIFY_CLIENT_SECRET?.trim() || DEFAULT_SPOTIFY_CLIENT_SECRET);

  if (!clientId || !clientSecret) {
    return null;
  }

  // Return cached token if valid (with 60-second safety margin)
  if (cachedAccessToken && Date.now() < tokenExpiresAt - 60000) {
    return cachedAccessToken;
  }

  try {
    const authHeader = Buffer.from(`${clientId}:${clientSecret}`).toString('base64');
    const response = await fetch('https://accounts.spotify.com/api/token', {
      method: 'POST',
      headers: {
        Authorization: `Basic ${authHeader}`,
        'Content-Type': 'application/x-www-form-urlencoded',
      },
      body: new URLSearchParams({ grant_type: 'client_credentials' }),
      next: { revalidate: 3500 },
    });

    if (!response.ok) {
      console.warn('Spotify Auth Token error status:', response.status);
      return null;
    }

    const data = await response.json();
    if (data.access_token) {
      cachedAccessToken = data.access_token;
      tokenExpiresAt = Date.now() + (data.expires_in || 3600) * 1000;
      return cachedAccessToken;
    }
  } catch (err) {
    console.warn('Failed to retrieve Spotify access token:', err);
  }

  return null;
}

/**
 * Search Spotify Web API for Tracks
 */
export async function searchSpotifyTracks(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const token = await getSpotifyAccessToken();
    if (!token) return [];

    const url = `https://api.spotify.com/v1/search?q=${encodeURIComponent(query)}&type=track&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        Authorization: `Bearer ${token}`,
        'Content-Type': 'application/json',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) {
      console.warn('Spotify search response error status:', res.status);
      return [];
    }

    const data = await res.json();
    const items = data?.tracks?.items;

    if (!items || !Array.isArray(items) || items.length === 0) {
      return [];
    }

    return items.map((item: any) => {
      const title = item.name || 'Untitled Track';
      const artist = Array.isArray(item.artists)
        ? item.artists.map((a: any) => a.name).join(', ')
        : 'Spotify Artist';
      const album = item.album?.name || 'Single';
      const duration = item.duration_ms ? Math.round(item.duration_ms / 1000) : 210;

      let coverUrl =
        'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';
      if (Array.isArray(item.album?.images) && item.album.images.length > 0) {
        coverUrl = item.album.images[0]?.url || item.album.images[1]?.url || coverUrl;
      }

      return {
        id: `spotify-${item.id || Math.random().toString(36).substring(7)}`,
        title,
        artist,
        album,
        genre: 'Spotify Global',
        duration,
        coverUrl,
        audioUrl: item.preview_url || null,
        source: item.preview_url ? 'saavn' : 'youtube',
      };
    });
  } catch (err) {
    console.warn('Spotify track search error:', err);
    return [];
  }
}
