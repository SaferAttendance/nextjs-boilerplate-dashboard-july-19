// lib/firebaseAdmin.ts
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth } from 'firebase-admin/auth';

export function getAdminAuth() {
  if (!getApps().length) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    let credential: any;

    if (svcJson) {
      credential = JSON.parse(svcJson); // expects project_id, client_email, private_key
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL;
      const rawKey = process.env.FIREBASE_PRIVATE_KEY;
      if (!projectId || !clientEmail || !rawKey) {
        throw new Error('Missing Firebase Admin env vars (PROJECT_ID / CLIENT_EMAIL / PRIVATE_KEY).');
      }
      credential = {
        projectId,
        clientEmail,
        privateKey: rawKey.includes('\\n') ? rawKey.replace(/\\n/g, '\n') : rawKey,
      };
    }

    initializeApp({ credential: cert(credential) });
  }
  return getAuth();
}
