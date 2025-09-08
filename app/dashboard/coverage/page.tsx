import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

export default async function CoveragePage() {
  const jar = await cookies();

  // Auth check
  const rawToken = jar.get('token')?.value ?? jar.get('sa_session')?.value;
  if (!rawToken) redirect('/admin/login');

  // Verify token
  let email: string | undefined;
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const decoded = await getAdminAuth().verifyIdToken(rawToken);
    email = decoded.email ?? jar.get('email')?.value ?? undefined;
    if (!email) redirect('/admin/login');
  } catch {
    redirect('/admin/login');
  }

  // Get user role from cookies
  const profileRole = jar.get('role')?.value;
  
  // Normalize and redirect based on role
  const normalizedRole = (profileRole || '').toLowerCase();
  
  switch (normalizedRole) {
    case 'admin':
      redirect('/dashboard/coverage/admin');
    case 'teacher':
      redirect('/dashboard/coverage/teacher');
    case 'substitute':
    case 'sub':
      redirect('/dashboard/coverage/sub');
    default:
      // If role is unknown or parent, redirect to dashboard
      redirect('/dashboard');
  }
}
