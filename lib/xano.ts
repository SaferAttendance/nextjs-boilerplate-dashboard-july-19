// lib/xano.ts (server-only)
export const XANO_BASE = process.env.NEXT_PUBLIC_XANO_BASE!;
const API_KEY = process.env.XANO_API_KEY!; // set in Vercel (not NEXT_PUBLIC)

export async function xano<T>(path: string, init?: RequestInit): Promise<T> {
  if (!XANO_BASE) throw new Error('NEXT_PUBLIC_XANO_BASE missing');
  if (!API_KEY) throw new Error('XANO_API_KEY missing');

  const res = await fetch(`${XANO_BASE}${path}`, {
    ...init,
    headers: {
      'Content-Type': 'application/json',
      'x-api-key': API_KEY, // use the header format your Xano key expects
      ...(init?.headers || {}),
    },
    // Per-user data should not be cached
    cache: 'no-store',
  });

  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Xano error ${res.status}: ${text}`);
  }
  return res.json() as Promise<T>;
}
