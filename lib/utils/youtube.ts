/**
 * Sanitizes and extracts a strictly 11-character YouTube video ID.
 * Prevents YouTube Player Error Code 2 (Invalid Parameter).
 */
export function sanitizeYouTubeId(input?: string | null): string | null {
  if (!input || typeof input !== 'string') return null;
  const str = input.trim();
  if (!str) return null;

  // 1. Exact 11-character YouTube Video ID regex
  if (/^[a-zA-Z0-9_-]{11}$/.test(str)) {
    return str;
  }

  // 2. Extract from watch?v= parameter
  const vMatch = str.match(/[?&]v=([a-zA-Z0-9_-]{11})/);
  if (vMatch && vMatch[1]) {
    return vMatch[1];
  }

  // 3. Extract from shortened URLs (youtu.be/...) or embeds
  const shortMatch = str.match(/(?:youtu\.be\/|embed\/|v\/|shorts\/)([a-zA-Z0-9_-]{11})/);
  if (shortMatch && shortMatch[1]) {
    return shortMatch[1];
  }

  // 4. Fallback search for any 11-character sequence inside the string
  const genericMatch = str.match(/([a-zA-Z0-9_-]{11})/);
  if (genericMatch && genericMatch[1]) {
    return genericMatch[1];
  }

  return null;
}
