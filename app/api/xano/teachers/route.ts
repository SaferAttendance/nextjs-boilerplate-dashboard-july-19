// app/api/xano/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// Resolve the Xano endpoint (env override -> base/group fallback)
function teachersEndpoint() {
  const direct = process.env.XANO_SEARCH_TEACHERS_URL; // full URL optional
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

  // ✅ Use request cookies in route handlers
  const jar = req.cookies;
  const email =
    jar.get('email')?.value ||
    jar.get('session_email')?.value || // if you stored it under this name
    '';

  const district = jar.get('district_code')?.value;
  const school = jar.get('school_code')?.value;

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  // Build Xano request
  const url = new URL(teachersEndpoint());
  // Provide both keys your Xano endpoint accepts
  url.searchParams.set('teacher_email', q);
  url.searchParams.set('teacher_name', q);

  // Scope params from cookies
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);

  // Include who is searching (if your Xano flow needs it)
  if (email) url.searchParams.set('email', email);

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) {
    headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const r = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
