// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAdminAuth } from '@/lib/firebaseAdmin'; // or '../../lib/firebaseAdmin'

export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe } = await request.json();
    await getAdminAuth().verifyIdToken(idToken); // throws if invalid

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4;
    const res = NextResponse.json({ success: true });

    res.cookies.set('token', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return res;
  } catch (error) {
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const res = NextResponse.json({ success: true });
  res.cookies.delete('token');
  return res;
}
