// app/api/xano/csv/route.ts
import { cookies } from 'next/headers';
import { NextResponse } from 'next/server';

export async function GET(req: Request) {
  /* ▲▲  add await ▼▼ */
  const jar = await cookies();              // <── was:  const jar = cookies();

  /* --- everything else unchanged --- */
  const urlObj = new URL(req.url);

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

  const admin_email =
    urlObj.searchParams.get('admin_email') ??
    jar.get('admin_email')?.value ??
    jar.get('email')?.value ??
    '';

  const target = `${process.env.XANO_CSV_DOWNLOAD_URL}?district_code=${encodeURIComponent(
    district_code,
  )}&school_code=${encodeURIComponent(school_code)}&admin_email=${encodeURIComponent(admin_email)}`;

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
        'Content-Disposition': 'attachment; filename=attendance.csv',
      },
    });
  } catch (e: any) {
    return NextResponse.json(
      { error: 'Proxy error', message: e?.message || 'Unknown error' },
      { status: 500 },
    );
  }
}
