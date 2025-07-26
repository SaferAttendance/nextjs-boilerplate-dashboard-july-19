// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminAuth } from '@/lib/firebaseAdmin'; // make sure this file exists

export const dynamic = 'force-dynamic';

// Single source of truth for the 5 dashboard actions
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
  // --- Auth gate (required) ---
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/');

  try {
    const claims = await getAdminAuth().verifyIdToken(token);
    // Optional: enforce admin role
    // if (claims.role !== 'admin') redirect('/dashboard/unauthorized');
  } catch {
    redirect('/');
  }

  // --- UI (safe for design changes) ---
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-600 text-white">
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
        </div>
      </header>

      {/* Quick Actions only */}
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
    </main>
  );
}
