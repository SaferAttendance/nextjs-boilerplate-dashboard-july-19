/* ------------------------------------------------------------------
   Proxies GET → process.env.XANO_ASSIGN_SUB_URL
   ------------------------------------------------------------------*/
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

const XANO = (process.env.XANO_ASSIGN_SUB_URL || '').replace(/\/$/, '');

function readCookie(req: NextRequest, name: string) {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  if (!XANO) {
    return NextResponse.json(
      { error: 'Missing XANO_ASSIGN_SUB_URL env var' },
      { status: 500 },
    );
  }

  const { searchParams } = new URL(req.url);

  /* ------------ scope from cookies ------------ */
  const district_code = readCookie(req, 'district_code');
  const school_code   = readCookie(req, 'school_code');
  const admin_email   = readCookie(req, 'email') ||
                        readCookie(req, 'session_email');

  if (!district_code || !school_code || !admin_email) {
    return NextResponse.json(
      { error: 'Missing admin cookies (district / school / email)' },
      { status: 401 },
    );
  }

  /* ------------ build Xano request ------------ */
  const url = new URL(XANO);
  url.searchParams.set('district_code', district_code);
  url.searchParams.set('school_code',   school_code);
  url.searchParams.set('admin_email',   admin_email);

  // forward everything the client sent (sub_email, class_id, …)
  searchParams.forEach((v, k) => url.searchParams.set(k, v));

  const res  = await fetch(url.toString(), { cache: 'no-store' });
  const text = await res.text();              // Xano sometimes returns ''
  const data = text ? JSON.parse(text) : null;

  return NextResponse.json(data, { status: res.status });
}
