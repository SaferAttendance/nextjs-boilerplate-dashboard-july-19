// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminAuth } from '@/lib/firebaseAdmin';

export const dynamic = 'force-dynamic';

// Quick actions (the 5 required)
const actions = [
  {
    href: '/dashboard/students',
    title: 'Search Students',
    desc: 'Look up student records quickly.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 4.5a3.5 3.5 0 110 7" strokeWidth="2" />
        <path d="M16 20H4v-1a6 6 0 0112 0v1z" strokeWidth="2" />
      </svg>
    ),
  },
  {
    href: '/dashboard/classes',
    title: 'Search Classes',
    desc: 'Browse classes and schedules.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M3 7h18M3 12h18M3 17h18" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/teachers',
    title: 'Search Teachers',
    desc: 'Find and manage teacher profiles.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <circle cx="12" cy="10" r="4" strokeWidth="2" />
        <path d="M6 20v-1a6 6 0 0112 0v1" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/subs',
    title: 'Substitute Assignments',
    desc: 'Assign and track substitutes.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M5 13l4 4L19 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    ),
  },
  {
    href: '/dashboard/csv',
    title: "Download Today's Attendance",
    desc: 'Export attendance for today.',
    icon: (
      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
        <path d="M12 3v12m0 0l-4-4m4 4l4-4" strokeWidth="2" strokeLinecap="round" />
        <path d="M4 20h16" strokeWidth="2" strokeLinecap="round" />
      </svg>
    ),
  },
];

export default async function DashboardPage() {
  // --- Auth gate (server-side) ---
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/');

  try {
    const claims = await getAdminAuth().verifyIdToken(token);
    // Optional role check:
    // if (claims.role !== 'admin') redirect('/dashboard/unauthorized');
  } catch {
    redirect('/');
  }

  // --- UI (design intact, Tailwind-only) ---
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

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">System Online</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-400 to-blue-600 text-sm font-medium text-white">
              A
            </div>
          </div>
        </div>
      </header>

      {/* Welcome / Stats */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Welcome back, Admin</h2>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your attendance system today.</p>
        </div>

        <div className="mb-10 grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-4">
          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Total Students</p>
                <p className="mt-1 text-3xl font-bold text-gray-900">1,247</p>
                <p className="mt-1 text-sm text-green-600">↗ +12 this week</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-blue-100">
                <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Present Today</p>
                <p className="mt-1 text-3xl font-bold text-green-600">1,089</p>
                <p className="mt-1 text-sm text-gray-500">87.3% attendance</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-green-100">
                <svg className="h-6 w-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                  />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Absent Today</p>
                <p className="mt-1 text-3xl font-bold text-red-600">158</p>
                <p className="mt-1 text-sm text-red-500">↗ +5 from yesterday</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-red-100">
                <svg className="h-6 w-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </div>
            </div>
          </div>

          <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm font-medium text-gray-600">Safety Alerts</p>
                <p className="mt-1 text-3xl font-bold text-orange-600">3</p>
                <p className="mt-1 text-sm text-orange-500">Requires attention</p>
              </div>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-orange-100">
                <svg className="h-6 w-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.503-1.667 1.733-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.267 16.5C2.497 17.333 3.459 19 5 19z"
                  />
                </svg>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Quick Actions (the 5 cards) */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Quick Actions</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {actions.map((a) => (
            <Link
              key={a.href}
              href={a.href}
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md focus:outline-none focus:ring-2 focus:ring-blue-500/30"
              aria-label={a.title}
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
                {a.icon}
              </div>
              <h3 className="text-base font-semibold text-gray-900">{a.title}</h3>
              <p className="mt-1 text-sm text-gray-600">{a.desc}</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg
                  className="transition group-hover:translate-x-0.5"
                  width="16"
                  height="16"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          ))}
        </div>
      </section>

      {/* Recent Activity */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <div className="overflow-hidden rounded-2xl border border-gray-100 bg-white shadow-sm">
          <div className="border-b border-gray-100 p-6">
            <h2 className="text-xl font-semibold text-gray-900">Recent Activity</h2>
            <p className="mt-1 text-sm text-gray-600">Latest updates from your attendance system</p>
          </div>
          <div className="p-6">
            <div className="space-y-6">
              <div className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 animate-pulse rounded-full bg-green-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">John Smith marked present</p>
                  <p className="text-xs text-gray-500">Mathematics • 9:15 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 rounded-full bg-red-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Sarah Johnson marked absent</p>
                  <p className="text-xs text-gray-500">English Literature • 8:45 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 rounded-full bg-blue-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">Safety protocol activated</p>
                  <p className="text-xs text-gray-500">Building A Emergency Drill • 8:30 AM</p>
                </div>
              </div>
              <div className="flex items-start gap-4">
                <span className="mt-2 h-2 w-2 rounded-full bg-orange-400" />
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">New student registered</p>
                  <p className="text-xs text-gray-500">Emma Wilson added to Grade 10 • 8:00 AM</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
