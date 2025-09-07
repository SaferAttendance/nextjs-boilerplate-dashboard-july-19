// app/dashboard/my-classes/page.tsx
import { cookies, headers } from 'next/headers';
import { redirect } from 'next/navigation';

export const runtime = 'nodejs';

// ----- Types matching your /api/xano/teachers response -----
type XanoTeacherRow = {
  id: number;
  teacher_name?: string;
  teacher_email?: string;
  class_name?: string;
  class_id?: string;
  period?: number | string;
  attendance_status?: string;
};

// View model used for display
type TeacherClass = {
  name: string;             // class name
  code: string;             // class_id (or fallback)
  schedule?: string;        // "Period X" derived from period
  students: number;         // count of rows for this class_id
};

function normalizeEmail(v?: string) {
  return (v || '').trim().toLowerCase();
}
function normalizeName(v?: string) {
  return (v || '').trim();
}

// Collapse rows -> classes for the chosen teacher (keyed by class_id)
function rowsToClasses(rows: XanoTeacherRow[]): TeacherClass[] {
  const byClass = new Map<string, { name: string; code: string; period?: number | string; students: number }>();

  for (const r of rows) {
    const key = r.class_id || `${r.class_name ?? ''}|${r.period ?? ''}`;
    if (!key) continue;

    if (byClass.has(key)) {
      byClass.get(key)!.students += 1;
    } else {
      byClass.set(key, {
        name: r.class_name || 'Class',
        code: r.class_id || key,
        period: r.period,
        students: 1,
      });
    }
  }

  // stable output
  const classes = Array.from(byClass.values()).map((c) => ({
    name: c.name,
    code: c.code,
    schedule: c.period ? `Period ${c.period}` : undefined,
    students: c.students,
  }));

  // sort by period if present, then by name
  classes.sort((a, b) => {
    const ap = (a.schedule || '').toLowerCase();
    const bp = (b.schedule || '').toLowerCase();
    if (ap && bp && ap !== bp) return ap.localeCompare(bp, undefined, { numeric: true });
    return a.name.toLowerCase().localeCompare(b.name.toLowerCase());
  });

  return classes;
}

export default async function MyClassesPage() {
  const jar = await cookies();

  // 1) Require session
  const token = jar.get('token')?.value;
  if (!token) redirect('/admin/login');

  // 2) Role gating (teacher or sub); you can relax this if admins should also see it
  const role = (jar.get('role')?.value || '').toLowerCase();
  const isTeacher = role === 'teacher';
  const isSub = role === 'sub' || role === 'substitute';
  if (!isTeacher && !isSub) redirect('/dashboard');

  const fullName =
    jar.get('full_name')?.value ??
    jar.get('fullname')?.value ??
    'Teacher';

  const email =
    jar.get('email')?.value ??
    undefined;

  if (!email) redirect('/admin/login');

  // 3) Fetch only this teacher's rows from your existing search API
  // Pass cookies along so any downstream auth (if added) keeps working.
  const base = process.env.NEXT_PUBLIC_BASE_PATH || '';
  const res = await fetch(`${base}/api/xano/teachers?q=${encodeURIComponent(email)}`, {
    method: 'GET',
    cache: 'no-store',
    headers: { cookie: headers().get('cookie') || '' },
  });

  if (!res.ok) {
    // Soft error: render a friendly message rather than crashing
    const msg = await res.text().catch(() => '');
    throw new Error(msg || 'Unable to load your classes right now.');
  }

  const payload = await res.json();
  const allRows: XanoTeacherRow[] = Array.isArray(payload) ? payload : payload?.records ?? [];

  // 4) Filter to *exactly* this teacher/sub by email (avoid accidental cross matches)
  const filtered = allRows.filter((r) => normalizeEmail(r.teacher_email) === normalizeEmail(email));

  const classes = rowsToClasses(filtered);

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-4 py-6 sm:px-6 lg:px-8">
          <h1 className="text-2xl font-bold text-gray-900">
            {isTeacher ? 'My Classes' : 'My Coverage Classes'}
          </h1>
          <p className="text-gray-600">
            {isTeacher
              ? 'These are the sections assigned to you.'
              : 'These are the classes you are currently assigned to cover.'}
          </p>
        </div>
      </header>

      {/* Teacher summary */}
      <section className="mx-auto max-w-7xl px-4 pt-6 sm:px-6 lg:px-8">
        <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                {(fullName?.[0] || 'T').toUpperCase()}
              </div>
              <div>
                <div className="text-base font-semibold text-gray-900">{fullName}</div>
                <div className="text-sm text-gray-600">{email}</div>
              </div>
            </div>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">Online</span>
            </div>
          </div>
        </div>
      </section>

      {/* Classes */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        {classes.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white p-10 text-center text-gray-600">
            No classes found for your account.
          </div>
        ) : (
          <>
            <div className="mb-6 flex items-center justify-between">
              <h2 className="text-2xl font-bold text-gray-900">Classes</h2>
              <div className="rounded-lg border border-gray-200 bg-white px-3 py-1.5 text-sm text-gray-700">
                Total: <span className="font-semibold">{classes.length}</span>
              </div>
            </div>

            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {classes.map((c, idx) => (
                <div
                  key={c.code + '|' + String(idx)}
                  className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-lg"
                >
                  <div className="mb-3 flex items-center justify-between">
                    <h3 className="text-base font-semibold text-gray-900">
                      {c.name || 'Class'}
                    </h3>
                    {c.schedule && (
                      <span className="rounded-md bg-blue-50 px-2 py-0.5 text-xs font-medium text-blue-700">
                        {c.schedule}
                      </span>
                    )}
                  </div>

                  <dl className="space-y-2 text-sm text-gray-700">
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Class Code</dt>
                      <dd className="font-medium">{c.code}</dd>
                    </div>
                    <div className="flex justify-between">
                      <dt className="text-gray-500">Students</dt>
                      <dd className="font-medium">{c.students}</dd>
                    </div>
                  </dl>

                  {/* You can wire this up later to a detail route or modal */}
                  {/* <Link href={`/dashboard/my-classes/${encodeURIComponent(c.code)}`} className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                    View roster
                    <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </Link> */}
                </div>
              ))}
            </div>
          </>
        )}
      </section>
    </main>
  );
}
