// app/api/xano/class-students/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function endpoint() {
  const direct = process.env.XANO_CLASS_STUDENTS_URL;
  if (direct) return direct.replace(/\/$/, '');
  
  const base =
    process.env.XANO_BASE_URL ||
    process.env.NEXT_PUBLIC_XANO_BASE ||
    '';
  
  // Check if there's a different endpoint name
  const endpointName = process.env.XANO_CLASS_STUDENTS_ENDPOINT || 'Admin_AllStudentsFromParticularClass';
  return `${base.replace(/\/$/, '')}/${endpointName}`;
}

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const classId = (searchParams.get('class_id') || '').trim();
  const teacherEmail = (searchParams.get('teacher_email') || '').trim();
  
  console.log('Incoming params:', { classId, teacherEmail });
  
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
  
  console.log('Cookies:', { district, school, adminEmail });
  
  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }
  
  const url = new URL(endpoint());
  
  // Try the most common parameter formats
  // Option 1: lowercase with underscores
  url.searchParams.set('teacher_email', teacherEmail);
  url.searchParams.set('class_id', classId);
  
  // Option 2: PascalCase (comment out if option 1 works)
  // url.searchParams.set('Teacher_Email', teacherEmail);
  // url.searchParams.set('Class_ID', classId);
  
  // Option 3: camelCase (uncomment if needed)
  // url.searchParams.set('teacherEmail', teacherEmail);
  // url.searchParams.set('classId', classId);
  
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);
  
  if (adminEmail) {
    url.searchParams.set('admin_email', adminEmail);
    url.searchParams.set('email', adminEmail);
  }
  
  url.searchParams.set('_ts', Date.now().toString());
  
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
    
    const text = await r.text();
    console.log('Raw response:', text);
    
    let data;
    try {
      data = JSON.parse(text);
    } catch {
      data = { error: 'Invalid JSON response', raw: text };
    }
    
    console.log('Parsed response:', data);
    console.log('Response status:', r.status);
    
    return NextResponse.json(data, { status: r.status });
  } catch (error) {
    console.error('Fetch error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch from Xano', details: String(error) },
      { status: 500 }
    );
  }
}
