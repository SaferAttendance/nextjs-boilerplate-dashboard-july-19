// app/dashboard/students/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import StudentsSearch from './StudentsSearch';

export const runtime = 'nodejs'; // firebase-admin needs Node

export default async function StudentsPage() {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  if (!token) redirect('/');

  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    await getAdminAuth().verifyIdToken(token);
  } catch {
    redirect('/');
  }

  const fullName =
    jar.get('full_name')?.value ??
    jar.get('fullname')?.value ??
    'Admin';

  return (
    <main className="font-montserrat bg-gradient-to-br from-brand-blue via-brand-light to-white min-h-screen relative">
      {/* Background blobs */}
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-brand-dark rounded-full blur-xl" />
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-brand-blue rounded-full blur-xl" />
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-brand-light rounded-full blur-lg" />
        <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-brand-dark rounded-full blur-xl" />
      </div>

      {/* Header */}
      <header className="relative bg-white/80 backdrop-blur-sm border-b border-white/20 shadow-sm z-10">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center py-4">
            <div className="flex items-center space-x-4">
              <Link
                href="/dashboard"
                className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                aria-label="Back to dashboard"
              >
                <svg className="w-5 h-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-brand-blue to-brand-dark rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Search Students</h1>
                <p className="text-sm text-gray-600">Find student profiles and attendance information</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">Welcome, {fullName}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-brand-blue to-brand-dark text-sm font-medium text-white">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content */}
      <section className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
        <StudentsSearch />
      </section>
    </main>
  );
}
