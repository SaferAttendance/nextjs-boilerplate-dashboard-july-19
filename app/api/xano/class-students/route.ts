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
  
  // FIXED: Using lowercase with underscores to match what likely works
  // Try both cases to be safe - your Xano API might expect either
  url.searchParams.set('teacher_email', teacherEmail);
  url.searchParams.set('Teacher_Email', teacherEmail);  // Also try PascalCase
  url.searchParams.set('class_id', classId);
  url.searchParams.set('Class_ID', classId);  // Also try PascalCase
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);
  
  // Optional context often useful on the backend
  if (adminEmail) {
    url.searchParams.set('admin_email', adminEmail);
    url.searchParams.set('email', adminEmail);
  }
  
  // Add timestamp to prevent caching
  url.searchParams.set('_ts', Date.now().toString());
  
  const headers: HeadersInit = { 
    Accept: 'application/json',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  };
  
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }
  
  console.log('Fetching class students from:', url.toString()); // Debug log
  
  const r = await fetch(url.toString(), {
    method: 'GET',
    headers,
    cache: 'no-store',
  });
  
  const data = await r.json().catch(() => ({}));
  
  console.log('Response status:', r.status); // Debug log
  console.log('Response data:', data); // Debug log
  
  return NextResponse.json(data, { status: r.status });
}
