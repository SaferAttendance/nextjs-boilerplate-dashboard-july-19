// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const runtime = 'nodejs'; // ensure Node runtime (Admin SDK requires Node)

type Body = {
  idToken: string;
  rememberMe?: boolean;
};

export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe }: Body = await request.json();

    // 1) Verify Firebase ID token (throws if invalid/expired)
    const decoded = await getAdminAuth().verifyIdToken(idToken);

    // Optional: enforce verified email if that's part of your policy
    if (decoded.email && decoded.email_verified === false) {
      return NextResponse.json(
        { error: 'Email not verified' },
        { status: 403 }
      );
    }

    // 2) Set secure HTTP-only cookie with appropriate lifetime
    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30d vs 4h
    const res = NextResponse.json({ success: true });

    res.cookies.set('token', idToken, {
      httpOnly: true,
      secure: true, // safe on Vercel; if you want: process.env.NODE_ENV === 'production'
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return res;
  } catch (error) {
    console.error('POST /api/session error:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  // Use same path to ensure deletion
  res.cookies.set('token', '', { path: '/', maxAge: 0 });
  return res;
}
