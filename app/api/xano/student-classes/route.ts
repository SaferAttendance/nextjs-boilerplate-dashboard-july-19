// app/api/xano/student-classes/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function studentClassesEndpoint() {
  const direct = process.env.XANO_STUDENT_CLASSES_URL; // optional full URL
  if (direct) return direct.replace(/\/$/, '');
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/Get_Student_Classes_for_admin`;
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
  const email    = readCookie(req, 'email');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const url = new URL(studentClassesEndpoint());
  url.searchParams.set('student_id', student_id);
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code',   school);
  if (email) {
    url.searchParams.set('admin_email', email);
    url.searchParams.set('email', email);
  }

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;

  const r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });

  const ct = r.headers.get('content-type') || '';
  const body = ct.includes('application/json') ? await r.json() : await r.text();
  return NextResponse.json(body, { status: r.status });
}
