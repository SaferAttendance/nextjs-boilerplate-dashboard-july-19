// app/api/xano/teacher-csv/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  const jar = await cookies();
  
  const urlObj = new URL(req.url);
  
  // Get teacher-specific parameters
  const teacher_email =
    urlObj.searchParams.get('teacher_email') ??
    jar.get('teacher_email')?.value ??
    jar.get('email')?.value ??
    '';
  
  const district_code =
    urlObj.searchParams.get('district_code') ??
    jar.get('district_code')?.value ??
    jar.get('district')?.value ??
    '';
  
  const school_code =
    urlObj.searchParams.get('school_code') ??
    jar.get('school_code')?.value ??
    jar.get('school')?.value ??
    '';

  // Use the teacher-specific endpoint
  const target = `${process.env.XANO_TEACHER_CSV_DOWNLOAD_URL}?teacher_email=${encodeURIComponent(
    teacher_email,
  )}&district_code=${encodeURIComponent(district_code)}&school_code=${encodeURIComponent(school_code)}`;

  try {
    const res = await fetch(target, { method: 'GET' });
    
    if (!res.ok) {
      const text = await res.text();
      return NextResponse.json(
        { error: 'Xano error', status: res.status, message: text },
        { status: res.status },
      );
    }
    
    const buffer = await res.arrayBuffer();
    
    return new NextResponse(buffer, {
      status: 200,
      headers: {
        'Content-Type': 'text/csv; charset=utf-8',
        'Content-Disposition': 'attachment; filename=teacher_attendance.csv',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Proxy error', message: e?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
