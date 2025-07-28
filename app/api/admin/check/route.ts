// app/api/admin/check/route.ts
import { NextRequest, NextResponse } from 'next/server';

const XANO_ADMIN_CHECK_URL =
  process.env.XANO_ADMIN_CHECK_URL || process.env.NEXT_PUBLIC_XANO_ADMIN_CHECK_URL;

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const email = searchParams.get('email');

  if (!email) {
    return NextResponse.json({ error: 'Missing email' }, { status: 400 });
  }
  if (!XANO_ADMIN_CHECK_URL) {
    return NextResponse.json(
      { error: 'XANO_ADMIN_CHECK_URL is not configured' },
      { status: 500 }
    );
  }

  try {
    const upstream = await fetch(
      `${XANO_ADMIN_CHECK_URL}?email=${encodeURIComponent(email)}`,
      {
        method: 'GET',
        headers: {
          Accept: 'application/json',
          // Include API key only if your Xano endpoint requires it
          ...(process.env.XANO_API_KEY
            ? { Authorization: `Bearer ${process.env.XANO_API_KEY}` }
            : {}),
        },
        cache: 'no-store',
      }
    );

    const body = await upstream.json().catch(() => ({}));
    // Pass through the upstream status (200 for admin/non-admin, etc.)
    return NextResponse.json(body, { status: upstream.status });
  } catch (err) {
    console.error('Xano admin check proxy failed:', err);
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }
}
