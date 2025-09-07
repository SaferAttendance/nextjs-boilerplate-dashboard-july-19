import { NextRequest, NextResponse } from 'next/server';

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

  // ---- Get user info from cookies
  const email = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  const roleRaw = readCookie(req, 'role') || '';
  const role = roleRaw.toLowerCase(); // normalize
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');

  // ---- Check permissions
  const isAdmin = role === 'admin';
  const isTeacherOrSub = role === 'teacher' || role === 'substitute' || role === 'sub';

  // Admins MUST have district and school codes
  if (isAdmin && (!district || !school)) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  // Teachers/Subs can only search for themselves (exact email if an email was queried)
  if (isTeacherOrSub) {
    const userEmailLower = (email || '').toLowerCase().trim();
    if (!userEmailLower) {
      return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
    }
    if (q.includes('@') && q.toLowerCase().trim() !== userEmailLower) {
      return NextResponse.json({ error: 'Teachers can only view their own classes' }, { status: 403 });
    }
  }

  // If not admin and not teacher/sub, deny access
  if (!isAdmin && !isTeacherOrSub) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  // ---- Build Xano request
  const url = new URL(teachersEndpoint());

  // Add district/school if available (required for admin, optional for teachers)
  if (district) url.searchParams.set('district_code', district);
  if (school) url.searchParams.set('school_code', school);

  // For teachers/subs, force self lookup by email regardless of q
  if (isTeacherOrSub && email) {
    url.searchParams.set('teacher_email', email);
  } else if (q.includes('@')) {
    url.searchParams.set('teacher_email', q);
  } else {
    url.searchParams.set('teacher_name', q);
  }

  // Add email context
  if (email) {
    url.searchParams.set('email', email);
    if (isAdmin) url.searchParams.set('admin_email', email);
  }

  const headers: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  try {
    const r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
    const data = await r.json();

    // Extra safety: if teacher/sub, filter to only their own rows
    if (isTeacherOrSub && email && Array.isArray(data)) {
      const emailLower = email.toLowerCase().trim();
      const filtered = data.filter((row: any) => (row.teacher_email || '').toLowerCase().trim() === emailLower);
      return NextResponse.json(filtered, { status: 200 });
    }

    return NextResponse.json(data, { status: r.status });
  } catch (error) {
    console.error('GET /api/xano/teachers error:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher data' }, { status: 500 });
  }
}
