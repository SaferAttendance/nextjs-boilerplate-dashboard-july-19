// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { getAdminAuth } from '@/lib/firebaseAdmin';

// Keep this page as a Server Component; use a tiny client subcomponent for sign out.
export const dynamic = 'force-dynamic';

function GradientBadge({ children }: { children: React.ReactNode }) {
  return (
    <div className="inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-500 to-blue-600 text-white">
      {children}
    </div>
  );
}

function Card({
  href,
  title,
  desc,
  icon,
}: {
  href: string;
  title: string;
  desc: string;
  icon: React.ReactNode;
}) {
  return (
    <Link
      href={href}
      className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition will-change-transform hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
      aria-label={title}
    >
      <div className="mb-5">
        <GradientBadge>{icon}</GradientBadge>
      </div>
      <h3 className="text-base font-semibold text-gray-900">{title}</h3>
      <p className="mt-1 text-sm text-gray-600">{desc}</p>
      <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
        Open
        <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
          <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
        </svg>
      </div>
    </Link>
  );
}

/** Client-only button for sign out */
function SignOutButton() {
  'use client';
  const doSignOut = async () => {
    try {
      await fetch('/api/session', { method: 'DELETE' });
    } catch {}
    // Hard redirect to clear any client state
    window.location.href = '/';
  };
  return (
    <button
      onClick={doSignOut}
      className="rounded-lg bg-red-500 px-4 py-2 text-sm text-white transition-all duration-200 hover:shadow-lg hover:bg-red-600"
    >
      Sign Out
    </button>
  );
}

export default async function DashboardPage() {
  // --- Server-side auth gate ---
  const token = (await cookies()).get('token')?.value;
  if (!token) redirect('/');

  try {
    const claims = await getAdminAuth().verifyIdToken(token);
    // Optional: role-based restriction
    // if (claims.role !== 'admin') redirect('/dashboard/unauthorized');
  } catch {
    redirect('/');
  }

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-500 to-blue-700 text-white">
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
            <SignOutButton />
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2">
          <h2 className="mb-2 text-3xl font-bold text-gray-900">Welcome back, Admin</h2>
          <p className="text-gray-600">Here&apos;s what&apos;s happening with your attendance system today.</p>
        </div>
      </section>

      {/* Quick Actions (your 5 cards) */}
      <section className="mx-auto max-w-7xl px-4 py-10 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Quick Actions</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          <Card
            href="/dashboard/students"
            title="Search Students"
            desc="Find and view student information and attendance records"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="11" cy="8" r="2" strokeWidth="2" />
                <path d="M7 14a4 4 0 008 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />

          <Card
            href="/dashboard/classes"
            title="Search Classes"
            desc="Browse class schedules and attendance information"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="7" y="7" width="8" height="6" rx="1" strokeWidth="2" />
                <path d="M9 9v4M11 9v4M13 9v4" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />

          <Card
            href="/dashboard/teachers"
            title="Search Teachers"
            desc="Find teacher profiles and their class assignments"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <circle cx="11" cy="11" r="8" strokeWidth="2" />
                <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M14 9V5a3 3 0 00-6 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <rect x="8" y="9" width="8" height="5" rx="1" strokeWidth="2" />
              </svg>
            }
          />

          <Card
            href="/dashboard/subs"
            title="Substitute Assignments"
            desc="Manage substitute teacher assignments and coverage"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="8.5" cy="7" r="4" strokeWidth="2" />
                <path d="M17 11l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            }
          />

          <Card
            href="/dashboard/csv"
            title="Download Today’s Attendance"
            desc="Export today's attendance data as a downloadable report"
            icon={
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <polyline points="7,10 12,15 17,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
              </svg>
            }
          />
        </div>
      </section>
    </main>
  );
}
