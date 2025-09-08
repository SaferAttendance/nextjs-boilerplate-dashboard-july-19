import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import RoleViewToggle from '@/components/RoleViewToggle';
import CoverageHub from './CoverageHub';

export const runtime = 'nodejs';

type RolePreview = 'admin' | 'teacher' | 'parent' | 'sub';

function normalizeRole(input?: string): RolePreview {
  const v = (input || '').toLowerCase();
  if (v === 'teacher') return 'teacher';
  if (v === 'parent') return 'parent';
  if (v === 'substitute' || v === 'sub') return 'sub';
  return 'admin';
}

function displayOrNA(v?: string | null) {
  return v && v.trim().length ? v : 'N/A';
}

export default async function CoveragePage({
  searchParams,
}: {
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();

  const rawToken = jar.get('token')?.value ?? jar.get('sa_session')?.value;
  if (!rawToken) redirect('/admin/login');

  // Verify token (server-side)
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const decoded = await getAdminAuth().verifyIdToken(rawToken!);
    const email = decoded.email ?? jar.get('email')?.value ?? undefined;
    if (!email) redirect('/admin/login');
  } catch {
    redirect('/admin/login');
  }

  // Profile bits from cookies
  const fullName =
    jar.get('full_name')?.value ??
    jar.get('fullname')?.value ??
    'User';
  const roleCookie = jar.get('role')?.value;
  const actualUserRole = normalizeRole(roleCookie);

  // Admin preview support
  const sp = (await searchParams) ?? {};
  const rawView = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  const previewRole: RolePreview =
    actualUserRole === 'admin' && rawView ? normalizeRole(rawView) : actualUserRole;

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="12" cy="12" r="4" strokeWidth="2" />
                <path d="M4.93 4.93l3.54 3.54M15.53 15.53l3.54 3.54M4.93 19.07l3.54-3.54M15.53 8.47l3.54-3.54" strokeWidth="2" strokeLinecap="round" />
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Coverage Hub</h1>
          </div>

          <div className="flex items-center gap-4">
            {/* Allow Admin to preview other roles exactly like the dashboard */}
            {actualUserRole === 'admin' && <RoleViewToggle current={previewRole} />}
          </div>
        </div>
      </header>

      {/* Intro */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">
            {previewRole === 'admin'
              ? 'Coverage Dashboard'
              : previewRole === 'teacher'
              ? 'My Time Off & Coverage'
              : previewRole === 'sub'
              ? 'Available Jobs'
              : 'Coverage'}
          </h2>

          {actualUserRole === 'admin' && previewRole !== 'admin' && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
              Previewing as
              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium capitalize">
                {previewRole}
              </span>
            </span>
          )}
        </div>

        <p className="text-gray-600">
          {previewRole === 'admin'
            ? 'Manage time-off requests, urgent openings, fair rotation, and payroll-ready logs.'
            : previewRole === 'teacher'
            ? 'Request time off, upload lesson plans, and respond to live coverage alerts.'
            : previewRole === 'sub'
            ? 'Find and accept substitute teaching opportunities and track your earnings.'
            : displayOrNA('')}
        </p>
      </section>

      {/* Role-specific UI */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <CoverageHub role={previewRole} fullName={fullName} />
      </section>
    </main>
  );
}
