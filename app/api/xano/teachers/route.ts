// app/api/xano/teachers/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';

export const runtime = 'nodejs';

// If your search endpoint is on a different Xano group, set:
// XANO_SEARCH_TEACHERS_URL=https://x8ki-letl-twmt.n7.xano.io/api:S0u99hr6/admin_search_teachers
// Otherwise falls back to `${XANO_BASE_URL}/admin_search_teachers` or `${NEXT_PUBLIC_XANO_BASE}/admin_search_teachers`
function teachersEndpoint() {
  const direct = process.env.XANO_SEARCH_TEACHERS_URL;
  if (direct) return direct.replace(/\/$/, '');
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/admin_search_teachers`;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);

  // Accept a single 'q' OR explicit fields. Explicit wins.
  const q = (searchParams.get('q') || '').trim();
  let teacherEmail = (searchParams.get('teacher_email') || '').trim();
  let teacherName  = (searchParams.get('teacher_name')  || '').trim();

  if (!teacherEmail && !teacherName) {
    if (!q) {
      return NextResponse.json({ error: 'Missing query. Provide q, teacher_email, or teacher_name' }, { status: 400 });
    }
    if (q.includes('@')) teacherEmail = q;
    else teacherName = q;
  }

  // ---- Scope from cookies
  const jar = cookies();
  const district = jar.get('district_code')?.value;
  const school   = jar.get('school_code')?.value;

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope (district_code/school_code)' }, { status: 401 });
  }

  // ---- Build Xano request
  const url = new URL(teachersEndpoint());
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);
  if (teacherEmail) url.searchParams.set('teacher_email', teacherEmail);
  if (teacherName)  url.searchParams.set('teacher_name',  teacherName);

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const r = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
