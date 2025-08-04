'use client';

import React, { useState } from 'react';

/* ---------- Types (align with your Xano payloads) ---------- */

type StudentMatch = {
  student_id: string | number;
  student_name?: string;
  parent_email?: string;
  school_code?: string;
  district_code?: string;
};

type StudentClassRow = {
  id: number;
  class_id?: string;
  class_name?: string;
  period?: number | string;
  attendance_status?: string;
  teacher_email?: string;
  parent_email?: string;
  school_code?: string;
  district_code?: string;
  student_id?: string | number;
  student_name?: string;
};

/* ---------- Styling helpers ---------- */

const cardGradientColors = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

function statusPillClasses(status?: string) {
  const s = (status || '').toString().trim().toLowerCase();
  if (s === 'present') return 'bg-green-100 text-green-800 ring-1 ring-green-200';
  if (s === 'absent')  return 'bg-red-100 text-red-800 ring-1 ring-red-200';
  return 'bg-gray-100 text-gray-800 ring-1 ring-gray-200';
}

/* ---------- Component ---------- */

export default function StudentsSearch() {
  // Search & selection
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [searchError, setSearchError] = useState<string | null>(null);
  const [noResults, setNoResults] = useState(false);

  const [matches, setMatches] = useState<StudentMatch[] | null>(null);
  const [selected, setSelected] = useState<StudentMatch | null>(null);

  // Classes for selected student
  const [classesLoading, setClassesLoading] = useState(false);
  const [classesError, setClassesError] = useState<string | null>(null);
  const [classes, setClasses] = useState<StudentClassRow[] | null>(null);

  // Modal for a selected class
  const [modalClass, setModalClass] = useState<StudentClassRow | null>(null);

  /* ---------- Actions ---------- */

  async function handleSearch(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSearchError(null);
    setNoResults(false);
    setMatches(null);
    setSelected(null);
    setClasses(null);
    setClassesError(null);
    setModalClass(null);

    const q = query.trim();
    if (!q) {
      alert('Please enter a student name or ID');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/xano/students?q=${encodeURIComponent(q)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      // Better error message if a non-JSON response comes back
      const ct = res.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) throw new Error((payload as any)?.error || String(payload) || `Search failed (${res.status})`);

      const rows: StudentMatch[] = Array.isArray(payload) ? (payload as any) : (payload as any)?.records ?? [];
      if (!rows || rows.length === 0) {
        setNoResults(true);
        return;
      }

      setMatches(rows);
      if (rows.length === 1) {
        await selectStudent(rows[0]);
      }
    } catch (err: any) {
      setSearchError(err?.message || 'Search failed');
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  }

  async function selectStudent(s: StudentMatch) {
    setSelected(s);
    setClasses(null);
    setClassesError(null);
    setModalClass(null);

    if (!s?.student_id && !s?.student_name) return;

    setClassesLoading(true);
    try {
      const url = `/api/xano/student-classes?student_id=${encodeURIComponent(String(s.student_id ?? ''))}`;
      const res = await fetch(url, { method: 'GET', cache: 'no-store' });

      const ct = res.headers.get('content-type') || '';
      const payload = ct.includes('application/json') ? await res.json() : await res.text();

      if (!res.ok) throw new Error((payload as any)?.error || String(payload) || `Failed (${res.status})`);

      let items: StudentClassRow[] = Array.isArray(payload) ? (payload as any) : (payload as any)?.records ?? [];

      items = items.map(r => ({
        ...r,
        student_id: r.student_id ?? s.student_id,
        student_name: r.student_name ?? s.student_name,
        parent_email: r.parent_email ?? s.parent_email,
        school_code: r.school_code ?? s.school_code,
        district_code: r.district_code ?? s.district_code,
      }));

      setClasses(items);
    } catch (e: any) {
      setClassesError(e?.message || 'Failed to load classes');
    } finally {
      setClassesLoading(false);
    }
  }

  const closeModal = () => setModalClass(null);

  /* ---------- UI ---------- */

  return (
    <>
      {/* Search Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Find a Student</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Search by student <strong>name</strong> or <strong>ID</strong> to view their enrolled classes and status.
        </p>

        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative" autoComplete="off">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter student name or ID..."
                className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200 pl-14 pr-16 text-lg shadow-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => {
                  if (!e.target.value) e.target.placeholder = 'Try: “Kira”, “22227”, or “Joe Rogan”';
                }}
                onBlur={(e) => (e.target.placeholder = 'Enter student name or ID...')}
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-2 rounded-xl hover:from-brand-dark hover:to-brand-blue transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Search
              </button>
            </div>
          </form>

            {searchError && (
              <p className="mt-3 text-sm text-red-600" role="alert">
                {searchError}
              </p>
            )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600 font-medium">Searching for student...</p>
        </div>
      )}

      {/* No Results */}
      {noResults && !loading && (
        <div className="text-center py-16">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Student Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn’t find a student with that name or ID. Please check your spelling and try again.
          </p>
        </div>
      )}

      {/* Multiple Matches */}
      {matches && !selected && matches.length > 1 && (
        <div className="max-w-3xl mx-auto mb-10">
          <h3 className="text-lg font-semibold text-gray-800 mb-3">Select a student</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            {matches.map((m, i) => (
              <button
                key={`${m.student_id}-${i}`}
                onClick={() => selectStudent(m)}
                className="text-left rounded-xl border border-gray-200 bg-white/90 p-4 shadow-sm hover:shadow-md hover:-translate-y-0.5 transition"
              >
                <div className="flex items-center gap-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-r from-brand-blue to-brand-dark text-white font-semibold">
                    {(m.student_name?.[0] || String(m.student_id).slice(-1) || 'S').toString().toUpperCase()}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{m.student_name || '—'}</div>
                    <div className="text-sm text-gray-600">ID: {m.student_id ?? '—'}</div>
                  </div>
                </div>
                {m.parent_email && <div className="mt-2 text-xs text-gray-500">Parent: {m.parent_email}</div>}
              </button>
            ))}
          </div>
        </div>
      )}

      {/* Selected Student Header */}
      {selected && (
        <div className="max-w-7xl mx-auto bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-6 mb-8">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <div className="w-14 h-14 bg-gradient-to-r from-brand-blue to-brand-dark rounded-xl flex items-center justify-center text-white text-lg font-semibold">
                {(selected.student_name?.[0] || String(selected.student_id).slice(-1) || 'S').toString().toUpperCase()}
              </div>
              <div>
                <div className="text-xl font-bold text-gray-900">{selected.student_name || 'Student'}</div>
                <div className="text-sm text-gray-600">ID: {selected.student_id ?? '—'}</div>
                {selected.parent_email && <div className="text-sm text-gray-500">Parent: {selected.parent_email}</div>}
              </div>
            </div>
            <div className="text-right text-sm text-gray-600">
              {selected.school_code && <div>School: {selected.school_code}</div>}
              {selected.district_code && <div>District: {selected.district_code}</div>}
            </div>
          </div>
        </div>
      )}

      {/* Classes */}
      {selected && (
        <section className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between mb-6">
            <h3 className="text-2xl font-bold text-gray-800">Enrolled Classes</h3>
            {classes && (
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-white/20">
                <span className="text-sm text-gray-600">Total: </span>
                <span className="font-semibold text-brand-dark">{classes.length}</span>
              </div>
            )}
          </div>

          {classesLoading && (
            <div className="text-center py-10">
              <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
              <p className="text-gray-600">Loading classes…</p>
            </div>
          )}

          {classesError && !classesLoading && (
            <div className="text-center text-sm text-red-600">{classesError}</div>
          )}

          {classes && !classesLoading && (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {classes.map((c, idx) => (
                <button
                  key={c.id}
                  onClick={() => setModalClass(c)}
                  className="text-left class-card bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
                >
                  <div className="flex items-start justify-between mb-4">
                    <div
                      className={`w-12 h-12 bg-gradient-to-r ${
                        cardGradientColors[idx % cardGradientColors.length]
                      } rounded-xl flex items-center justify-center shadow-lg`}
                    >
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                        />
                      </svg>
                    </div>
                    <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClasses(c.attendance_status)}`}>
                      {c.attendance_status || 'Pending'}
                    </span>
                  </div>

                  <h4 className="text-xl font-bold text-gray-800 mb-1">{c.class_name || 'Class'}</h4>
                  <p className="text-gray-600 mb-4">{c.class_id || '—'}</p>

                  <div className="space-y-2 text-sm text-gray-600">
                    {c.period && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>Period {c.period}</span>
                      </div>
                    )}
                    {c.teacher_email && (
                      <div className="flex items-center gap-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.003 5.884L12 10.882l9.997-4A2 2 0 0019 4H5a2 2 0 00-1.997 1.884z M22 8.118l-10 5-10-5V16a2 2 0 002 2h16a2 2 0 002-2V8.118z" />
                        </svg>
                        <span>{c.teacher_email}</span>
                      </div>
                    )}
                  </div>
                </button>
              ))}
            </div>
          )}
        </section>
      )}

      {/* Class Details Modal */}
      {modalClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" onClick={(e) => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{modalClass.class_name || 'Class'}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Class Code</p>
                  <p className="font-semibold text-gray-800">{modalClass.class_id || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Schedule</p>
                  <p className="font-semibold text-gray-800">{modalClass.period ? `Period ${modalClass.period}` : '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Teacher Email</p>
                  <p className="font-semibold text-gray-800">{modalClass.teacher_email || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Parent Email</p>
                  <p className="font-semibold text-gray-800">{modalClass.parent_email || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">School Code</p>
                  <p className="font-semibold text-gray-800">{modalClass.school_code || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Attendance Status</p>
                  <span className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClasses(modalClass.attendance_status)}`}>
                    {modalClass.attendance_status || 'Pending'}
                  </span>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Student Name</p>
                  <p className="font-semibold text-gray-800">{modalClass.student_name || selected?.student_name || '—'}</p>
                </div>
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Student ID</p>
                  <p className="font-semibold text-gray-800">{modalClass.student_id ?? selected?.student_id ?? '—'}</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
