// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs';

type Body = { idToken: string; rememberMe?: boolean };

// ---- POST: create session cookie
export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe = false }: Body = await request.json();
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    if (decoded.email && decoded.email_verified === false) {
      return NextResponse.json({ error: 'Email not verified' }, { status: 403 });
    }

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30d or 4h
    const res = NextResponse.json({ success: true });

    // ✅ Use a consistent cookie name for the session
    res.cookies.set('sa_session', idToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',                    // <— critical so /dashboard can read it
      maxAge,
    });

    // (Optional convenience cookie for email; non-HttpOnly)
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
    // Read the new name, fall back to the old name if present (for compat)
    const token =
      request.cookies.get('sa_session')?.value ||
      request.cookies.get('token')?.value;

    if (!token) {
      return NextResponse.json({ error: 'No session' }, { status: 401 });
    }

    const decoded = await getAdminAuth().verifyIdToken(token);
    const email = decoded.email || request.cookies.get('email')?.value;
    if (!email) return NextResponse.json({ error: 'No email' }, { status: 400 });

    // Build admin check URL
    const adminCheck =
      process.env.XANO_ADMIN_CHECK_URL ||
      `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '').replace(/\/$/, '')}/admin_dashboard_checkAdmin`;

    const url = new URL(adminCheck);
    url.searchParams.set('email', email);
    url.searchParams.set('admin_email', email);

    const headers: HeadersInit = {};
    if (process.env.XANO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
    }

    const r = await fetch(url.toString(), { headers, cache: 'no-store' });
    if (!r.ok) {
      const out = await r.text().catch(() => '');
      console.warn('Xano admin check failed:', r.status, out);
      return NextResponse.json({ error: 'Admin check failed' }, { status: 502 });
    }

    const data = await r.json();

    // Adjust keys to your Xano shape
    const full_name = data.full_name || data.fullName || data.name || '';
    const district_code = data.district_code || data.districtCode || data.district || '';
    const school_code = data.school_code || data.schoolCode || data.school || '';

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

  // Clear new and legacy cookie names for safety
  ['sa_session', 'token'].forEach((name) => {
    res.cookies.set(name, '', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    });
  });

  // clear profile cookies
  ['full_name', 'district_code', 'school_code', 'email'].forEach((k) =>
    res.cookies.set(k, '', {
      httpOnly: false,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'lax',
      path: '/',
      maxAge: 0,
    }),
  );

  return res;
}
