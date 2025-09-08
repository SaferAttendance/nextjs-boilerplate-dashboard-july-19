//app/dashboard/coverage/admin/page.tsx

import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import AdminCoverageClient from './AdminCoverageClient';

export const runtime = 'nodejs';

export default async function AdminCoveragePage() {
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

  // Get user profile from cookies
  const profileRole = jar.get('role')?.value;
  const profileFullName = jar.get('full_name')?.value || jar.get('fullname')?.value || 'Admin User';
  const profileDistrictCode = jar.get('district_code')?.value;
  const profileSchoolCode = jar.get('school_code')?.value;

  // Ensure admin role
  const normalizedRole = (profileRole || '').toLowerCase();
  if (normalizedRole !== 'admin') {
    // Non-admins shouldn't access this page directly
    redirect('/dashboard/coverage');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 16l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">Coverage Management Center</h1>
              <p className="text-xs text-gray-500">Admin View</p>
            </div>
          </div>

          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </a>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">
                District: {profileDistrictCode || 'N/A'} | School: {profileSchoolCode || 'N/A'}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <AdminCoverageClient 
          fullName={profileFullName}
          districtCode={profileDistrictCode}
          schoolCode={profileSchoolCode}
        />
      </div>
    </main>
  );
}
