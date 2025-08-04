// app/api/xano/student/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

function studentSearchEndpoint(): string {
  // Prefer the direct full URL you provided
  const direct = process.env.XANO_STUDENTS_SEARCH_URL || process.env.XANO_STUDENT_SEARCH_URL;
  if (direct) return direct.replace(/\/$/, '');

  // Fallback: construct from base if ever needed
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/Admin_Student_Search`;
}

function isLikelyId(q: string): boolean {
  // treat as ID if all digits (or digits with minor spaces)
  return /^[0-9]+$/.test(q.trim());
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Missing query (q)' }, { status: 400 });
  }

  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const url = new URL(studentSearchEndpoint());
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);

  if (isLikelyId(q)) {
    // Xano expects Student_ID_Search for ID lookups
    url.searchParams.set('Student_ID_Search', q);
  } else {
    // Xano expects Student_Name_Search for name lookups
    url.searchParams.set('Student_Name_Search', q);
  }

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

  // Try to return JSON; if Xano returned HTML/text (e.g., wrong path), map to 502 with snippet
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
