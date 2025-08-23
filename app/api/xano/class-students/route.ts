// app/api/xano/class-students/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  const direct = process.env.XANO_CLASS_STUDENTS_URL || process.env.XANO_CLASS_INFO_URL;
  if (direct) return direct.replace(/\/$/, '');
  
  const base =
    process.env.XANO_BASE_URL ||
    process.env.NEXT_PUBLIC_XANO_BASE ||
    '';
  
  // Use the same endpoint as the live dashboard
  return `${base.replace(/\/$/, '')}/class_info`;  // <-- Changed this!
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
  
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');
  const adminEmail =
    readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  
  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }
  
  const url = new URL(endpoint());
  
  // Use the same parameter names as in the live dashboard
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);
  
  // Try with class_id first, then class_name (same pattern as live dashboard)
  if (classId.match(/^\d+$/) || classId.startsWith('CLS')) {
    url.searchParams.set('class_id', classId);
  } else {
    url.searchParams.set('class_name', classId);
  }
  
  // Add teacher email parameter
  url.searchParams.set('teacher_email', teacherEmail);
  
  if (adminEmail) {
    url.searchParams.set('admin_email', adminEmail);
  }
  
  // Add cache busting
  url.searchParams.set('_ts', Date.now().toString());
  url.searchParams.set('_rand', Math.random().toString(36));
  
  const headers: HeadersInit = { 
    Accept: 'application/json',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  };
  
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }
  
  try {
    const r = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    const data = await r.json();
    
    // The response might be in different formats, normalize it
    const students = Array.isArray(data) ? data : 
                    data?.students || 
                    data?.records || 
                    [];
    
    // Map the fields to match what the component expects
    const normalizedStudents = students.map((student: any) => ({
      id: student.id || student.student_id,
      student_id: student.student_id || student.id,
      student_name: student.student_name || student.name || '—',
      attendance_status: student.attendance_status || student.status || 'pending',
      class_name: student.class_name,
      teacher_name: student.teacher_name,
      // Include other fields as needed
    }));
    
    return NextResponse.json(normalizedStudents, { status: r.status });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Xano' },
      { status: 500 }
    );
  }
}
