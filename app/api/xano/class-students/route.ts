// app/api/xano/class-students/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  // If you want to set the full URL explicitly:
  // XANO_CLASS_STUDENTS_URL=https://x8ki-.../Admin_AllStudentsFromParticularClass
  const direct = process.env.XANO_CLASS_STUDENTS_URL;
  if (direct) return direct.replace(/\/$/, '');

  const base =
    process.env.XANO_BASE_URL ||
    process.env.NEXT_PUBLIC_XANO_BASE ||
    '';

  // Default to your endpoint name
  return `${base.replace(/\/$/, '')}/Admin_AllStudentsFromParticularClass`;
}

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = (searchParams.get('class_id') || '').trim();
  const teacherEmail = (searchParams.get('teacher_email') || '').trim();

  if (!classId || !teacherEmail) {
    return NextResponse.json(
      { error: 'Missing class_id or teacher_email' },
      { status: 400 }
    );
  }

  // Scope from cookies (set by /api/session GET)
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');
  const adminEmail =
    readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const url = new URL(endpoint());
  // Your Xano endpoint expects *these exact names*
  url.searchParams.set('Teacher_Email', teacherEmail);
  url.searchParams.set('Class_ID', classId);
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);

  // Optional context often useful on the backend
  if (adminEmail) {
    url.searchParams.set('admin_email', adminEmail);
    url.searchParams.set('email', adminEmail);
  }

  const headers: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const r = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });

  const data = await r.json().catch(() => ({}));
  return NextResponse.json(data, { status: r.status });
}
