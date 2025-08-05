/* ------------------------------------------------------------------------
   app/api/xano/class-info/route.ts
   Proxies GET → XANO_CLASS_INFO_URL
---------------------------------------------------------------------------*/
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const XANO = (process.env.XANO_CLASS_INFO_URL || '').replace(/\/$/, '');

function readCookie(req: NextRequest, name: string) {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  if (!XANO) {
    return NextResponse.json(
      { error: 'Missing XANO_CLASS_INFO_URL env var' },
      { status: 500 }
    );
  }

  const { searchParams } = new URL(req.url);

  const district_code = readCookie(req, 'district_code');
  const school_code   = readCookie(req, 'school_code');

  if (!district_code || !school_code) {
    return NextResponse.json(
      { error: 'Missing admin cookies (district / school)' },
      { status: 401 }
    );
  }

  const url = new URL(XANO);
  url.searchParams.set('district_code', district_code);
  url.searchParams.set('school_code',   school_code);

  // forward whatever came from client (class_id, class_name, teacher_email …)
  searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const res  = await fetch(url.toString(), { cache: 'no-store' });
  const text = await res.text();
  const data = text ? JSON.parse(text) : null;

  return NextResponse.json(data, { status: res.status });
}
