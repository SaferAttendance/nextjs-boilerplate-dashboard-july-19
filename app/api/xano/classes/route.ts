// Forward-proxy → Xano “search by class” endpoint
// -------------------------------------------------
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

/* Pick explicit URL first, otherwise BASE + default path */
function searchClassesEndpoint() {
  const direct = process.env.XANO_SEARCH_CLASSES_URL;            // <- env var ①
  if (direct) return direct.replace(/\/$/, '');

  const base =
    process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  return `${base.replace(/\/$/, '')}/admin_searchByClass`;
}

/* Small helper because `req.cookies.get()` returns { value } on edge/node */
function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  const q = (searchParams.get('q') || '').trim();

  if (!q) {
    return NextResponse.json({ error: 'Missing query (q)' }, { status: 400 });
  }

  /* --- scope from admin cookies --------------------------------------- */
  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');
  const admin    = readCookie(req, 'email') || readCookie(req, 'admin_email');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  /* --- Build outbound GET --------------------------------------------- */
  const url = new URL(searchClassesEndpoint());
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code',   school);

/* Normalize input and send BOTH fields with the SAME value
   - Uppercase all letters
   - Remove separators (space, dot, underscore, dash)
   - Preserve digits exactly (incl. leading zeros)
*/
const raw = (searchParams.get('q') || '').trim();
const normalized = raw.replace(/[\s._-]+/g, '').toUpperCase();

url.searchParams.set('class_name', normalized);
url.searchParams.set('class_id', normalized);

// Optional: if your Xano endpoint also accepts a combined field
// url.searchParams.set('class_code', normalized);

  if (admin) url.searchParams.set('admin_email', admin);

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;

  const r = await fetch(url.toString(), { headers, cache: 'no-store' });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
