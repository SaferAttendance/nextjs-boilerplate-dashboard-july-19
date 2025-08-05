/* ------------------------------------------------------------------------
   app/api/xano/assign-sub/route.ts
   Proxies POST → XANO_ASSIGN_SUB_URL
---------------------------------------------------------------------------*/
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const XANO = (process.env.XANO_ASSIGN_SUB_URL || '').replace(/\/$/, '');

function readCookie(req: NextRequest, name: string) {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function POST(req: NextRequest) {
  if (!XANO) {
    return NextResponse.json(
      { error: 'Missing XANO_ASSIGN_SUB_URL env var' },
      { status: 500 }
    );
  }

  const body = await req.json().catch(() => ({}));

  const district_code = readCookie(req, 'district_code');
  const school_code   = readCookie(req, 'school_code');
  const admin_email   = readCookie(req, 'email') ||
                        readCookie(req, 'session_email');

  if (!district_code || !school_code || !admin_email) {
    return NextResponse.json(
      { error: 'Missing admin cookies (district / school / email)' },
      { status: 401 }
    );
  }

  const payload = {
    ...body,
    district_code,
    school_code,
    admin_email,
  };

  const res = await fetch(XANO, {
    method : 'POST',
    headers: {
      'Content-Type': 'application/json',
      ...(process.env.XANO_API_KEY
        ? { Authorization: `Bearer ${process.env.XANO_API_KEY}` }
        : {}),
    },
    body: JSON.stringify(payload),
    cache: 'no-store',
  });

  const txt = await res.text();          // Xano sometimes returns ‘‘
  const data = txt ? JSON.parse(txt) : null;
  return NextResponse.json(data, { status: res.status });
}
