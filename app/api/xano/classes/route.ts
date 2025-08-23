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

/* Decide whether q is ID-only, letters+numbers, or letters-only.
   - Normalize: remove separators and uppercase letters
   - Keep numeric part as-is to preserve leading zeros (e.g., "022") */
const raw = (searchParams.get('q') || '').trim();
const cleaned = raw.replace(/[\s._-]+/g, '').toUpperCase();

const onlyDigits   = /^[0-9]+$/.test(cleaned);
const onlyLetters  = /^[A-Z]+$/.test(cleaned);
// letters+digits(+optional trailing letters), e.g. "MM022", "ENG10A"
const lettersNums  = cleaned.match(/^([A-Z]+)(\d+)([A-Z]*)$/);

if (onlyDigits) {
  // Digits only → ID
  url.searchParams.set('class_id', cleaned); // leading zeros preserved
} else if (lettersNums) {
  // Split into uppercase letters and numeric part
  const letters = (lettersNums[1] + (lettersNums[3] || '')).toUpperCase(); // e.g., "ENGA" from "ENG10A"
  const numbers = lettersNums[2]; // e.g., "022" (keeps leading zeros)
  url.searchParams.set('class_name', letters);
  url.searchParams.set('class_id', numbers);
  // Optional: send full code if Xano supports it
  url.searchParams.set('class_code', cleaned);
} else if (onlyLetters) {
  // Letters only → name (uppercase)
  url.searchParams.set('class_name', cleaned);
} else {
  // Fallback: extract letters/numbers separately if mixed oddly
  const letters = (cleaned.match(/[A-Z]+/g) || []).join('');
  const numbers = (cleaned.match(/\d+/g) || []).join('');
  if (letters) url.searchParams.set('class_name', letters.toUpperCase());
  if (numbers) url.searchParams.set('class_id', numbers);
  url.searchParams.set('class_code', cleaned);
}


  if (admin) url.searchParams.set('admin_email', admin);

  const headers: HeadersInit = {};
  if (process.env.XANO_API_KEY) headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;

  const r = await fetch(url.toString(), { headers, cache: 'no-store' });
  const data = await r.json();
  return NextResponse.json(data, { status: r.status });
}
