import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import LogoutButton from '@/components/LogoutButton';
import LiveDashboardCard from './LiveDashboardCard';
import RoleViewToggle from '@/components/RoleViewToggle';

export const runtime = 'nodejs'; // firebase-admin needs Node runtime

type StoredUserProfile = {
  email: string;
  fullName: string;
  role: 'admin' | 'teacher' | 'parent' | 'substitute';
  districtCode: string | null;
  schoolCode: string | null;
  subAssigned: string | null;
  phoneId: string | null;
};

type RolePreview = 'admin' | 'teacher' | 'parent' | 'sub';

function normalizeRole(input?: string): RolePreview {
  const v = (input || '').toLowerCase();
  if (v === 'teacher') return 'teacher';
  if (v === 'parent') return 'parent';
  if (v === 'substitute' || v === 'sub') return 'sub';
  return 'admin';
}

function capitalize(word?: string | null) {
  if (!word) return 'N/A';
  return word.slice(0, 1).toUpperCase() + word.slice(1);
}

function displayOrNA(v?: string | null) {
  return v && v.trim().length ? v : 'N/A';
}

export default async function DashboardPage({
  searchParams,
}: {
  // Next.js 15: searchParams is a Promise in server components
  searchParams?: Promise<Record<string, string | string[] | undefined>>;
}) {
  const jar = await cookies();

  const rawToken =
    jar.get('token')?.value ??
    jar.get('sa_session')?.value;
  if (!rawToken) redirect('/admin/login');

  // Verify token & get email
  let email: string | undefined;
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const decoded = await getAdminAuth().verifyIdToken(rawToken!);
    email = decoded.email ?? jar.get('email')?.value ?? undefined;
    if (!email) redirect('/admin/login');
  } catch {
    redirect('/admin/login');
  }

  // Get user profile from cookies (set by the login process via /api/session)
  let userProfile: StoredUserProfile | null = null;
  let fullName = 'User';
  let actualUserRole: RolePreview = 'admin';

  // Try to get user profile from cookies first (server-side)
  const profileEmail = jar.get('email')?.value;
  const profileFullName = jar.get('full_name')?.value || jar.get('fullname')?.value;
  const profileRole = jar.get('role')?.value;
  const profileDistrictCode = jar.get('district_code')?.value;
  const profileSchoolCode = jar.get('school_code')?.value;

  if (profileEmail && profileFullName && profileRole) {
    userProfile = {
      email: profileEmail,
      fullName: profileFullName,
      role: profileRole as 'admin' | 'teacher' | 'parent' | 'substitute',
      districtCode: profileDistrictCode || null,
      schoolCode: profileSchoolCode || null,
      subAssigned: jar.get('sub_assigned')?.value || null,
      phoneId: jar.get('phone_id')?.value || null,
    };
    fullName = profileFullName;
    actualUserRole = normalizeRole(profileRole);
  }

  // ----- Role preview toggle support -----
  const sp = (await searchParams) ?? {};
  const rawView = Array.isArray(sp.view) ? sp.view[0] : sp.view;
  
  let previewRole: RolePreview;
  if (actualUserRole === 'admin' && rawView) {
    // Admin can preview any role
    previewRole = normalizeRole(rawView);
  } else {
    // Non-admins see their actual role, admins default to admin view
    previewRole = actualUserRole;
  }

  const isAdmin   = previewRole === 'admin';
  const isTeacher = previewRole === 'teacher';
  const isParent  = previewRole === 'parent';
  const isSub     = previewRole === 'sub';

  // Derived values for the profile popover
  const initial = fullName?.[0]?.toUpperCase() || 'U';
  const popEmail = userProfile?.email ?? profileEmail ?? 'N/A';
  const popFullName = userProfile?.fullName ?? fullName ?? 'N/A';
  const popRole = userProfile?.role ?? (profileRole as StoredUserProfile['role'] | undefined) ?? 'admin';
  const popDistrict = userProfile?.districtCode ?? profileDistrictCode ?? null;
  const popSchool = userProfile?.schoolCode ?? profileSchoolCode ?? null;
  const popSubAssigned = userProfile?.subAssigned ?? null;
  const popPhoneId = userProfile?.phoneId ?? jar.get('phone_id')?.value ?? null;

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

          <div className="flex items-center gap-4">
            {/* Role preview toggle - only show for admins */}
            {actualUserRole === 'admin' && (
              <RoleViewToggle current={previewRole} />
            )}

            <div className="hidden sm:flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">System Online</span>
            </div>

            {/* Profile popover (no client JS needed) */}
            <details className="relative">
              <summary
                aria-label="View profile"
                className="flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-gradient-to-r from-blue-300 to-blue-500 text-sm font-medium text-white outline-none ring-0 transition hover:brightness-110 focus:ring-2 focus:ring-blue-500/40 [&::-webkit-details-marker]:hidden list-none"
              >
                {initial}
              </summary>

              {/* Panel */}
              <div
                role="menu"
                className="absolute right-0 z-50 mt-2 w-80 origin-top-right rounded-xl border border-gray-200 bg-white p-4 text-sm shadow-xl"
              >
                <div className="mb-3">
                  <p className="text-xs font-medium uppercase tracking-wide text-gray-500">Signed in as</p>
                  <p className="truncate text-base font-semibold text-gray-900">{displayOrNA(popFullName)}</p>
                  <p className="truncate text-xs text-gray-600">{displayOrNA(popEmail)}</p>
                </div>

                <div className="grid grid-cols-1 gap-2">
                  <div className="rounded-lg bg-gray-50 p-3">
                    <dl className="grid grid-cols-3 gap-y-2">
                      <dt className="col-span-1 text-gray-500">Role</dt>
                      <dd className="col-span-2 font-medium text-gray-900">{capitalize(popRole)}</dd>

                      <dt className="col-span-1 text-gray-500">District</dt>
                      <dd className="col-span-2 font-medium text-gray-900">{displayOrNA(popDistrict)}</dd>

                      <dt className="col-span-1 text-gray-500">School</dt>
                      <dd className="col-span-2 font-medium text-gray-900">{displayOrNA(popSchool)}</dd>

                      {/* Sub_assigned: hidden unless assigned */}
                      {popSubAssigned && popSubAssigned.trim().length > 0 && (
                        <>
                          <dt className="col-span-1 text-gray-500">Sub_assigned</dt>
                          <dd className="col-span-2 font-medium text-gray-900">{popSubAssigned}</dd>
                        </>
                      )}

                      <dt className="col-span-1 text-gray-500">Phone_Id</dt>
                      <dd className="col-span-2 font-medium text-gray-900">{displayOrNA(popPhoneId)}</dd>
                    </dl>
                  </div>

                  <p className="text-[11px] leading-4 text-gray-500">
                    These values are read from cookies set during sign-in. If something looks off, sign out and back in.
                  </p>
                </div>

                <div className="mt-3 flex items-center justify-between">
                  <span className="inline-flex items-center gap-2 rounded-md bg-gray-100 px-2.5 py-1 text-[11px] font-medium text-gray-700">
                    <svg width="14" height="14" viewBox="0 0 24 24" fill="none" className="opacity-80">
                      <path d="M12 15v-3m0-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                    Cookie-backed profile
                  </span>
                  {/* A convenient logout in-panel */}
                  <LogoutButton />
                </div>
              </div>
            </details>

            {/* Existing logout (kept for parity; the in-panel one is optional) */}
            <LogoutButton />
          </div>
        </div>
      </header>

      {/* Welcome */}
      <section className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <div className="mb-2 flex items-center justify-between">
          <h2 className="text-3xl font-bold text-gray-900">
            Welcome back, {fullName}
          </h2>
          {/* Only show role indicator if admin is previewing a different role */}
          {actualUserRole === 'admin' && previewRole !== 'admin' && (
            <span className="inline-flex items-center gap-2 rounded-full border border-gray-200 bg-white px-3 py-1 text-sm text-gray-700">
              Previewing as
              <span className="rounded-md bg-gray-100 px-2 py-0.5 font-medium capitalize">
                {previewRole}
              </span>
            </span>
          )}
        </div>
        <p className="text-gray-600">Choose a quick action to get started.</p>
        
        {/* Client-side script to handle missing profile */}
        <script
          dangerouslySetInnerHTML={{
            __html: `
              (function() {
                // Check if we have user profile in sessionStorage, redirect to login if not
                const profile = sessionStorage.getItem('sa_profile');
                if (!profile && !${JSON.stringify(!!userProfile)}) {
                  console.warn('No user profile found, redirecting to login');
                  window.location.href = '/admin/login';
                }
              })();
            `,
          }}
        />
      </section>

      {/* Quick Actions */}
      <section className="mx-auto max-w-7xl px-4 pb-12 sm:px-6 lg:px-8">
        <h2 className="mb-6 text-2xl font-bold text-gray-900">Quick Actions</h2>

        <div className="grid grid-cols-1 gap-6 sm:grid-cols-2 lg:grid-cols-3">
          {/* Search Students (Admin, Teacher, Sub) */}
          {(isAdmin || isTeacher || isSub) && (
            <Link
              href="/dashboard/students"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="11" cy="8" r="2" strokeWidth="2" />
                  <path d="M7 14a4 4 0 008 0" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Search Students</h3>
              <p className="mt-1 text-sm text-gray-600">Find and view student information and attendance records (scoped by role).</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Search Classes & Assign Substitutes (Admin only) */}
          {isAdmin && (
            <Link
              href="/dashboard/classes"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="7" y="7" width="8" height="6" rx="1" strokeWidth="2" />
                  <path d="M9 9v4M11 9v4M13 9v4" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Search Classes & Assign Substitutes</h3>
              <p className="mt-1 text-sm text-gray-600">Browse class schedules, add a Substitute Teacher, and see live attendance information.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Search Teachers (Admin only) */}
          {isAdmin && (
            <Link
              href="/dashboard/teachers"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <path d="M14 9V5a3 3 0 00-6 0v4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <rect x="8" y="9" width="8" height="5" rx="1" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Search Teachers</h3>
              <p className="mt-1 text-sm text-gray-600">Find teacher profiles and their class assignments.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Remove A Substitute Assignment (Admin only) */}
          {isAdmin && (
            <Link
              href="/dashboard/subs"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M16 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="7" r="4" strokeWidth="2" />
                  <path d="M17 11l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Remove A Substitute Assignment</h3>
              <p className="mt-1 text-sm text-gray-600">Manage substitute teacher assignments and coverage.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* View All Registered Substitutes (Admin only) */}
          {isAdmin && (
            <Link
              href="/dashboard/view-all-subs"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 00-4-4H5a4 4 0 00-4 4v2" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="8.5" cy="7" r="4" strokeWidth="2" />
                  <path d="M20 21v-2a4 4 0 00-3-3.87" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <circle cx="16" cy="3.13" r="3" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">View All Registered Substitutes</h3>
              <p className="mt-1 text-sm text-gray-600">Browse all substitute teachers registered in the system.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Download Today's Attendance (Admin, Teacher, Sub) */}
          {(isAdmin || isTeacher || isSub) && (
            <Link
              href="/dashboard/csv"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M21 15v4a2 2 0 01-2 2H5a2 2 0 01-2-2v-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <polyline points="7,10 12,15 17,10" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  <line x1="12" y1="15" x2="12" y2="3" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Download Today&apos;s Attendance</h3>
              <p className="mt-1 text-sm text-gray-600">Export today's attendance data as a report (scoped by role).</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* ---- TEACHER & SUB ONLY ---- */}

          {/* View My Classes (Teacher, Sub) */}
          {(isTeacher || isSub) && (
            <Link
              href="/dashboard/my-classes"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="4" y="5" width="16" height="12" rx="2" strokeWidth="2" />
                  <path d="M8 9h8M8 13h5" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">View My Classes</h3>
              <p className="mt-1 text-sm text-gray-600">See only the classes you teach or are assigned to cover.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Search My Students (Teacher, Sub) */}
          {(isTeacher || isSub) && (
            <Link
              href="/dashboard/my-students"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <circle cx="11" cy="11" r="8" strokeWidth="2" />
                  <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Search My Students</h3>
              <p className="mt-1 text-sm text-gray-600">Search only within your assigned classes.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Assign Grades (Teacher, Sub) */}
          {(isTeacher || isSub) && (
            <Link
              href="/dashboard/grades"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24  fill='none' stroke='currentColor'">
                  <path d="M12 20l9-9-3-3-9 9-3 1 1-3 9-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Assign Grades</h3>
              <p className="mt-1 text-sm text-gray-600">Enter grades, add comments, and upload files for your students.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Request Time Off / Calendar (Teacher only) */}
          {isTeacher && (
            <Link
              href="/dashboard/time-off"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="3" y="4" width="18" height="18" rx="2" ry="2" strokeWidth="2" />
                  <path d="M16 2v4M8 2v4M3 10h18" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Request Time Off / Calendar</h3>
              <p className="mt-1 text-sm text-gray-600">Request time off and track approvals/sub coverage.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* ---- PARENT ONLY ---- */}

          {/* My Children */}
          {isParent && (
            <Link
              href="/dashboard/my-children"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M17 21v-2a4 4 0 00-4-4H7a4 4 0 00-4 4v2" strokeWidth="2" />
                  <circle cx="9.5" cy="7" r="3.5" strokeWidth="2" />
                  <circle cx="18" cy="7" r="2.5" strokeWidth="2" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">My Children</h3>
              <p className="mt-1 text-sm text-gray-600">See your children's profiles, classes, and attendance.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Today's Attendance (Parent) */}
          {isParent && (
            <Link
              href="/dashboard/parent-attendance"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M3 12h18M3 6h18M3 18h18" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Today&apos;s Attendance</h3>
              <p className="mt-1 text-sm text-gray-600">View today's attendance for your children.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Class List (Parent) */}
          {isParent && (
            <Link
              href="/dashboard/parent-class-list"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <rect x="4" y="5" width="16" height="12" rx="2" strokeWidth="2" />
                  <path d="M8 9h8M8 13h5" strokeWidth="2" strokeLinecap="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Class List</h3>
              <p className="mt-1 text-sm text-gray-600">See each child's current classes and teachers.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Submit Absence Note (Parent) */}
          {isParent && (
            <Link
              href="/dashboard/parent-absence"
              className="group rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-blue-500/30"
            >
              <div className="mb-5 inline-flex h-11 w-11 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M12 20l9-9-3-3-9 9-3 1 1-3 9-9" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
              <h3 className="text-base font-semibold text-gray-900">Submit Absence Note</h3>
              <p className="mt-1 text-sm text-gray-600">Submit an absence/late note to the school.</p>
              <div className="mt-4 inline-flex items-center gap-2 text-sm font-medium text-blue-700">
                Open
                <svg className="transition group-hover:translate-x-0.5" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                  <path d="M9 5l7 7-7 7" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            </Link>
          )}

          {/* Live Dashboard spans the full row on sm / lg */}
          <div className="sm:col-span-2 lg:col-span-3">
            <LiveDashboardCard />
          </div>
        </div>
      </section>
    </main>
  );
}
