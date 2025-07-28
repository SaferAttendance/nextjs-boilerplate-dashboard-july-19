// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type Body = { idToken: string; rememberMe?: boolean };

function firstString(...vals: any[]): string {
  for (const v of vals) {
    if (typeof v === 'string' && v.trim().length > 0) return v;
  }
  return '';
}

// ---- POST: create session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe = false }: Body = await request.json();
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    if (decoded.email && decoded.email_verified === false) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4;
    const res = NextResponse.json({ success: true });

    // httpOnly session token
    res.cookies.set('token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    // convenience email cookie (non-httpOnly)
    if (decoded.email) {
      res.cookies.set('email', decoded.email, {
        httpOnly: false,
        secure: process.env.NODE_ENV === 'production',
        sameSite: 'lax',
        path: '/',
        maxAge,
      });
    }

    return res;
  } catch (error) {
    console.error('POST /api/session error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// ---- GET: hydrate profile cookies from Xano
export async function GET(request: NextRequest) {
  try {
    const token = request.cookies.get('token')?.value;
    if (!token) return NextResponse.json({ error: 'No session' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = decoded.email || request.cookies.get('email')?.value;
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    // Build admin check URL (group with admin_dashboard_checkAdmin)
    const adminCheck =
      process.env.XANO_ADMIN_CHECK_URL ||
      `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
        .replace(/\/$/, '')}/admin_dashboard_checkAdmin`;

    const url = new URL(adminCheck);
    url.searchParams.set('email', email);
    url.searchParams.set('admin_email', email); // try both if Xano expects this

    const headers: HeadersInit = { Accept: 'application/json' };
    if (process.env.XANO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
    }

    const r = await fetch(url.toString(), { headers, cache: 'no-store' });
    if (!r.ok) {
      const out = await r.text();
      console.warn('Xano admin check failed:', r.status, out);
      return NextResponse.json({ error: 'Admin check failed' }, { status: 502 });
    }

    const payload = await r.json();
    const data = Array.isArray(payload) ? payload[0] ?? {} : payload ?? {};

    // 🔑 Normalize multiple possible key names from Xano
    const full_name = firstString(
      data.full_name,
      data.fullname,
      data.fullName,
      data.name
    );
    const district_code = firstString(
      data.district_code,
      data.districtCode,
      data.districtcode,
      data.district
    );
    const school_code = firstString(
      data.school_code,
      data.schoolCode,
      data.schoolcode,
      data.school
    );

    const res = NextResponse.json({
      success: true,
      profile: { full_name, district_code, school_code, email },
    });

    const cookieOpts = {
      httpOnly: false as const,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax' as const,
      path: '/',
      maxAge: 60 * 60 * 24 * 7, // 7 days
    };

    if (full_name) res.cookies.set('full_name', full_name, cookieOpts);
    // (optional) also set a 'fullname' cookie for legacy readers:
    if (full_name) res.cookies.set('fullname', full_name, cookieOpts);

    if (district_code) res.cookies.set('district_code', district_code, cookieOpts);
    if (school_code) res.cookies.set('school_code', school_code, cookieOpts);
    res.cookies.set('email', email, cookieOpts);

    return res;
  } catch (e) {
    console.error('GET /api/session error:', e);
    return NextResponse.json({ error: 'Session hydrate failed' }, { status: 500 });
  }
}

// ---- DELETE: clear session
export async function DELETE() {
  const res = NextResponse.json({ success: true });
  const base = {
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax' as const,
    path: '/',
  };
  res.cookies.set('token', '', { ...base, httpOnly: true, maxAge: 0 });
  ['full_name', 'fullname', 'district_code', 'school_code', 'email'].forEach((k) =>
    res.cookies.set(k, '', { ...base, httpOnly: false, maxAge: 0 }),
  );
  return res;
}
