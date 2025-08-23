'use client';

import React, { useEffect, useState } from 'react';

type ActivityItem = {
  id?: number | string;
  title: string;
  detail?: string;
  created_at?: number | string;
};

type AbsentStudent = {
  id?: number | string;
  name?: string;
  class?: string;
  period?: string | number;
  teacher?: string;
};

type ClassStats = {
  classId?: string;
  className: string;
  teacher?: string;
  present: number;
  absent: number;
  pending: number;
  late: number;
  total: number;
};

type PeriodStudent = {
  id: string;
  name?: string;
  status: string;
  class?: string;
  classId?: string;
  teacher?: string;
};

type PeriodStats = {
  present: number;
  absent: number;
  pending: number;
  late: number;
  total: number;
  presentPct: number;
  absentPct: number;
  students: PeriodStudent[];
  classes: ClassStats[];
};

type LivePayload = {
  present: number;
  absent: number;
  pending?: number;
  late?: number;
  total?: number;
  presentPct?: number;
  absentPct?: number;
  subsCount?: number;
  absent_students?: AbsentStudent[];
  periodStats?: Record<string, PeriodStats>;
  timestamp?: number | string | null;
  activity: ActivityItem[];
};

/* ---------- time helpers ---------- */

function isActiveSchoolHoursET(d: Date = new Date()) {
  return true; // DEMO MODE: Always active
}

function timeAgo(ts?: number | string | null) {
  if (!ts) return '';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(String(ts));
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/* ---------- component ---------- */

export default function LiveDashboardCard({ pollMs = 5000 }: { pollMs?: number }) {
  const [data, setData] = useState<LivePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAbsent, setShowAbsent] = useState(false);
  const [showPeriods, setShowPeriods] = useState(false);
  const [selectedPeriod, setSelectedPeriod] = useState<string | null>(null);
  const [selectedClass, setSelectedClass] = useState<ClassStats | null>(null);
  const [classStudents, setClassStudents] = useState<any[]>([]);
  const [filteredStudents, setFilteredStudents] = useState<any[]>([]);
  const [statusFilter, setStatusFilter] = useState<string | null>(null);
  const [selectedStudent, setSelectedStudent] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [paused, setPaused] = useState(false);

  const fetchLive = async () => {
    const allowed = true; // DEMO MODE
    setPaused(false);

    if (!allowed) {
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch('/api/xano/live-dashboard', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' },
      });
      const payload = await res.json();
      if (!res.ok) {
        // Special handling for loading state
        if (payload?.error === 'Loading live data') {
          throw new Error('Loading live data');
        }
        throw new Error(payload?.error || `Failed (${res.status})`);
      }
      setData(payload);
    } catch (e: any) {
      console.error('Live dashboard fetch error:', e);
      setError(e?.message || 'Failed to load live data');
    } finally {
      setLoading(false);
    }
  };

  // Fetch class students
  const fetchClassStudents = async (classId: string, period: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/xano/live-dashboard?detail=students&classId=${classId}&period=${period}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      setClassStudents(Array.isArray(data) ? data : data?.students || []);
    } catch (e) {
      console.error('Failed to fetch class students:', e);
      setClassStudents([]);
    } finally {
      setDetailLoading(false);
    }
  };

  // Fetch individual student details
  const fetchStudentDetails = async (studentId: string) => {
    setDetailLoading(true);
    try {
      const res = await fetch(`/api/xano/live-dashboard?detail=student&studentId=${studentId}`, {
        cache: 'no-store',
      });
      const student = await res.json();
      setSelectedStudent(student);
    } catch (e) {
      console.error('Failed to fetch student details:', e);
    } finally {
      setDetailLoading(false);
    }
  };

  useEffect(() => {
    fetchLive();
    const id = setInterval(fetchLive, pollMs);
    return () => clearInterval(id);
  }, [pollMs]);

  const total = data?.total ?? (data ? data.present + data.absent : 0);
  const presentPct = data?.presentPct ?? (total ? Math.round((data!.present / total) * 100) : 0);
  const absentPct = data?.absentPct ?? (total ? Math.round((data!.absent / total) * 100) : 0);

  const startEmergency = async () => {
    try {
      setBusy(true);
      alert('Emergency Protocol triggered (placeholder).');
    } catch (e: any) {
      alert(e?.message || 'Failed to start emergency');
    } finally {
      setBusy(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'present': return 'text-green-600 bg-green-50';
      case 'absent': return 'text-red-600 bg-red-50';
      case 'late': return 'text-yellow-600 bg-yellow-50';
      case 'pending': return 'text-gray-600 bg-gray-50';
      default: return 'text-gray-500 bg-gray-50';
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
              </svg>
            </span>
            <h3 className="text-base font-semibold text-gray-900">Live Dashboard</h3>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span className="h-2 w-2 rounded-full animate-pulse bg-green-400" />
            <span className="text-xs text-gray-600">Live</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Present %</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading && !data ? '—' : `${presentPct}%`}
            </p>
          </div>

          <button
            className="rounded-xl border border-gray-100 bg-white p-3 text-left hover:bg-gray-50"
            onClick={() => data && setShowAbsent(true)}
          >
            <p className="text-xs text-gray-500">Absent %</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading && !data ? '—' : `${absentPct}%`}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              {data ? `${data.absent ?? 0} student${(data.absent ?? 0) === 1 ? '' : 's'}` : ''}
              {data && <span className="ml-1 underline">View details</span>}
            </p>
          </button>

          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Substitute Teachers</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading && !data ? '—' : data?.subsCount ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Pending/Late</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading && !data ? '—' : `${(data?.pending ?? 0) + (data?.late ?? 0)}`}
            </p>
          </div>
        </div>

        {/* Period Breakdown Section */}
        <div className="mb-4">
          <div className="flex items-center justify-between mb-2">
            <h4 className="text-xs font-semibold text-gray-700">Period Attendance</h4>
            <button
              className="text-xs text-blue-600 hover:text-blue-700 font-medium"
              onClick={() => data?.periodStats && setShowPeriods(true)}
              disabled={!data?.periodStats}
            >
              View All →
            </button>
          </div>
          <div className="grid grid-cols-5 gap-2">
            {['1', '2', '3', '4', '5'].map((period) => {
              const stats = data?.periodStats?.[period];
              const pct = stats?.presentPct ?? 0;
              const color = pct >= 90 ? 'bg-green-500' : pct >= 75 ? 'bg-yellow-500' : 'bg-red-500';
              
              return (
                <div
                  key={period}
                  className="rounded-lg border border-gray-100 bg-white p-2 text-center hover:shadow-sm transition-shadow cursor-pointer"
                  onClick={() => {
                    if (data?.periodStats) {
                      setSelectedPeriod(period);
                      setShowPeriods(true);
                    }
                  }}
                >
                  <p className="text-[10px] text-gray-500 font-medium">Period {period}</p>
                  <p className="text-lg font-bold text-gray-900">
                    {loading && !stats ? '—' : `${pct}%`}
                  </p>
                  <div className="mt-1 h-1 w-full bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${color} transition-all duration-300`}
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        </div>

        {/* Activity */}
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold text-gray-700">Recent Activity</h4>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
            {error && (
              <div className="px-3 py-4 text-center">
                <p className="text-sm text-blue-600 mb-2">{error === 'Loading live data' ? 'Loading live data' : error}</p>
                {error === 'Loading live data' && (
                  <button
                    onClick={fetchLive}
                    className="inline-flex items-center px-3 py-1 text-xs font-medium text-white bg-blue-600 hover:bg-blue-700 rounded-md transition-colors"
                  >
                    <svg className="w-3 h-3 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
                    </svg>
                    Refresh Live Data
                  </button>
                )}
              </div>
            )}
            
            {!error && loading && !data && (
              <div className="px-3 py-6 text-center text-xs text-gray-500">Loading…</div>
            )}
            
            {!error && !loading && !data?.activity?.length && (
              <div className="px-3 py-6 text-center text-xs text-gray-500">
                No recent events.
              </div>
            )}
            
            {!error && data?.activity && data.activity.length > 0 && (
              data.activity.slice(0, 2).map((a) => (
                <div
                  key={String(a.id ?? `${a.title}-${a.created_at}`)}
                  className="flex items-center justify-between px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.title}</p>
                    {a.detail && <p className="truncate text-xs text-gray-500">{a.detail}</p>}
                  </div>
                  <span className="ml-3 shrink-0 whitespace-nowrap text-[11px] text-gray-500">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
              ))
            )}
          </div>
        </div>

        {/* CTA */}
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:from-rose-600 hover:to-red-700 disabled:opacity-60"
          onClick={startEmergency}
          disabled={busy}
        >
          <span className="mr-2">🚨</span> {busy ? 'Starting…' : 'Emergency Protocol'}
        </button>

        {/* Footer */}
        <p className="mt-2 text-right text-[11px] text-gray-500">
          {`Updated ${timeAgo(data?.timestamp ?? Date.now())}`}
        </p>
      </div>

      {/* Period Details Modal with Drill-Down */}
      {showPeriods && data?.periodStats && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => {
            setShowPeriods(false);
            setSelectedPeriod(null);
            setSelectedClass(null);
            setClassStudents([]);
            setFilteredStudents([]);
            setStatusFilter(null);
            setSelectedStudent(null);
          }}
        >
          <div
            className="max-h-[80vh] w-full max-w-3xl overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Navigation breadcrumb */}
            <div className="mb-4 flex items-center justify-between">
              <div className="flex items-center space-x-2 text-sm">
                <button
                  className="text-blue-600 hover:text-blue-700"
                  onClick={() => {
                    setSelectedClass(null);
                    setClassStudents([]);
                    setSelectedStudent(null);
                  }}
                >
                  Periods
                </button>
                {selectedPeriod && (
                  <>
                    <span className="text-gray-400">/</span>
                    <button
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => {
                        setSelectedClass(null);
                        setClassStudents([]);
                        setSelectedStudent(null);
                      }}
                    >
                      Period {selectedPeriod}
                    </button>
                  </>
                )}
                {selectedClass && (
                  <>
                    <span className="text-gray-400">/</span>
                    <button
                      className="text-blue-600 hover:text-blue-700"
                      onClick={() => setSelectedStudent(null)}
                    >
                      {selectedClass.className}
                    </button>
                  </>
                )}
                {selectedStudent && (
                  <>
                    <span className="text-gray-400">/</span>
                    <span className="text-gray-900">{selectedStudent.name || 'Student'}</span>
                  </>
                )}
              </div>
              <button
                className="rounded-md p-2 hover:bg-gray-100"
                onClick={() => {
                  setShowPeriods(false);
                  setSelectedPeriod(null);
                  setSelectedClass(null);
                  setClassStudents([]);
                  setFilteredStudents([]);
                  setStatusFilter(null);
                  setSelectedStudent(null);
                }}
                aria-label="Close"
              >
                ✕
              </button>
            </div>

            {detailLoading && (
              <div className="py-8 text-center text-gray-500">Loading details...</div>
            )}

            {/* Student Detail View */}
            {selectedStudent && !detailLoading && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Student Information</h4>
                <div className="rounded-lg border border-gray-200 p-4">
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-500">Name</p>
                      <p className="font-semibold">{selectedStudent.name || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Student ID</p>
                      <p className="font-semibold">{selectedStudent.id || selectedStudent.student_id || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Grade</p>
                      <p className="font-semibold">{selectedStudent.grade || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Current Status</p>
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                        getStatusColor(selectedStudent.status || 'pending')
                      }`}>
                        {selectedStudent.status || 'Pending'}
                      </span>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Email</p>
                      <p className="font-semibold">{selectedStudent.email || '—'}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-500">Phone</p>
                      <p className="font-semibold">{selectedStudent.phone || '—'}</p>
                    </div>
                  </div>
                  {selectedStudent.parent_info && (
                    <div className="mt-4 pt-4 border-t">
                      <p className="text-sm text-gray-500 mb-2">Parent/Guardian Information</p>
                      <div className="grid grid-cols-2 gap-4">
                        <div>
                          <p className="text-xs text-gray-500">Name</p>
                          <p className="text-sm font-medium">{selectedStudent.parent_info.name || '—'}</p>
                        </div>
                        <div>
                          <p className="text-xs text-gray-500">Contact</p>
                          <p className="text-sm font-medium">{selectedStudent.parent_info.phone || selectedStudent.parent_info.email || '—'}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* Class Students View */}
            {selectedClass && !selectedStudent && !detailLoading && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">
                  {selectedClass.className} - Period {selectedPeriod}
                </h4>
                <div className="grid grid-cols-4 gap-2 mb-4">
                  <button
                    className={`rounded-lg border ${statusFilter === 'present' ? 'border-green-400 bg-green-100' : 'border-green-200 bg-green-50'} p-2 text-center hover:bg-green-100`}
                    onClick={() => filterStudentsByStatus(statusFilter === 'present' ? null : 'present')}
                  >
                    <p className="text-xs text-green-600">Present</p>
                    <p className="text-lg font-bold text-green-700">{selectedClass.present}</p>
                  </button>
                  <button
                    className={`rounded-lg border ${statusFilter === 'absent' ? 'border-red-400 bg-red-100' : 'border-red-200 bg-red-50'} p-2 text-center hover:bg-red-100`}
                    onClick={() => filterStudentsByStatus(statusFilter === 'absent' ? null : 'absent')}
                  >
                    <p className="text-xs text-red-600">Absent</p>
                    <p className="text-lg font-bold text-red-700">{selectedClass.absent}</p>
                  </button>
                  <button
                    className={`rounded-lg border ${statusFilter === 'pending' ? 'border-gray-400 bg-gray-100' : 'border-gray-200 bg-gray-50'} p-2 text-center hover:bg-gray-100`}
                    onClick={() => filterStudentsByStatus(statusFilter === 'pending' ? null : 'pending')}
                  >
                    <p className="text-xs text-gray-600">Pending</p>
                    <p className="text-lg font-bold text-gray-700">{selectedClass.pending}</p>
                  </button>
                  <button
                    className={`rounded-lg border ${statusFilter === 'late' ? 'border-yellow-400 bg-yellow-100' : 'border-yellow-200 bg-yellow-50'} p-2 text-center hover:bg-yellow-100`}
                    onClick={() => filterStudentsByStatus(statusFilter === 'late' ? null : 'late')}
                  >
                    <p className="text-xs text-yellow-600">Late</p>
                    <p className="text-lg font-bold text-yellow-700">{selectedClass.late}</p>
                  </button>
                </div>
                
                {statusFilter && (
                  <p className="text-sm text-gray-600">
                    Showing {statusFilter} students only. 
                    <button 
                      className="ml-2 text-blue-600 hover:text-blue-700"
                      onClick={() => filterStudentsByStatus(null)}
                    >
                      Show all
                    </button>
                  </p>
                )}
                
                <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                  {filteredStudents.length === 0 ? (
                    <p className="py-4 text-center text-sm text-gray-500">
                      {classStudents.length === 0 
                        ? "No students found for this class" 
                        : `No ${statusFilter} students found`}
                    </p>
                  ) : (
                    filteredStudents.map((student: any) => (
                      <button
                        key={student.id || student.student_id}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        onClick={() => fetchStudentDetails(student.id || student.student_id)}
                      >
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{student.name || '—'}</p>
                          <p className="text-xs text-gray-500">ID: {student.id || student.student_id}</p>
                        </div>
                        <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          getStatusColor(student.status || 'pending')
                        }`}>
                          {student.status || 'Pending'}
                        </span>
                      </button>
                    ))
                  )}
                </div>
              </div>
            )}

            {/* Period Detail View with Classes */}
            {selectedPeriod && !selectedClass && !detailLoading && (
              <div className="space-y-4">
                <h4 className="text-lg font-semibold text-gray-900">Period {selectedPeriod} Details</h4>
                
                {/* Status Summary Cards */}
                <div className="grid grid-cols-4 gap-3">
                  <button
                    className="rounded-lg border border-green-200 bg-green-50 p-3 text-center hover:bg-green-100"
                  >
                    <p className="text-xs text-green-600">Present</p>
                    <p className="text-2xl font-bold text-green-700">
                      {data.periodStats[selectedPeriod].present}
                    </p>
                  </button>
                  <button
                    className="rounded-lg border border-red-200 bg-red-50 p-3 text-center hover:bg-red-100"
                  >
                    <p className="text-xs text-red-600">Absent</p>
                    <p className="text-2xl font-bold text-red-700">
                      {data.periodStats[selectedPeriod].absent}
                    </p>
                  </button>
                  <button
                    className="rounded-lg border border-gray-200 bg-gray-50 p-3 text-center hover:bg-gray-100"
                  >
                    <p className="text-xs text-gray-600">Pending</p>
                    <p className="text-2xl font-bold text-gray-700">
                      {data.periodStats[selectedPeriod].pending}
                    </p>
                  </button>
                  <button
                    className="rounded-lg border border-yellow-200 bg-yellow-50 p-3 text-center hover:bg-yellow-100"
                  >
                    <p className="text-xs text-yellow-600">Late</p>
                    <p className="text-2xl font-bold text-yellow-700">
                      {data.periodStats[selectedPeriod].late}
                    </p>
                  </button>
                </div>

                {/* Classes List */}
                <div>
                  <h5 className="text-sm font-semibold text-gray-700 mb-2">Classes</h5>
                  <div className="divide-y divide-gray-100 rounded-lg border border-gray-200">
                    {data.periodStats[selectedPeriod].classes.map((cls) => (
                      <button
                        key={cls.className}
                        className="w-full flex items-center justify-between p-3 hover:bg-gray-50"
                        onClick={() => {
                          setSelectedClass(cls);
                          // Get students from the period stats that belong to this class
                          const periodData = data.periodStats[selectedPeriod];
                          if (periodData && periodData.students) {
                            const classStudentsList = periodData.students.filter((s: any) => 
                              s.class === cls.className || s.classId === cls.classId
                            );
                            setClassStudents(classStudentsList);
                            setFilteredStudents(classStudentsList);
                          } else {
                            // Fallback to fetching via API
                            const identifier = cls.classId || cls.className;
                            if (identifier) {
                              fetchClassStudents(identifier, selectedPeriod);
                            }
                          }
                        }}
                      >
                        <div className="text-left">
                          <p className="font-medium text-gray-900">{cls.className}</p>
                          <p className="text-xs text-gray-500">{cls.teacher || 'No teacher assigned'}</p>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">
                              {Math.round((cls.present / cls.total) * 100)}% Present
                            </p>
                            <p className="text-xs text-gray-500">
                              {cls.present}/{cls.total} students
                            </p>
                          </div>
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                          </svg>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              </div>
            )}

            {/* All Periods View */}
            {!selectedPeriod && !detailLoading && (
              <div className="space-y-3">
                <h4 className="text-lg font-semibold text-gray-900">All Periods Overview</h4>
                {['1', '2', '3', '4', '5'].map((period) => {
                  const stats = data.periodStats![period];
                  if (!stats) return null;
                  
                  const color = stats.presentPct >= 90 ? 'text-green-600' : 
                              stats.presentPct >= 75 ? 'text-yellow-600' : 'text-red-600';
                  
                  return (
                    <button
                      key={period}
                      className="w-full rounded-lg border border-gray-200 p-4 hover:bg-gray-50 text-left"
                      onClick={() => setSelectedPeriod(period)}
                    >
                      <div className="flex items-center justify-between mb-2">
                        <h5 className="font-semibold text-gray-900">Period {period}</h5>
                        <span className={`text-2xl font-bold ${color}`}>
                          {stats.presentPct}%
                        </span>
                      </div>
                      <div className="grid grid-cols-4 gap-4 text-sm">
                        <div>
                          <p className="text-gray-500">Present</p>
                          <p className="font-semibold text-gray-900">{stats.present}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Absent</p>
                          <p className="font-semibold text-gray-900">{stats.absent}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Pending</p>
                          <p className="font-semibold text-gray-900">{stats.pending}</p>
                        </div>
                        <div>
                          <p className="text-gray-500">Late</p>
                          <p className="font-semibold text-gray-900">{stats.late}</p>
                        </div>
                      </div>
                      <div className="mt-2 h-2 w-full bg-gray-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full transition-all duration-300 ${
                            stats.presentPct >= 90 ? 'bg-green-500' : 
                            stats.presentPct >= 75 ? 'bg-yellow-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${stats.presentPct}%` }}
                        />
                      </div>
                    </button>
                  );
                })}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Absent details modal (existing) */}
      {showAbsent && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAbsent(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Absent Students</h4>
              <button
                className="rounded-md p-2 hover:bg-gray-100"
                onClick={() => setShowAbsent(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {!data?.absent_students?.length ? (
              <p className="py-8 text-center text-sm text-gray-600">No absent students listed.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.absent_students.map((s, i) => (
                  <li key={`${s.id ?? i}`} className="py-3">
                    <p className="text-sm font-medium text-gray-900">{s.name || '—'}</p>
                    <p className="text-xs text-gray-500">
                      {[s.class, s.period ? `Period ${s.period}` : '', s.teacher]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
