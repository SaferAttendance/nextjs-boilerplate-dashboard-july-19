// app/dashboard/page.tsx
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';

const SESSION_COOKIE_NAMES = ['sa_session', '__session', 'session']; // adjust to your actual cookie name(s)

export default async function DashboardPage() {
  // Next 15: cookies() is async
  const jar = await cookies();

  // If none of these cookies exist, treat as unauthenticated and redirect.
  const hasSession = SESSION_COOKIE_NAMES.some((n) => !!jar.get(n)?.value);
  if (!hasSession) {
    redirect('/admin/login');
  }

  // Optional: read any profile/scope cookies your /api/session GET populated
  const fullName     = jar.get('full_name')?.value ?? null;
  const email        = jar.get('email')?.value ?? null;
  const districtCode = jar.get('district_code')?.value ?? null;
  const schoolCode   = jar.get('school_code')?.value ?? null;

  return (
    <main className="min-h-screen p-8">
      <h1 className="text-2xl font-bold mb-4">Admin Dashboard</h1>

      <div className="rounded-xl border bg-white p-6 shadow-sm">
        <p className="text-gray-700">
          Welcome{fullName ? `, ${fullName}` : ''}.
        </p>
        <div className="mt-4 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 text-sm text-gray-600">
          <div className="rounded-lg border p-4">
            <div className="font-medium text-gray-900 mb-1">Email</div>
            <div className="text-gray-700">{email ?? '—'}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium text-gray-900 mb-1">District Code</div>
            <div className="text-gray-700">{districtCode ?? '—'}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium text-gray-900 mb-1">School Code</div>
            <div className="text-gray-700">{schoolCode ?? '—'}</div>
          </div>
          <div className="rounded-lg border p-4">
            <div className="font-medium text-gray-900 mb-1">Session</div>
            <div className="text-gray-700">
              {hasSession ? 'Active' : 'Missing'}
            </div>
          </div>
        </div>
      </div>

      {/* Your real dashboard content goes here */}
      <section className="mt-8">
        <div className="rounded-xl border bg-white p-6 shadow-sm">
          <h2 className="text-xl font-semibold mb-2">Overview</h2>
          <p className="text-gray-600">
            Replace this with your widgets, charts, and navigation.
          </p>
        </div>
      </section>
    </main>
  );
}
