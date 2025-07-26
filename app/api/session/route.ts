// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type Body = { idToken: string; rememberMe?: boolean };

// Helper: resolve Xano admin lookup endpoint
function adminLookupUrl(email: string) {
  // Prefer full override if you set it
  const direct = process.env.XANO_ADMIN_LOOKUP_URL; // e.g. https://.../api:wWEItDWL/admin_dashboard_checkAdmin
  if (direct) {
    const u = new URL(direct.replace(/\/$/, ''));
    u.searchParams.set('email', email);
    return u.toString();
  }
  // Fallback: base/group variable
  const base = process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '';
  const url = new URL(`${base.replace(/\/$/, '')}/admin_dashboard_checkAdmin`);
  url.searchParams.set('email', email);
  return url.toString();
}

// Small helper so we can reuse identical cookie attributes
function cookieAttrs(maxAge: number) {
  return {
    path: '/',
    sameSite: 'lax' as const,
    secure: process.env.NODE_ENV === 'production',
    // NOTE: profile cookies are NOT httpOnly so you may read them in Client Components if needed.
    // Keep `token` httpOnly.
    httpOnly: false,
    maxAge,
  };
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe = false }: Body = await request.json();

    // Verify ID token (throws on invalid/expired)
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    // Optional: enforce verified emails
    if (decoded.email && decoded.email_verified === false) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30d or 4h
    const res = NextResponse.json({ success: true });

    // httpOnly session token
    res.cookies.set('token', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    // It’s OK to also set the email now for convenience
    if (decoded.email) {
      res.cookies.set('email', decoded.email, cookieAttrs(maxAge));
      res.cookies.set('session_email', decoded.email, cookieAttrs(maxAge));
    }

    return res;
  } catch (error) {
    console.error('POST /api/session error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// NEW: hydrate profile cookies from Xano using the session token
export async function GET(req: NextRequest) {
  try {
    const raw = req.cookies.get('token');
    const token = typeof raw === 'string' ? raw : raw?.value;
    if (!token) return NextResponse.json({ error: 'No session' }, { status: 401 });

    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = decoded.email;
    if (!email) return NextResponse.json({ error: 'No email on token' }, { status: 400 });

    // Call Xano to get admin profile (must return district_code, school_code, full_name)
    const url = adminLookupUrl(email);
    const headers: HeadersInit = {};
    if (process.env.XANO_API_KEY) headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;

    const x = await fetch(url, { headers, cache: 'no-store' });
    if (!x.ok) {
      const text = await x.text();
      console.error('Xano admin lookup failed:', x.status, text);
      return NextResponse.json({ error: 'Admin lookup failed' }, { status: 502 });
    }
    const profile = await x.json();

    // Try a few common keys just in case
    const fullName =
      profile.full_name || profile.name || profile.fullName || 'Admin';
    const district =
      profile.district_code || profile.district || profile.districtCode;
    const school =
      profile.school_code || profile.school || profile.schoolCode;

    if (!district || !school) {
      return NextResponse.json(
        { error: 'Profile missing district_code/school_code' },
        { status: 400 }
      );
    }

    // Set profile cookies
    const maxAge = 60 * 60 * 24 * 30; // 30d
    const res = NextResponse.json({ success: true, profile });

    res.cookies.set('email', email, cookieAttrs(maxAge));
    res.cookies.set('session_email', email, cookieAttrs(maxAge));
    res.cookies.set('full_name', String(fullName), cookieAttrs(maxAge));
    res.cookies.set('district_code', String(district), cookieAttrs(maxAge));
    res.cookies.set('school_code', String(school), cookieAttrs(maxAge));

    return res;
  } catch (err) {
    console.error('GET /api/session error:', err);
    return NextResponse.json({ error: 'Session hydrate failed' }, { status: 500 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  // Clear everything we set
  const clear = { path: '/', sameSite: 'lax' as const, secure: process.env.NODE_ENV === 'production', maxAge: 0 };
  res.cookies.set('token', '', { ...clear, httpOnly: true });
  for (const key of ['email', 'session_email', 'full_name', 'district_code', 'school_code']) {
    res.cookies.set(key, '', clear);
  }
  return res;
}
