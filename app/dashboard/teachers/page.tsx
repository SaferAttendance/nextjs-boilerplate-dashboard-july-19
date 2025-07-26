// app/dashboard/teachers/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeachersSearch from './TeachersSearch';

export default async function TeachersPage() {
  // ---- Require valid session
  const jar = await cookies(); // ✅ must await in server components
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
    <main className="relative min-h-screen bg-gradient-to-br from-[color:var(--brand-blue)] via-[color:var(--brand-light)] to-white font-montserrat">
      {/* Background blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 h-32 w-32 rounded-full bg-[color:var(--brand-dark)] blur-xl" />
        <div className="absolute bottom-20 right-20 h-40 w-40 rounded-full bg-[color:var(--brand-blue)] blur-xl" />
        <div className="absolute left-1/3 top-1/2 h-24 w-24 rounded-full bg-[color:var(--brand-light)] blur-lg" />
        <div className="absolute right-1/4 top-1/3 h-28 w-28 rounded-full bg-[color:var(--brand-dark)] blur-xl" />
      </div>

      {/* Header */}
      <header className="relative border-b border-white/20 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            {/* Left: back + title */}
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100"
                aria-label="Back to dashboard"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>

              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-[color:var(--brand-blue)] to-[color:var(--brand-dark)] text-white shadow-lg">
                <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>

              <div>
                <h1 className="text-xl font-bold text-gray-800">Search Teachers</h1>
                <p className="text-sm text-gray-600">Find teacher profiles and class information</p>
              </div>
            </div>

            {/* Right: user chip */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">Welcome, {fullName}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-[color:var(--brand-blue)] to-[color:var(--brand-dark)] text-sm font-medium text-white">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <section className="relative mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        {/* Page intro */}
        <div className="mb-12 text-center">
          <h2 className="mb-4 text-4xl font-bold text-gray-800">Find a Teacher</h2>
          <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-700">
            Search by teacher name or email address to view their class schedules and attendance information.
          </p>
        </div>

        {/* Client search + results */}
        <TeachersSearch />
      </section>
    </main>
  );
}
