'use client';

import { useMemo, useState } from 'react';

type ClassItem = {
  id?: string | number;
  name?: string;
  class_name?: string;
  course?: string;
  code?: string;
  schedule?: string;
  period?: string | number;
  room?: string;
  room_number?: string;
  students?: number;
  students_count?: number;
  attendance?: number; // if your API returns one
};

type TeacherItem = {
  id?: string | number;
  teacher_name?: string;
  name?: string;
  full_name?: string;
  teacher_email?: string;
  email?: string;
  department?: string;
  experience?: string;
  employeeId?: string | number;
  classes?: ClassItem[];
  class_list?: ClassItem[];
};

function getTeacherName(t: TeacherItem) {
  return t.teacher_name || t.name || t.full_name || 'Unnamed';
}
function getTeacherEmail(t: TeacherItem) {
  return t.teacher_email || t.email || '';
}
function getClasses(t: TeacherItem): ClassItem[] {
  return (t.classes || t.class_list || []) as ClassItem[];
}
function titleForClass(c: ClassItem, ix: number) {
  return c.name || c.class_name || c.course || `Class ${ix + 1}`;
}
function roomForClass(c: ClassItem) {
  return c.room || c.room_number || '';
}
function studentsForClass(c: ClassItem) {
  return typeof c.students === 'number'
    ? c.students
    : typeof c.students_count === 'number'
    ? c.students_count
    : undefined;
}

export default function TeachersSearch() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TeacherItem[]>([]);
  const [touched, setTouched] = useState(false);

  // Modal state
  const [open, setOpen] = useState(false);
  const [modalData, setModalData] = useState<{
    teacher?: string;
    cls?: ClassItem;
  } | null>(null);

  const gradientPalette = useMemo(
    () => [
      'from-blue-400 to-blue-600',
      'from-green-400 to-green-600',
      'from-purple-400 to-purple-600',
      'from-orange-400 to-orange-600',
      'from-pink-400 to-pink-600',
    ],
    []
  );

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setTouched(true);
    setError(null);

    const query = q.trim();
    if (!query) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/xano/teachers?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        cache: 'no-store',
      });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || 'Search failed');
      }

      const items: TeacherItem[] = Array.isArray(payload)
        ? payload
        : (payload?.items || payload?.data || payload?.results || []);

      setResults(items || []);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  function openClassModal(teacherName: string, cls: ClassItem) {
    setModalData({ teacher: teacherName, cls });
    setOpen(true);
  }

  return (
    <>
      {/* Search bar (glass effect) */}
      <form onSubmit={doSearch} className="mx-auto mb-12 max-w-2xl">
        <div className="relative">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setTouched(true)}
            type="text"
            placeholder="Enter teacher name or email address..."
            className="w-full rounded-2xl border border-white/20 bg-white/90 px-6 py-4 pl-14 pr-24 text-lg text-gray-900 shadow-lg backdrop-blur-sm transition-all duration-200 placeholder:text-gray-500 focus:border-transparent focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-blue)]"
          />
          <svg
            className="pointer-events-none absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            disabled={loading || !q.trim()}
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-[color:var(--brand-blue)] to-[color:var(--brand-dark)] px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-[color:var(--brand-dark)] hover:to-[color:var(--brand-blue)] disabled:cursor-not-allowed disabled:opacity-50"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </div>
      </form>

      {/* Loading */}
      {loading && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-[color:var(--brand-blue)] border-t-transparent" />
          <p className="font-medium text-gray-700">Searching for teacher…</p>
        </div>
      )}

      {/* No results */}
      {!loading && !error && results.length === 0 && touched && q.trim() && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-6 flex h-24 w-24 items-center justify-center rounded-full bg-gray-100">
            <svg className="h-12 w-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="mb-2 text-xl font-semibold text-gray-800">No Teacher Found</h3>
          <p className="mx-auto max-w-md text-gray-600">
            We couldn&apos;t find a teacher with that name or email address. Please check your spelling and try again.
          </p>
        </div>
      )}

      {/* Error */}
      {error && (
        <div className="mx-auto max-w-2xl rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-center text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="space-y-10">
        {results.map((t, tIdx) => {
          const name = getTeacherName(t);
          const email = getTeacherEmail(t);
          const dept = t.department;
          const exp = t.experience;
          const empId = t.employeeId;
          const classes = getClasses(t);

          return (
            <div key={(t.id as any) ?? `${email}-${tIdx}`}>
              {/* Teacher card (glass) */}
              <div className="mb-8 rounded-2xl border border-white/20 bg-white/90 p-8 shadow-lg backdrop-blur-sm">
                <div className="flex items-center space-x-6">
                  <div className="flex h-20 w-20 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg">
                    <svg className="h-10 w-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="mb-2 text-2xl font-bold text-gray-800">{name}</h3>
                    {email && <p className="mb-2 text-gray-600">{email}</p>}
                    <div className="flex items-center space-x-4 text-sm text-gray-500">
                      {dept ? <span>{dept}</span> : null}
                      {dept && exp ? <span>•</span> : null}
                      {exp ? <span>{exp}</span> : null}
                      {classes?.length ? (
                        <>
                          {(dept || exp) && <span>•</span>}
                          <span>{classes.length} classes</span>
                        </>
                      ) : null}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="mb-2 rounded-full bg-green-100 px-3 py-1 text-sm font-medium text-green-800">Active</div>
                    {empId ? <p className="text-sm text-gray-600">Employee ID: {empId}</p> : null}
                  </div>
                </div>
              </div>

              {/* Classes grid */}
              <div>
                <div className="mb-6 flex items-center justify-between">
                  <h4 className="text-2xl font-bold text-gray-800">Classes Taught</h4>
                  <div className="rounded-lg border border-white/20 bg-white/90 px-4 py-2 text-sm text-gray-600 shadow-sm backdrop-blur-sm">
                    Total Classes: <span className="font-semibold text-[color:var(--brand-dark)]">{classes.length}</span>
                  </div>
                </div>

                <div className="grid grid-cols-1 gap-6 md:grid-cols-2 lg:grid-cols-3">
                  {classes.map((c, cIdx) => {
                    const title = titleForClass(c, cIdx);
                    const code = c.code;
                    const schedule = c.schedule || (c.period ? `Period ${c.period}` : undefined);
                    const room = roomForClass(c);
                    const students = studentsForClass(c);
                    const attendance = typeof c.attendance === 'number' ? c.attendance : undefined;
                    const grad = gradientPalette[cIdx % gradientPalette.length];

                    return (
                      <button
                        key={(c.id as any) ?? `${title}-${cIdx}`}
                        type="button"
                        onClick={() => openClassModal(name, c)}
                        className="transform rounded-2xl border border-white/20 bg-white/90 p-6 text-left shadow-lg transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl backdrop-blur-sm"
                      >
                        <div className="mb-4 flex items-start justify-between">
                          <div className={`flex h-12 w-12 items-center justify-center rounded-xl bg-gradient-to-r ${grad} text-white shadow-lg`}>
                            <svg className="h-6 w-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                            </svg>
                          </div>
                          {typeof attendance === 'number' && (
                            <div className="rounded-full bg-green-100 px-2 py-1 text-xs font-medium text-green-800">
                              {attendance}% Attendance
                            </div>
                          )}
                        </div>

                        <h5 className="mb-2 text-xl font-bold text-gray-800">{title}</h5>
                        {code && <p className="mb-4 text-gray-600">{code}</p>}

                        <div className="space-y-2 text-sm text-gray-600">
                          {schedule && (
                            <div className="flex items-center space-x-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                              </svg>
                              <span>{schedule}</span>
                            </div>
                          )}
                          {room && (
                            <div className="flex items-center space-x-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 111.314 0z" />
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                              </svg>
                              <span>{room}</span>
                            </div>
                          )}
                          {typeof students === 'number' && (
                            <div className="flex items-center space-x-2">
                              <svg className="h-4 w-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                              </svg>
                              <span>{students} students</span>
                            </div>
                          )}
                        </div>
                      </button>
                    );
                  })}
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Modal */}
      {open && modalData?.cls && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4 backdrop-blur-sm"
          onClick={(e) => {
            if (e.currentTarget === e.target) setOpen(false);
          }}
        >
          <div className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl">
            <div className="mb-6 flex items-center justify-between">
              <h3 className="text-2xl font-bold text-gray-800">
                {titleForClass(modalData.cls, 0)}
              </h3>
              <button
                onClick={() => setOpen(false)}
                className="rounded-lg p-2 transition-colors duration-200 hover:bg-gray-100"
                aria-label="Close"
              >
                <svg className="h-6 w-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>

            <div className="space-y-6">
              <div className="grid grid-cols-2 gap-4">
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Teacher</p>
                  <p className="font-semibold text-gray-800">{modalData.teacher}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Class Code</p>
                  <p className="font-semibold text-gray-800">{modalData.cls.code || '—'}</p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Schedule</p>
                  <p className="font-semibold text-gray-800">
                    {modalData.cls.schedule ||
                      (modalData.cls.period ? `Period ${modalData.cls.period}` : '—')}
                  </p>
                </div>
                <div className="rounded-lg bg-gray-50 p-4">
                  <p className="mb-1 text-sm text-gray-600">Room</p>
                  <p className="font-semibold text-gray-800">{roomForClass(modalData.cls) || '—'}</p>
                </div>
              </div>

              <div className="rounded-lg bg-[color:var(--brand-light)]/20 p-4">
                <p className="mb-2 text-sm text-gray-600">Current Attendance (if provided)</p>
                <div className="flex items-center space-x-3">
                  <div className="h-3 flex-1 rounded-full bg-gray-200">
                    <div
                      className="h-3 rounded-full bg-gradient-to-r from-green-400 to-green-600 transition-all duration-500"
                      style={{
                        width: `${
                          typeof modalData.cls.attendance === 'number'
                            ? modalData.cls.attendance
                            : 0
                        }%`,
                      }}
                    />
                  </div>
                  <span className="font-semibold text-gray-800">
                    {typeof modalData.cls.attendance === 'number'
                      ? `${modalData.cls.attendance}%`
                      : '—'}
                  </span>
                </div>
              </div>

              <div className="flex gap-4">
                <button
                  className="flex-1 rounded-xl bg-gradient-to-r from-[color:var(--brand-blue)] to-[color:var(--brand-dark)] px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-[color:var(--brand-dark)] hover:to-[color:var(--brand-blue)]"
                  onClick={() => alert('Open attendance records')}
                >
                  View Attendance Records
                </button>
                <button
                  className="flex-1 rounded-xl bg-gradient-to-r from-green-400 to-green-600 px-4 py-3 font-medium text-white shadow-lg transition-all duration-200 hover:from-green-500 hover:to-green-700"
                  onClick={() => alert('Open take attendance')}
                >
                  Take Attendance
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
