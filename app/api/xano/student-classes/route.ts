// app/api/xano/student-classes/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

function studentClassesEndpoint(): string {
  const direct = process.env.XANO_STUDENTS_CLASSES_URL || process.env.XANO_STUDENT_CLASSES_URL;
  if (direct) return direct.replace(/\/$/, '');
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/Get_Student_Classes_for_admin`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Accept several possible names from the client, normalize to one
  const studentIdParam =
    searchParams.get('student_id') ??
    searchParams.get('Student_ID') ??
    searchParams.get('StudentId') ??
    searchParams.get('id') ??
    '';

  if (!studentIdParam) {
    return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
  }

  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const url = new URL(studentClassesEndpoint());
  // Send both common casings to Xano just in case
  url.searchParams.set('student_id', String(studentIdParam));
  url.searchParams.set('Student_ID', String(studentIdParam));
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);

  const headers: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  let r: Response;
  try {
    r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
  } catch (e) {
    return NextResponse.json({ error: 'Upstream request failed' }, { status: 502 });
  }

  if (!r.ok) {
    const snippet = await r.clone().text().then(t => t.slice(0, 300)).catch(() => '');
    console.warn('Xano student-classes not OK:', r.status, url.toString(), snippet);
  }

  try {
    const data = await r.clone().json();
    return NextResponse.json(data, { status: r.status });
  } catch {
    const text = await r.text();
    return NextResponse.json(
      { error: 'Upstream returned non-JSON', upstreamStatus: r.status, snippet: text.slice(0, 300) },
      { status: 502 },
    );
  }
}
