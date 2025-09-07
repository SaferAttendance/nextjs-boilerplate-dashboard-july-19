// app/api/xano/teachers/route.ts
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
  const role = readCookie(req, 'role');
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');

  // ---- Check permissions
  const isAdmin = role === 'admin';
  // Handle both 'sub' and 'substitute' variations
  const isTeacherOrSub = role === 'teacher' || role === 'substitute' || role === 'sub';

  // Admins need district and school codes
  if (isAdmin && (!district || !school)) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  // Teachers/Subs can only search for themselves
  if (isTeacherOrSub) {
    const queryLower = q.toLowerCase().trim();
    const userEmailLower = (email || '').toLowerCase().trim();
    
    // Check if they're searching for themselves
    if (queryLower !== userEmailLower) {
      return NextResponse.json({ error: 'Teachers can only view their own classes' }, { status: 403 });
    }
  }

  // If not admin and not teacher/sub, deny access
  if (!isAdmin && !isTeacherOrSub) {
    return NextResponse.json({ error: 'Unauthorized access' }, { status: 403 });
  }

  // ---- Build Xano request
  const url = new URL(teachersEndpoint());
  
  // For teachers, we still need to pass district/school if available
  // Some teachers might have these cookies set
  if (district) url.searchParams.set('district_code', district);
  if (school) url.searchParams.set('school_code', school);
  
  // Set the search parameters
  if (q.includes('@')) {
    url.searchParams.set('teacher_email', q);
  } else {
    url.searchParams.set('teacher_name', q);
  }

  // Add email context
  if (email) {
    url.searchParams.set('email', email);
    if (isAdmin) {
      url.searchParams.set('admin_email', email);
    }
  }

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  try {
    const r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
    const data = await r.json();
    
    // If teacher/sub, filter results to only their own data (extra safety)
    if (isTeacherOrSub && email && Array.isArray(data)) {
      const filteredData = data.filter((row: any) => {
        const teacherEmail = (row.teacher_email || '').toLowerCase().trim();
        return teacherEmail === email.toLowerCase().trim();
      });
      return NextResponse.json(filteredData, { status: 200 });
    }
    
    return NextResponse.json(data, { status: r.status });
  } catch (error) {
    console.error('Error fetching teacher data:', error);
    return NextResponse.json({ error: 'Failed to fetch teacher data' }, { status: 500 });
  }
}
