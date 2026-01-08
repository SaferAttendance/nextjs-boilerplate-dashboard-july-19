'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type TeacherData = {
  email: string;
  fullName: string;
  employeeId: string;
  schoolCode: string;
  districtCode: string;
  department: string;
};

type ScheduleClass = {
  id: number;
  period: number;
  className: string;
  room: string;
  subject: string;
  grade: string;
  students: number;
  days: string[];
};

type TimeOffRequest = {
  id: number;
  teacher_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  substitute_id: string | null;
  lesson_plan_url: string | null;
  created_at: number | null;
};

type CoverageLog = {
  id: number;
  date: string;
  teacher_id: string;
  substitute_id: string;
  coverage_request_id: number;
  periods: string;
  duration: number;
  rate: number;
  amount: number;
  status: 'pending' | 'verified' | 'paid';
  school_code: string;
  class_name: string | null;
  assigned_name: string | null;
};

type CoverageOpening = {
  id: number;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  department: string;
  date: string;
  room: string;
  students: number;
  subject: string;
  grade: string;
  status: string;
  substitute_id: string | null;
  substitute_name: string | null;
  pay_amount: number;
  urgent: boolean;
  school_code: string;
};

type RotationTeacher = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  position: number;
  days_since_last: number;
  hours_this_month: number;
  status: string | null;
  school_code: string;
};

type TeacherInfo = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  position: number;
  days_since_last: number;
  hours_this_month: number;
  amount_this_month: number;
  school_code: string;
  status: string | null;
};

const XANO_TEACHER_API = 'https://xgeu-jqgf-nnju.n7e.xano.io/api:t_J13ik1';

const CALL_OUT_REASONS = [
  { id: 'illness', label: 'Personal Illness', icon: '🤒' },
  { id: 'family_emergency', label: 'Family Emergency', icon: '👨‍👩‍👧' },
  { id: 'medical_appointment', label: 'Medical Appointment', icon: '🏥' },
  { id: 'personal', label: 'Personal Day', icon: '📋' },
  { id: 'professional_dev', label: 'Professional Development', icon: '📚' },
  { id: 'jury_duty', label: 'Jury Duty', icon: '⚖️' },
  { id: 'bereavement', label: 'Bereavement', icon: '💐' },
  { id: 'other', label: 'Other', icon: '📝' },
];

// Generate weekday dates for the next 14 days
function getUpcomingWeekdays(count: number = 10): { date: string; dayName: string; dateFormatted: string }[] {
  const days: { date: string; dayName: string; dateFormatted: string }[] = [];
  const today = new Date();
  let current = new Date(today);
  
  while (days.length < count) {
    const dayOfWeek = current.getDay();
    if (dayOfWeek !== 0 && dayOfWeek !== 6) { // Skip weekends
      days.push({
        date: current.toISOString().split('T')[0],
        dayName: current.toLocaleDateString('en-US', { weekday: 'short' }),
        dateFormatted: current.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      });
    }
    current.setDate(current.getDate() + 1);
  }
  return days;
}

export default function TeacherCoverageClient({ teacherData }: { teacherData: TeacherData }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<'schedule' | 'coverage' | 'earnings'>('schedule');
  const [loading, setLoading] = useState(true);
  
  // Data states
  const [teacherInfo, setTeacherInfo] = useState<TeacherInfo | null>(null);
  const [schedule, setSchedule] = useState<ScheduleClass[]>([]);
  const [myRequests, setMyRequests] = useState<TimeOffRequest[]>([]);
  const [coverageLog, setCoverageLog] = useState<CoverageLog[]>([]);
  const [availableCoverage, setAvailableCoverage] = useState<CoverageOpening[]>([]);
  const [rotationList, setRotationList] = useState<RotationTeacher[]>([]);
  const [earnings, setEarnings] = useState({ total: 0, pending: 0, verified: 0, paid: 0, totalJobs: 0, totalHours: 0 });
  
  // Filter states
  const [selectedDate, setSelectedDate] = useState<string>(new Date().toISOString().split('T')[0]);
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  
  // Modal states
  const [showCallOutModal, setShowCallOutModal] = useState(false);
  const [callOutType, setCallOutType] = useState<'day' | 'class'>('day');
  const [callOutDate, setCallOutDate] = useState<string>('');
  const [callOutPeriod, setCallOutPeriod] = useState<number>(0);
  const [callOutClass, setCallOutClass] = useState<ScheduleClass | null>(null);
  const [callOutReason, setCallOutReason] = useState('');
  const [callOutNotes, setCallOutNotes] = useState('');
  const [callOutLessonPlan, setCallOutLessonPlan] = useState('');
  const [callOutSubmitting, setCallOutSubmitting] = useState(false);
  
  // Request time off modal
  const [showTimeOffModal, setShowTimeOffModal] = useState(false);
  const [timeOffStart, setTimeOffStart] = useState('');
  const [timeOffEnd, setTimeOffEnd] = useState('');
  const [timeOffReason, setTimeOffReason] = useState('');
  const [timeOffNotes, setTimeOffNotes] = useState('');
  const [timeOffLessonPlan, setTimeOffLessonPlan] = useState('');
  const [timeOffSubmitting, setTimeOffSubmitting] = useState(false);
  
  // Stat modals
  const [showCoverageLogModal, setShowCoverageLogModal] = useState(false);
  const [showRequestsModal, setShowRequestsModal] = useState(false);
  const [showRotationModal, setShowRotationModal] = useState(false);
  
  // Accept coverage states
  const [acceptedCoverage, setAcceptedCoverage] = useState<Set<number>>(new Set());
  
  const initialLoadComplete = useRef(false);
  const upcomingDates = useMemo(() => getUpcomingWeekdays(10), []);

  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  // Fetch functions
  async function fetchTeacherInfo() {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/info?teacher_id=${teacherData.employeeId}`);
      const data = await response.json();
      if (data.teacher) setTeacherInfo(data.teacher);
    } catch (e) {
      console.error('Failed to fetch teacher info:', e);
    }
  }

  async function fetchSchedule() {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/my-schedule?teacher_id=${teacherData.employeeId}`);
      const data = await response.json();
      if (data.schedules) setSchedule(data.schedules);
    } catch (e) {
      console.error('Failed to fetch schedule:', e);
    }
  }

  async function fetchMyRequests() {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/my-time-off?teacher_id=${teacherData.employeeId}`);
      const data = await response.json();
      if (data.requests) setMyRequests(data.requests);
    } catch (e) {
      console.error('Failed to fetch requests:', e);
    }
  }

  async function fetchCoverageLog() {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/my-coverage-log?teacher_id=${teacherData.employeeId}`);
      const data = await response.json();
      if (data.logs) {
        setCoverageLog(data.logs);
        // Calculate earnings
        const logs = data.logs as CoverageLog[];
        const total = logs.reduce((sum, l) => sum + (l.amount || 0), 0);
        const pending = logs.filter(l => l.status === 'pending').reduce((sum, l) => sum + (l.amount || 0), 0);
        const verified = logs.filter(l => l.status === 'verified').reduce((sum, l) => sum + (l.amount || 0), 0);
        const paid = logs.filter(l => l.status === 'paid').reduce((sum, l) => sum + (l.amount || 0), 0);
        const totalHours = logs.reduce((sum, l) => sum + (l.duration || 0), 0);
        setEarnings({ total, pending, verified, paid, totalJobs: logs.length, totalHours });
      }
    } catch (e) {
      console.error('Failed to fetch coverage log:', e);
    }
  }

  async function fetchAvailableCoverage() {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/available-coverage?teacher_id=${teacherData.employeeId}&school_code=${teacherData.schoolCode}`);
      const data = await response.json();
      if (data.openings) setAvailableCoverage(data.openings.filter((o: CoverageOpening) => o.teacher_id !== teacherData.employeeId));
    } catch (e) {
      console.error('Failed to fetch available coverage:', e);
    }
  }

  async function fetchRotationList() {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/rotation-status?school_code=${teacherData.schoolCode}`);
      const data = await response.json();
      if (data.rotations) setRotationList(data.rotations);
    } catch (e) {
      console.error('Failed to fetch rotation list:', e);
    }
  }

  // Initial load
  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      if (!mounted) return;
      setLoading(true);
      
      await Promise.all([
        fetchTeacherInfo(),
        fetchSchedule(),
        fetchMyRequests(),
        fetchCoverageLog(),
        fetchAvailableCoverage(),
        fetchRotationList(),
      ]);
      
      if (!mounted) return;
      setLoading(false);
      initialLoadComplete.current = true;
    }
    
    loadData();
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Call out handler
  async function handleCallOut() {
    if (!callOutReason || !callOutDate) return;
    setCallOutSubmitting(true);
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/call-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherData.employeeId,
          call_out_type: callOutType,
          date: callOutDate,
          period: callOutType === 'class' ? callOutPeriod : 0,
          reason: CALL_OUT_REASONS.find(r => r.id === callOutReason)?.label || callOutReason,
          notes: callOutNotes.trim() || 'N/A',
          lesson_plan_url: callOutLessonPlan.trim() || 'N/A',
        }),
      });
      const result = await response.json();
      if (result.success) {
        pushToast(`Call out recorded for ${callOutType === 'day' ? 'full day' : `Period ${callOutPeriod}`}. Coverage request created.`, 'success');
        setShowCallOutModal(false);
        resetCallOutForm();
        fetchAvailableCoverage();
      } else {
        pushToast(result.message || 'Failed to submit call out', 'error');
      }
    } catch {
      pushToast('Failed to submit call out.', 'error');
    } finally {
      setCallOutSubmitting(false);
    }
  }

  function resetCallOutForm() {
    setCallOutType('day');
    setCallOutDate('');
    setCallOutPeriod(0);
    setCallOutClass(null);
    setCallOutReason('');
    setCallOutNotes('');
    setCallOutLessonPlan('');
  }

  // Time off request handler
  async function handleTimeOffRequest() {
    if (!timeOffStart || !timeOffEnd || !timeOffReason) return;
    setTimeOffSubmitting(true);
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/request-time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherData.employeeId,
          start_date: timeOffStart,
          end_date: timeOffEnd,
          reason: CALL_OUT_REASONS.find(r => r.id === timeOffReason)?.label || timeOffReason,
          notes: timeOffNotes.trim() || '',
          lesson_plan_url: timeOffLessonPlan.trim() || 'N/A',
        }),
      });
      const result = await response.json();
      if (result.success) {
        pushToast('Time off request submitted for admin approval!', 'success');
        setShowTimeOffModal(false);
        resetTimeOffForm();
        fetchMyRequests();
      } else {
        pushToast(result.message || 'Failed to submit request', 'error');
      }
    } catch {
      pushToast('Failed to submit request.', 'error');
    } finally {
      setTimeOffSubmitting(false);
    }
  }

  function resetTimeOffForm() {
    setTimeOffStart('');
    setTimeOffEnd('');
    setTimeOffReason('');
    setTimeOffNotes('');
    setTimeOffLessonPlan('');
  }

  // Cancel time off request
  async function handleCancelRequest(requestId: number) {
    if (!confirm('Are you sure you want to cancel this request?')) return;
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/cancel-time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: requestId,
          teacher_id: teacherData.employeeId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        pushToast('Request cancelled.', 'success');
        fetchMyRequests();
      } else {
        pushToast(result.message || 'Failed to cancel', 'error');
      }
    } catch {
      pushToast('Failed to cancel request.', 'error');
    }
  }

  // Accept coverage
  async function handleAcceptCoverage(coverageId: number) {
    try {
      const response = await fetch(`${XANO_TEACHER_API}/teachers/accept-coverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherData.employeeId,
          coverage_id: coverageId,
        }),
      });
      const result = await response.json();
      if (result.success) {
        setAcceptedCoverage(prev => new Set(prev).add(coverageId));
        setAvailableCoverage(prev => prev.filter(c => c.id !== coverageId));
        pushToast('Coverage accepted! Added to your assignments.', 'success');
        fetchCoverageLog();
      } else {
        pushToast(result.message || 'Failed to accept coverage', 'error');
      }
    } catch {
      pushToast('Failed to accept coverage.', 'error');
    }
  }

  // W-2 Export
  function handleExportW2() {
    pushToast('Generating earnings export...', 'success');
    const content = `TEACHER COVERAGE EARNINGS REPORT
${'='.repeat(36)}
Generated: ${new Date().toLocaleDateString()}

PERSONAL INFORMATION
${'-'.repeat(20)}
Name: ${teacherData.fullName}
Employee ID: ${teacherData.employeeId}
Department: ${teacherData.department}
School: ${teacherData.schoolCode}

EARNINGS SUMMARY
${'-'.repeat(16)}
Total Earnings: $${earnings.total.toFixed(2)}
  - Pending: $${earnings.pending.toFixed(2)}
  - Verified: $${earnings.verified.toFixed(2)}
  - Paid: $${earnings.paid.toFixed(2)}

Total Jobs: ${earnings.totalJobs}
Total Hours: ${earnings.totalHours}

COVERAGE LOG
${'-'.repeat(12)}
${coverageLog.map(l => `${l.date} | ${l.class_name || 'Coverage'} | $${(l.amount || 0).toFixed(2)} | ${l.status}`).join('\n') || 'No coverage records'}

---
This document is for tax preparation purposes.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `Coverage_Earnings_${teacherData.employeeId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setTimeout(() => pushToast('Earnings export downloaded!', 'success'), 500);
  }

  function formatDate(dateStr: string | number): string {
    if (!dateStr) return '';
    if (typeof dateStr === 'number') return new Date(dateStr).toLocaleDateString();
    return new Date(dateStr).toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
  }

  // Filter coverage by date/subject
  const filteredCoverage = useMemo(() => {
    return availableCoverage.filter(c => {
      if (c.teacher_id === teacherData.employeeId) return false;
      if (acceptedCoverage.has(c.id)) return false;
      if (subjectFilter !== 'all' && c.subject?.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      return true;
    });
  }, [availableCoverage, subjectFilter, acceptedCoverage, teacherData.employeeId]);

  // Unique subjects from coverage
  const subjects = useMemo(() => {
    const subs = new Set(availableCoverage.map(c => c.subject).filter(Boolean));
    return Array.from(subs);
  }, [availableCoverage]);

  // My position in rotation
  const myRotationPosition = useMemo(() => {
    const me = rotationList.find(r => r.employee_id === teacherData.employeeId);
    return me?.position || 0;
  }, [rotationList, teacherData.employeeId]);

  // Pending requests count
  const pendingRequestsCount = useMemo(() => {
    return myRequests.filter(r => r.status === 'pending').length;
  }, [myRequests]);

  if (loading) {
    return (
      <div className="flex items-center justify-center min-h-[400px]">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600 mx-auto mb-4"></div>
          <p className="text-gray-600">Loading your dashboard...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Tab Navigation */}
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-fit">
        <button
          onClick={() => setActiveTab('schedule')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'schedule' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          My Schedule
        </button>
        <button
          onClick={() => setActiveTab('coverage')}
          className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'coverage' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>Coverage Pool</span>
          {filteredCoverage.length > 0 && (
            <span className="bg-green-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {filteredCoverage.length}
            </span>
          )}
        </button>
        <button
          onClick={() => setActiveTab('earnings')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'earnings' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Earnings
        </button>
      </div>

      {activeTab === 'schedule' && (
        <>
          {/* Quick Stats Row */}
          <div className="grid grid-cols-4 gap-4">
            <button
              onClick={() => setShowRotationModal(true)}
              className="text-left bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xs font-medium text-gray-500 mb-1">Rotation Position</h3>
              <div className="text-2xl font-bold text-purple-600">#{myRotationPosition || '-'}</div>
            </button>
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <h3 className="text-xs font-medium text-gray-500 mb-1">Days Since Last</h3>
              <div className="text-2xl font-bold text-gray-900">{teacherInfo?.days_since_last || 0}</div>
            </div>
            <button
              onClick={() => setShowRequestsModal(true)}
              className="text-left bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xs font-medium text-gray-500 mb-1">Pending Requests</h3>
              <div className="text-2xl font-bold text-orange-600">{pendingRequestsCount}</div>
            </button>
            <button
              onClick={() => setShowCoverageLogModal(true)}
              className="text-left bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow"
            >
              <h3 className="text-xs font-medium text-gray-500 mb-1">Coverage Jobs</h3>
              <div className="text-2xl font-bold text-green-600">{earnings.totalJobs}</div>
            </button>
          </div>

          {/* Call Out Actions */}
          <div className="bg-gradient-to-r from-red-50 to-orange-50 border border-red-200 rounded-xl p-5">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">Need to Call Out?</h3>
                <p className="text-sm text-gray-600">Request coverage for a specific class or full day</p>
              </div>
              <div className="flex gap-3">
                <button
                  onClick={() => {
                    setCallOutType('class');
                    setShowCallOutModal(true);
                  }}
                  className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 text-sm font-medium"
                >
                  Call Out (Single Class)
                </button>
                <button
                  onClick={() => {
                    setCallOutType('day');
                    setShowCallOutModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Call Out (Full Day)
                </button>
                <button
                  onClick={() => setShowTimeOffModal(true)}
                  className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium"
                >
                  Request Time Off
                </button>
              </div>
            </div>
          </div>

          {/* Date Selector */}
          <div className="bg-white rounded-xl shadow-sm border p-4">
            <h3 className="text-sm font-medium text-gray-700 mb-3">Select Date to View Schedule</h3>
            <div className="flex gap-2 overflow-x-auto pb-2">
              {upcomingDates.map((d) => (
                <button
                  key={d.date}
                  onClick={() => setSelectedDate(d.date)}
                  className={`flex-shrink-0 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                    selectedDate === d.date
                      ? 'bg-purple-600 text-white'
                      : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                  }`}
                >
                  <div>{d.dayName}</div>
                  <div className="text-xs opacity-80">{d.dateFormatted}</div>
                </button>
              ))}
            </div>
          </div>

          {/* Schedule Grid */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">My Class Schedule</h2>
                <p className="text-sm text-gray-600">{new Date(selectedDate).toLocaleDateString('en-US', { weekday: 'long', month: 'long', day: 'numeric' })}</p>
              </div>
              <button
                onClick={() => {
                  fetchSchedule();
                  pushToast('Schedule refreshed!', 'success');
                }}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                🔄 Refresh
              </button>
            </div>
            <div className="p-5">
              {schedule.length === 0 ? (
                <div className="text-center py-8 text-gray-500">
                  <div className="text-4xl mb-2">📅</div>
                  <p>No schedule data available.</p>
                  <p className="text-sm">Contact admin to set up your class schedule.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {schedule.sort((a, b) => a.period - b.period).map((cls) => (
                    <div
                      key={cls.id}
                      className="flex items-center justify-between p-4 bg-gray-50 rounded-lg border hover:shadow-sm transition-shadow"
                    >
                      <div className="flex items-center space-x-4">
                        <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
                          <span className="text-lg font-bold text-purple-600">{cls.period}</span>
                        </div>
                        <div>
                          <div className="font-medium text-gray-900">{cls.className}</div>
                          <div className="text-sm text-gray-600">
                            {cls.subject} • Grade {cls.grade} • Room {cls.room}
                          </div>
                          <div className="text-xs text-gray-500">{cls.students} students</div>
                        </div>
                      </div>
                      <button
                        onClick={() => {
                          setCallOutType('class');
                          setCallOutDate(selectedDate);
                          setCallOutPeriod(cls.period);
                          setCallOutClass(cls);
                          setShowCallOutModal(true);
                        }}
                        className="px-3 py-1.5 text-sm text-red-600 border border-red-200 rounded-lg hover:bg-red-50"
                      >
                        Call Out
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Quick Full Day Call Out */}
          {schedule.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border p-5">
              <div className="flex items-center justify-between">
                <div>
                  <h3 className="font-medium text-gray-900">Call Out for Full Day</h3>
                  <p className="text-sm text-gray-600">
                    This will request coverage for all {schedule.length} classes on {formatDate(selectedDate)}
                  </p>
                </div>
                <button
                  onClick={() => {
                    setCallOutType('day');
                    setCallOutDate(selectedDate);
                    setShowCallOutModal(true);
                  }}
                  className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 text-sm font-medium"
                >
                  Call Out All Classes
                </button>
              </div>
            </div>
          )}

          {/* My Time Off Requests */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b flex items-center justify-between">
              <h2 className="text-lg font-semibold text-gray-900">My Time Off Requests</h2>
              <button
                onClick={() => setShowTimeOffModal(true)}
                className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
              >
                + New Request
              </button>
            </div>
            <div className="p-5">
              {myRequests.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No time off requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {myRequests.slice(0, 5).map((req) => (
                    <div
                      key={req.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        req.status === 'approved' ? 'bg-green-50 border-green-200' :
                        req.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                        req.status === 'denied' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50 border-gray-200'
                      }`}
                    >
                      <div>
                        <div className="font-medium text-gray-900">
                          {formatDate(req.start_date)}
                          {req.end_date !== req.start_date && ` - ${formatDate(req.end_date)}`}
                        </div>
                        <div className="text-sm text-gray-600">{req.reason}</div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          req.status === 'approved' ? 'bg-green-100 text-green-700' :
                          req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                          req.status === 'denied' ? 'bg-red-100 text-red-700' :
                          'bg-gray-100 text-gray-700'
                        }`}>
                          {req.status.charAt(0).toUpperCase() + req.status.slice(1)}
                        </span>
                        {req.status === 'pending' && (
                          <button
                            onClick={() => handleCancelRequest(req.id)}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Cancel
                          </button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'coverage' && (
        <>
          {/* Earnings Tracker */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">My Coverage Earnings</h3>
                <p className="text-sm text-gray-600">Earn extra by covering other teachers&apos; classes</p>
              </div>
              <button
                onClick={handleExportW2}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm"
              >
                Export W-2 →
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${earnings.total.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Total</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-yellow-600">${earnings.pending.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Pending</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${earnings.verified.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Verified</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${earnings.paid.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Paid</div>
              </div>
            </div>
          </div>

          {/* Filters */}
          <div className="flex items-center gap-3">
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Subjects</option>
              {subjects.map(s => (
                <option key={s} value={s}>{s}</option>
              ))}
            </select>
            <button
              onClick={() => {
                fetchAvailableCoverage();
                pushToast('Refreshed!', 'success');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              🔄 Refresh
            </button>
            <span className="text-sm text-gray-500">
              {filteredCoverage.length} opportunities available
            </span>
          </div>

          {/* Coverage Grid */}
          {filteredCoverage.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Coverage Opportunities</h3>
              <p className="text-gray-600 text-sm">Check back later for coverage opportunities.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredCoverage.map((coverage) => (
                <div key={coverage.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{coverage.class_name}</h3>
                      <p className="text-sm text-gray-600">For: {coverage.teacher_name}</p>
                    </div>
                    {coverage.urgent && (
                      <span className="text-xs px-2 py-1 rounded-full bg-red-100 text-red-700">
                        Urgent
                      </span>
                    )}
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>📅 {formatDate(coverage.date)}</div>
                    <div>🚪 Room {coverage.room}</div>
                    <div>📚 {coverage.subject} • Grade {coverage.grade}</div>
                    <div>👥 {coverage.students} students</div>
                  </div>

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-lg font-semibold text-gray-900">${coverage.pay_amount.toFixed(2)}</div>
                    <button
                      onClick={() => handleAcceptCoverage(coverage.id)}
                      disabled={acceptedCoverage.has(coverage.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        acceptedCoverage.has(coverage.id)
                          ? 'bg-gray-200 text-gray-500'
                          : 'bg-green-600 text-white hover:bg-green-700'
                      }`}
                    >
                      {acceptedCoverage.has(coverage.id) ? 'Accepted' : 'Accept Coverage'}
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}

          {/* Coverage Log */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">My Coverage History</h2>
            </div>
            <div className="p-5">
              {coverageLog.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-4">No coverage history yet.</p>
              ) : (
                <div className="space-y-3">
                  {coverageLog.slice(0, 5).map((log) => (
                    <div key={log.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div>
                        <div className="font-medium text-gray-900">{log.class_name || 'Coverage'}</div>
                        <div className="text-sm text-gray-600">{formatDate(log.date)} • {log.duration}h</div>
                      </div>
                      <div className="text-right">
                        <div className="font-medium text-gray-900">${(log.amount || 0).toFixed(2)}</div>
                        <span className={`text-xs px-2 py-0.5 rounded-full ${
                          log.status === 'paid' ? 'bg-green-100 text-green-700' :
                          log.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                          'bg-yellow-100 text-yellow-700'
                        }`}>
                          {log.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}

      {activeTab === 'earnings' && (
        <>
          {/* Full Earnings View */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-xl font-semibold text-gray-900 mb-1">Earnings Summary</h3>
                <p className="text-gray-600">Your coverage compensation overview</p>
              </div>
              <button
                onClick={handleExportW2}
                className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium"
              >
                📊 Export for Taxes
              </button>
            </div>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-purple-600">${earnings.total.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-gray-900">{earnings.totalJobs}</div>
                <div className="text-sm text-gray-600">Total Jobs</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-blue-600">{earnings.totalHours}</div>
                <div className="text-sm text-gray-600">Hours Worked</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-3xl font-bold text-green-600">
                  ${earnings.totalJobs > 0 ? (earnings.total / earnings.totalJobs).toFixed(2) : '0.00'}
                </div>
                <div className="text-sm text-gray-600">Avg per Job</div>
              </div>
            </div>
          </div>

          {/* Payment Status Breakdown */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-yellow-50 border border-yellow-200 rounded-xl p-5">
              <h3 className="text-sm font-medium text-yellow-800 mb-2">Pending Verification</h3>
              <div className="text-2xl font-bold text-yellow-600">${earnings.pending.toFixed(2)}</div>
              <p className="text-xs text-yellow-700 mt-1">Awaiting admin approval</p>
            </div>
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-5">
              <h3 className="text-sm font-medium text-blue-800 mb-2">Verified</h3>
              <div className="text-2xl font-bold text-blue-600">${earnings.verified.toFixed(2)}</div>
              <p className="text-xs text-blue-700 mt-1">Ready for payment</p>
            </div>
            <div className="bg-green-50 border border-green-200 rounded-xl p-5">
              <h3 className="text-sm font-medium text-green-800 mb-2">Paid</h3>
              <div className="text-2xl font-bold text-green-600">${earnings.paid.toFixed(2)}</div>
              <p className="text-xs text-green-700 mt-1">Deposited to account</p>
            </div>
          </div>

          {/* Full Coverage Log */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">Complete Coverage Log</h2>
            </div>
            <div className="overflow-x-auto">
              {coverageLog.length === 0 ? (
                <div className="p-8 text-center text-gray-500">
                  <div className="text-4xl mb-2">📊</div>
                  <p>No coverage records yet. Accept coverage opportunities to start earning!</p>
                </div>
              ) : (
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-5 py-3 text-left text-xs font-medium text-gray-500 uppercase">Amount</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coverageLog.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-900">
                          {formatDate(log.date)}
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <div className="text-sm font-medium text-gray-900">{log.class_name || 'Coverage'}</div>
                          <div className="text-xs text-gray-500">{log.assigned_name}</div>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm text-gray-600">
                          {log.duration}h @ ${log.rate}/hr
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            log.status === 'paid' ? 'bg-green-100 text-green-700' :
                            log.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status}
                          </span>
                        </td>
                        <td className="px-5 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                          ${(log.amount || 0).toFixed(2)}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>
          </div>
        </>
      )}

      {/* Call Out Modal */}
      {showCallOutModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4">
            <div className={`px-5 py-4 border-b ${callOutType === 'day' ? 'bg-red-50 border-red-200' : 'bg-orange-50 border-orange-200'}`}>
              <h2 className="font-semibold text-gray-900">
                {callOutType === 'day' ? '🚨 Call Out - Full Day' : '⏰ Call Out - Single Class'}
              </h2>
              <p className="text-sm text-gray-600">
                {callOutType === 'day' 
                  ? `All ${schedule.length} classes will be added to the coverage pool`
                  : callOutClass ? `${callOutClass.className} - Period ${callOutClass.period}` : 'Select a class'}
              </p>
            </div>
            <div className="p-5 space-y-4">
              {/* Date Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Date *</label>
                <select
                  value={callOutDate}
                  onChange={(e) => setCallOutDate(e.target.value)}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                >
                  <option value="">Select a date...</option>
                  {upcomingDates.map(d => (
                    <option key={d.date} value={d.date}>
                      {d.dayName}, {d.dateFormatted}
                    </option>
                  ))}
                </select>
              </div>

              {/* Class Selection (for single class) */}
              {callOutType === 'class' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Select Class *</label>
                  {schedule.length === 0 ? (
                    <div className="space-y-3">
                      <p className="text-sm text-gray-500 italic">No schedule data found. Enter period manually:</p>
                      <div className="grid grid-cols-4 gap-2">
                        {[1, 2, 3, 4, 5, 6, 7, 8].map(period => (
                          <button
                            key={period}
                            type="button"
                            onClick={() => {
                              setCallOutPeriod(period);
                              setCallOutClass({ id: period, period, className: `Period ${period}`, room: '', subject: '', grade: '', students: 0, days: [] });
                            }}
                            className={`p-3 rounded-lg border text-center font-medium transition-colors ${
                              callOutPeriod === period
                                ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500 text-orange-700'
                                : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50 text-gray-700'
                            }`}
                          >
                            Period {period}
                          </button>
                        ))}
                      </div>
                    </div>
                  ) : (
                    <div className="space-y-2 max-h-48 overflow-y-auto">
                      {schedule.sort((a, b) => a.period - b.period).map(cls => (
                        <button
                          key={cls.id}
                          type="button"
                          onClick={() => {
                            setCallOutPeriod(cls.period);
                            setCallOutClass(cls);
                          }}
                          className={`w-full text-left p-3 rounded-lg border transition-colors ${
                            callOutPeriod === cls.period
                              ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                              : 'border-gray-200 hover:border-gray-300 hover:bg-gray-50'
                          }`}
                        >
                          <div className="flex items-center justify-between">
                            <div>
                              <div className="font-medium text-gray-900">Period {cls.period}: {cls.className}</div>
                              <div className="text-xs text-gray-600">{cls.subject} • Grade {cls.grade} • Room {cls.room} • {cls.students} students</div>
                            </div>
                            {callOutPeriod === cls.period && (
                              <span className="text-orange-600 text-lg">✓</span>
                            )}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Reason Selection */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CALL_OUT_REASONS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setCallOutReason(r.id)}
                      className={`p-2 rounded-lg border text-left text-sm ${
                        callOutReason === r.id
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>

              {/* Lesson Plan */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Plan URL (Optional)</label>
                <input
                  type="url"
                  value={callOutLessonPlan}
                  onChange={(e) => setCallOutLessonPlan(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              {/* Notes */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={callOutNotes}
                  onChange={(e) => setCallOutNotes(e.target.value)}
                  placeholder="Any special instructions for the substitute..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCallOutModal(false);
                  resetCallOutForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCallOut}
                disabled={!callOutReason || !callOutDate || (callOutType === 'class' && !callOutPeriod) || callOutSubmitting}
                className={`px-4 py-2 text-white rounded-lg text-sm font-medium disabled:opacity-50 ${
                  callOutType === 'day' ? 'bg-red-600 hover:bg-red-700' : 'bg-orange-600 hover:bg-orange-700'
                }`}
              >
                {callOutSubmitting ? 'Submitting...' : 'Confirm Call Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Time Off Request Modal */}
      {showTimeOffModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4">
            <div className="bg-blue-50 px-5 py-4 border-b border-blue-200">
              <h2 className="font-semibold text-gray-900">📅 Request Time Off</h2>
              <p className="text-sm text-gray-600">Submit for admin approval (multi-day absences)</p>
            </div>
            <div className="p-5 space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Start Date *</label>
                  <input
                    type="date"
                    value={timeOffStart}
                    onChange={(e) => setTimeOffStart(e.target.value)}
                    min={new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">End Date *</label>
                  <input
                    type="date"
                    value={timeOffEnd}
                    onChange={(e) => setTimeOffEnd(e.target.value)}
                    min={timeOffStart || new Date().toISOString().split('T')[0]}
                    className="w-full px-3 py-2 border rounded-lg text-sm"
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CALL_OUT_REASONS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setTimeOffReason(r.id)}
                      className={`p-2 rounded-lg border text-left text-sm ${
                        timeOffReason === r.id
                          ? 'border-blue-500 bg-blue-50 ring-2 ring-blue-500'
                          : 'border-gray-200 hover:border-gray-300'
                      }`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Lesson Plan URL (Optional)</label>
                <input
                  type="url"
                  value={timeOffLessonPlan}
                  onChange={(e) => setTimeOffLessonPlan(e.target.value)}
                  placeholder="https://drive.google.com/..."
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={timeOffNotes}
                  onChange={(e) => setTimeOffNotes(e.target.value)}
                  placeholder="Additional details..."
                  rows={2}
                  className="w-full px-3 py-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowTimeOffModal(false);
                  resetTimeOffForm();
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleTimeOffRequest}
                disabled={!timeOffStart || !timeOffEnd || !timeOffReason || timeOffSubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {timeOffSubmitting ? 'Submitting...' : 'Submit Request'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Rotation List Modal */}
      {showRotationModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">🔄 Coverage Rotation List</h2>
              <button onClick={() => setShowRotationModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto">
              {rotationList.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No rotation data available.</p>
              ) : (
                <div className="space-y-2">
                  {rotationList.sort((a, b) => a.position - b.position).map((teacher) => (
                    <div
                      key={teacher.id}
                      className={`flex items-center justify-between p-3 rounded-lg border ${
                        teacher.employee_id === teacherData.employeeId
                          ? 'bg-purple-50 border-purple-200'
                          : 'bg-gray-50'
                      }`}
                    >
                      <div className="flex items-center space-x-3">
                        <span className={`w-8 h-8 rounded-full flex items-center justify-center font-bold text-sm ${
                          teacher.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                          teacher.position <= 3 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {teacher.position}
                        </span>
                        <div>
                          <div className="font-medium text-gray-900">
                            {teacher.name}
                            {teacher.employee_id === teacherData.employeeId && (
                              <span className="ml-2 text-xs bg-purple-100 text-purple-700 px-2 py-0.5 rounded-full">You</span>
                            )}
                          </div>
                          <div className="text-xs text-gray-600">{teacher.department}</div>
                        </div>
                      </div>
                      <div className="text-right text-sm">
                        <div className="text-gray-900">{teacher.days_since_last} days ago</div>
                        <div className="text-xs text-gray-500">{teacher.hours_this_month}h this month</div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Coverage Log Modal */}
      {showCoverageLogModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">📊 Coverage History ({coverageLog.length})</h2>
              <button onClick={() => setShowCoverageLogModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto">
              {coverageLog.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No coverage history yet.</p>
              ) : (
                <div className="space-y-3">
                  {coverageLog.map((log) => (
                    <div key={log.id} className="p-3 bg-gray-50 rounded-lg border">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{log.class_name || 'Coverage'}</div>
                          <div className="text-xs text-gray-600">{formatDate(log.date)} • {log.duration}h</div>
                        </div>
                        <div className="text-right">
                          <div className="font-medium text-green-600">${(log.amount || 0).toFixed(2)}</div>
                          <span className={`text-xs px-2 py-0.5 rounded-full ${
                            log.status === 'paid' ? 'bg-green-100 text-green-700' :
                            log.status === 'verified' ? 'bg-blue-100 text-blue-700' :
                            'bg-yellow-100 text-yellow-700'
                          }`}>
                            {log.status}
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Requests Modal */}
      {showRequestsModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">📋 My Time Off Requests ({myRequests.length})</h2>
              <button onClick={() => setShowRequestsModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto">
              {myRequests.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No time off requests yet.</p>
              ) : (
                <div className="space-y-3">
                  {myRequests.map((req) => (
                    <div
                      key={req.id}
                      className={`p-3 rounded-lg border ${
                        req.status === 'approved' ? 'bg-green-50 border-green-200' :
                        req.status === 'pending' ? 'bg-yellow-50 border-yellow-200' :
                        req.status === 'denied' ? 'bg-red-50 border-red-200' :
                        'bg-gray-50'
                      }`}
                    >
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">
                            {formatDate(req.start_date)}
                            {req.end_date !== req.start_date && ` - ${formatDate(req.end_date)}`}
                          </div>
                          <div className="text-sm text-gray-600">{req.reason}</div>
                          {req.notes && <div className="text-xs text-gray-500 mt-1">{req.notes}</div>}
                        </div>
                        <div className="flex items-center space-x-2">
                          <span className={`text-xs px-2 py-1 rounded-full ${
                            req.status === 'approved' ? 'bg-green-100 text-green-700' :
                            req.status === 'pending' ? 'bg-yellow-100 text-yellow-700' :
                            req.status === 'denied' ? 'bg-red-100 text-red-700' :
                            'bg-gray-100 text-gray-700'
                          }`}>
                            {req.status}
                          </span>
                          {req.status === 'pending' && (
                            <button
                              onClick={() => handleCancelRequest(req.id)}
                              className="text-xs text-red-600 hover:text-red-700"
                            >
                              Cancel
                            </button>
                          )}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 max-w-sm ${
              t.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
          >
            <span>{t.type === 'success' ? '✓' : '✗'}</span>
            <span className="font-medium text-sm">{t.message}</span>
            <button onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))} className="ml-2">×</button>
          </div>
        ))}
      </div>
    </div>
  );
}
