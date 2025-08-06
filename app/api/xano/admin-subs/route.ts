// app/api/xano/admin-subs/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

function baseUrl() {
  return (
    process.env.XANO_BASE_URL ||
    process.env.NEXT_PUBLIC_XANO_BASE ||
    ''
  ).replace(/\/$/, '');
}

function listEndpoint() {
  return (
    process.env.XANO_ADMIN_SUBS_LIST_URL ||
    process.env.XANO_SUBS_LIST_URL || // alias
    `${baseUrl()}/adminSubAssignmentsList`
  ).replace(/\/$/, '');
}

function unrestrictEndpoint() {
  return (
    process.env.XANO_ADMIN_UNRESTRICT_URL ||
    process.env.XANO_UNRESTRICT_TEACHER_URL || // alias
    `${baseUrl()}/admin_unrestrictTeacherAccess`
  ).replace(/\/$/, '');
}

function authHeaders(): HeadersInit {
  const h: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) {
    h.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }
  return h;
}

export async function GET(req: NextRequest) {
  // Required by Xano list endpoint:
  // school_code, district_code, admin_email (from cookies)
  const district_code = readCookie(req, 'district_code');
  const school_code = readCookie(req, 'school_code');
  const admin_email = readCookie(req, 'email') || readCookie(req, 'admin_email');

  if (!district_code || !school_code || !admin_email) {
    return NextResponse.json(
      { error: 'Missing admin scope (district_code/school_code/admin_email)' },
      { status: 401 }
    );
  }

  const url = new URL(listEndpoint());
  url.searchParams.set('district_code', district_code);
  url.searchParams.set('school_code', school_code);
  url.searchParams.set('admin_email', admin_email);

  const r = await fetch(url.toString(), {
    method: 'GET',
    headers: authHeaders(),
    cache: 'no-store',
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}

export async function POST(req: NextRequest) {
  // Required by Xano unrestrict endpoint:
  // admin_email, teacher_email, sub_email, class_id, school_code, district_code, class_name
  const body = await req.json().catch(() => ({} as any));
  const teacher_email = (body?.teacher_email || '').trim();
  const sub_email = (body?.sub_email || '').trim();
  const class_id = (body?.class_id || '').toString().trim();
  const class_name = (body?.class_name || '').toString().trim();

  const district_code = readCookie(req, 'district_code');
  const school_code = readCookie(req, 'school_code');
  const admin_email = readCookie(req, 'email') || readCookie(req, 'admin_email');

  const missing: string[] = [];
  if (!admin_email) missing.push('admin_email');
  if (!teacher_email) missing.push('teacher_email');
  if (!sub_email) missing.push('sub_email');
  if (!class_id) missing.push('class_id');
  if (!class_name) missing.push('class_name');
  if (!school_code) missing.push('school_code');
  if (!district_code) missing.push('district_code');

  if (missing.length) {
    return NextResponse.json(
      { error: `Missing required fields: ${missing.join(', ')}` },
      { status: 400 }
    );
  }

  const r = await fetch(unrestrictEndpoint(), {
    method: 'POST',
    headers: {
      ...authHeaders(),
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      admin_email,
      teacher_email,
      sub_email,
      class_id,
      class_name,
      school_code,
      district_code,
    }),
    cache: 'no-store',
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
