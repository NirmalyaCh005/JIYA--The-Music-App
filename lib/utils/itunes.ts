import { Track } from '@/types/music';

export async function searchITunesSongs(query: string, limit: number = 20): Promise<Track[]> {
  try {
    const url = `https://itunes.apple.com/search?term=${encodeURIComponent(query)}&media=music&entity=song&limit=${limit}`;
    const res = await fetch(url, {
      headers: {
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/121.0.0.0 Safari/537.36',
      },
      next: { revalidate: 3600 },
    });

    if (!res.ok) return [];

    const data = await res.json();
    if (!data.results || !Array.isArray(data.results) || data.results.length === 0) {
      return [];
    }

    return data.results.map((item: any) => {
      const cover = item.artworkUrl100
        ? item.artworkUrl100.replace('100x100bb', '600x600bb')
        : 'https://images.unsplash.com/photo-1618005182384-a83a8bd57fbe?auto=format&fit=crop&w=600&q=80';

      return {
        id: `itunes-${item.trackId || Math.random().toString(36).substring(7)}`,
        title: item.trackName || 'Untitled Track',
        artist: item.artistName || 'iTunes Artist',
        album: item.collectionName || 'Single',
        genre: item.primaryGenreName || 'Music',
        duration: item.trackTimeMillis ? Math.round(item.trackTimeMillis / 1000) : 210,
        coverUrl: cover,
        audioUrl: item.previewUrl || null,
        source: item.previewUrl ? 'saavn' : 'youtube',
      };
    });
  } catch (err) {
    console.warn('iTunes API Search Error:', err);
    return [];
  }
}
