// app/dashboard/teachers/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

export default async function TeachersPage() {
  // ---- Require valid session
  const jar = await cookies(); // in your project cookies() is async
  const token = jar.get('token')?.value;
  if (!token) redirect('/');

  // Optional: verify again with Firebase Admin
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    await getAdminAuth().verifyIdToken(token);
  } catch {
    redirect('/');
  }

  const fullName = jar.get('full_name')?.value ?? 'Admin';

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header (matches dashboard look) */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <h1 className="text-lg font-semibold text-gray-900">Safer Attendance Dashboard</h1>
          </div>

          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">System Online</span>
            </div>
            <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-blue-300 to-blue-500 text-sm font-medium text-white">
              {fullName.charAt(0).toUpperCase()}
            </div>
          </div>
        </div>
      </header>

      {/* Page intro */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-6 flex items-center justify-between">
          <div>
            <h2 className="text-3xl font-bold text-gray-900">Search Teachers</h2>
            <p className="mt-2 text-gray-600">Search by teacher name or email. Results are scoped by your district & school.</p>
          </div>
          <Link
            href="/dashboard"
            className="rounded-lg border border-gray-200 bg-white px-4 py-2 text-sm font-medium text-gray-700 shadow-sm transition hover:-translate-y-0.5 hover:shadow"
          >
            ← Back to Dashboard
          </Link>
        </div>

        {/* Client search UI */}
        <TeachersSearch />
      </section>
    </main>
  );
}

// Import the client component without mixing "use client" here
import TeachersSearch from './TeachersSearch';
