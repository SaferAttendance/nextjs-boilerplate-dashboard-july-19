/* Proxy GET to XANO_ASSIGN_SUB_URL
   Ensures: sub_email, teacher_email, class_id, class_name,
            school_code, district_code, period, admin_email  */
import { NextRequest, NextResponse } from 'next/server';
export const runtime = 'nodejs';

const XANO = (process.env.XANO_ASSIGN_SUB_URL || '').replace(/\/$/, '');

function cookie(req: NextRequest, key: string) {
  const c: any = req.cookies.get(key);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  if (!XANO) {
    return NextResponse.json({ error: 'XANO_ASSIGN_SUB_URL not set' }, { status: 500 });
  }

  const src = new URL(req.url).searchParams;
  /* ----------- pull mandatory admin-scope cookies ----------- */
  const district_code = cookie(req, 'district_code');
  const school_code   = cookie(req, 'school_code');
  const admin_email   = cookie(req, 'email') || cookie(req, 'session_email');

  if (!district_code || !school_code || !admin_email) {
    return NextResponse.json({ error: 'Missing admin cookies' }, { status: 401 });
  }

  /* ----------- build Xano URL, validating all 8 inputs ----------- */
  const url = new URL(XANO);
  const required = ['sub_email', 'teacher_email', 'class_id', 'class_name', 'period'];

  required.forEach((k) => {
    const v = src.get(k);
    if (!v) return NextResponse.json({ error: `Missing ${k}` }, { status: 400 });
    url.searchParams.set(k, v);
  });

  url.searchParams.set('district_code', district_code);
  url.searchParams.set('school_code',   school_code);
  url.searchParams.set('admin_email',   admin_email);

  const upstream = await fetch(url.toString(), { cache: 'no-store' });
  const bodyTxt  = await upstream.text();              // Xano may return ''
  const bodyJson = bodyTxt ? JSON.parse(bodyTxt) : null;

  return NextResponse.json(bodyJson, { status: upstream.status });
}
