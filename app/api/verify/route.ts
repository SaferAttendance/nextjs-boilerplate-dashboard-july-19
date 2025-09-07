import { NextRequest, NextResponse } from 'next/server';

export async function GET(request: NextRequest) {
  try {
    const { searchParams } = new URL(request.url);
    const email = searchParams.get('email');

    if (!email) {
      return NextResponse.json({ error: 'Email parameter is required' }, { status: 400 });
    }

    // Server-side env var pointing to your Xano endpoint:
    // e.g. https://your-xano.com/api:12345/Verify_User_Email_and_Role_From_Allowed_Users
    const xanoEndpoint =
      process.env.XANO_VERIFY_USER_URL || process.env.NEXT_PUBLIC_XANO_VERIFY_USER_URL;

    if (!xanoEndpoint) {
      console.error('Missing XANO_VERIFY_USER_URL');
      return NextResponse.json({ error: 'Server configuration error' }, { status: 500 });
    }

    const xanoUrl = `${xanoEndpoint}?email=${encodeURIComponent(email)}`;

    const headers: HeadersInit = { Accept: 'application/json' };
    if (process.env.XANO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
    }

    const resp = await fetch(xanoUrl, { method: 'GET', headers, cache: 'no-store' });

    if (!resp.ok) {
      console.error(`Xano API error: ${resp.status} ${resp.statusText}`);
      return NextResponse.json({ error: 'Failed to verify user credentials' }, { status: resp.status });
    }

    const data = await resp.json();

    if (!data || (Array.isArray(data) && data.length === 0)) {
      return NextResponse.json({
        email: null,
        full_name: null,
        role: null,
        district_code: null,
        school_code: null,
        sub_assigned: null,
        Phone_ID: null,
      });
    }

    const user = Array.isArray(data) ? data[0] : data;

    return NextResponse.json({
      email: user.email ?? null,
      full_name: user.full_name ?? null,
      role: user.role ?? null,
      district_code: user.district_code ?? null,
      school_code: user.school_code ?? null,
      sub_assigned: user.sub_assigned ?? null,
      Phone_ID: user.Phone_ID ?? null,
    });
  } catch (err) {
    console.error('User verification error:', err);
    return NextResponse.json({ error: 'Internal server error during user verification' }, { status: 500 });
  }
}
