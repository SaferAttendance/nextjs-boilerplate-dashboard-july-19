'use client';

import React, { useState } from 'react';

/* ---------- Types ---------- */
// test

// Rows returned by /api/xano/Students (backed by your Xano Students search)
type XanoTeacherRow = {
  id: number;
  teacher_name?: string;
  teacher_email?: string;
  class_name?: string;
  class_id?: string;
  period?: number | string;
  attendance_status?: string;
};

// Rows returned by /api/xano/class-students (Admin_AllStudentsFromParticularClass)
type StudentRow = {
  id: number;
  created_at?: number;
  student_id?: number | string;
  student_name?: string;
  class_name?: string;
  class_id?: string;
  period?: number | string;
  attendance_status?: string;
  teacher_email?: string;
  school_code?: string;
  admin_email?: string;
  parent_email?: string;
  district_code?: string;
  teacher_name?: string;
};

// View model for the UI
type TeacherVM = {
  name: string;
  email: string;
  department?: string;
  experience?: string;
  employeeId?: string;
  classes: Array<{
    name: string;
    code: string;          // class_id
    schedule?: string;     // derived from period if present
    room?: string;         // optional
    students: number;      // count of rows for this class_id
    attendance?: number | null; // placeholder if you later compute %
  }>;
};

/* ---------- Styling helpers ---------- */

const cardGradientColors = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

// Map attendance status -> pill colors
function statusPillClasses(status?: string) {
  const s = (status || '').toString().trim().toLowerCase();
  if (s === 'present') return 'bg-green-100 text-green-800 ring-1 ring-green-200';
  if (s === 'absent')  return 'bg-red-100 text-red-800 ring-1 ring-red-200';
  // default + "pending"
  return 'bg-gray-100 text-gray-800 ring-1 ring-gray-200';
}

/* ---------- Component ---------- */

export default function StudentsSearch() {
  // Search & results
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState<TeacherVM | null>(null);
  const [noResults, setNoResults] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Modal class card
  const [modalClass, setModalClass] =
    useState<TeacherVM['classes'][number] | null>(null);

  // Attendance records (inside modal)
  const [recordsLoading, setRecordsLoading] = useState(false);
  const [recordsError, setRecordsError] = useState<string | null>(null);
  const [records, setRecords] = useState<StudentRow[] | null>(null);

  /* ---------- Helpers ---------- */

  // Convert Xano rows -> TeacherVM and de-dupe by class_id
  function toTeacherVM(rows: XanoTeacherRow[]): TeacherVM {
    const first = rows[0] ?? {};
    const name = (first.teacher_name ?? '').trim() || 'Teacher';
    const email = (first.teacher_email ?? '').trim();

    // Group rows by class_id (fallback to class_name|period if class_id missing)
    const byClass = new Map<
      string,
      { name: string; code: string; period?: string | number; students: number }
    >();

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

    const classes = Array.from(byClass.values()).map((c) => ({
      name: c.name,
      code: c.code,
      schedule: c.period ? `Period ${c.period}` : undefined,
      room: undefined,
      students: c.students,
      attendance: null,
    }));

    return {
      name,
      email,
      department: '',  // keep layout consistent with your current UI
      experience: '',
      employeeId: '',
      classes,
    };
  }

  /* ---------- Search ---------- */

  const handleSearch = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setError(null);
    setNoResults(false);
    setTeacher(null);
    setModalClass(null);
    setRecords(null);
    setRecordsError(null);

    const q = query.trim();
    if (!q) {
      alert('Please enter a student name or Student ID');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/xano/Students?q=${encodeURIComponent(q)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || `Search failed (${res.status})`);
      }

      const rows: XanoTeacherRow[] = Array.isArray(payload)
        ? payload
        : payload?.records ?? [];

      if (!rows || rows.length === 0) {
        setNoResults(true);
        setTeacher(null);
        return;
      }

      setTeacher(toTeacherVM(rows));
    } catch (err: any) {
      setError(err?.message || 'Search failed');
      setNoResults(true);
    } finally {
      setLoading(false);
    }
  };

  /* ---------- Modal actions ---------- */

  const closeModal = () => {
    setModalClass(null);
    setRecords(null);
    setRecordsError(null);
    setRecordsLoading(false);
  };

  const viewAttendanceRecords = async () => {
    if (!teacher || !modalClass) return;

    setRecordsLoading(true);
    setRecordsError(null);
    setRecords(null);

    try {
      const url = `/api/xano/class-students?class_id=${encodeURIComponent(
        modalClass.code
      )}&teacher_email=${encodeURIComponent(teacher.email)}`;

      const res = await fetch(url, { method: 'GET', cache: 'no-store' });
      const payload = await res.json();

      if (!res.ok) {
        throw new Error(payload?.error || `Failed (${res.status})`);
      }

      const items: StudentRow[] = Array.isArray(payload)
        ? payload
        : payload?.records ?? [];

      // Optional: sort by student_name
      items.sort((a, b) =>
        (a.student_name || '').localeCompare(b.student_name || '')
      );

      setRecords(items);
    } catch (e: any) {
      setRecordsError(e?.message || 'Failed to load records');
    } finally {
      setRecordsLoading(false);
    }
  };

  /* ---------- UI ---------- */

  return (
    <>
      {/* Search Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Find a Teacher</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Search by student name or Student ID to view their class schedules and attendance information.
        </p>

        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative" autoComplete="off">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter student name or Student ID..."
                className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200 pl-14 pr-16 text-lg shadow-lg"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                onFocus={(e) => {
                  if (!e.target.value)
                    e.target.placeholder =
                      'Try: Sarah Johnson, john@school.edu, or Mike Davis';
                }}
                onBlur={(e) =>
                  (e.target.placeholder =
                    'Enter student name or Student ID...')
                }
              />
              <svg
                className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
                />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-2 rounded-xl hover:from-brand-dark hover:to-brand-blue transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Search
              </button>
            </div>
          </form>

          {error && (
            <p className="mt-3 text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="text-center py-16" data-testid="loading-state">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Searching for student...</p>
        </div>
      )}

      {/* No Results */}
      {noResults && !loading && (
        <div className="text-center py-16" data-testid="no-results">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Student Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find a student with that name or Student ID. Please check your spelling and try again.
          </p>
        </div>
      )}

      {/* Results */}
      {teacher && !loading && (
        <div className="fadein" data-testid="search-results">
          {/* Teacher Info Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{teacher.name}</h3>
                <p className="text-gray-600 mb-2">{teacher.email}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{teacher.department || '—'}</span>
                  <span>•</span>
                  <span>{teacher.experience || '—'}</span>
                  <span>•</span>
                  <span>{teacher.classes.length} classes</span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Active
                </div>
                <p className="text-sm text-gray-600">
                  Employee ID: <span>{teacher.employeeId || '—'}</span>
                </p>
              </div>
            </div>
          </div>

          {/* Classes Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Classes Taught</h3>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-white/20">
                <span className="text-sm text-gray-600">Total Classes: </span>
                <span className="font-semibold text-brand-dark">{teacher.classes.length}</span>
              </div>
            </div>

            {/* Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacher.classes.map((classInfo, idx) => (
                <div
                  key={classInfo.code}
                  className="class-card bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer opacity-100 transform translate-y-0"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                  onClick={() => {
                    setModalClass(classInfo);
                    setRecords(null);
                    setRecordsError(null);
                    setRecordsLoading(false);
                  }}
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
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {classInfo.attendance != null ? `${classInfo.attendance}%` : '—'} Attendance
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{classInfo.name}</h4>
                  <p className="text-gray-600 mb-4">{classInfo.code}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    {classInfo.schedule && (
                      <div className="flex items-center space-x-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <span>{classInfo.schedule}</span>
                      </div>
                    )}
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"
                        />
                      </svg>
                      <span>{classInfo.students} students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* Class Details Modal (with records viewer) */}
      {modalClass && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={closeModal}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{modalClass.name}</h3>
                <button
                  onClick={closeModal}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Summary tiles */}
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Class Code</p>
                  <p className="font-semibold text-gray-800">{modalClass.code}</p>
                </div>
                {modalClass.schedule && (
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Schedule</p>
                    <p className="font-semibold text-gray-800">{modalClass.schedule}</p>
                  </div>
                )}
                <div className="bg-gray-50 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-1">Enrolled Students</p>
                  <p className="font-semibold text-gray-800">{modalClass.students}</p>
                </div>
              </div>

              {/* Actions */}
              <div className="flex gap-4 mb-6">
                <button
                  className="flex-1 bg-gradient-to-r from-brand-blue to-brand-dark text-white py-3 px-4 rounded-xl hover:from-brand-dark hover:to-brand-blue transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  onClick={viewAttendanceRecords}
                >
                  View Attendance Records
                </button>
                <button
                  className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-500 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                  onClick={() => alert('Opening attendance taking interface...')}
                >
                  Take Attendance
                </button>
              </div>

              {/* Records panel */}
              <div className="bg-white border rounded-xl">
                {recordsLoading && (
                  <div className="py-10 text-center">
                    <div className="w-10 h-10 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-3" />
                    <p className="text-gray-600">Loading records…</p>
                  </div>
                )}

                {recordsError && !recordsLoading && (
                  <div className="py-6 px-4 text-center text-sm text-red-600">{recordsError}</div>
                )}

                {records && !recordsLoading && (
                  <>
                    <div className="px-6 pt-5 pb-3 border-b">
                      <h4 className="text-lg font-semibold text-gray-800">
                        Students in {modalClass.name} ({modalClass.code})
                      </h4>
                      <p className="text-sm text-gray-500">
                        {records.length} record{records.length === 1 ? '' : 's'}
                      </p>
                    </div>
                    <div className="overflow-x-auto">
                      <table className="min-w-full divide-y divide-gray-200">
                        <thead className="bg-gray-50">
                          <tr>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Student ID
                            </th>
                            <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                              Status
                            </th>
                          </tr>
                        </thead>
                        <tbody className="bg-white divide-y divide-gray-100">
                          {records.map((row) => (
                            <tr key={row.id}>
                              <td className="px-6 py-3 text-sm text-gray-800">
                                {row.student_name || '—'}
                              </td>
                              <td className="px-6 py-3 text-sm text-gray-600">
                                {row.student_id ?? '—'}
                              </td>
                              <td className="px-6 py-3 text-sm">
                                <span
                                  className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${statusPillClasses(row.attendance_status)}`}
                                >
                                  {row.attendance_status || 'Pending'}
                                </span>
                              </td>
                            </tr>
                          ))}
                        </tbody>
                      </table>
                    </div>
                  </>
                )}
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
