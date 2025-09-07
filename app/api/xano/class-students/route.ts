// app/api/xano/class-students/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  const direct = process.env.XANO_CLASS_STUDENTS_URL || process.env.XANO_CLASS_INFO_URL;
  if (direct) return direct.replace(/\/$/, '');
  
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  // This should use the direct URL if available, not append /class_info
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
  const period = (searchParams.get('period') || '').trim();
  
  console.log('Incoming params:', { classId, teacherEmail, period });
  
  if (!classId) {
    return NextResponse.json(
      { error: 'Missing class_id' },
      { status: 400 }
    );
  }
  
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');
  const adminEmail = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  
  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }
  
  const url = new URL(endpoint());
  
  // Required parameters - These stay lowercase as shown in Xano
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);
  
  // FIXED: Use capital letters for Class_ID to match Xano's expectations
  url.searchParams.set('Class_ID', classId);
  
  // FIXED: Use capital letters for Teacher_Email to match Xano's expectations
  if (teacherEmail) {
    url.searchParams.set('Teacher_Email', teacherEmail);
  }
  
  // Add period if provided
  if (period) {
    url.searchParams.set('period', period);
  }
  
  // Optional admin email
  if (adminEmail) {
    url.searchParams.set('admin_email', adminEmail);
  }
  
  const headers: HeadersInit = { 
    Accept: 'application/json',
    'Cache-Control': 'no-store',
    'Pragma': 'no-cache'
  };
  
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }
  
  console.log('Calling Xano URL:', url.toString());
  
  try {
    const r = await fetch(url.toString(), {
      method: 'GET',
      headers,
      cache: 'no-store',
    });
    
    const data = await r.json();
    console.log('Xano response:', data);
    
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
    }));
    
    console.log('Normalized students:', normalizedStudents);
    
    return NextResponse.json(normalizedStudents, { status: r.status });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Xano' },
      { status: 500 }
    );
  }
}
