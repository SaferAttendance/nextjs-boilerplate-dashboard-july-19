// app/api/admin/check/route.ts
import { NextResponse } from 'next/server';

export async function POST(req: Request) {
  try {
    const { email } = await req.json();
    if (!email || typeof email !== 'string') {
      return NextResponse.json({ error: 'Missing email' }, { status: 400 });
    }

    const base = process.env.XANO_ADMIN_CHECK_URL;
    if (!base) {
      return NextResponse.json({ error: 'XANO_ADMIN_CHECK_URL not set' }, { status: 500 });
    }

    // Xano input name is `email1`
    const url = `${base}?email1=${encodeURIComponent(email.toLowerCase())}`;

    const headers: Record<string, string> = {};
    // If you store a Xano API key, add it (optional—depends on your Xano settings)
    if (process.env.XANO_API_KEY) {
      headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
      // or: headers['X-API-Key'] = process.env.XANO_API_KEY;
    }

    const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
    if (!res.ok) {
      const text = await res.text().catch(() => '');
      return NextResponse.json(
        { error: `Xano error ${res.status}`, detail: text || undefined },
        { status: 502 }
      );
    }

    const data = await res.json();

    // Normalize possible field names from Xano
    const normalized = {
      isAdmin: !!data.isAdmin,
      districtCode: data.districtCode ?? data.district_code ?? null,
      schoolCode: data.schoolCode ?? data.school_code ?? null,
      email: data.email ?? null,
      fullName: data.fullName ?? data.fullname ?? data.full_name ?? null,
    };

    return NextResponse.json(normalized);
  } catch (err: any) {
    console.error('Admin check route error:', err);
    return NextResponse.json({ error: 'Internal error' }, { status: 500 });
  }
}
