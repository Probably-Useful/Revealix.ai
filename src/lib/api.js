/**
 * API base URL
 * Dev:  Vite proxy rewrites /api → http://localhost:5000
 * Prod: Set VITE_API_URL env var in Netlify to your Railway URL
 */
const BASE = (import.meta.env.VITE_API_URL ?? '/api').replace(/\/$/, '');

export const api = {
  post: (path, body) =>
    fetch(`${BASE}${path}`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: body ? JSON.stringify(body) : undefined,
    }),

  get: (path) => fetch(`${BASE}${path}`),

  videoFeedUrl: () => `${BASE}/video_feed?t=${Date.now()}`,
};
