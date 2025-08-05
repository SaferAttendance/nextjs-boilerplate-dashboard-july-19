import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import dynamic from 'next/dynamic';

const ClassesSearch = dynamic(() => import('./ClassesSearch'), { ssr: false });

export default async function ClassesPage() {
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
    jar.get('full_name')?.value ||
    jar.get('fullname')?.value ||
    'Admin';

  return (
    <main className="relative min-h-screen font-montserrat bg-gradient-to-br from-brand-blue via-brand-light to-white">
      {/* subtle blobs */}
      <div className="pointer-events-none absolute inset-0 opacity-5">
        <div className="absolute top-20 left-20 h-32 w-32 rounded-full bg-brand-dark blur-xl" />
        <div className="absolute bottom-20 right-20 h-40 w-40 rounded-full bg-brand-blue blur-xl" />
      </div>

      {/* header (matches teachers / students pages) */}
      <header className="relative z-10 border-b border-white/20 bg-white/80 backdrop-blur-sm shadow-sm">
        <div className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between py-4">
            <div className="flex items-center gap-4">
              <Link
                href="/dashboard"
                aria-label="Back to dashboard"
                className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100"
              >
                <svg className="h-5 w-5 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div className="flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark shadow-lg">
                <svg className="h-6 w-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <div>
                <h1 className="text-xl font-bold text-gray-800">Search Classes</h1>
                <p className="text-sm text-gray-600">Find classes &amp; manage substitute assignments</p>
              </div>
            </div>

            <div className="flex items-center gap-4">
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

      {/* content */}
      <section className="relative z-10 mx-auto max-w-7xl px-4 py-12 sm:px-6 lg:px-8">
        <ClassesSearch />
      </section>
    </main>
  );
}
