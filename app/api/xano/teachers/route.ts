import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// If you have a full URL, put it in XANO_SEARCH_TEACHERS_URL.
// Otherwise we build it from the base.
function teachersEndpoint(): string {
  const direct = process.env.XANO_SEARCH_TEACHERS_URL;
  if (direct) return direct.replace(/\/$/, '');
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/admin_search_teachers`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Missing query (q)' }, { status: 400 });
  }

  // ---- Scope from cookies (NO await on cookies())
  const jar = cookies();
  const district = jar.get('district_code')?.value;
  const school   = jar.get('school_code')?.value;

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  // Build the Xano request with the exact input names your endpoint expects
  const url = new URL(teachersEndpoint());
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);

  // Xano inputs: teacher_email or teacher_name — choose based on input
  if (q.includes('@')) {
    url.searchParams.set('teacher_email', q);
  } else {
    url.searchParams.set('teacher_name', q);
  }

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
  const data = await r.json();

  return NextResponse.json(data, { status: r.status });
}
