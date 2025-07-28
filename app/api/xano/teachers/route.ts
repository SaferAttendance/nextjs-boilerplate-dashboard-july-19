// app/api/xano/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
{/* test */}
export const runtime = 'nodejs';

function teachersEndpoint() {
  const direct = process.env.XANO_SEARCH_TEACHERS_URL; // full URL optional
  if (direct) return direct.replace(/\/$/, '');
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/admin_search_teachers`;
}

// Normalize cookie reads across runtimes/types
function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Missing query (q)' }, { status: 400 });
  }

  // ---- scope from cookies
  const email =
    readCookie(req, 'email') ||
    readCookie(req, 'session_email') ||
    undefined;

  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  // ---- build Xano request with your exact input names
  const url = new URL(teachersEndpoint());
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);

  if (q.includes('@')) {
    url.searchParams.set('teacher_email', q);
  } else {
    url.searchParams.set('teacher_name', q);
  }

  // some Xano flows prefer / log admin context
  if (email) {
    url.searchParams.set('email', email);
    url.searchParams.set('admin_email', email);
  }

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
