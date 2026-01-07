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
    id: t.employee_id || String(t.id),
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
  const [showRotationManagementModal, setShowRotationManagementModal] = useState(false);

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
    
    // First find the coverage request ID from the class_id
    const matchingClass = uncoveredClasses.find(c => c.class_id === classId);
    if (!matchingClass) {
      pushToast('Coverage request not found', 'error');
      setRaceConditionActive(false);
      return;
    }
    
    pushToast(`Auto-assigning ${matchingClass.class_name || classId}...`, 'success');

    try {
      // Use the new auto-assign endpoint that picks next person in rotation
      const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:aeQ3kHz2/coverage/auto-assign', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverage_id: matchingClass.id })
      });
      
      const result = await response.json();
      
      if (result.success && result.assignment) {
        pushToast(`✓ Assigned to ${result.assignment.assigned_to} (rotation-based)`, 'success');
      } else if (result.error) {
        throw new Error(result.message || 'Auto-assign failed');
      } else {
        pushToast('Assignment created', 'success');
      }
      
      await refreshData();
    } catch (e: any) {
      // Fallback to emergency notification if auto-assign fails
      pushToast(`Auto-assign failed: ${e?.message}. Sending notifications instead...`, 'error');
      try {
        await assignEmergencyCoverage(classId, true, emergencyMode);
        pushToast('Emergency notifications sent', 'success');
        await refreshData();
      } catch (e2: any) {
        pushToast(e2?.message || 'Emergency assign failed', 'error');
      }
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
      const today = new Date().toISOString().split('T')[0];
      await markTeacherAbsent(teacherId, today);
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
        showRotationManagementModal={() => setShowRotationManagementModal(true)}
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
          schoolCode={safeSchool}
          districtCode={safeDistrict}
          teachers={Object.values(rotationData).flat()}
          onCreate={async (data: CreateOpeningData) => {
            try {
              // Calculate timestamps client-side
              const [year, month, day] = data.date.split('-').map(Number);
              const [startH, startM] = data.startTime.split(':').map(Number);
              const [endH, endM] = data.endTime.split(':').map(Number);
              
              // Create timestamps - add 5 hours for EST to UTC conversion
              const startTimestamp = Date.UTC(year, month - 1, day, startH + 5, startM);
              const endTimestamp = Date.UTC(year, month - 1, day, endH + 5, endM);
              
              const response = await fetch('https://x8ki-letl-twmt.n7.xano.io/api:aeQ3kHz2/coverage/create-opening', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                  type: data.type,
                  date: data.date,
                  start_time: data.startTime,
                  end_time: data.endTime,
                  start_timestamp: startTimestamp,
                  end_timestamp: endTimestamp,
                  district_code: data.district,
                  school_code: data.school,
                  department: data.department,
                  class_name: data.className,
                  class_id: data.classId,
                  room: data.room,
                  grade: data.grade,
                  teacher_id: data.teacherId,
                  teacher_name: data.teacherName,
                  reason: data.reason,
                  pay_amount: data.payAmount,
                  urgent: data.urgent,
                  notes: data.notes || null
                })
              });
              
              const result = await response.json();
              
              if (result.success) {
                pushToast(`✓ Coverage opening created for ${data.className}`, 'success');
                await refreshData();
                setShowCreateOpeningModal(false);
              } else {
                pushToast(result.message || 'Failed to create opening', 'error');
              }
            } catch (e: any) {
              pushToast(e?.message || 'Failed to create opening', 'error');
            }
          }}
        />
      )}

      {showDailyScheduleModal && (
        <DailyScheduleModal
          onClose={() => setShowDailyScheduleModal(false)}
          uncoveredClasses={uncoveredClasses}
          onEmergencyAssign={handleEmergencyAssign}
        />
      )}

      {showRotationManagementModal && (
        <RotationManagementModal
          schoolCode={safeSchool}
          rotationData={rotationData}
          onClose={() => setShowRotationManagementModal(false)}
          pushToast={pushToast}
        />
      )}

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
  showRotationManagementModal: () => void;
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
  showRotationManagementModal,
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
              <p className="font-semibold">Auto-Assign All</p>
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
              <button onClick={showRotationManagementModal} className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">
                Manage Rotation
              </button>
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
                  Auto-Assign
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
        <h2 className="text-xl font-semibold mb-4">Auto-Assign Allment</h2>

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

  const handleExportCSV = () => {
    if (rows.length === 0) {
      onExport('CSV');
      return;
    }

    const headers = ['Date', 'Teacher', 'Class Covered', 'Duration (hrs)', 'Type', 'Amount', 'Status'];
    const csvRows = rows.map(r => [
      r.date,
      r.teacher_name,
      r.class_name,
      r.duration,
      r.type || (r.duration >= 4 ? 'full_day' : 'partial'),
      r.amount,
      r.status
    ]);

    const csvContent = [
      headers.join(','),
      ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.setAttribute('href', url);
    link.setAttribute('download', `coverage-history-${schoolCode}-${new Date().toISOString().split('T')[0]}.csv`);
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    onExport('CSV');
  };

  const handleExportPDF = () => {
    if (rows.length === 0) {
      onExport('PDF');
      return;
    }

    const printContent = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>Coverage History - ${schoolCode}</title>
        <style>
          body { font-family: Arial, sans-serif; padding: 20px; }
          h1 { color: #333; margin-bottom: 5px; }
          .subtitle { color: #666; margin-bottom: 20px; }
          table { width: 100%; border-collapse: collapse; margin-top: 20px; }
          th { background-color: #f3f4f6; padding: 12px 8px; text-align: left; font-size: 12px; color: #6b7280; text-transform: uppercase; border-bottom: 2px solid #e5e7eb; }
          td { padding: 12px 8px; border-bottom: 1px solid #e5e7eb; font-size: 14px; }
          .amount { font-weight: 600; }
          .footer { margin-top: 30px; font-size: 12px; color: #9ca3af; }
        </style>
      </head>
      <body>
        <h1>Coverage History Report</h1>
        <p class="subtitle">School: ${schoolCode} | Generated: ${new Date().toLocaleDateString()}</p>
        <table>
          <thead>
            <tr>
              <th>Date</th>
              <th>Teacher</th>
              <th>Class Covered</th>
              <th>Duration</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Status</th>
            </tr>
          </thead>
          <tbody>
            ${rows.map(r => `
              <tr>
                <td>${r.date}</td>
                <td>${r.teacher_name}</td>
                <td>${r.class_name}</td>
                <td>${r.duration}h</td>
                <td>${r.type || 'partial'}</td>
                <td class="amount">$${r.amount}</td>
                <td>${r.status}</td>
              </tr>
            `).join('')}
          </tbody>
        </table>
        <div class="footer">
          <p>Total Records: ${rows.length} | Total Amount: $${rows.reduce((sum, r) => sum + (r.amount || 0), 0)}</p>
        </div>
      </body>
      </html>
    `;

    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(printContent);
      printWindow.document.close();
      printWindow.focus();
      setTimeout(() => {
        printWindow.print();
        printWindow.close();
      }, 250);
    }

    onExport('PDF');
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Coverage History</h2>
          <div className="flex space-x-2">
            <button
              onClick={handleExportCSV}
              className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200"
            >
              Export CSV
            </button>
            <button
              onClick={handleExportPDF}
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
                    <td className="p-3">{r.duration}h</td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                          r.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'
                        }`}
                      >
                        {r.type || 'partial'}
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

        {!loading && !err && rows.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 border-t pt-4">
            <span>Total Records: {rows.length}</span>
            <span className="font-semibold text-gray-900">
              Total Amount: ${rows.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}
            </span>
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
  onCreate: (data: CreateOpeningData) => void;
  schoolCode: string;
  districtCode: string;
  teachers: TeacherView[];
};

type CreateOpeningData = {
  type: string;
  date: string;
  startTime: string;
  endTime: string;
  district: string;
  school: string;
  department: string;
  className: string;
  classId: string;
  room: string;
  grade: string;
  teacherId: string;
  teacherName: string;
  reason: string;
  payAmount: number;
  urgent: boolean;
  notes: string;
};

function CreateOpeningModal({ onClose, onCreate, schoolCode, districtCode, teachers }: CreateOpeningModalProps) {
  const [openingType, setOpeningType] = useState('standard');
  const [date, setDate] = useState(new Date().toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('08:00');
  const [endTime, setEndTime] = useState('09:00');
  const [district, setDistrict] = useState(districtCode || '');
  const [school, setSchool] = useState(schoolCode || '');
  const [department, setDepartment] = useState('');
  const [className, setClassName] = useState('');
  const [classId, setClassId] = useState('');
  const [room, setRoom] = useState('');
  const [grade, setGrade] = useState('');
  const [teacherId, setTeacherId] = useState('');
  const [reason, setReason] = useState('');
  const [payAmount, setPayAmount] = useState(35);
  const [urgent, setUrgent] = useState(false);
  const [notes, setNotes] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-generate class ID when relevant fields change
  useEffect(() => {
    if (department && school && date) {
      const deptCode = department.substring(0, 4).toUpperCase();
      const dateCode = date.replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setClassId(`${deptCode}-${school.toUpperCase()}-${dateCode}-${randomNum}`);
    }
  }, [department, school, date]);

  // Calculate pay based on duration
  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const durationHours = Math.max(0, (endMinutes - startMinutes) / 60);
      setPayAmount(Math.round(durationHours * 35)); // $35/hour rate
    }
  }, [startTime, endTime]);

  const selectedTeacher = teachers.find(t => t.id === teacherId);

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime || !department || !className) {
      return;
    }
    
    setIsSubmitting(true);
    
    const data: CreateOpeningData = {
      type: openingType,
      date,
      startTime,
      endTime,
      district,
      school,
      department,
      className,
      classId,
      room,
      grade,
      teacherId,
      teacherName: selectedTeacher?.name || '',
      reason,
      payAmount,
      urgent,
      notes,
    };
    
    await onCreate(data);
    setIsSubmitting(false);
  };

  const departments = ['Mathematics', 'English', 'Science', 'History', 'Physical Education', 'Art', 'Music', 'Foreign Language', 'Special Education', 'Other'];
  const grades = ['K', '1', '2', '3', '4', '5', '6', '7', '8', '9', '10', '11', '12'];
  const reasons = ['Sick Leave', 'Personal Day', 'Professional Development', 'Emergency', 'Appointment', 'Family Leave', 'Jury Duty', 'Other'];

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-2xl w-full mx-4 max-h-[90vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-semibold">Create Coverage Opening</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="space-y-6">
          {/* Opening Type & Urgency */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Type</label>
              <select
                value={openingType}
                onChange={(e) => setOpeningType(e.target.value)}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="standard">Standard Coverage</option>
                <option value="emergency">Emergency Coverage</option>
                <option value="long-term">Long-term Substitute</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-3 p-2.5 border border-gray-300 rounded-lg w-full cursor-pointer hover:bg-gray-50">
                <input
                  type="checkbox"
                  checked={urgent}
                  onChange={(e) => setUrgent(e.target.checked)}
                  className="w-5 h-5 text-red-600 rounded focus:ring-red-500"
                />
                <span className="text-sm font-medium text-gray-700">🚨 Mark as Urgent</span>
              </label>
            </div>
          </div>

          {/* Date & Time */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Date & Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input
                  type="time"
                  value={startTime}
                  onChange={(e) => setStartTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input
                  type="time"
                  value={endTime}
                  onChange={(e) => setEndTime(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Location */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input
                  type="text"
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  placeholder="e.g., 0001"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <input
                  type="text"
                  value={school}
                  onChange={(e) => setSchool(e.target.value)}
                  placeholder="e.g., blueberry"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* Class Details */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Class Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select
                  value={department}
                  onChange={(e) => setDepartment(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select department...</option>
                  {departments.map(d => (
                    <option key={d} value={d}>{d}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select
                  value={grade}
                  onChange={(e) => setGrade(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select grade...</option>
                  {grades.map(g => (
                    <option key={g} value={g}>Grade {g}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                <input
                  type="text"
                  value={className}
                  onChange={(e) => setClassName(e.target.value)}
                  placeholder="e.g., Algebra I"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input
                  type="text"
                  value={room}
                  onChange={(e) => setRoom(e.target.value)}
                  placeholder="e.g., Room 101"
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
              </div>
            </div>
            <div className="mt-4">
              <label className="block text-sm font-medium text-gray-700 mb-1">Class ID</label>
              <input
                type="text"
                value={classId}
                onChange={(e) => setClassId(e.target.value)}
                placeholder="Auto-generated"
                className="w-full p-2.5 border border-gray-200 rounded-lg bg-gray-50 text-gray-600"
              />
              <p className="mt-1 text-xs text-gray-500">Auto-generated based on department, school, and date</p>
            </div>
          </div>

          {/* Teacher & Reason */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage Reason</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Being Covered</label>
                <select
                  value={teacherId}
                  onChange={(e) => setTeacherId(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select teacher...</option>
                  {teachers.map(t => (
                    <option key={t.id} value={t.id}>{t.name} - {t.department}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select
                  value={reason}
                  onChange={(e) => setReason(e.target.value)}
                  className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                >
                  <option value="">Select reason...</option>
                  {reasons.map(r => (
                    <option key={r} value={r}>{r}</option>
                  ))}
                </select>
              </div>
            </div>
          </div>

          {/* Pay & Notes */}
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Compensation & Notes</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input
                    type="number"
                    value={payAmount}
                    onChange={(e) => setPayAmount(Number(e.target.value))}
                    className="w-full p-2.5 pl-7 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>
                <p className="mt-1 text-xs text-gray-500">Auto-calculated at $35/hour</p>
              </div>
              <div className="flex items-end">
                <div className="w-full p-3 bg-blue-50 rounded-lg">
                  <p className="text-sm text-blue-800">
                    <span className="font-medium">Duration:</span>{' '}
                    {(() => {
                      const [startH, startM] = startTime.split(':').map(Number);
                      const [endH, endM] = endTime.split(':').map(Number);
                      const hours = Math.max(0, ((endH * 60 + endM) - (startH * 60 + startM)) / 60);
                      return `${hours.toFixed(1)} hours`;
                    })()}
                  </p>
                </div>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
              <textarea
                value={notes}
                onChange={(e) => setNotes(e.target.value)}
                placeholder="Any additional information for the substitute..."
                rows={3}
                className="w-full p-2.5 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
        </div>

        {/* Summary */}
        {className && department && (
          <div className="mt-6 p-4 bg-gray-50 rounded-lg border border-gray-200">
            <h4 className="text-sm font-semibold text-gray-900 mb-2">Summary</h4>
            <p className="text-sm text-gray-700">
              <span className="font-medium">{className}</span> ({department}) on{' '}
              <span className="font-medium">{new Date(date).toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' })}</span>{' '}
              from <span className="font-medium">{startTime}</span> to <span className="font-medium">{endTime}</span>
              {room && <> in <span className="font-medium">{room}</span></>}
              {selectedTeacher && <> (covering for <span className="font-medium">{selectedTeacher.name}</span>)</>}
            </p>
          </div>
        )}

        <div className="mt-6 flex justify-end space-x-3">
          <button
            onClick={onClose}
            className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
          >
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            disabled={!department || !className || !date || isSubmitting}
            className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
                </svg>
                <span>Creating...</span>
              </>
            ) : (
              <span>Create Opening</span>
            )}
          </button>
        </div>
      </div>
    </div>
  );
}

type DailyScheduleModalProps = {
  onClose: () => void;
  uncoveredClasses: CoverageRequest[];
  onEmergencyAssign: (classId: string) => void;
};

function DailyScheduleModal({ onClose, uncoveredClasses, onEmergencyAssign }: DailyScheduleModalProps) {
  const today = new Date().toISOString().split('T')[0];
  
  // Ensure we have an array to work with
  const classes = Array.isArray(uncoveredClasses) ? uncoveredClasses : [];

  // Helper to convert timestamp or time string to "HH:MM" format
  const formatTime = (timeValue: string | number | null | undefined): string | null => {
    if (!timeValue) return null;
    
    // If it's a number (Unix timestamp in milliseconds)
    if (typeof timeValue === 'number') {
      const date = new Date(timeValue);
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    // If it's a string that looks like a timestamp (all digits, long)
    if (typeof timeValue === 'string' && /^\d{10,}$/.test(timeValue)) {
      const date = new Date(parseInt(timeValue, 10));
      return date.toLocaleTimeString('en-US', { hour: '2-digit', minute: '2-digit', hour12: false });
    }
    
    // If it's already a time string like "09:00" or "09:00:00"
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      return timeValue.substring(0, 5);
    }
    
    return null;
  };

  // Helper to format time for display (12-hour format)
  const formatTimeDisplay = (timeValue: string | number | null | undefined): string => {
    if (!timeValue) return '?';
    
    // If it's a number (Unix timestamp in milliseconds)
    if (typeof timeValue === 'number') {
      const date = new Date(timeValue);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    // If it's a string that looks like a timestamp
    if (typeof timeValue === 'string' && /^\d{10,}$/.test(timeValue)) {
      const date = new Date(parseInt(timeValue, 10));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    
    // If it's already a time string
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      const [hours, minutes] = timeValue.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }
    
    return '?';
  };
  
  // Define time slots for the schedule
  const timeSlots = [
    { label: '8:00 AM', start: '08:00', end: '10:00' },
    { label: '10:00 AM', start: '10:00', end: '12:00' },
    { label: '12:00 PM', start: '12:00', end: '14:00' },
    { label: '2:00 PM', start: '14:00', end: '16:00' },
    { label: '4:00 PM', start: '16:00', end: '18:00' },
  ];

  // Group classes by time slot
  const getClassesForSlot = (slot: { start: string; end: string }) => {
    return classes.filter((cls) => {
      const classHour = formatTime(cls.start_time);
      if (!classHour) return false;
      return classHour >= slot.start && classHour < slot.end;
    });
  };

  // Get all classes that don't fit neatly into slots (for "Other" section)
  const unslottedClasses = classes.filter((cls) => {
    const classHour = formatTime(cls.start_time);
    if (!classHour) return true;
    return classHour < '08:00' || classHour >= '18:00';
  });

  const [selectedClass, setSelectedClass] = useState<CoverageRequest | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[85vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Daily Coverage Schedule</h2>
            <p className="text-sm text-gray-500 mt-1">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="flex gap-4 mb-6">
          <div className="flex items-center gap-2 px-3 py-2 bg-red-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-red-700">{classes.length} Open</span>
          </div>
          <div className="flex items-center gap-2 px-3 py-2 bg-green-50 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm text-green-700">Click any open slot to assign</span>
          </div>
        </div>

        {/* Time Slot Grid */}
        <div className="grid grid-cols-5 gap-3">
          {timeSlots.map((slot) => {
            const slotClasses = getClassesForSlot(slot);
            return (
              <div key={slot.label} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-50 px-3 py-2 border-b border-gray-200">
                  <p className="text-sm font-semibold text-gray-700 text-center">{slot.label}</p>
                </div>
                <div className="p-2 space-y-2 min-h-[120px]">
                  {slotClasses.length === 0 ? (
                    <div className="text-center py-4">
                      <p className="text-xs text-gray-400">No classes</p>
                    </div>
                  ) : (
                    slotClasses.map((cls) => (
                      <button
                        key={cls.id}
                        onClick={() => setSelectedClass(cls)}
                        className={`w-full p-2 rounded-lg text-left transition-all hover:scale-[1.02] ${
                          cls.status === 'covered'
                            ? 'bg-green-100 text-green-800 hover:bg-green-200'
                            : 'bg-red-100 text-red-800 hover:bg-red-200'
                        }`}
                      >
                        <p className="text-xs font-semibold truncate">{cls.class_name || cls.class_id}</p>
                        <p className="text-[10px] opacity-75">
                          {formatTimeDisplay(cls.start_time)} - {formatTimeDisplay(cls.end_time)}
                        </p>
                        <p className="text-[10px] mt-1 font-medium">
                          {cls.status === 'covered' ? '✓ Covered' : '⚠ Open'}
                        </p>
                      </button>
                    ))
                  )}
                </div>
              </div>
            );
          })}
        </div>

        {/* Unslotted classes (before 8am or after 6pm) */}
        {unslottedClasses.length > 0 && (
          <div className="mt-4 border border-gray-200 rounded-lg p-4">
            <p className="text-sm font-medium text-gray-700 mb-2">Other Times</p>
            <div className="flex flex-wrap gap-2">
              {unslottedClasses.map((cls) => (
                <button
                  key={cls.id}
                  onClick={() => setSelectedClass(cls)}
                  className={`px-3 py-2 rounded-lg text-sm ${
                    cls.status === 'covered'
                      ? 'bg-green-100 text-green-800'
                      : 'bg-red-100 text-red-800'
                  }`}
                >
                  {cls.class_name || cls.class_id} ({formatTimeDisplay(cls.start_time) || 'No time'})
                </button>
              ))}
            </div>
          </div>
        )}

        {/* No Data State */}
        {classes.length === 0 && (
          <div className="text-center py-12">
            <svg className="w-12 h-12 text-green-500 mx-auto mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <p className="text-gray-600 font-medium">All classes are covered!</p>
            <p className="text-sm text-gray-500 mt-1">No coverage gaps for today.</p>
          </div>
        )}

        {/* Class Detail Popup */}
        {selectedClass && (
          <div className="fixed inset-0 bg-black/30 flex items-center justify-center z-[60]" onClick={() => setSelectedClass(null)}>
            <div className="bg-white rounded-xl p-6 max-w-md w-full mx-4 shadow-xl" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold">{selectedClass.class_name || selectedClass.class_id}</h3>
                  <p className="text-sm text-gray-500">Class ID: {selectedClass.class_id}</p>
                </div>
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  selectedClass.status === 'covered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                }`}>
                  {selectedClass.status === 'covered' ? 'Covered' : 'Open'}
                </span>
              </div>

              <div className="space-y-3 mb-6">
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Date</span>
                  <span className="font-medium">{selectedClass.date || today}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-gray-500">Time</span>
                  <span className="font-medium">{formatTimeDisplay(selectedClass.start_time)} - {formatTimeDisplay(selectedClass.end_time)}</span>
                </div>
                {selectedClass.substitute_name && (
                  <div className="flex justify-between text-sm">
                    <span className="text-gray-500">Assigned To</span>
                    <span className="font-medium">{selectedClass.substitute_name}</span>
                  </div>
                )}
                {selectedClass.urgent && (
                  <div className="flex items-center gap-2 text-sm text-red-600">
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                    <span className="font-medium">Urgent - Needs immediate coverage</span>
                  </div>
                )}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={() => setSelectedClass(null)}
                  className="flex-1 px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200"
                >
                  Close
                </button>
                {selectedClass.status !== 'covered' && (
                  <button
                    onClick={() => {
                      onEmergencyAssign(selectedClass.class_id);
                      setSelectedClass(null);
                    }}
                    className="flex-1 px-4 py-2 text-white bg-red-600 rounded-lg hover:bg-red-700"
                  >
                    Auto-Assign
                  </button>
                )}
              </div>
            </div>
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

type RotationManagementModalProps = {
  schoolCode: string;
  rotationData: Record<string, TeacherView[]>;
  onClose: () => void;
  pushToast: (message: string, type?: 'success' | 'error') => void;
};

function RotationManagementModal({ schoolCode, rotationData, onClose, pushToast }: RotationManagementModalProps) {
  const [activeTab, setActiveTab] = useState<'rotation' | 'history'>('rotation');
  const [historyData, setHistoryData] = useState<CoverageHistoryEntry[]>([]);
  const [loadingHistory, setLoadingHistory] = useState(false);

  useEffect(() => {
    if (activeTab === 'history' && historyData.length === 0) {
      setLoadingHistory(true);
      adminAPI.getCoverageHistory(schoolCode)
        .then((data) => setHistoryData(data || []))
        .catch(() => pushToast('Failed to load history', 'error'))
        .finally(() => setLoadingHistory(false));
    }
  }, [activeTab, schoolCode]);

  const allStaff = Object.values(rotationData).flat();
  const sortedByRotation = [...allStaff].sort((a, b) => b.daysSinceLast - a.daysSinceLast);
  const nextUp = sortedByRotation.find(s => s.status === 'free');
  const departments = Object.keys(rotationData);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-5xl w-full mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="flex items-center justify-between mb-4">
          <div>
            <h2 className="text-xl font-semibold">Department Rotation Management</h2>
            <p className="text-sm text-gray-500">Fair rotation-based coverage assignment</p>
          </div>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex border-b border-gray-200 mb-4">
          <button
            onClick={() => setActiveTab('rotation')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'rotation' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Current Rotation
          </button>
          <button
            onClick={() => setActiveTab('history')}
            className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${
              activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'
            }`}
          >
            Assignment History
          </button>
        </div>

        <div className="flex-1 overflow-y-auto">
          {activeTab === 'rotation' && (
            <div className="space-y-6">
              {nextUp && (
                <div className="bg-purple-50 border border-purple-200 rounded-lg p-4">
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 rounded-full bg-purple-600 text-white flex items-center justify-center font-semibold">
                        {nextUp.name.charAt(0)}
                      </div>
                      <div>
                        <p className="text-sm text-purple-600 font-medium">Next Up for Coverage</p>
                        <p className="font-semibold text-gray-900">{nextUp.name}</p>
                        <p className="text-xs text-gray-500">{nextUp.department} • {nextUp.daysSinceLast} days since last coverage</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-2xl font-bold text-purple-600">#{nextUp.position || 1}</p>
                      <p className="text-xs text-gray-500">in rotation</p>
                    </div>
                  </div>
                </div>
              )}

              {departments.map((dept) => {
                const deptStaff = rotationData[dept] || [];
                const sorted = [...deptStaff].sort((a, b) => b.daysSinceLast - a.daysSinceLast);
                
                return (
                  <div key={dept} className="border border-gray-200 rounded-lg overflow-hidden">
                    <div className="bg-gray-50 px-4 py-3 border-b border-gray-200">
                      <h3 className="font-medium text-gray-900">{dept} Department</h3>
                      <p className="text-xs text-gray-500">{deptStaff.length} staff in rotation</p>
                    </div>
                    <div className="p-4">
                      <div className="flex items-center space-x-2 overflow-x-auto pb-2">
                        {sorted.map((staff, idx) => (
                          <div
                            key={staff.id}
                            className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all ${
                              staff.status === 'free'
                                ? idx === 0 ? 'border-purple-500 bg-purple-50' : 'border-green-300 bg-green-50'
                                : staff.status === 'covering' ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 opacity-60'
                            }`}
                          >
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${
                                staff.status === 'free' ? 'bg-green-500' : staff.status === 'covering' ? 'bg-blue-500' : 'bg-gray-400'
                              }`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.daysSinceLast}d • {staff.hoursThisMonth}h</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${
                                staff.status === 'free' ? 'bg-green-100 text-green-700' : staff.status === 'covering' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'
                              }`}>
                                {staff.status}
                              </span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}

          {activeTab === 'history' && (
            <div>
              {loadingHistory ? (
                <div className="text-center py-8 text-gray-500">Loading history...</div>
              ) : historyData.length === 0 ? (
                <div className="text-center py-8 text-gray-500">No assignment history yet.</div>
              ) : (
                <div className="border border-gray-200 rounded-lg overflow-hidden">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr className="text-left text-xs text-gray-500">
                        <th className="p-3 font-medium">Date</th>
                        <th className="p-3 font-medium">Assigned To</th>
                        <th className="p-3 font-medium">Class</th>
                        <th className="p-3 font-medium">Hours</th>
                        <th className="p-3 font-medium">Amount</th>
                        <th className="p-3 font-medium">Type</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {historyData.map((entry) => (
                        <tr key={entry.id} className="text-sm">
                          <td className="p-3">{entry.date}</td>
                          <td className="p-3 font-medium">{entry.teacher_name}</td>
                          <td className="p-3">{entry.class_name}</td>
                          <td className="p-3">{entry.duration}h</td>
                          <td className="p-3 font-medium">${entry.amount}</td>
                          <td className="p-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${
                              entry.type === 'rotation' ? 'bg-purple-100 text-purple-700' : entry.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'
                            }`}>
                              {entry.type || 'manual'}
                            </span>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}

              {historyData.length > 0 && (
                <div className="mt-4 grid grid-cols-3 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Assignments</p>
                    <p className="text-2xl font-bold text-gray-900">{historyData.length}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Hours</p>
                    <p className="text-2xl font-bold text-gray-900">{historyData.reduce((sum, e) => sum + (e.duration || 0), 0)}h</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-500">Total Amount</p>
                    <p className="text-2xl font-bold text-gray-900">${historyData.reduce((sum, e) => sum + (e.amount || 0), 0).toFixed(2)}</p>
                  </div>
                </div>
              )}
            </div>
          )}
        </div>

        <div className="mt-6 flex justify-end border-t border-gray-200 pt-4">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}
