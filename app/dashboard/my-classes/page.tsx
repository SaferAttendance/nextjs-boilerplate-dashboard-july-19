import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import MyClassesClient from './MyClassesClient';

export default async function MyClassesPage() {
  const jar = await cookies();
  const token = jar.get('token')?.value;
  if (!token) redirect('/admin/login');

  // Verify token
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    await getAdminAuth().verifyIdToken(token);
  } catch {
    redirect('/admin/login');
  }

  // Get teacher info from cookies
  const teacherEmail = jar.get('email')?.value;
  const fullName = jar.get('full_name')?.value ?? jar.get('fullname')?.value ?? 'Teacher';
  const role = jar.get('role')?.value;

  // Check if user is teacher or substitute
  if (!teacherEmail || (role !== 'teacher' && role !== 'substitute')) {
    redirect('/dashboard');
  }

  return (
    <main className="font-montserrat bg-gradient-to-br from-brand-blue via-brand-light to-white min-h-screen relative">
      {/* Background blobs */}
      <div className="absolute inset-0 opacity-5 pointer-events-none z-0">
        <div className="absolute top-20 left-20 w-32 h-32 bg-brand-dark rounded-full blur-xl"></div>
        <div className="absolute bottom-20 right-20 w-40 h-40 bg-brand-blue rounded-full blur-xl"></div>
        <div className="absolute top-1/2 left-1/3 w-24 h-24 bg-brand-light rounded-full blur-lg"></div>
        <div className="absolute top-1/3 right-1/4 w-28 h-28 bg-brand-dark rounded-full blur-xl"></div>
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
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"></path>
                </svg>
              </Link>
              <div className="w-12 h-12 bg-gradient-to-r from-brand-blue to-brand-dark rounded-xl flex items-center justify-center shadow-lg">
                <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">My Classes</h1>
                <p className="text-sm text-gray-600">View and manage your assigned classes</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-semibold text-gray-800">{fullName}</p>
                <p className="text-xs text-gray-600">{teacherEmail}</p>
              </div>
              <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-r from-brand-blue to-brand-dark text-sm font-medium text-white">
                {fullName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* Content - Client Component */}
      <main className="relative max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12 z-10">
        <MyClassesClient teacherEmail={teacherEmail} teacherName={fullName} />
      </main>
    </main>
  );
}
