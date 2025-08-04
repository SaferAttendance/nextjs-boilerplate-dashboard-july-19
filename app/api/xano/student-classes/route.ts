// app/api/xano/student-classes/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  // Support either name in case the env var was created differently
  const direct =
    process.env.XANO_STUDENTS_CLASSES_URL ||
    process.env.XANO_STUDENT_CLASSES_URL;

  if (direct) return direct.replace(/\/$/, '');

  const base =
    process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/Get_Student_Classes_for_admin`;
}

// Normalize cookie read across runtimes
function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const student_id = (searchParams.get('student_id') || '').trim();
  const parent_email = (searchParams.get('parent_email') || '').trim();

  if (!student_id) {
    return NextResponse.json({ error: 'Missing student_id' }, { status: 400 });
  }

  // Scope from the admin’s session cookies
  const district_code = readCookie(req, 'district_code');
  const admin_email =
    readCookie(req, 'email') ||
    readCookie(req, 'admin_email') ||
    undefined;

  if (!district_code || !admin_email) {
    return NextResponse.json(
      { error: 'Missing admin scope (district_code/admin_email)' },
      { status: 401 },
    );
  }

  // Build Xano URL with required params
  const url = new URL(endpoint());
  url.searchParams.set('student_id', student_id);
  url.searchParams.set('district_code', district_code);
  url.searchParams.set('admin_email', admin_email);
  if (parent_email) url.searchParams.set('parent_email', parent_email);

  const headers: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const r = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  // Pass through Xano response
  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
