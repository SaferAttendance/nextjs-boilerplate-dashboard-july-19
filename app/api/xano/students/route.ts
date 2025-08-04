import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  const direct = process.env.XANO_STUDENTS_SEARCH_URL;
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return (direct || `${base.replace(/\/$/, '')}/Admin_Student_Search`).replace(/\/$/, '');
}

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();
  if (!q) return NextResponse.json({ error: 'Missing query (q)' }, { status: 400 });

  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');
  const email    = readCookie(req, 'email');

  const url = new URL(endpoint());

  // Map q -> student_id OR student_name (Xano ignores unknown params)
  if (/^\d+$/.test(q)) url.searchParams.set('student_id', q);
  else url.searchParams.set('student_name', q);

  if (district) url.searchParams.set('district_code', district);
  if (school)   url.searchParams.set('school_code', school);
  if (email)    url.searchParams.set('admin_email', email);

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;

  const r = await fetch(url.toString(), { headers, cache: 'no-store' });

  const ct = r.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await r.json() : await r.text();
  if (!ct.includes('application/json')) {
    return NextResponse.json({ error: 'Xano returned non-JSON response', preview: String(body).slice(0, 256) }, { status: 502 });
  }
  return NextResponse.json(body, { status: r.status });
}
