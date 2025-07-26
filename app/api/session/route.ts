import { cookies } from 'next/headers'; // ✅ Important
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Firebase Admin init
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe } = await request.json();
    const decodedToken = await getAuth().verifyIdToken(idToken);

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4;
    const cookieStore = cookies(); // ✅ Now correct

    cookieStore.set('token', idToken, {
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Session creation failed:', error);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

export async function DELETE() {
  const cookieStore = cookies();
  cookieStore.delete('token');
  return NextResponse.json({ success: true });
}
