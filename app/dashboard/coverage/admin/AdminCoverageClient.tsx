'use client';

import React, { useEffect, useMemo, useState } from 'react';
import { adminAPI, CoverageHistoryEntry, CoverageRequest, Teacher as XanoTeacher } from '@/lib/xano/api';
import { useAdminDashboard } from '@/lib/hooks/useCoverage';
import SchoolSelector from '@/components/SchoolSelector';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type AssignmentHistoryEntry = {
  id: number;
  date: string;
  raw_date: string;
  teacher_id: string;
  teacher_name: string;
  class_name: string;
  department: string;
  duration: number;
  amount: number;
  status: string;
  type: string;
  room: string;
  coverage_request_id: number;
};

type TeacherStat = {
  teacher_id: string;
  teacher_name: string;
  total_assignments: number;
  total_hours: number;
  total_amount: number;
  last_assignment: string | null;
};

type SubstituteApplicant = {
  id: number;
  first_name: string;
  last_name: string;
  full_name: string;
  email: string;
  phone: string | null;
  district_code: string;
  school_code: string | null;
  status: 'pending' | 'approved' | 'denied';
  certifications: string | null;
  experience_years: number | null;
  subjects: string | null;
  grade_levels: string | null;
  availability: string | null;
  notes: string | null;
  admin_notes: string | null;
  denial_reason: string | null;
  reviewed_by: string | null;
  reviewed_at: number | null;
  applied_at: number | null;
  applied_date: string;
};

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

// Track the active school for filtering (can be 'all' or specific school code)
  const [activeSchool, setActiveSchool] = useState<string>(schoolCode || '');
  const safeSchool = activeSchool === 'all' ? '' : (activeSchool || schoolCode || '');
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

  // Assignment History state
  const [assignmentHistory, setAssignmentHistory] = useState<AssignmentHistoryEntry[]>([]);
  const [teacherStats, setTeacherStats] = useState<TeacherStat[]>([]);
  const [historyTotals, setHistoryTotals] = useState({ total_assignments: 0, total_hours: 0, total_amount: 0 });
  const [historyLoading, setHistoryLoading] = useState(false);

  // Covered classes state
  const [coveredClasses, setCoveredClasses] = useState<CoverageRequest[]>([]);

  // Modal states
  const [showBatchAssignModal, setShowBatchAssignModal] = useState(false);
  const [showMarkAbsentModal, setShowMarkAbsentModal] = useState(false);
  const [showHistoryModal, setShowHistoryModal] = useState(false);
  const [showCreateOpeningModal, setShowCreateOpeningModal] = useState(false);
  const [showDailyScheduleModal, setShowDailyScheduleModal] = useState(false);
  const [showRotationManagementModal, setShowRotationManagementModal] = useState(false);
  const [showAvailableTeachersModal, setShowAvailableTeachersModal] = useState(false);
  const [showAvailableSubstitutesModal, setShowAvailableSubstitutesModal] = useState(false);
  const [showApplicantsModal, setShowApplicantsModal] = useState(false);
  const [showCoverageDetailsModal, setShowCoverageDetailsModal] = useState<number | null>(null);

  // School schedule state (SNIPPET 1)
  const [schools, setSchools] = useState<{ school_code: string; school_name: string; school_type: string; start_time: string; end_time: string; total_periods: number; is_default: boolean }[]>([]);
  const [selectedSchool, setSelectedSchool] = useState<string>('');
  const [schoolScheduleLoading, setSchoolScheduleLoading] = useState(true);

  // Applicants data
  const [applicants, setApplicants] = useState<SubstituteApplicant[]>([]);
  const [applicantsCounts, setApplicantsCounts] = useState({ pending: 0, approved: 0, denied: 0, total: 0 });
  const [applicantsLoading, setApplicantsLoading] = useState(false);


 // Fetch schools for this admin (SNIPPET 2) - UPDATED VERSION
useEffect(() => {
  async function fetchMySchools() {
    // Try multiple ways to get the email
    let email = '';
    
    // Method 1: Direct cookie access
    const cookies = document.cookie.split('; ');
    for (const cookie of cookies) {
      if (cookie.startsWith('email=')) {
        email = decodeURIComponent(cookie.split('=')[1]);
        break;
      }
    }
    
    // Method 2: If still not found, try looking for encoded version
    if (!email) {
      for (const cookie of cookies) {
        if (cookie.includes('email')) {
          console.log('Found cookie with email:', cookie);
        }
      }
    }
    
    console.log('All cookies:', document.cookie);
    console.log('Extracted email:', email);
    
    if (!email) {
      console.error('No email cookie found');
      setSchoolScheduleLoading(false);
      return;
    }
    
    try {
      const url = `https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/admin/my-schools?email=${encodeURIComponent(email)}`;
      console.log('Fetching schools from:', url);
      
      const response = await fetch(url);
      const data = await response.json();
      
      console.log('Schools API response:', data);
      
      if (!data.error && data.schools) {
        setSchools(data.schools);
        const defaultSchool = data.schools.find((s: any) => s.is_default) || data.schools[0];
        if (defaultSchool) {
          setSelectedSchool(defaultSchool.school_code);
          console.log('Selected default school:', defaultSchool.school_code);
        }
      } else {
        console.error('Schools API error:', data);
      }
    } catch (e) {
      console.error('Failed to fetch schools:', e);
    } finally {
      setSchoolScheduleLoading(false);
    }
  }
  fetchMySchools();
}, []);

  // Smart countdown based on school schedule (SNIPPET 3)

  // Smart countdown based on school schedule (SNIPPET 3)
  const [countdownText, setCountdownText] = useState('Loading...');
  
  useEffect(() => {
    const currentSchool = schools.find(s => s.school_code === selectedSchool);
    if (!currentSchool) {
      setCountdownText('Select a school');
      return;
    }

    const updateCountdown = () => {
      const now = new Date();
      const dayOfWeek = now.getDay(); // 0 = Sunday, 6 = Saturday
      
      // Check if weekend
      if (dayOfWeek === 0 || dayOfWeek === 6) {
        setCountdownText(`School resumes Monday at ${currentSchool.start_time}`);
        return;
      }

      // Parse school times
      const [startH, startM] = currentSchool.start_time.split(':').map(Number);
      const [endH, endM] = currentSchool.end_time.split(':').map(Number);
      
      const schoolStart = new Date(now);
      schoolStart.setHours(startH, startM, 0, 0);
      
      const schoolEnd = new Date(now);
      schoolEnd.setHours(endH, endM, 0, 0);

      if (now < schoolStart) {
        // Before school starts
        const diff = schoolStart.getTime() - now.getTime();
        const mins = Math.floor(diff / 60000);
        const secs = Math.floor((diff % 60000) / 1000);
        setCountdownText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
      } else if (now > schoolEnd) {
        // After school ends
        setCountdownText(`School day ended`);
      } else {
        // During school hours - calculate next period
        const periodDuration = (endH * 60 + endM - startH * 60 - startM) / currentSchool.total_periods;
        const minutesSinceStart = (now.getHours() * 60 + now.getMinutes()) - (startH * 60 + startM);
        const currentPeriod = Math.floor(minutesSinceStart / periodDuration) + 1;
        const nextPeriodStart = startH * 60 + startM + (currentPeriod * periodDuration);
        const nextPeriodDate = new Date(now);
        nextPeriodDate.setHours(Math.floor(nextPeriodStart / 60), nextPeriodStart % 60, 0, 0);
        
        if (currentPeriod >= currentSchool.total_periods) {
          setCountdownText('Last period');
        } else {
          const diff = nextPeriodDate.getTime() - now.getTime();
          const mins = Math.floor(diff / 60000);
          const secs = Math.floor((diff % 60000) / 1000);
          setCountdownText(`${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`);
        }
      }
    };

    updateCountdown();
    const interval = setInterval(updateCountdown, 1000);
    return () => clearInterval(interval);
  }, [schools, selectedSchool]);

  const urgentTimerText = countdownText;

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

  async function fetchAssignmentHistory() {
    if (!safeSchool) return;
    setHistoryLoading(true);
    try {
      const response = await fetch(`https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/coverage/assignment-history?school=${safeSchool}`);
      const data = await response.json();
      if (data.history) {
        setAssignmentHistory(data.history);
        setTeacherStats(data.teacher_stats || []);
        setHistoryTotals(data.totals || { total_assignments: 0, total_hours: 0, total_amount: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch assignment history:', e);
    } finally {
      setHistoryLoading(false);
    }
  }

  // Fetch covered classes
  async function fetchCoveredClasses() {
    if (!safeSchool) return;
    try {
      const response = await fetch(`https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/coverage/covered?school=${safeSchool}`);
      const data = await response.json();
      if (data.covered) {
        setCoveredClasses(data.covered);
      }
    } catch (e) {
      console.error('Failed to fetch covered classes:', e);
    }
  }

  // Fetch assignment history on mount and when data changes
  useEffect(() => {
    fetchAssignmentHistory();
    fetchCoveredClasses();
  }, [safeSchool]);

  // Fetch applicants
  async function fetchApplicants() {
    if (!safeSchool) return;
    setApplicantsLoading(true);
    try {
      const response = await fetch(`https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/substitutes/applicants?school=${safeSchool}`);
      const data = await response.json();
      if (data.applicants) {
        setApplicants(data.applicants);
        setApplicantsCounts(data.counts || { pending: 0, approved: 0, denied: 0, total: 0 });
      }
    } catch (e) {
      console.error('Failed to fetch applicants:', e);
    } finally {
      setApplicantsLoading(false);
    }
  }

  // Fetch applicants on mount
  useEffect(() => {
    fetchApplicants();
  }, [safeSchool]);

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
    
    const matchingClass = uncoveredClasses.find(c => c.class_id === classId);
    if (!matchingClass) {
      pushToast('Coverage request not found', 'error');
      setRaceConditionActive(false);
      return;
    }
    
    pushToast(`Auto-assigning ${matchingClass.class_name || classId}...`, 'success');

    try {
      const response = await fetch('https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/coverage/auto-assign', {
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
      await fetchCoveredClasses();
    } catch (e: any) {
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

  // Handle removing an assignment
  async function handleRemoveAssignment(coverage: CoverageRequest) {
    if (raceConditionActive) {
      pushToast('Operation in progress - please wait', 'error');
      return;
    }
    setRaceConditionActive(true);
    try {
      const response = await fetch('https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/coverage/remove-assignment', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ coverage_id: coverage.id })
      });
      
      const result = await response.json();
      
      if (result.success) {
        pushToast(`✓ Assignment removed from ${coverage.class_name || coverage.class_id}`, 'success');
        await refreshData();
        await fetchCoveredClasses();
      } else {
        pushToast(result.message || 'Failed to remove assignment', 'error');
      }
    } catch (e: any) {
      pushToast(e?.message || 'Failed to remove assignment', 'error');
    } finally {
      setRaceConditionActive(false);
    }
  }

// Handle viewing coverage details
  function handleViewDetails(coverageId: number) {
    setShowCoverageDetailsModal(coverageId);
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
          {/* School Selector (SNIPPET 4) */}
                   {/* School Selector */}
         <SchoolSelector 
            onSchoolChange={(newSchoolCode) => {
              setSelectedSchool(newSchoolCode);
              setActiveSchool(newSchoolCode);
              refreshData();
            }} 
          />
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
        assignmentHistory={assignmentHistory}
        teacherStats={teacherStats}
        historyTotals={historyTotals}
        historyLoading={historyLoading}
        fetchAssignmentHistory={fetchAssignmentHistory}
        showAvailableTeachersModal={() => setShowAvailableTeachersModal(true)}
        showAvailableSubstitutesModal={() => setShowAvailableSubstitutesModal(true)}
        showApplicantsModal={() => setShowApplicantsModal(true)}
        pendingApplicantsCount={applicantsCounts.pending}
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
              const [year, month, day] = data.date.split('-').map(Number);
              const [startH, startM] = data.startTime.split(':').map(Number);
              const [endH, endM] = data.endTime.split(':').map(Number);
              
              const startTimestamp = Date.UTC(year, month - 1, day, startH + 5, startM);
              const endTimestamp = Date.UTC(year, month - 1, day, endH + 5, endM);
              
              const response = await fetch('https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/coverage/create-opening', {
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
          coveredClasses={coveredClasses}
          onEmergencyAssign={handleEmergencyAssign}
          onRemoveAssignment={handleRemoveAssignment}
          onViewDetails={handleViewDetails}
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

      {showAvailableTeachersModal && (
        <AvailableTeachersModal
          teachers={Object.values(rotationData).flat()}
          onClose={() => setShowAvailableTeachersModal(false)}
        />
      )}

      {showAvailableSubstitutesModal && (
        <AvailableSubstitutesModal
          teachers={Object.values(rotationData).flat().filter(t => t.status === 'free')}
          onClose={() => setShowAvailableSubstitutesModal(false)}
        />
      )}

      {showApplicantsModal && (
        <ApplicantsModal
          applicants={applicants}
          counts={applicantsCounts}
          loading={applicantsLoading}
          onClose={() => setShowApplicantsModal(false)}
          onRefresh={fetchApplicants}
          pushToast={pushToast}
        />
      )}

      {showCoverageDetailsModal && (
        <CoverageDetailsModal
          coverageId={showCoverageDetailsModal}
          onClose={() => setShowCoverageDetailsModal(null)}
          pushToast={pushToast}
        />
      )}

      {/* Race Condition Notification */}
      {raceConditionActive && (
        <div className="fixed bottom-4 right-4 bg-blue-600 text-white p-4 rounded-lg shadow-lg z-50">
          <div className="flex items-center space-x-3">
            <div className="animate-spin">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
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
            className={`text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 transform transition-transform duration-300 max-w-sm ${t.type === 'success' ? 'bg-green-500' : 'bg-red-500'}`}
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
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="flex-shrink-0 ml-2" aria-label="Dismiss">
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
  assignmentHistory: AssignmentHistoryEntry[];
  teacherStats: TeacherStat[];
  historyTotals: { total_assignments: number; total_hours: number; total_amount: number };
  historyLoading: boolean;
  fetchAssignmentHistory: () => void;
  showAvailableTeachersModal: () => void;
  showAvailableSubstitutesModal: () => void;
  showApplicantsModal: () => void;
  pendingApplicantsCount: number;
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
  assignmentHistory,
  teacherStats,
  historyTotals,
  historyLoading,
  fetchAssignmentHistory,
  showAvailableTeachersModal,
  showAvailableSubstitutesModal,
  showApplicantsModal,
  pendingApplicantsCount,
}: AdminViewProps) {
  return (
    <div className="space-y-6">
      {/* Status Overview */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
        {/* Uncovered Classes */}
        <button 
          onClick={() => {
            if (uncoveredCount > 0) {
              document.getElementById('uncovered-classes-section')?.scrollIntoView({ behavior: 'smooth' });
            }
          }}
          className={`text-left bg-white rounded-xl p-6 border transition-all ${
            uncoveredCount === 0 
              ? 'border-green-300 bg-gradient-to-br from-green-50 to-emerald-50' 
              : 'border-red-200 hover:border-red-300 hover:shadow-md cursor-pointer'
          }`}
        >
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Uncovered Classes</p>
              <p className={`text-3xl font-bold mt-1 ${uncoveredCount === 0 ? 'text-green-600' : 'text-red-600'}`}>{uncoveredCount}</p>
            </div>
            {uncoveredCount === 0 ? (
              <div className="p-3 bg-green-100 rounded-lg animate-bounce"><span className="text-3xl">🏆</span></div>
            ) : (
              <div className="p-3 bg-red-50 rounded-lg">
                <svg className="w-6 h-6 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                </svg>
              </div>
            )}
          </div>
          {uncoveredCount === 0 ? (
            <div className="mt-3 flex items-center text-xs text-green-600 font-medium">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
              </svg>
              All classes covered! Great job! 🎉
            </div>
          ) : (
            <div className="mt-3 flex items-center text-xs text-red-600">
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Next class starts in {urgentTimerText} — Click to view ↓
            </div>
          )}
        </button>

        {/* Available Teachers */}
        <button onClick={showAvailableTeachersModal} className="text-left bg-white rounded-xl p-6 border border-gray-200 hover:border-green-300 hover:shadow-md transition-all cursor-pointer">
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
          <div className="mt-3 text-xs text-blue-600 hover:text-blue-700 font-medium">Click to view full list →</div>
        </button>

        {/* Available Substitutes */}
        <button onClick={showAvailableSubstitutesModal} className="text-left bg-white rounded-xl p-6 border border-gray-200 hover:border-blue-300 hover:shadow-md transition-all cursor-pointer">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Available Substitutes</p>
              <p className="text-3xl font-bold text-blue-600 mt-1">{activeSubstitutes}</p>
            </div>
            <div className="p-3 bg-blue-50 rounded-lg">
              <svg className="w-6 h-6 text-blue-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            </div>
          </div>
          <div className="mt-3 text-xs text-blue-600 font-medium">Click to view full list →</div>
        </button>

        {/* Pending Applicants */}
        <button onClick={showApplicantsModal} className={`text-left bg-white rounded-xl p-6 border transition-all cursor-pointer ${pendingApplicantsCount > 0 ? 'border-orange-200 hover:border-orange-300 hover:shadow-md bg-gradient-to-br from-orange-50 to-amber-50' : 'border-gray-200 hover:border-gray-300 hover:shadow-md'}`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500">Pending Applicants</p>
              <p className={`text-3xl font-bold mt-1 ${pendingApplicantsCount > 0 ? 'text-orange-600' : 'text-gray-600'}`}>{pendingApplicantsCount}</p>
            </div>
            <div className={`p-3 rounded-lg ${pendingApplicantsCount > 0 ? 'bg-orange-100' : 'bg-gray-50'}`}>
              {pendingApplicantsCount > 0 ? <span className="text-2xl">📋</span> : (
                <svg className="w-6 h-6 text-gray-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              )}
            </div>
          </div>
          <div className={`mt-3 text-xs font-medium ${pendingApplicantsCount > 0 ? 'text-orange-600' : 'text-gray-500'}`}>
            {pendingApplicantsCount > 0 ? `${pendingApplicantsCount} awaiting review →` : 'All applications reviewed ✓'}
          </div>
        </button>
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
          <button onClick={toggleEmergencyMode} className={`px-4 py-2 rounded-lg font-medium transition-colors ${emergencyMode ? 'bg-yellow-600 text-white hover:bg-yellow-700' : 'bg-white text-gray-700 border border-gray-300 hover:bg-gray-50'}`}>
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
              <button onClick={showRotationManagementModal} className="px-3 py-1.5 text-sm bg-purple-100 text-purple-700 rounded-lg hover:bg-purple-200 transition-colors">Manage Rotation</button>
              <button onClick={showHistoryModal} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200 transition-colors">View History</button>
              <button onClick={showDailyScheduleModal} className="px-3 py-1.5 text-sm bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors">Daily Schedule</button>
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
                              <span className="inline-flex items-center justify-center w-6 h-6 rounded-full bg-blue-100 text-blue-600 font-medium text-xs">{teacher.position}</span>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </td>
                          <td className="py-3 font-medium text-gray-900">{teacher.name}</td>
                          <td className="py-3 text-gray-600">{teacher.daysSinceLast}d</td>
                          <td className="py-3">
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${teacher.status === 'free' ? 'bg-green-100 text-green-700' : teacher.status === 'covering' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
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

      {/* Department Rotation Management Section */}
      <DepartmentRotationSection
        rotationData={rotationData}
        assignmentHistory={assignmentHistory}
        teacherStats={teacherStats}
        historyTotals={historyTotals}
        historyLoading={historyLoading}
        onRefresh={fetchAssignmentHistory}
      />

      {/* Uncovered Classes List */}
      {uncoveredClasses?.length > 0 && (
        <div id="uncovered-classes-section" className="bg-white rounded-xl border border-red-200">
          <div className="p-6 border-b border-red-200 bg-red-50">
            <h2 className="text-lg font-semibold text-red-900">Uncovered Classes Requiring Immediate Attention</h2>
          </div>
          <div className="p-6 space-y-4">
            {uncoveredClasses.slice(0, 10).map((cls) => (
              <div key={cls.id} className="flex items-center justify-between p-4 bg-gray-50 rounded-lg">
                <div className="flex items-center space-x-4">
                  <div className={`w-2 h-8 rounded-full ${cls.urgent ? 'bg-red-500' : 'bg-yellow-500'}`} />
                  <div>
                    <p className="font-medium text-gray-900">{cls.class_name || cls.class_id} ({cls.class_id})</p>
                    <p className="text-sm text-gray-600">{fmtDateTime(cls.date, cls.start_time)} → {cls.end_time}</p>
                  </div>
                </div>
                <button onClick={() => emergencyAssign(cls.class_id)} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors text-sm font-medium">
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
        <h2 className="text-xl font-semibold mb-4">Auto-Assign All</h2>
        <div className="space-y-4 mb-6">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <p className="text-sm text-yellow-800">This will create emergency openings; acceptances happen from teacher/sub flows.</p>
          </div>
          <div className="space-y-2">
            <p className="font-medium text-gray-700">Available Teachers ({available.length})</p>
            <div className="border border-gray-200 rounded-lg divide-y divide-gray-100 max-h-60 overflow-y-auto">
              {available.map((teacher) => (
                <div key={teacher.id} className="flex items-center p-3">
                  <div className="flex-1">
                    <p className="font-medium">{teacher.name}</p>
                    <p className="text-xs text-gray-500">{teacher.department} • Position #{teacher.position ?? '—'}</p>
                  </div>
                </div>
              ))}
              {available.length === 0 && <div className="p-3 text-sm text-gray-600">No available teachers.</div>}
            </div>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={onAssign} className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">Create Emergency Openings</button>
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
            <select value={selectedTeacher} onChange={(e) => setSelectedTeacher(e.target.value)} className="w-full p-2 border border-gray-300 rounded-lg">
              <option value="">Choose a teacher...</option>
              {teachers.filter((t) => t.status !== 'absent').map((teacher) => (
                <option key={teacher.id} value={teacher.id}>{teacher.name} - {teacher.department}</option>
              ))}
            </select>
          </div>
          <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
            <p className="text-sm text-orange-800">This will mark the teacher as absent and refresh coverage needs.</p>
          </div>
        </div>
        <div className="flex justify-end space-x-3">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={() => selectedTeacher && onMarkAbsent(selectedTeacher)} disabled={!selectedTeacher} className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 disabled:cursor-not-allowed">
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
    return () => { alive = false; };
  }, [schoolCode]);

  const handleExportCSV = () => {
    if (rows.length === 0) { onExport('CSV'); return; }
    const headers = ['Date', 'Teacher', 'Class Covered', 'Duration (hrs)', 'Type', 'Amount', 'Status'];
    const csvRows = rows.map(r => [r.date, r.teacher_name, r.class_name, r.duration, r.type || (r.duration >= 4 ? 'full_day' : 'partial'), r.amount, r.status]);
    const csvContent = [headers.join(','), ...csvRows.map(row => row.map(cell => `"${cell}"`).join(','))].join('\n');
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

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl p-6 max-w-4xl w-full mx-4 max-h-[80vh] overflow-y-auto">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Coverage History</h2>
          <div className="flex space-x-2">
            <button onClick={handleExportCSV} className="px-3 py-1.5 text-sm bg-gray-100 text-gray-700 rounded-lg hover:bg-gray-200">Export CSV</button>
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
                      <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${r.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-blue-100 text-blue-700'}`}>{r.type || 'partial'}</span>
                    </td>
                    <td className="p-3 font-medium">${r.amount}</td>
                  </tr>
                ))}
                {rows.length === 0 && <tr><td className="p-3 text-sm text-gray-600" colSpan={6}>No history records yet.</td></tr>}
              </tbody>
            </table>
          </div>
        )}
        {!loading && !err && rows.length > 0 && (
          <div className="mt-4 flex justify-between items-center text-sm text-gray-600 border-t pt-4">
            <span>Total Records: {rows.length}</span>
            <span className="font-semibold text-gray-900">Total Amount: ${rows.reduce((sum, r) => sum + (r.amount || 0), 0).toFixed(2)}</span>
          </div>
        )}
        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}

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

type CreateOpeningModalProps = {
  onClose: () => void;
  onCreate: (data: CreateOpeningData) => void;
  schoolCode: string;
  districtCode: string;
  teachers: TeacherView[];
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

  useEffect(() => {
    if (department && school && date) {
      const deptCode = department.substring(0, 4).toUpperCase();
      const dateCode = date.replace(/-/g, '');
      const randomNum = Math.floor(Math.random() * 1000).toString().padStart(3, '0');
      setClassId(`${deptCode}-${school.toUpperCase()}-${dateCode}-${randomNum}`);
    }
  }, [department, school, date]);

  useEffect(() => {
    if (startTime && endTime) {
      const [startH, startM] = startTime.split(':').map(Number);
      const [endH, endM] = endTime.split(':').map(Number);
      const startMinutes = startH * 60 + startM;
      const endMinutes = endH * 60 + endM;
      const durationHours = Math.max(0, (endMinutes - startMinutes) / 60);
      setPayAmount(Math.round(durationHours * 35));
    }
  }, [startTime, endTime]);

  const selectedTeacher = teachers.find(t => t.id === teacherId);

  const handleSubmit = async () => {
    if (!date || !startTime || !endTime || !department || !className) return;
    setIsSubmitting(true);
    const data: CreateOpeningData = { type: openingType, date, startTime, endTime, district, school, department, className, classId, room, grade, teacherId, teacherName: selectedTeacher?.name || '', reason, payAmount, urgent, notes };
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
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" /></svg>
          </button>
        </div>
        <div className="space-y-6">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Opening Type</label>
              <select value={openingType} onChange={(e) => setOpeningType(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg">
                <option value="standard">Standard Coverage</option>
                <option value="emergency">Emergency Coverage</option>
                <option value="long-term">Long-term Substitute</option>
              </select>
            </div>
            <div className="flex items-end">
              <label className="flex items-center space-x-3 p-2.5 border border-gray-300 rounded-lg w-full cursor-pointer hover:bg-gray-50">
                <input type="checkbox" checked={urgent} onChange={(e) => setUrgent(e.target.checked)} className="w-5 h-5 text-red-600 rounded focus:ring-red-500" />
                <span className="text-sm font-medium text-gray-700">🚨 Mark as Urgent</span>
              </label>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Date & Time</h3>
            <div className="grid grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Date</label>
                <input type="date" value={date} onChange={(e) => setDate(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Start Time</label>
                <input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">End Time</label>
                <input type="time" value={endTime} onChange={(e) => setEndTime(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Location</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">District</label>
                <input type="text" value={district} onChange={(e) => setDistrict(e.target.value)} placeholder="e.g., 0001" className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">School</label>
                <input type="text" value={school} onChange={(e) => setSchool(e.target.value)} placeholder="e.g., blueberry" className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Class Details</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department *</label>
                <select value={department} onChange={(e) => setDepartment(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg">
                  <option value="">Select department...</option>
                  {departments.map(d => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Grade Level</label>
                <select value={grade} onChange={(e) => setGrade(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg">
                  <option value="">Select grade...</option>
                  {grades.map(g => <option key={g} value={g}>Grade {g}</option>)}
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Class Name *</label>
                <input type="text" value={className} onChange={(e) => setClassName(e.target.value)} placeholder="e.g., Algebra I" className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Room</label>
                <input type="text" value={room} onChange={(e) => setRoom(e.target.value)} placeholder="e.g., Room 101" className="w-full p-2.5 border border-gray-300 rounded-lg" />
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Coverage Reason</h3>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Teacher Being Covered</label>
                <select value={teacherId} onChange={(e) => setTeacherId(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg">
                  <option value="">Select teacher...</option>
                  {teachers.map(t => <option key={t.id} value={t.id}>{t.name} - {t.department}</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Reason</label>
                <select value={reason} onChange={(e) => setReason(e.target.value)} className="w-full p-2.5 border border-gray-300 rounded-lg">
                  <option value="">Select reason...</option>
                  {reasons.map(r => <option key={r} value={r}>{r}</option>)}
                </select>
              </div>
            </div>
          </div>
          <div className="border-t pt-4">
            <h3 className="text-sm font-semibold text-gray-900 mb-3">Compensation & Notes</h3>
            <div className="grid grid-cols-2 gap-4 mb-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Pay Amount</label>
                <div className="relative">
                  <span className="absolute left-3 top-2.5 text-gray-500">$</span>
                  <input type="number" value={payAmount} onChange={(e) => setPayAmount(Number(e.target.value))} className="w-full p-2.5 pl-7 border border-gray-300 rounded-lg" />
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
              <textarea value={notes} onChange={(e) => setNotes(e.target.value)} placeholder="Any additional information for the substitute..." rows={3} className="w-full p-2.5 border border-gray-300 rounded-lg" />
            </div>
          </div>
        </div>
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
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
          <button onClick={handleSubmit} disabled={!department || !className || !date || isSubmitting} className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center space-x-2">
            {isSubmitting ? <span>Creating...</span> : <span>Create Opening</span>}
          </button>
        </div>
      </div>
    </div>
  );
}

// NEW: Updated DailyScheduleModal with tabs and list view
type DailyScheduleModalProps = {
  onClose: () => void;
  uncoveredClasses: CoverageRequest[];
  coveredClasses: CoverageRequest[];
  onEmergencyAssign: (classId: string) => void;
  onRemoveAssignment: (coverage: CoverageRequest) => void;
  onViewDetails: (coverageId: number) => void;
};

function DailyScheduleModal({ 
  onClose, 
  uncoveredClasses, 
  coveredClasses, 
  onEmergencyAssign,
  onRemoveAssignment,
  onViewDetails 
}: DailyScheduleModalProps) {
  const [activeTab, setActiveTab] = useState<'all' | 'covered' | 'uncovered'>('all');
  
  const allClasses = [...uncoveredClasses, ...coveredClasses];
  
  const displayClasses = activeTab === 'all' ? allClasses :
                         activeTab === 'covered' ? coveredClasses :
                         uncoveredClasses;

  // Helper to format time
  const formatTimeDisplay = (timeValue: string | number | null | undefined): string => {
    if (!timeValue) return '?';
    if (typeof timeValue === 'number') {
      const date = new Date(timeValue);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (typeof timeValue === 'string' && /^\d{10,}$/.test(timeValue)) {
      const date = new Date(parseInt(timeValue, 10));
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    if (typeof timeValue === 'string' && timeValue.includes(':')) {
      const [hours, minutes] = timeValue.split(':');
      const h = parseInt(hours, 10);
      const ampm = h >= 12 ? 'PM' : 'AM';
      const h12 = h % 12 || 12;
      return `${h12}:${minutes} ${ampm}`;
    }
    return '?';
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        {/* Header */}
        <div className="bg-gradient-to-r from-purple-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Daily Coverage Schedule</h2>
            <p className="text-purple-100 text-sm">
              {new Date().toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}
            </p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {/* Summary Stats */}
        <div className="px-6 py-4 bg-gray-50 border-b border-gray-200 flex gap-4">
          <div className="flex items-center gap-2 px-4 py-2 bg-green-100 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-green-500"></div>
            <span className="text-sm font-medium text-green-700">{coveredClasses.length} Covered</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-red-100 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-red-500"></div>
            <span className="text-sm font-medium text-red-700">{uncoveredClasses.length} Open</span>
          </div>
          <div className="flex items-center gap-2 px-4 py-2 bg-blue-100 rounded-lg">
            <div className="w-3 h-3 rounded-full bg-blue-500"></div>
            <span className="text-sm font-medium text-blue-700">{allClasses.length} Total</span>
          </div>
        </div>

        {/* Filter Tabs */}
        <div className="px-6 py-3 border-b border-gray-200 flex space-x-2">
          {(['all', 'covered', 'uncovered'] as const).map(tab => (
            <button
              key={tab}
              onClick={() => setActiveTab(tab)}
              className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                activeTab === tab
                  ? tab === 'covered' ? 'bg-green-100 text-green-700' :
                    tab === 'uncovered' ? 'bg-red-100 text-red-700' :
                    'bg-purple-100 text-purple-700'
                  : 'text-gray-600 hover:bg-gray-100'
              }`}
            >
              {tab === 'all' ? 'All Classes' : tab === 'covered' ? '✓ Covered' : '⚠ Uncovered'}
              <span className="ml-1 text-xs">
                ({tab === 'all' ? allClasses.length : tab === 'covered' ? coveredClasses.length : uncoveredClasses.length})
              </span>
            </button>
          ))}
        </div>

        {/* Content */}
        <div className="flex-1 overflow-auto p-6">
          {displayClasses.length === 0 ? (
            <div className="text-center py-12">
              <div className="text-4xl mb-4">
                {activeTab === 'covered' ? '📋' : activeTab === 'uncovered' ? '🎉' : '📅'}
              </div>
              <p className="text-gray-600">
                {activeTab === 'covered' ? 'No covered classes' : 
                 activeTab === 'uncovered' ? 'All classes are covered!' : 
                 'No classes scheduled'}
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {displayClasses.map((cls) => {
                const isCovered = cls.status === 'covered';
                return (
                  <div
                    key={cls.id}
                    className={`p-4 rounded-lg border transition-all ${
                      isCovered 
                        ? 'bg-green-50 border-green-200' 
                        : 'bg-red-50 border-red-200'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center space-x-4">
                        <div className={`w-3 h-12 rounded-full ${isCovered ? 'bg-green-500' : 'bg-red-500'}`} />
                        <div>
                          <div className="flex items-center gap-2">
                            <h3 className="font-semibold text-gray-900">{cls.class_name || cls.class_id}</h3>
                            {cls.urgent && (
                              <span className="px-2 py-0.5 text-xs bg-red-100 text-red-700 rounded-full">🚨 Urgent</span>
                            )}
                          </div>
                          <p className="text-sm text-gray-600">
                            {formatTimeDisplay(cls.start_time)} - {formatTimeDisplay(cls.end_time)} • Room {cls.room || 'TBD'}
                          </p>
                          {isCovered && cls.substitute_name && (
                            <p className="text-sm text-green-700 font-medium mt-1">
                              ✓ Covered by: {cls.substitute_name}
                            </p>
                          )}
                        </div>
                      </div>
                      <div className="flex items-center space-x-2">
                        <button
                          onClick={() => onViewDetails(Number(cls.id))}
                          className="px-3 py-1.5 text-sm text-blue-600 hover:bg-blue-50 rounded-lg"
                        >
                          Details
                        </button>
                        {isCovered ? (
                          <button
                            onClick={() => onRemoveAssignment(cls)}
                            className="px-3 py-1.5 text-sm text-red-600 hover:bg-red-100 rounded-lg border border-red-200"
                          >
                            Remove Assignment
                          </button>
                        ) : (
                          <button
                            onClick={() => onEmergencyAssign(cls.class_id)}
                            className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                          >
                            Auto-Assign
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">
            Close
          </button>
        </div>
      </div>
    </div>
  );
}

// Coverage Details Modal
type CoverageDetailsModalProps = {
  coverageId: number;
  onClose: () => void;
  pushToast: (message: string, type?: 'success' | 'error') => void;
};

function CoverageDetailsModal({ coverageId, onClose, pushToast }: CoverageDetailsModalProps) {
  const [details, setDetails] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function fetchDetails() {
      try {
        const response = await fetch(`https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/coverage/${coverageId}`);
        const data = await response.json();
        setDetails(data);
      } catch (e) {
        pushToast('Failed to load coverage details', 'error');
      } finally {
        setLoading(false);
      }
    }
    fetchDetails();
  }, [coverageId]);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[60]">
      <div className="bg-white rounded-xl p-6 max-w-lg w-full mx-4">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-xl font-semibold">Coverage Details</h2>
          <button onClick={onClose} className="text-gray-400 hover:text-gray-600">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        {loading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : details ? (
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <p className="text-sm text-gray-500">Class</p>
                <p className="font-medium">{details.class_name || details.class_id}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Status</p>
                <span className={`inline-flex px-2 py-1 rounded-full text-xs font-medium ${details.status === 'covered' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                  {details.status}
                </span>
              </div>
              <div>
                <p className="text-sm text-gray-500">Date</p>
                <p className="font-medium">{details.date}</p>
              </div>
              <div>
                <p className="text-sm text-gray-500">Time</p>
                <p className="font-medium">{details.start_time} - {details.end_time}</p>
              </div>
              {details.substitute_name && (
                <div className="col-span-2">
                  <p className="text-sm text-gray-500">Assigned To</p>
                  <p className="font-medium">{details.substitute_name}</p>
                </div>
              )}
              {details.room && (
                <div>
                  <p className="text-sm text-gray-500">Room</p>
                  <p className="font-medium">{details.room}</p>
                </div>
              )}
              {details.department && (
                <div>
                  <p className="text-sm text-gray-500">Department</p>
                  <p className="font-medium">{details.department}</p>
                </div>
              )}
            </div>
          </div>
        ) : (
          <div className="py-8 text-center text-gray-500">No details available</div>
        )}

        <div className="mt-6 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
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
          <button onClick={() => setActiveTab('rotation')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rotation' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            Current Rotation
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-4 py-2 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-purple-600 text-purple-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
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
                          <div key={staff.id} className={`flex-shrink-0 p-3 rounded-lg border-2 transition-all ${staff.status === 'free' ? idx === 0 ? 'border-purple-500 bg-purple-50' : 'border-green-300 bg-green-50' : staff.status === 'covering' ? 'border-blue-300 bg-blue-50' : 'border-gray-300 bg-gray-50 opacity-60'}`}>
                            <div className="flex items-center space-x-2">
                              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-white text-sm font-medium ${staff.status === 'free' ? 'bg-green-500' : staff.status === 'covering' ? 'bg-blue-500' : 'bg-gray-400'}`}>
                                {idx + 1}
                              </div>
                              <div>
                                <p className="text-sm font-medium text-gray-900 whitespace-nowrap">{staff.name}</p>
                                <p className="text-xs text-gray-500">{staff.daysSinceLast}d • {staff.hoursThisMonth}h</p>
                              </div>
                            </div>
                            <div className="mt-2">
                              <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${staff.status === 'free' ? 'bg-green-100 text-green-700' : staff.status === 'covering' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700'}`}>
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
                            <span className={`inline-flex items-center px-2 py-1 rounded-full text-xs font-medium ${entry.type === 'rotation' ? 'bg-purple-100 text-purple-700' : entry.type === 'emergency' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700'}`}>
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
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}

// Department Rotation Section Component
type DepartmentRotationSectionProps = {
  rotationData: Record<string, TeacherView[]>;
  assignmentHistory: AssignmentHistoryEntry[];
  teacherStats: TeacherStat[];
  historyTotals: { total_assignments: number; total_hours: number; total_amount: number };
  historyLoading: boolean;
  onRefresh: () => void;
};

function DepartmentRotationSection({
  rotationData,
  assignmentHistory,
  teacherStats,
  historyTotals,
  historyLoading,
  onRefresh,
}: DepartmentRotationSectionProps) {
  const [activeTab, setActiveTab] = useState<'rotation' | 'history' | 'stats'>('rotation');
  const [selectedDepartment, setSelectedDepartment] = useState<string>('all');
  
  const departments = Object.keys(rotationData);
  
  const filteredHistory = selectedDepartment === 'all' 
    ? assignmentHistory 
    : assignmentHistory.filter(h => h.department === selectedDepartment);
  
  const displayRotation = selectedDepartment === 'all'
    ? rotationData
    : { [selectedDepartment]: rotationData[selectedDepartment] || [] };

  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
      <div className="bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-4">
        <div className="flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Department Rotation Management</h2>
            <p className="text-indigo-100 text-sm mt-1">Fair rotation-based coverage assignments with full audit trail</p>
          </div>
          <button onClick={onRefresh} disabled={historyLoading} className="px-4 py-2 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors flex items-center space-x-2">
            <svg className={`w-4 h-4 ${historyLoading ? 'animate-spin' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
            </svg>
            <span>Refresh</span>
          </button>
        </div>
      </div>

      <div className="border-b border-gray-200">
        <div className="flex">
          <button onClick={() => setActiveTab('rotation')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'rotation' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              <span>Rotation Queue</span>
            </span>
          </button>
          <button onClick={() => setActiveTab('history')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'history' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              <span>Assignment History</span>
            </span>
          </button>
          <button onClick={() => setActiveTab('stats')} className={`px-6 py-3 text-sm font-medium border-b-2 transition-colors ${activeTab === 'stats' ? 'border-indigo-600 text-indigo-600' : 'border-transparent text-gray-500 hover:text-gray-700'}`}>
            <span className="flex items-center space-x-2">
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
              </svg>
              <span>Teacher Stats</span>
            </span>
          </button>
        </div>
      </div>

      <div className="px-6 py-3 bg-gray-50 border-b border-gray-200">
        <div className="flex items-center space-x-3">
          <span className="text-sm font-medium text-gray-700">Department:</span>
          <select value={selectedDepartment} onChange={(e) => setSelectedDepartment(e.target.value)} className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-indigo-500 focus:border-indigo-500">
            <option value="all">All Departments</option>
            {departments.map(dept => <option key={dept} value={dept}>{dept}</option>)}
          </select>
          
          <div className="ml-auto flex items-center space-x-6 text-sm">
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Total Assignments:</span>
              <span className="font-semibold text-gray-900">{historyTotals.total_assignments}</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Total Hours:</span>
              <span className="font-semibold text-gray-900">{historyTotals.total_hours.toFixed(1)}h</span>
            </div>
            <div className="flex items-center space-x-2">
              <span className="text-gray-500">Total Amount:</span>
              <span className="font-semibold text-green-600">${historyTotals.total_amount.toFixed(2)}</span>
            </div>
          </div>
        </div>
      </div>

      <div className="p-6">
        {activeTab === 'rotation' && (
          <div className="space-y-6">
            {Object.entries(displayRotation).map(([dept, teachers]) => (
              <div key={dept} className="border border-gray-200 rounded-lg overflow-hidden">
                <div className="bg-gray-100 px-4 py-3 flex items-center justify-between">
                  <h3 className="font-semibold text-gray-900">{dept}</h3>
                  <span className="text-sm text-gray-500">{teachers.length} in rotation</span>
                </div>
                <div className="divide-y divide-gray-100">
                  {teachers.length === 0 ? (
                    <div className="px-4 py-8 text-center text-gray-500">No teachers in rotation for this department</div>
                  ) : (
                    teachers.sort((a, b) => (a.position ?? 999) - (b.position ?? 999)).map((teacher, index) => (
                      <div key={teacher.id} className={`px-4 py-3 flex items-center justify-between ${index === 0 ? 'bg-green-50 border-l-4 border-green-500' : ''}`}>
                        <div className="flex items-center space-x-4">
                          <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-green-500 text-white' : 'bg-gray-200 text-gray-600'}`}>{index + 1}</div>
                          <div>
                            <div className="flex items-center space-x-2">
                              <span className="font-medium text-gray-900">{teacher.name}</span>
                              {index === 0 && <span className="px-2 py-0.5 bg-green-100 text-green-700 text-xs font-semibold rounded-full">NEXT UP</span>}
                            </div>
                            <div className="text-sm text-gray-500">{teacher.daysSinceLast > 0 ? `${teacher.daysSinceLast} days since last coverage` : 'No recent coverage'}</div>
                          </div>
                        </div>
                        <div className="flex items-center space-x-4">
                          <div className="text-right">
                            <p className="text-sm font-medium text-gray-900">{teacher.hoursThisMonth}h this month</p>
                            <p className="text-sm text-gray-500">${teacher.amountThisMonth.toFixed(0)} earned</p>
                          </div>
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacher.status === 'free' ? 'bg-green-100 text-green-700' : teacher.status === 'covering' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                            {teacher.status === 'free' ? 'Available' : teacher.status === 'covering' ? 'Covering' : 'Absent'}
                          </span>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </div>
            ))}
          </div>
        )}

        {activeTab === 'history' && (
          <div>
            {historyLoading ? (
              <div className="py-12 text-center text-gray-500">Loading history...</div>
            ) : filteredHistory.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No assignment history found</div>
            ) : (
              <div className="overflow-x-auto">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Teacher</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Department</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Duration</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Amount</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {filteredHistory.map((entry) => (
                      <tr key={entry.id} className="hover:bg-gray-50">
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-900">{entry.date}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-gray-900">{entry.teacher_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{entry.class_name}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-500">{entry.department}</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-700">{entry.duration}h</td>
                        <td className="px-4 py-3 whitespace-nowrap text-sm font-medium text-green-600">${entry.amount.toFixed(2)}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-2 py-1 rounded-full text-xs font-medium ${entry.status === 'paid' ? 'bg-green-100 text-green-700' : entry.status === 'verified' ? 'bg-blue-100 text-blue-700' : 'bg-yellow-100 text-yellow-700'}`}>
                            {entry.status.charAt(0).toUpperCase() + entry.status.slice(1)}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === 'stats' && (
          <div>
            {teacherStats.length === 0 ? (
              <div className="py-12 text-center text-gray-500">No teacher statistics available</div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {teacherStats.sort((a, b) => b.total_hours - a.total_hours).map((stat, index) => (
                  <div key={stat.teacher_id} className={`p-4 rounded-lg border ${index === 0 ? 'border-yellow-300 bg-yellow-50' : 'border-gray-200 bg-white'}`}>
                    <div className="flex items-center justify-between mb-3">
                      <div className="flex items-center space-x-3">
                        <div className={`w-10 h-10 rounded-full flex items-center justify-center text-sm font-bold ${index === 0 ? 'bg-yellow-400 text-yellow-900' : index === 1 ? 'bg-gray-300 text-gray-700' : index === 2 ? 'bg-orange-300 text-orange-800' : 'bg-gray-100 text-gray-600'}`}>
                          {index === 0 ? '🏆' : index + 1}
                        </div>
                        <div>
                          <p className="font-semibold text-gray-900">{stat.teacher_name}</p>
                          <p className="text-xs text-gray-500">ID: {stat.teacher_id}</p>
                        </div>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-2 text-center">
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-lg font-bold text-gray-900">{stat.total_assignments}</p>
                        <p className="text-xs text-gray-500">Assignments</p>
                      </div>
                      <div className="bg-gray-50 rounded p-2">
                        <p className="text-lg font-bold text-gray-900">{stat.total_hours.toFixed(1)}h</p>
                        <p className="text-xs text-gray-500">Hours</p>
                      </div>
                      <div className="bg-green-50 rounded p-2">
                        <p className="text-lg font-bold text-green-600">${stat.total_amount.toFixed(0)}</p>
                        <p className="text-xs text-gray-500">Earned</p>
                      </div>
                    </div>
                    {stat.last_assignment && (
                      <p className="mt-3 text-xs text-gray-500 text-center">Last assignment: {new Date(stat.last_assignment).toLocaleDateString()}</p>
                    )}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}

// Available Teachers Modal
type AvailableTeachersModalProps = {
  teachers: TeacherView[];
  onClose: () => void;
};

function AvailableTeachersModal({ teachers, onClose }: AvailableTeachersModalProps) {
  const [selectedTeacher, setSelectedTeacher] = useState<TeacherView | null>(null);
  const [filter, setFilter] = useState<'all' | 'free' | 'covering' | 'absent'>('all');

  const filteredTeachers = filter === 'all' ? teachers : teachers.filter(t => t.status === filter);
  const availableCount = teachers.filter(t => t.status === 'free').length;

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-4xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-green-600 to-emerald-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Available Teachers</h2>
            <p className="text-green-100 text-sm">{availableCount} available out of {teachers.length} total</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 flex space-x-2">
          {(['all', 'free', 'covering', 'absent'] as const).map(status => (
            <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status ? 'bg-green-100 text-green-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              {status === 'all' ? 'All' : status === 'free' ? 'Available' : status === 'covering' ? 'Covering' : 'Absent'}
              <span className="ml-1 text-xs">({status === 'all' ? teachers.length : teachers.filter(t => t.status === status).length})</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {filteredTeachers.map(teacher => (
              <button key={teacher.id} onClick={() => setSelectedTeacher(selectedTeacher?.id === teacher.id ? null : teacher)} className={`text-left p-4 rounded-lg border transition-all ${selectedTeacher?.id === teacher.id ? 'border-green-500 bg-green-50 ring-2 ring-green-500' : 'border-gray-200 hover:border-green-300 hover:shadow-md'}`}>
                <div className="flex items-center justify-between mb-2">
                  <h3 className="font-semibold text-gray-900">{teacher.name}</h3>
                  <span className={`px-2 py-1 rounded-full text-xs font-medium ${teacher.status === 'free' ? 'bg-green-100 text-green-700' : teacher.status === 'covering' ? 'bg-blue-100 text-blue-700' : 'bg-red-100 text-red-700'}`}>
                    {teacher.status === 'free' ? 'Available' : teacher.status === 'covering' ? 'Covering' : 'Absent'}
                  </span>
                </div>
                <p className="text-sm text-gray-600 mb-2">{teacher.department}</p>
                
                {selectedTeacher?.id === teacher.id && (
                  <div className="mt-4 pt-4 border-t border-gray-200 space-y-2">
                    <div className="grid grid-cols-2 gap-4 text-sm">
                      <div><span className="text-gray-500">Position:</span><span className="ml-2 font-medium">{teacher.position || 'N/A'}</span></div>
                      <div><span className="text-gray-500">Days Since Last:</span><span className="ml-2 font-medium">{teacher.daysSinceLast}</span></div>
                      <div><span className="text-gray-500">Hours This Month:</span><span className="ml-2 font-medium">{teacher.hoursThisMonth}h</span></div>
                      <div><span className="text-gray-500">Earned This Month:</span><span className="ml-2 font-medium text-green-600">${teacher.amountThisMonth}</span></div>
                    </div>
                  </div>
                )}
              </button>
            ))}
          </div>
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}

// Available Substitutes Modal
type AvailableSubstitutesModalProps = {
  teachers: TeacherView[];
  onClose: () => void;
};

function AvailableSubstitutesModal({ teachers, onClose }: AvailableSubstitutesModalProps) {
  const [selectedSub, setSelectedSub] = useState<TeacherView | null>(null);

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-blue-600 to-indigo-600 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Available Substitutes</h2>
            <p className="text-blue-100 text-sm">{teachers.length} available for coverage</p>
          </div>
          <button onClick={onClose} className="text-white/80 hover:text-white">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-auto p-6">
          {teachers.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <svg className="w-12 h-12 mx-auto mb-4 text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              <p>No substitutes currently available</p>
            </div>
          ) : (
            <div className="space-y-3">
              {teachers.map(sub => (
                <button key={sub.id} onClick={() => setSelectedSub(selectedSub?.id === sub.id ? null : sub)} className={`w-full text-left p-4 rounded-lg border transition-all ${selectedSub?.id === sub.id ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500' : 'border-gray-200 hover:border-blue-300 hover:shadow-md'}`}>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center space-x-4">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-blue-700 font-semibold">{sub.name.charAt(0)}</span>
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{sub.name}</h3>
                        <p className="text-sm text-gray-600">{sub.department}</p>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm font-medium text-gray-900">{sub.hoursThisMonth}h this month</p>
                      <p className="text-sm text-green-600">${sub.amountThisMonth} earned</p>
                    </div>
                  </div>
                  
                  {selectedSub?.id === sub.id && (
                    <div className="mt-4 pt-4 border-t border-gray-200 grid grid-cols-3 gap-4 text-sm">
                      <div className="bg-gray-50 rounded p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{sub.position || '-'}</p>
                        <p className="text-xs text-gray-500">Queue Position</p>
                      </div>
                      <div className="bg-gray-50 rounded p-3 text-center">
                        <p className="text-lg font-bold text-gray-900">{sub.daysSinceLast}</p>
                        <p className="text-xs text-gray-500">Days Since Last</p>
                      </div>
                      <div className="bg-green-50 rounded p-3 text-center">
                        <p className="text-lg font-bold text-green-600">${sub.amountThisMonth}</p>
                        <p className="text-xs text-gray-500">This Month</p>
                      </div>
                    </div>
                  )}
                </button>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}

// Applicants Modal
type ApplicantsModalProps = {
  applicants: SubstituteApplicant[];
  counts: { pending: number; approved: number; denied: number; total: number };
  loading: boolean;
  onClose: () => void;
  onRefresh: () => void;
  pushToast: (message: string, type?: 'success' | 'error') => void;
};

function ApplicantsModal({ applicants, counts, loading, onClose, onRefresh, pushToast }: ApplicantsModalProps) {
  const [filter, setFilter] = useState<'all' | 'pending' | 'approved' | 'denied'>('pending');
  const [selectedApplicant, setSelectedApplicant] = useState<SubstituteApplicant | null>(null);
  const [reviewMode, setReviewMode] = useState<'view' | 'approve' | 'deny'>('view');
  const [denialReason, setDenialReason] = useState('');
  const [adminNotes, setAdminNotes] = useState('');
  const [submitting, setSubmitting] = useState(false);

  const filteredApplicants = filter === 'all' ? applicants : applicants.filter(a => a.status === filter);

  const handleReview = async (action: 'approve' | 'deny') => {
    if (!selectedApplicant) return;
    
    setSubmitting(true);
    try {
      const response = await fetch('https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2/substitutes/applicants/review', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          applicant_id: selectedApplicant.id,
          action,
          reason: action === 'deny' ? denialReason : null,
          admin_notes: adminNotes,
          reviewed_by: 'Admin'
        })
      });
      
      const result = await response.json();
      
      if (result.success) {
        pushToast(`✓ Applicant ${action === 'approve' ? 'approved' : 'denied'} successfully`, 'success');
        setSelectedApplicant(null);
        setReviewMode('view');
        setDenialReason('');
        setAdminNotes('');
        onRefresh();
      } else {
        pushToast(result.message || 'Failed to process review', 'error');
      }
    } catch (e) {
      pushToast('Failed to process review', 'error');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white rounded-xl w-full max-w-5xl mx-4 max-h-[90vh] overflow-hidden flex flex-col">
        <div className="bg-gradient-to-r from-orange-500 to-amber-500 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-bold text-white">Substitute Applicants</h2>
            <p className="text-orange-100 text-sm">{counts.pending} pending • {counts.approved} approved • {counts.denied} denied</p>
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={onRefresh} disabled={loading} className="px-3 py-1.5 bg-white/20 text-white rounded-lg hover:bg-white/30 transition-colors text-sm">
              {loading ? 'Loading...' : 'Refresh'}
            </button>
            <button onClick={onClose} className="text-white/80 hover:text-white">
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>

        <div className="px-6 py-3 border-b border-gray-200 flex space-x-2">
          {(['pending', 'approved', 'denied', 'all'] as const).map(status => (
            <button key={status} onClick={() => setFilter(status)} className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${filter === status ? status === 'pending' ? 'bg-orange-100 text-orange-700' : status === 'approved' ? 'bg-green-100 text-green-700' : status === 'denied' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700' : 'text-gray-600 hover:bg-gray-100'}`}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
              <span className="ml-1 text-xs">({status === 'all' ? counts.total : counts[status as keyof typeof counts]})</span>
            </button>
          ))}
        </div>

        <div className="flex-1 overflow-auto p-6">
          {loading ? (
            <div className="text-center py-12 text-gray-500">Loading applicants...</div>
          ) : filteredApplicants.length === 0 ? (
            <div className="text-center py-12 text-gray-500">
              <span className="text-4xl mb-4 block">📋</span>
              <p>No {filter === 'all' ? '' : filter} applicants found</p>
            </div>
          ) : (
            <div className="space-y-4">
              {filteredApplicants.map(applicant => (
                <div key={applicant.id} className={`border rounded-lg overflow-hidden transition-all ${selectedApplicant?.id === applicant.id ? 'border-orange-500 ring-2 ring-orange-500' : 'border-gray-200 hover:border-orange-300'}`}>
                  <button onClick={() => { setSelectedApplicant(selectedApplicant?.id === applicant.id ? null : applicant); setReviewMode('view'); }} className="w-full text-left p-4 flex items-center justify-between bg-white hover:bg-gray-50">
                    <div className="flex items-center space-x-4">
                      <div className={`w-12 h-12 rounded-full flex items-center justify-center text-lg font-bold ${applicant.status === 'pending' ? 'bg-orange-100 text-orange-700' : applicant.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {applicant.first_name.charAt(0)}{applicant.last_name.charAt(0)}
                      </div>
                      <div>
                        <h3 className="font-semibold text-gray-900">{applicant.full_name}</h3>
                        <p className="text-sm text-gray-600">{applicant.email}</p>
                      </div>
                    </div>
                    <div className="flex items-center space-x-4">
                      <div className="text-right">
                        <p className="text-sm font-medium text-gray-900">{applicant.experience_years || 0} years exp.</p>
                        <p className="text-xs text-gray-500">Applied {applicant.applied_date}</p>
                      </div>
                      <span className={`px-3 py-1 rounded-full text-sm font-medium ${applicant.status === 'pending' ? 'bg-orange-100 text-orange-700' : applicant.status === 'approved' ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                        {applicant.status.charAt(0).toUpperCase() + applicant.status.slice(1)}
                      </span>
                    </div>
                  </button>

                  {selectedApplicant?.id === applicant.id && (
                    <div className="border-t border-gray-200 bg-gray-50 p-4">
                      {reviewMode === 'view' ? (
                        <>
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Phone</p>
                              <p className="font-medium text-gray-900">{applicant.phone || 'N/A'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Subjects</p>
                              <p className="font-medium text-gray-900">{applicant.subjects || 'General'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Grade Levels</p>
                              <p className="font-medium text-gray-900">{applicant.grade_levels || 'Any'}</p>
                            </div>
                            <div className="bg-white rounded-lg p-3">
                              <p className="text-xs text-gray-500 mb-1">Availability</p>
                              <p className="font-medium text-gray-900">{applicant.availability || 'Flexible'}</p>
                            </div>
                          </div>

                          <div className="bg-white rounded-lg p-3 mb-4">
                            <p className="text-xs text-gray-500 mb-1">Certifications</p>
                            <p className="text-gray-900">{applicant.certifications || 'None listed'}</p>
                          </div>

                          {applicant.notes && (
                            <div className="bg-white rounded-lg p-3 mb-4">
                              <p className="text-xs text-gray-500 mb-1">Applicant Notes</p>
                              <p className="text-gray-900">{applicant.notes}</p>
                            </div>
                          )}

                          {applicant.denial_reason && (
                            <div className="bg-red-50 border border-red-200 rounded-lg p-3 mb-4">
                              <p className="text-xs text-red-600 mb-1">Denial Reason</p>
                              <p className="text-red-800">{applicant.denial_reason}</p>
                            </div>
                          )}

                          {applicant.status === 'pending' && (
                            <div className="flex space-x-3 mt-4">
                              <button onClick={() => setReviewMode('approve')} className="flex-1 px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 font-medium">✓ Approve Applicant</button>
                              <button onClick={() => setReviewMode('deny')} className="flex-1 px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 font-medium">✗ Deny Applicant</button>
                            </div>
                          )}
                        </>
                      ) : (
                        <div className="space-y-4">
                          <h4 className="font-semibold text-gray-900">{reviewMode === 'approve' ? '✓ Approve' : '✗ Deny'} {applicant.full_name}</h4>
                          
                          {reviewMode === 'deny' && (
                            <div>
                              <label className="block text-sm font-medium text-gray-700 mb-1">Denial Reason (will be sent to applicant)</label>
                              <textarea value={denialReason} onChange={(e) => setDenialReason(e.target.value)} placeholder="Please provide a reason for denial..." rows={3} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                            </div>
                          )}
                          
                          <div>
                            <label className="block text-sm font-medium text-gray-700 mb-1">Admin Notes (internal only)</label>
                            <textarea value={adminNotes} onChange={(e) => setAdminNotes(e.target.value)} placeholder="Optional internal notes..." rows={2} className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-orange-500" />
                          </div>

                          <div className="flex space-x-3">
                            <button onClick={() => setReviewMode('view')} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Cancel</button>
                            <button onClick={() => handleReview(reviewMode === 'approve' ? 'approve' : 'deny')} disabled={submitting || (reviewMode === 'deny' && !denialReason.trim())} className={`flex-1 px-4 py-2 text-white rounded-lg font-medium disabled:opacity-50 ${reviewMode === 'approve' ? 'bg-green-600 hover:bg-green-700' : 'bg-red-600 hover:bg-red-700'}`}>
                              {submitting ? 'Processing...' : reviewMode === 'approve' ? 'Confirm Approval' : 'Confirm Denial'}
                            </button>
                          </div>
                        </div>
                      )}
                    </div>
                  )}
                </div>
              ))}
            </div>
          )}
        </div>

        <div className="px-6 py-4 border-t border-gray-200 flex justify-end">
          <button onClick={onClose} className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg">Close</button>
        </div>
      </div>
    </div>
  );
}
