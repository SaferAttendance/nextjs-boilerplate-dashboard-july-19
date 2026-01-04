//app/dashboard/coverage/admin/AdminCoverageClient.tsx

'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI, CoverageHistoryEntry, CoverageRequest, Teacher as XanoTeacher } from '@/lib/xano/api';
import { useAdminDashboard } from '@/lib/hooks/useCoverage';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type TeacherView = {
  id: string;
  name: string;
  daysSinceLast: number;
  position: number | null;
  status: 'free' | 'covering' | 'absent';
  department: string;
  hoursThisMonth: number;
  amountThisMonth: number;
};

function mapTeacher(t: XanoTeacher): TeacherView {
  return {
    id: String(t.id),
    name: t.name,
    daysSinceLast: Number(t.days_since_last ?? 0),
    position: t.rotation_position ?? null,
    status: t.status,
    department: t.department,
    hoursThisMonth: Number(t.hours_this_month ?? 0),
    amountThisMonth: Number(t.amount_this_month ?? 0),
  };
}

function fmtDateTime(dateStr?: string, timeStr?: string) {
  if (!dateStr && !timeStr) return '';
  if (!dateStr) return timeStr || '';
  if (!timeStr) return dateStr;
  return `${dateStr} ${timeStr}`;
}

export default function AdminCoverageClient({
  fullName,
  districtCode,
  schoolCode,
}: {
  fullName: string;
  districtCode?: string | null;
  schoolCode?: string | null;
}) {
  const initial = useMemo(() => (fullName || 'Admin').split(' ')[0], [fullName]);

  const safeSchool = schoolCode || '';
  const safeDistrict = districtCode || '';

  const {
    uncoveredClasses,
    departmentRotations,
    stats,
    loading,
    error,
    refreshData,
    assignEmergencyCoverage,
    markTeacherAbsent,
  } = useAdminDashboard(safeSchool, safeDistrict);

  const [emergencyMode, setEmergencyMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [raceConditionActive, setRaceConditionActive] = useState(false);

  // Modal states
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [showMarkAbsentModal, setShowMarkAbsentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateOpeningModal, setShowCreateOpeningModal] = useState(false);
  const [showDailyScheduleModal, setShowDailyScheduleModal] = useState(false);

  // Countdown (UI-only for now)
  const [urgentMM, setUrgentMM] = useState(42);
  const [urgentSS, setUrgentSS] = useState(15);

  useEffect(() => {
    const interval = setInterval(() => {
      setUrgentSS((s) => {
        if (urgentMM <= 0 && s <= 0) return 0;
        if (s > 0) return s - 1;
        setUrgentMM((m) => (m > 0 ? m - 1 : 0));
        return 59;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [urgentMM]);

  const urgentTimerText = useMemo(() => {
    const mm = String(Math.max(0, urgentMM)).padStart(2, '0');
    const ss = String(Math.max(0, urgentSS)).padStart(2, '0');
    return urgentMM <= 0 && urgentSS <= 0 ? 'OVERDUE' : `${mm}:${ss}`;
  }, [urgentMM, urgentSS]);

  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  function toggleEmergencyMode() {
    setEmergencyMode((prev) => {
      const next = !prev;
      pushToast(
        next ? 'Emergency mode activated — broadcast enabled' : 'Emergency mode deactivated',
        'success'
      );
      return next;
    });
  }

  const uncoveredCount = stats?.uncoveredCount ?? uncoveredClasses.length ?? 0;
  const availableCount = stats?.availableTeachers ?? 0;
  const activeSubstitutes = stats?.activeSubstitutes ?? 0;
  const coverageRate = stats?.coverageRate ?? 0;

  const rotationData: Record<string, TeacherView[]> = useMemo(() => {
    const out: Record<string, TeacherView[]> = {};
    for (const [dept, teachers] of Object.entries(departmentRotations || {})) {
      out[dept] = (teachers || []).map(mapTeacher);
    }
    return out;
  }, [departmentRotations]);

  function viewAvailableTeachers() {
    const available = Object.values(rotationData).flat().filter((t) => t.status === 'free');
    if (available.length === 0) {
      pushToast('No available teachers found right now.', 'error');
      return;
    }
    pushToast(`Available teachers: ${available.map((t) => t.name).join(', ')}`, 'success');
  }

  async function handleEmergencyAssign(classId: string) {
    if (!safeSchool) {
      pushToast('Missing school code — cannot load coverage data.', 'error');
      return;
    }
    if (raceConditionActive) {
      pushToast('Race condition in progress - please wait', 'error');
      return;
    }

    setRaceConditionActive(true);
    pushToast(`Creating emergency coverage for ${classId}...`, 'success');

    try {
      const created = await assignEmergencyCoverage(classId, true, emergencyMode);
      pushToast(`Emergency coverage created: ${created.class_name || created.class_id}`, 'success');
      await refreshData();
    } catch (e: any) {
      pushToast(e?.message || 'Emergency create failed', 'error');
    } finally {
      setRaceConditionActive(false);
    }
  }

  async function handleBatchAssign() {
    const classes = (uncoveredClasses || []).slice(0, 3);
    if (classes.length === 0) {
      pushToast('No uncovered classes to assign.', 'error');
      return;
    }
    if (raceConditionActive) {
      pushToast('Race condition in progress - please wait', 'error');
      return;
    }

    setRaceConditionActive(true);
    pushToast(`Creating emergency openings for ${classes.length} classes...`, 'success');

    try {
      for (const c of classes) {
        await assignEmergencyCoverage(c.class_id, true, true);
      }
      pushToast('Emergency openings created. Waiting for acceptances...', 'success');
      await refreshData();
      setShowBatchAssignModal(false);
    } catch (e: any) {
      pushToast(e?.message || 'Batch create failed', 'error');
    } finally {
      setRaceConditionActive(false);
    }
  }

  async function handleMarkAbsent(teacherId: string) {
    if (raceConditionActive) {
      pushToast('Race condition in progress - please wait', 'error');
      return;
    }
    setRaceConditionActive(true);
    try {
      pushToast('Marking teacher absent...', 'success');
      await markTeacherAbsent(teacherId);
      pushToast('Teacher marked absent. Coverage needs refreshed.', 'success');
      await refreshData();
      setShowMarkAbsentModal(false);
    } catch (e: any) {
      pushToast(e?.message || 'Mark absent failed', 'error');
    } finally {
      setRaceConditionActive(false);
    }
  }

  return (
    <>
      {/* top status / config */}
      <div className="mb-6 flex flex-wrap items-center justify-between gap-3">
        <div className="flex items-center gap-3">
          <div className="h-10 w-10 rounded-xl bg-purple-600 text-white flex items-center justify-center font-semibold">
            {initial?.[0]?.toUpperCase() || 'A'}
          </div>
          <div>
            <div className="text-sm text-gray-500">Signed in as</div>
            <div className="font-medium text-gray-900">{fullName || 'Admin'}</div>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <button
            onClick={() => refreshData()}
            className="px-3 py-2 rounded-lg text-sm bg-white border border-gray-200 hover:bg-gray-50"
          >
            Refresh
          </button>
        </div>
      </div>

      {(!schoolCode || !districtCode) && (
        <div className="mb-6 rounded-xl border border-yellow-200 bg-yellow-50 p-4 text-sm text-yellow-800">
          Missing <b>district_code</b> or <b>school_code</b> cookies. The admin page will load, but Xano calls
          may fail until those cookies are set.
        </div>
      )}

      {loading && (
        <div className="mb-6 rounded-xl border border-gray-200 bg-white p-4 text-sm text-gray-600">
          Loading live coverage data…
        </div>
      )}

      {error && (
        <div className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Main Admin View Content */}
      <AdminView
        uncoveredCount={uncoveredCount}
        availableCount={availableCount}
        activeSubstitutes={activeSubstitutes}
        coverageRate={coverageRate}
        urgentTimerText={urgentTimerText}
        emergencyAssign={handleEmergencyAssign}
        emergencyBatchAssign={() => setShowBatchAssignModal(true)}
        markTeacherAbsent={() => setShowMarkAbsentModal(true)}
        viewAvailableTeachers={viewAvailableTeachers}
        pushToast={pushToast}
        emergencyMode={emergencyMode}
        toggleEmergencyMode={toggleEmergencyMode}
        rotationData={rotationData}
        uncoveredClasses={uncoveredClasses}
        showHistoryModal={() => setShowHistoryModal(true)}
        showCreateOpeningModal={() => setShowCreateOpeningModal(true)}
        showDailyScheduleModal={() => setShowDailyScheduleModal(true)}
      />

      {/* Modals */}
      {showBatchAssignModal && (
        <EmergencyBatchAssignModal
          teachers={Object.values(rotationData).flat()}
          onClose={() => setShowBatchAssignModal(false)}
          onAssign={handleBatchAssign}
        />
      )}

      {showMarkAbsentModal && (
        <MarkTeacherAbsentModal
          teachers={Object.values(rotationData).flat()}
          onClose={() => setShowMarkAbsentModal(false)}
          onMarkAbsent={handleMarkAbsent}
        />
      )}

      {showHistoryModal && (
        <CoverageHistoryModal
          schoolCode={safeSchool}
          onClose={() => setShowHistoryModal(false)}
          onExport={(format: string) => pushToast(`Exporting history as ${format}…`, 'success')}
        />
      )}

      {showCreateOpeningModal && (
        <CreateOpeningModal
          onClose={() => setShowCreateOpeningModal(false)}
          onCreate={async (type: string, classId: string) => {
            if (!classId) {
              pushToast('Please enter a class id (ex: MATH201).', 'error');
              return;
            }
            try {
              if (type === 'emergency') {
                await handleEmergencyAssign(classId);
              } else {
                pushToast('Standard openings need a Xano endpoint (not wired yet).', 'error');
              }
              setShowCreateOpeningModal(false);
            } catch {
              /* handled via toast */
            }
          }}
        />
      )}

      {showDailyScheduleModal && <DailyScheduleModal onClose={() => setShowDailyScheduleModal(false)} />}

      {/* Race Condition Notification */}
      {raceConditionActive && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"
                />
              </svg>
            </div>
            <div>
              <div className="font-medium">Working…</div>
              <div className="text-sm">Syncing coverage updates</div>
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 transform transition-transform duration-300 max-w-sm',
              t.type === 'success' ? 'bg-green-500' : 'bg-red-500',
            ].join(' ')}
          >
            <div className="flex-shrink-0">
              {t.type === 'success' ? (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              )}
            </div>
            <div className="font-medium">{t.message}</div>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="flex-shrink-0 ml-2"
              aria-label="Dismiss"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </>
  );
}

/** AdminView props + component */
type AdminViewProps = {
  uncoveredCount: number;
  availableCount: number;
  activeSubstitutes: number;
  coverageRate: number;
  urgentTimerText: string;
  emergencyAssign: (classId: string) => void;
  emergencyBatchAssign: () => void;
  markTeacherAbsent: () => void;
  viewAvailableTeachers: () => void;
  pushToast: (message: string, type?: 'success' | 'error') => void;
  emergencyMode: boolean;
  toggleEmergencyMode: () => void;
  rotationData: Record<string, TeacherView[]>;
  uncoveredClasses: CoverageRequest[];
  showHistoryModal: () => void;
  showCreateOpeningModal: () => void;
  showDailyScheduleModal: () => void;
};

function AdminView({
  uncoveredCount,
  availableCount,
  activeSubstitutes,
  coverageRate,
  urgentTimerText,
  emergencyAssign,
  emergencyBatchAssign,
  markTeacherAbsent,
  viewAvailableTeachers,
  emergencyMode,
  toggleEmergencyMode,
  rotationData,
  uncoveredClasses,
  showHistoryModal,
  showCreateOpeningModal,
  showDailyScheduleModal,
}: AdminViewProps) {
  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Uncovered Classes</p>
              <p className="text-3xl font-bold text-red-600 mt-1">{uncoveredCount}</p>
            </div>
            <div className="p-3 bg-red-50 rounded-lg">
              <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z"
                />
              </svg>
            </div>
          </div>
          <div className="mt-3 flex items-center text-xs text-red-600">
            <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            Next class starts in {urgentTimerText}
          </div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Teachers</p>
              <p className="text-3xl font-bold text-green-600 mt-1">{availableCount}</p>
            </div>
            <div className="p-3 bg-green-50 rounded-lg">
              <svg className="w-6 h-6 text-green-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
            </div>
          </div>
          <button onClick={viewAvailableTeachers} className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">
            View available list →
          </button>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Active Substitutes</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{activeSubstitutes}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">Live from dashboard stats</div>
        </div>

        <div className="bg-white rounded-xl p-6 border border-gray-200">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Coverage Rate</p>
              <p className="text-3xl font-bold text-gray-900 mt-1">{coverageRate}%</p>
            </div>
            <div className="p-3 bg-gray-50 rounded-lg">
              <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-xs text-gray-600">Live from dashboard stats</div>
        </div>
      </div>

      {/* Emergency Mode Toggle */}
      <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-4">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-3">
            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
            <div>
              <p className="font-medium text-gray-900">Emergency Mode</p>
              <p className="text-sm text-gray-600">Broadcast to all available staff</p>
            </div>
          </div>
          <button
            onClick={toggleEmergencyMode}
            className={`px-4 py-2 rounded-lg font-medium transition-colors ${
              emergencyMode
                ? 'bg-yellow-600 text-white hover:bg-yellow-700'
                : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'
            }`}
          >
            {emergencyMode ? 'Deactivate' : 'Activate'}
          </button>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <button onClick={emergencyBatchAssign} className="bg-red-600 text-white rounded-xl p-6 hover:bg-red-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-semibold">Emergency Batch Assign</p>
              <p className="text-sm opacity-90 mt-1">Create emergency openings for top uncovered</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
        </button>

        <button onClick={markTeacherAbsent} className="bg-orange-600 text-white rounded-xl p-6 hover:bg-orange-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-semibold">Mark Teacher Absent</p>
              <p className="text-sm opacity-90 mt-1">Creates/refreshes coverage needs</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M18.364 18.364A9 9 0 005.636 5.636m12.728 12.728A9 9 0 015.636 5.636m12.728 12.728L5.636 5.636" />
            </svg>
          </div>
        </button>

        <button onClick={showCreateOpeningModal} className="bg-blue-600 text-white rounded-xl p-6 hover:bg-blue-700 transition-colors">
          <div className="flex items-center justify-between">
            <div className="text-left">
              <p className="font-semibold">Create Opening</p>
              <p className="text-sm opacity-90 mt-1">Emergency wired, standard pending</p>
            </div>
            <svg className="w-8 h-8 opacity-80" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
          </div>
        </button>
      </div>

      {/* Department Rotation Tables */}
      <div className="bg-white rounded-xl border border-gray-200">
        <div className="p-6 border-b border-gray-200">
          <div className="flex items-center justify-between">
            <h2 className="text-lg font-semibold text-gray-900">Department Coverage Rotations</h2>
            <div className="flex items-center space-x-2">
              <button onClick={showHistoryModal} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">
                View History
              </button>
              <button onClick={showDailyScheduleModal} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">
                Daily Schedule
              </button>
            </div>
          </div>
        </div>

        <div className="divide-y divide-gray-200">
          {Object.entries(rotationData).length === 0 ? (
            <div className="p-6 text-sm text-gray-600">No rotation data yet.</div>
          ) : (
            Object.entries(rotationData).map(([dept, teachers]) => (
              <div key={dept} className="p-6">
                <h3 className="font-medium text-gray-900 mb-4">{dept} Department</h3>
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead>
                      <tr className="text-left text-xs text-gray-500">
                        <th className="pb-3 font-medium">Position</th>
                        <th className="pb-3 font-medium">Teacher</th>
                        <th className="pb-3 font-medium">Days Since Last</th>
                        <th className="pb-3 font-medium">Status</th>
                        <th className="pb-3 font-medium">Hours This Month</th>
                        <th className="pb-3 font-medium">Amount Earned</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {teachers.map((teacher) => (
                        <tr key={teacher.id} className="text-sm">
                          <td className="py-3">
                            {teacher.position ? (
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium text-xs">
                                {teacher.position}
                              </span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 font-medium text-gray-900">{teacher.name}</td>
                          <td className="py-3 text-gray-600">{teacher.daysSinceLast}d</td>
                          <td className="py-3">
                            <span
                              className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                                teacher.status === 'free'
                                  ? 'bg-green-100 text-green-700'
                                  : teacher.status === 'covering'
                                  ? 'bg-blue-100 text-blue-700'
                                  : 'bg-gray-100 text-gray-700'
                              }`}
                            >
                              {teacher.status}
                            </span>
                          </td>
                          <td className="py-3 text-gray-600">{teacher.hoursThisMonth}h</td>
                          <td className="py-3 text-gray-900 font-medium">${teacher.amountThisMonth}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Uncovered Classes List */}
      {uncoveredClasses?.length > 0 && (
        <div className="bg-white rounded-xl border border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Uncovered Classes Requiring Immediate Attention</h2>
          </div>
          <div className="p-6 space-y-4">
            {uncoveredClasses.slice(0, 10).map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-8 rounded-full ${cls.urgent ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900">
                      {cls.class_name || cls.class_id} ({cls.class_id})
                    </p>
                    <p className="text-sm text-gray-600">
                      {fmtDateTime(cls.date, cls.start_time)} → {cls.end_time}
                    </p>
                  </div>
                </div>
                <button
                  onClick={() => emergencyAssign(cls.class_id)}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium"
                >
                  Emergency Assign
                </button>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

/** Modals */

type EmergencyBatchAssignModalProps = {
  teachers: TeacherView[];
  onClose: () => void;
  onAssign: () => void;
};

function EmergencyBatchAssignModal({ teachers, onClose, onAssign }: EmergencyBatchAssignModalProps) {
  const available = teachers.filter((t) => t.status === 'free');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <h2 className="text-xl font-semibold mb-4">Emergency Batch Assignment</h2>

        <div className="space-y-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">
              This will create emergency openings; acceptances happen from teacher/sub flows.
            </p>
          </div>

          <div className="space-y-2">
            <p className="font-medium text-gray-700">Available Teachers ({available.length})</p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {available.map((teacher) => (
                <div key={teacher.id} className="flex items-center p-3">
                  <div className="flex-1">
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-xs text-gray-500">
                      {teacher.department} • Position #{teacher.position ?? '—'}
                    </p>
                  </div>
                </div>
              ))}
              {available.length === 0 && <div className="p-3 text-sm text-gray-600">No available teachers.</div>}
            </div>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button onClick={onAssign} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
            Create Emergency Openings
          </button>
        </div>
      </div>
    </div>
  );
}

type MarkTeacherAbsentModalProps = {
  teachers: TeacherView[];
  onClose: () => void;
  onMarkAbsent: (teacherId: string) => void;
};

function MarkTeacherAbsentModal({ teachers, onClose, onMarkAbsent }: MarkTeacherAbsentModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Mark Teacher Absent</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Select Teacher</label>
            <select
              value={selectedTeacher}
              onChange={(e) => setSelectedTeacher(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="">Choose a teacher...</option>
              {teachers
                .filter((t) => t.status !== 'absent')
                .map((teacher) => (
                  <option key={teacher.id} value={teacher.id}>
                    {teacher.name} - {teacher.department}
                  </option>
                ))}
            </select>
          </div>

          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">
              This will mark the teacher as absent and refresh coverage needs.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => selectedTeacher && onMarkAbsent(selectedTeacher)}
            disabled={!selectedTeacher}
            className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            Mark Absent
          </button>
        </div>
      </div>
    </div>
  );
}

type CoverageHistoryModalProps = {
  schoolCode: string;
  onClose: () => void;
  onExport: (format: string) => void;
};

function CoverageHistoryModal({ schoolCode, onClose, onExport }: CoverageHistoryModalProps) {
  const [rows, setRows] = useState<CoverageHistoryEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string>('');

  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        setLoading(true);
        setErr('');
        const data = await adminAPI.getCoverageHistory(schoolCode);
        if (alive) setRows(data || []);
      } catch (e: any) {
        if (alive) setErr(e?.message || 'Failed to load history');
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, [schoolCode]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Coverage History</h2>
          <div className="flex space-x-2">
            <button
              onClick={() => onExport('CSV')}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export CSV
            </button>
            <button
              onClick={() => onExport('PDF')}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export PDF
            </button>
          </div>
        </div>

        {loading && <div className="text-sm text-gray-600">Loading history…</div>}
        {err && <div className="text-sm text-red-700 mb-3">{err}</div>}

        {!loading && !err && (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <table className="w-full">
              <thead className="bg-gray-50">
                <tr className="text-left text-xs text-gray-500">
                  <th className="p-3 font-medium">Date</th>
                  <th className="p-3 font-medium">Teacher</th>
                  <th className="p-3 font-medium">Class Covered</th>
                  <th className="p-3 font-medium">Duration</th>
                  <th className="p-3 font-medium">Type</th>
                  <th className="p-3 font-medium">Amount</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {rows.map((r) => (
                  <tr key={r.id} className="text-sm">
                    <td className="p-3">{r.date}</td>
                    <td className="p-3 font-medium">{r.teacher_name}</td>
                    <td className="p-3">{r.class_name}</td>
                    <td className="p-3">{r.duration_hours}h</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          r.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {r.type}
                      </span>
                    </td>
                    <td className="p-3 font-medium">${r.amount}</td>
                  </tr>
                ))}
                {rows.length === 0 && (
                  <tr>
                    <td className="p-3 text-sm text-gray-600" colSpan={6}>
                      No history records yet.
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          </div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

type CreateOpeningModalProps = {
  onClose: () => void;
  onCreate: (type: string, classId: string) => void;
};

function CreateOpeningModal({ onClose, onCreate }: CreateOpeningModalProps) {
  const [openingType, setOpeningType] = useState('standard');
  const [classId, setClassId] = useState('');

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4">
        <h2 className="text-xl font-semibold mb-4">Create Coverage Opening</h2>

        <div className="space-y-4 mb-6">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Opening Type</label>
            <select
              value={openingType}
              onChange={(e) => setOpeningType(e.target.value)}
              className="w-full p-2 border border-gray-300 rounded-lg"
            >
              <option value="standard">Standard Coverage</option>
              <option value="emergency">Emergency Coverage</option>
              <option value="long-term">Long-term Substitute</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-2">Class ID</label>
            <input
              type="text"
              value={classId}
              onChange={(e) => setClassId(e.target.value)}
              placeholder="e.g., MATH201"
              className="w-full p-2 border border-gray-300 rounded-lg"
            />
            <p className="mt-1 text-xs text-gray-500">
              Emergency is wired. Standard/long-term need a dedicated Xano endpoint.
            </p>
          </div>
        </div>

        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Cancel
          </button>
          <button
            onClick={() => onCreate(openingType, classId.trim())}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700"
          >
            Create Opening
          </button>
        </div>
      </div>
    </div>
  );
}

type DailyScheduleModalProps = {
  onClose: () => void;
};

function DailyScheduleModal({ onClose }: DailyScheduleModalProps) {
  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Daily Coverage Schedule</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="grid grid-cols-5 gap-4">
          {['8:00 AM', '10:00 AM', '12:00 PM', '2:00 PM', '4:00 PM'].map((time) => (
            <div key={time} className="text-center">
              <p className="text-sm font-medium text-gray-700 mb-2">{time}</p>
              <div className="space-y-2">
                {[1, 2].map((i) => (
                  <div
                    key={i}
                    className={`p-3 rounded-lg text-xs ${
                      Math.random() > 0.5 ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                    }`}
                  >
                    {Math.random() > 0.5 ? 'Covered' : 'Open'}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
