import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  const direct = process.env.XANO_STUDENT_CLASSES_URL;
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return (direct || `${base.replace(/\/$/, '')}/Get_Student_Classes_for_admin`).replace(/\/$/, '');
}

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const student_id = (searchParams.get('student_id') || '').trim();
  if (!student_id) return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });

  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');

  const url = new URL(endpoint());
  url.searchParams.set('student_id', student_id);
  if (district) url.searchParams.set('district_code', district);
  if (school)   url.searchParams.set('school_code', school);

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
