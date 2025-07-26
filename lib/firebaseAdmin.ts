// lib/firebaseAdmin.ts
import 'server-only';
import { getApps, initializeApp, cert } from 'firebase-admin/app';
import { getAuth, type Auth } from 'firebase-admin/auth';

export function getAdminAuth(): Auth {
  if (!getApps().length) {
    const svcJson = process.env.FIREBASE_SERVICE_ACCOUNT;
    let credential: { projectId: string; clientEmail: string; privateKey: string };

    if (svcJson) {
      const parsed = JSON.parse(svcJson);
      credential = {
        projectId: parsed.project_id,
        clientEmail: parsed.client_email,
        privateKey: parsed.private_key,
      };
    } else {
      const projectId = process.env.FIREBASE_PROJECT_ID!;
      const clientEmail = process.env.FIREBASE_CLIENT_EMAIL!;
      let privateKey = process.env.FIREBASE_PRIVATE_KEY!;
      if (privateKey.includes('\\n')) privateKey = privateKey.replace(/\\n/g, '\n');
      credential = { projectId, clientEmail, privateKey };
    }

    initializeApp({ credential: cert(credential) });
  }
  return getAuth();
}
