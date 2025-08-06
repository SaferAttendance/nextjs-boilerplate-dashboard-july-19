import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import LiveDashboardCard from './LiveDashboardCard'; // uses the updated card

export const runtime = 'nodejs'; // firebase-admin needs Node runtime

type XanoAdmin = {
  full_name?: string;
  fullname?: string;
  fullName?: string;
  name?: string;
  school_id?: string | number;
};

export default async function DashboardPage() {
  const jar = await cookies();

  const rawToken =
    jar.get('token')?.value ??
    jar.get('sa_session')?.value;
  if (!rawToken) redirect('/admin/login');

  // Verify token & get email
  let email: string | undefined;
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const decoded = await getAdminAuth().verifyIdToken(rawToken!);
    email = decoded.email ?? jar.get('email')?.value ?? undefined;
    if (!email) redirect('/admin/login');
  } catch {
    redirect('/admin/login');
  }

  // Prefer the cookie set by /api/session GET
  let fullName =
    jar.get('full_name')?.value ||
    jar.get('fullname')?.value ||
    'Admin';

  // If not present, fetch once from Xano to populate the greeting
  if (!jar.get('full_name')?.value && !jar.get('fullname')?.value) {
    try {
      const adminCheckUrl =
        process.env.XANO_ADMIN_CHECK_URL ||
        process.env.NEXT_PUBLIC_XANO_ADMIN_CHECK_URL ||
        `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
          .replace(/\/$/, '')}/admin_dashboard_checkAdmin`;

      const url = `${adminCheckUrl}?email=${encodeURIComponent(email!)}`;

      const headers: HeadersInit = { Accept: 'application/json' };
      if (process.env.XANO_API_KEY) {
        headers['Authorization'] = `Bearer ${process.env.XANO_API_KEY}`;
      }

      const res = await fetch(url, { method: 'GET', headers, cache: 'no-store' });
      if (res.ok) {
        const payload = await res.json();
        const record: XanoAdmin | undefined = Array.isArray(payload) ? payload[0] : payload;
        fullName = String(
          record?.full_name ||
            record?.fullname ||
            record?.fullName ||
            record?.name ||
            fullName
        );
      }
    } catch {
      // Not fatal
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path
                  d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Safer Attendance Dashboard</h1>
          </div>

          <div className="flex items-center gap-4">
            <div className="hidden sm:flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">System Online</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-300 to-blue-500 text-sm font-medium text-white">
              {fullName?.[0]?.toUpperCase() || 'A'}
            </div>
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">
            Welcome back, {fullName}
          </h2>
          <p className="text-gray-600">Choose a quick action to get started.</p>
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Quick Actions</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search Students */}
          <Link
            href="/dashboard/students"
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11" cy="8" r="2" strokeWidth="2" />
                <path d="M7 14a4 4 0 008 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Search Students</h3>
            <p className="mt-1 text-sm text-gray-600">Find and view student information and attendance records.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
              Open
              <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>

          {/* Search Classes */}
          <Link
            href="/dashboard/classes"
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="7" y="7" width="8" height="6" rx="1" strokeWidth="2" />
                <path d="M9 9v4M11 9v4M13 9v4" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Search Classes & Assign Substitutes</h3>
            <p className="mt-1 text-sm text-gray-600">Browse class schedules, add a Substitute Teacher, and see live attendance information.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
              Open
              <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>

          {/* Search Teachers */}
          <Link
            href="/dashboard/teachers"
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 9V5a3 3 0 00-6 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="8" y="9" width="8" height="5" rx="1" strokeWidth="2" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Search Teachers</h3>
            <p className="mt-1 text-sm text-gray-600">Find teacher profiles and their class assignments.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
              Open
              <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>

          {/* Substitute Assignments */}
          <Link
            href="/dashboard/subs"
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="7" r="4" strokeWidth="2" />
                <path d="M17 11l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">View and Remove Substitute Assignments</h3>
            <p className="mt-1 text-sm text-gray-600">Manage substitute teacher assignments and coverage.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
              Open
              <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>

          {/* Download Today’s Attendance */}
          <Link
            href="/dashboard/csv"
            className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
          >
            <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7,10 12,15 17,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>
            <h3 className="text-base font-semibold text-gray-900">Download Today&apos;s Attendance</h3>
            <p className="mt-1 text-sm text-gray-600">Export today’s attendance data as a report.</p>
            <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
              Open
              <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </Link>

          {/* Live Dashboard (bottom-right on lg screens) */}
          <LiveDashboardCard pollMs={5000} />
        </div>
      </section>
    </main>
  );
}
