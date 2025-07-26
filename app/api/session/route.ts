// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// Your Firebase Admin SDK service account (best stored as env vars)
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

// Initialize admin if not already
if (!getApps().length) {
  initializeApp({
    credential: cert(serviceAccount as any),
  });
}

export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe } = await request.json();

    // Verify ID token from Firebase Auth
    const decodedToken = await getAuth().verifyIdToken(idToken);

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30d or 4h

    // Set secure HTTP-only cookie
    cookies().set('token', idToken, {
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
  // For logging out — just remove the cookie
  cookies().delete('token');
  return NextResponse.json({ success: true });
}
