// app/api/session/route.ts
import { NextRequest, NextResponse } from 'next/server';
import { getAuth } from 'firebase-admin/auth';
import { initializeApp, cert, getApps } from 'firebase-admin/app';

// ---------------------------------------------------------------------------
// 1️⃣  Firebase‑admin initialisation (runs once per cold start)
// ---------------------------------------------------------------------------
const serviceAccount = {
  projectId: process.env.FIREBASE_PROJECT_ID,
  clientEmail: process.env.FIREBASE_CLIENT_EMAIL,
  privateKey: process.env.FIREBASE_PRIVATE_KEY?.replace(/\\n/g, '\n'),
};

if (!getApps().length) {
  initializeApp({ credential: cert(serviceAccount as any) });
}

// ---------------------------------------------------------------------------
// 2️⃣  POST  ‑ log‑in: verify ID token and set secure HTTP‑only cookie
// ---------------------------------------------------------------------------
export async function POST(request: NextRequest) {
  try {
    const { idToken, rememberMe } = await request.json();

    // Verify Firebase ID token
    await getAuth().verifyIdToken(idToken);

    const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 4; // 30 d or 4 h

    // Build response *first*
    const response = NextResponse.json({ success: true });

    // Write cookie on the *response*
    response.cookies.set({
      name: 'token',
      value: idToken,
      httpOnly: true,
      secure: true,
      sameSite: 'lax',
      path: '/',
      maxAge,
    });

    return response;
  } catch (err) {
    console.error('Session creation failed:', err);
    return NextResponse.json({ error: 'Invalid token' }, { status: 401 });
  }
}

// ---------------------------------------------------------------------------
// 3️⃣  DELETE ‑ log‑out: clear the cookie
// ---------------------------------------------------------------------------
export async function DELETE() {
  const response = NextResponse.json({ success: true });
  response.cookies.delete('token');          // remove cookie
  return response;
}
