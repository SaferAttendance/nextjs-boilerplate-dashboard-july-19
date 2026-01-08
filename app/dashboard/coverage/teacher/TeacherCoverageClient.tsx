'use client';

import React, { useEffect, useMemo, useState, useCallback } from 'react';

// ==================== TYPE DEFINITIONS ====================

type Toast = { id: string; message: string; type: 'success' | 'error' };

type TimeOffRequest = {
  id: string;
  startDate: string;
  endDate: string;
  startDateRaw: string;
  endDateRaw: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  substitute?: string;
  lessonPlanUrl?: string;
  createdAt?: number | null;
  approvedBy?: number | null;
  approvedAt?: number | null;
};

type CoverageLog = {
  id: string;
  date: string;
  dateRaw: string;
  weekday: string;
  course: string;
  teacher: string;
  room: string;
  periods: string;
  duration: string;
  durationHours: number;
  status: 'verified' | 'pending' | 'paid';
  amount: number;
  rate: number;
  coverageRequestId?: number;
  department?: string | null;
  assignmentType?: string | null;
};

type AvailableCoverage = {
  id: number;
  classId: string;
  className: string;
  teacherName: string;
  teacherId: string;
  department: string;
  date: string;
  dateRaw: string;
  startTime: number | null;
  endTime: number | null;
  room: string;
  students: number;
  subject: string;
  grade: string;
  payAmount: number;
  urgent: boolean;
  schoolCode: string;
};

type ScheduleItem = {
  id: number;
  period: number;
  className: string;
  room: string;
  subject: string;
  grade: string;
  students: number;
  days: string[];
};

type RotationMember = {
  id: number;
  employeeId: string;
  name: string;
  department: string;
  position: number;
  daysSinceLast: number;
  hoursThisMonth: number;
  status: string | null;
  isMe: boolean;
};

type TodaysCoverageClass = {
  period: number;
  name: string;
  room: string;
  substituteId?: string;
  substituteName?: string;
};

type TeacherData = {
  email: string;
  fullName: string;
  department: string;
  employeeId: string;
  schoolCode: string;
  districtCode: string;
  rotationPosition: number;
  daysSinceLast: number;
  monthlyEarnings: number;
  yearToDateEarnings: number;
  hoursThisMonth: number;
  pendingApproval: number;
  verifiedAmount: number;
  paidAmount: number;
  approvedAmount: number;
  totalJobs: number;
  todaysCoverage: {
    date: string;
    substitute: string;
    classes: TodaysCoverageClass[];
  } | null;
  myRequests: TimeOffRequest[];
  coverageLog: CoverageLog[];
  availableCoverage: AvailableCoverage[];
  schedule: ScheduleItem[];
  rotationList: RotationMember[];
  apiUrls: {
    teacher: string;
    main: string;
  };
};

// ==================== MAIN COMPONENT ====================

export default function TeacherCoverageClient({ teacherData }: { teacherData: TeacherData }) {
  const firstName = teacherData.fullName.split(' ')[0];
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [activeTab, setActiveTab] = useState<'overview' | 'schedule' | 'rotation'>('overview');
  
  // Local state for data that can change
  const [myRequests, setMyRequests] = useState<TimeOffRequest[]>(teacherData.myRequests);
  const [coverageLog, setCoverageLog] = useState<CoverageLog[]>(teacherData.coverageLog);
  const [availableCoverage, setAvailableCoverage] = useState<AvailableCoverage[]>(teacherData.availableCoverage);
  
  // Find urgent coverage (within next hour)
  const urgentCoverage = useMemo(() => {
    const now = new Date();
    const todayStr = now.toISOString().split('T')[0];
    return availableCoverage.find(c => {
      if (!c.urgent) return false;
      return c.dateRaw === todayStr;
    });
  }, [availableCoverage]);

  const [showUrgentCoverage, setShowUrgentCoverage] = useState(!!urgentCoverage);

  // Countdown timer for urgent coverage
  const [urgentMM, setUrgentMM] = useState(38);
  const [urgentSS, setUrgentSS] = useState(42);
  
  useEffect(() => {
    if (!showUrgentCoverage || !urgentCoverage) return;
    const interval = setInterval(() => {
      setUrgentSS((s) => {
        if (urgentMM <= 0 && s <= 0) return 0;
        if (s > 0) return s - 1;
        setUrgentMM((m) => (m > 0 ? m - 1 : 0));
        return 59;
      });
    }, 1000);
    return () => clearInterval(interval);
  }, [urgentMM, showUrgentCoverage, urgentCoverage]);

  const urgentTimerText = useMemo(() => {
    const mm = String(Math.max(0, urgentMM)).padStart(2, '0');
    const ss = String(Math.max(0, urgentSS)).padStart(2, '0');
    return urgentMM <= 0 && urgentSS <= 0 ? 'OVERDUE' : `${mm}:${ss}`;
  }, [urgentMM, urgentSS]);

  // ==================== TOAST HELPERS ====================
  
  const pushToast = useCallback((message: string, type: 'success' | 'error' = 'success') => {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }, []);

  // ==================== API HANDLERS ====================

  // Accept coverage opportunity
  async function handleAcceptCoverage(coverageId?: number) {
    const targetId = coverageId || urgentCoverage?.id;
    if (!targetId) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${teacherData.apiUrls.teacher}/teachers/accept-coverage`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherData.employeeId,
          coverage_id: targetId,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        if (targetId === urgentCoverage?.id) {
          setShowUrgentCoverage(false);
        }
        setAvailableCoverage(prev => prev.filter(c => c.id !== targetId));
        pushToast('Coverage accepted! You\'ll receive confirmation shortly.', 'success');
        
        // Refresh coverage log after short delay
        setTimeout(() => refreshCoverageLog(), 1000);
      } else {
        pushToast(data.message || 'Failed to accept coverage', 'error');
      }
    } catch (error) {
      console.error('Accept coverage error:', error);
      pushToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Submit time off request
  async function handleTimeOffSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    const startDate = formData.get('startDate') as string;
    const endDate = formData.get('endDate') as string;
    const reason = formData.get('reason') as string;
    const notes = formData.get('notes') as string;
    const lessonPlanUrl = formData.get('lessonPlanUrl') as string || '';

    if (!startDate || !endDate || !reason) {
      pushToast('Please fill in all required fields', 'error');
      return;
    }

    // Validate dates
    if (new Date(startDate) > new Date(endDate)) {
      pushToast('End date must be after start date', 'error');
      return;
    }

    if (new Date(startDate) < new Date()) {
      pushToast('Start date cannot be in the past', 'error');
      return;
    }

    setIsSubmitting(true);
    try {
      const response = await fetch(`${teacherData.apiUrls.teacher}/teachers/request-time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          teacher_id: teacherData.employeeId,
          start_date: startDate,
          end_date: endDate,
          reason: reason,
          notes: notes || '',
          lesson_plan_url: lessonPlanUrl || 'N/A',
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        const newRequest: TimeOffRequest = {
          id: String(data.request.id),
          startDate: formatDate(startDate),
          endDate: formatDate(endDate),
          startDateRaw: startDate,
          endDateRaw: endDate,
          reason: reason,
          notes: notes,
          status: 'pending',
        };
        setMyRequests(prev => [newRequest, ...prev]);
        pushToast('Time off request submitted! Admin will review shortly.', 'success');
        form.reset();
      } else {
        pushToast(data.message || 'Failed to submit request', 'error');
      }
    } catch (error) {
      console.error('Submit time off error:', error);
      pushToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Cancel time off request
  async function handleCancelRequest(requestId: string) {
    if (!confirm('Are you sure you want to cancel this request?')) return;

    setIsSubmitting(true);
    try {
      const response = await fetch(`${teacherData.apiUrls.teacher}/teachers/cancel-time-off`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          request_id: parseInt(requestId),
          teacher_id: teacherData.employeeId,
        }),
      });

      const data = await response.json();
      
      if (response.ok && data.success) {
        setMyRequests(prev => prev.filter(r => r.id !== requestId));
        pushToast('Request cancelled successfully', 'success');
      } else {
        pushToast(data.message || 'Failed to cancel request', 'error');
      }
    } catch (error) {
      console.error('Cancel request error:', error);
      pushToast('Network error. Please try again.', 'error');
    } finally {
      setIsSubmitting(false);
    }
  }

  // Refresh coverage log
  async function refreshCoverageLog() {
    try {
      const response = await fetch(
        `${teacherData.apiUrls.teacher}/teachers/my-coverage-log?teacher_id=${teacherData.employeeId}`
      );
      const data = await response.json();
      if (data.logs) {
        const updatedLogs = data.logs.map((log: any) => ({
          id: String(log.id),
          date: formatDate(log.date),
          dateRaw: log.date,
          weekday: getWeekday(log.date),
          course: log.class_name || 'Coverage Assignment',
          teacher: log.assigned_name || 'Unknown',
          room: log.school_code || '',
          periods: log.periods || '',
          duration: `${log.duration} hour${log.duration !== 1 ? 's' : ''}`,
          durationHours: log.duration,
          status: log.status as 'verified' | 'pending' | 'paid',
          amount: log.amount || 0,
          rate: log.rate || 0,
          coverageRequestId: log.coverage_request_id,
        }));
        setCoverageLog(updatedLogs);
      }
    } catch (error) {
      console.error('Failed to refresh coverage log:', error);
    }
  }

  // Export for taxes
  function handleExportForTaxes() {
    if (coverageLog.length === 0) {
      pushToast('No coverage data to export', 'error');
      return;
    }
    
    pushToast('Generating tax export...', 'success');
    
    // Generate CSV data
    const headers = ['Date', 'Day', 'Class', 'Teacher Covered', 'Periods', 'Duration', 'Status', 'Amount', 'Rate'];
    const rows = coverageLog.map(log => [
      log.date,
      log.weekday,
      `"${log.course}"`,
      `"${log.teacher}"`,
      `"${log.periods}"`,
      log.duration,
      log.status,
      `$${log.amount.toFixed(2)}`,
      `$${log.rate.toFixed(2)}/hr`,
    ]);
    
    // Add summary
    const totalAmount = coverageLog.reduce((sum, l) => sum + l.amount, 0);
    const totalHours = coverageLog.reduce((sum, l) => sum + l.durationHours, 0);
    rows.push([]);
    rows.push(['SUMMARY']);
    rows.push(['Total Assignments', coverageLog.length.toString()]);
    rows.push(['Total Hours', totalHours.toString()]);
    rows.push(['Total Earnings', `$${totalAmount.toFixed(2)}`]);
    rows.push(['Employee ID', teacherData.employeeId]);
    rows.push(['School', teacherData.schoolCode]);
    
    const csvContent = [
      `Coverage Log Export - ${teacherData.fullName}`,
      `Generated: ${new Date().toLocaleDateString()}`,
      '',
      headers.join(','),
      ...rows.map(row => Array.isArray(row) ? row.join(',') : row),
    ].join('\n');
    
    // Download CSV
    const blob = new Blob([csvContent], { type: 'text/csv' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `coverage-log-${teacherData.employeeId}-${new Date().toISOString().split('T')[0]}.csv`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => {
      pushToast('Tax export downloaded!', 'success');
    }, 500);
  }

  // ==================== RENDER ====================

  return (
    <div className="space-y-8">
      {/* Header with Quick Stats */}
      <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
        <div>
          <h1 className="text-3xl font-bold text-gray-900">Welcome, {firstName}!</h1>
          <p className="text-gray-600 mt-1">
            {teacherData.department} • Employee ID: {teacherData.employeeId}
          </p>
        </div>
        <div className="flex items-center gap-4">
          <div className="text-right">
            <div className="text-sm text-gray-500">Rotation Position</div>
            <div className="text-2xl font-bold text-purple-600">#{teacherData.rotationPosition || '-'}</div>
          </div>
          <div className="text-right">
            <div className="text-sm text-gray-500">Days Since Last</div>
            <div className="text-2xl font-bold text-gray-900">{teacherData.daysSinceLast}</div>
          </div>
        </div>
      </div>

      {/* Tab Navigation */}
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8">
          {[
            { id: 'overview', label: 'Overview' },
            { id: 'schedule', label: 'My Schedule' },
            { id: 'rotation', label: 'Rotation List' },
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as typeof activeTab)}
              className={`py-2 px-1 border-b-2 font-medium text-sm transition-colors ${
                activeTab === tab.id
                  ? 'border-purple-500 text-purple-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
              }`}
            >
              {tab.label}
            </button>
          ))}
        </nav>
      </div>

      {/* URGENT COVERAGE ALERT */}
      {showUrgentCoverage && urgentCoverage && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">🚨 URGENT: Coverage Needed NOW</h3>
                <p className="text-gray-700 mb-3">
                  <strong>{urgentCoverage.className}</strong> ({urgentCoverage.subject})
                </p>
                <div className="text-sm text-gray-600 space-y-1">
                  <div>📍 {urgentCoverage.room} • {urgentCoverage.students} students • Grade {urgentCoverage.grade}</div>
                  <div>👤 Covering for: {urgentCoverage.teacherName} ({urgentCoverage.department})</div>
                  <div>⏰ Starts in <span className="font-bold text-red-600">{urgentTimerText}</span></div>
                  <div>💰 Pay: <span className="font-bold text-green-600">${urgentCoverage.payAmount.toFixed(2)}</span></div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-3xl font-bold text-red-600 animate-pulse mb-2">{urgentTimerText}</div>
              <div className="text-xs text-gray-500 mb-4">until class starts</div>
              <button
                onClick={() => handleAcceptCoverage(urgentCoverage.id)}
                disabled={isSubmitting}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg shadow-lg disabled:opacity-50"
              >
                {isSubmitting ? 'ACCEPTING...' : '✓ ACCEPT NOW'}
              </button>
              <button
                onClick={() => setShowUrgentCoverage(false)}
                className="block w-full mt-2 text-sm text-gray-500 hover:text-gray-700"
              >
                Dismiss
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Tab Content */}
      {activeTab === 'overview' && (
        <>
          {/* Today's Coverage Alert */}
          {teacherData.todaysCoverage && (
            <div className="bg-blue-50 border border-blue-200 rounded-xl p-6">
              <div className="flex items-start space-x-4">
                <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center flex-shrink-0">
                  <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-900 mb-2">📅 Your Classes Today ({teacherData.todaysCoverage.date})</h3>
                  <p className="text-gray-700 mb-3">
                    Your classes are covered by <strong>{teacherData.todaysCoverage.substitute}</strong>
                  </p>
                  <div className="text-sm text-gray-600 space-y-1">
                    {teacherData.todaysCoverage.classes.map((cls, idx) => (
                      <div key={idx}>
                        • Period {cls.period}: {cls.name} {cls.room && `(${cls.room})`}
                        {cls.substituteName && <span className="text-blue-600 ml-2">→ {cls.substituteName}</span>}
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          )}

          {/* Earnings Tracker */}
          <div className="bg-gradient-to-r from-purple-50 to-indigo-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-6">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">💰 My Coverage Earnings</h3>
                <p className="text-gray-600 text-sm">Compensation for covering other teachers&apos; classes</p>
              </div>
              <button
                onClick={handleExportForTaxes}
                disabled={coverageLog.length === 0}
                className="px-4 py-2 bg-white border border-purple-300 text-purple-700 rounded-lg hover:bg-purple-50 transition-colors text-sm font-medium disabled:opacity-50"
              >
                📊 Export for Taxes
              </button>
            </div>

            <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-purple-600">${teacherData.monthlyEarnings.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Total Earnings</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-gray-900">{teacherData.hoursThisMonth}</div>
                <div className="text-sm text-gray-600">Hours Worked</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-yellow-600">${teacherData.pendingApproval.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Pending</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-blue-600">${teacherData.verifiedAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Verified</div>
              </div>
              <div className="bg-white rounded-lg p-4 text-center shadow-sm">
                <div className="text-2xl font-bold text-green-600">${teacherData.paidAmount.toFixed(2)}</div>
                <div className="text-sm text-gray-600">Paid</div>
              </div>
            </div>

            <div className="mt-4 pt-4 border-t border-purple-200 flex justify-between items-center text-sm">
              <span className="text-gray-600">{teacherData.totalJobs} total coverage assignments</span>
            </div>
          </div>

          {/* Available Coverage Opportunities */}
          {availableCoverage.length > 0 && (
            <div className="bg-green-50 border border-green-200 rounded-xl p-6">
              <h3 className="text-lg font-semibold text-gray-900 mb-4">🎯 Available Coverage Opportunities</h3>
              <div className="space-y-3">
                {availableCoverage.slice(0, 5).map((coverage) => (
                  <div key={coverage.id} className="bg-white rounded-lg p-4 flex items-center justify-between shadow-sm">
                    <div className="flex-1">
                      <div className="flex items-center gap-2">
                        <span className="font-medium text-gray-900">{coverage.className}</span>
                        {coverage.urgent && (
                          <span className="px-2 py-0.5 bg-red-100 text-red-700 text-xs rounded-full font-medium">
                            URGENT
                          </span>
                        )}
                      </div>
                      <div className="text-sm text-gray-600 mt-1">
                        {coverage.date} • {coverage.room} • {coverage.department}
                      </div>
                      <div className="text-sm text-gray-500">
                        Covering for: {coverage.teacherName} • {coverage.students} students • Grade {coverage.grade}
                      </div>
                    </div>
                    <div className="text-right ml-4">
                      <div className="font-bold text-green-600 text-lg">${coverage.payAmount.toFixed(2)}</div>
                      <button
                        onClick={() => handleAcceptCoverage(coverage.id)}
                        disabled={isSubmitting}
                        className="mt-2 px-4 py-2 bg-green-600 text-white text-sm rounded-lg hover:bg-green-700 disabled:opacity-50 transition-colors"
                      >
                        Accept
                      </button>
                    </div>
                  </div>
                ))}
              </div>
              {availableCoverage.length > 5 && (
                <button className="mt-4 text-green-600 hover:text-green-700 text-sm font-medium">
                  View All {availableCoverage.length} Opportunities →
                </button>
              )}
            </div>
          )}

          {/* Request Time Off Form */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">📝 Request Time Off</h2>
              <p className="text-sm text-gray-600 mt-1">Submit a request for admin approval. Coverage will be arranged automatically.</p>
            </div>
            <div className="p-6">
              <form className="space-y-6" onSubmit={handleTimeOffSubmit}>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">Start Date *</label>
                    <input 
                      type="date" 
                      name="startDate"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-2">End Date *</label>
                    <input 
                      type="date" 
                      name="endDate"
                      required
                      min={new Date().toISOString().split('T')[0]}
                      className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                  <select 
                    name="reason"
                    required
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                  >
                    <option value="">Select a reason...</option>
                    <option value="Personal">Personal Day</option>
                    <option value="Medical">Medical</option>
                    <option value="Family Emergency">Family Emergency</option>
                    <option value="Professional Development">Professional Development</option>
                    <option value="Jury Duty">Jury Duty</option>
                    <option value="Bereavement">Bereavement</option>
                    <option value="Other">Other</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea 
                    name="notes"
                    rows={3} 
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                    placeholder="Additional details for admin..."
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Plan Link (Optional)</label>
                  <input 
                    type="url" 
                    name="lessonPlanUrl"
                    placeholder="https://drive.google.com/..."
                    className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-purple-500 focus:border-transparent" 
                  />
                  <p className="text-xs text-gray-500 mt-1">Share a link to your lesson plans for the substitute</p>
                </div>

                <button 
                  type="submit" 
                  disabled={isSubmitting}
                  className="w-full bg-purple-600 text-white py-3 px-6 rounded-lg hover:bg-purple-700 transition-colors font-medium disabled:opacity-50"
                >
                  {isSubmitting ? 'Submitting...' : 'Submit Time Off Request'}
                </button>
              </form>
            </div>
          </div>

          {/* My Requests Table */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
            <div className="px-6 py-4 border-b border-gray-200">
              <h2 className="text-xl font-semibold text-gray-900">📋 My Time Off Requests</h2>
            </div>
            {myRequests.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📅</div>
                No time-off requests yet. Use the form above to submit one.
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Dates</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Reason</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Substitute</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {myRequests.map((request) => (
                      <tr key={request.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{request.startDate}</div>
                          {request.endDate !== request.startDate && (
                            <div className="text-sm text-gray-500">to {request.endDate}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="text-gray-900">{request.reason}</div>
                          {request.notes && (
                            <div className="text-sm text-gray-500 truncate max-w-[200px]">{request.notes}</div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            request.status === 'approved' 
                              ? 'bg-green-100 text-green-800' 
                              : request.status === 'pending'
                              ? 'bg-yellow-100 text-yellow-800'
                              : request.status === 'cancelled'
                              ? 'bg-gray-100 text-gray-800'
                              : 'bg-red-100 text-red-800'
                          }`}>
                            {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          {request.substitute ? (
                            <div className="font-medium text-gray-900">{request.substitute}</div>
                          ) : (
                            <div className="text-gray-400">
                              {request.status === 'approved' ? 'Being assigned...' : '-'}
                            </div>
                          )}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                          {request.status === 'pending' && (
                            <button 
                              onClick={() => handleCancelRequest(request.id)}
                              disabled={isSubmitting}
                              className="text-red-600 hover:text-red-900 disabled:opacity-50"
                            >
                              Cancel
                            </button>
                          )}
                          {request.lessonPlanUrl && request.lessonPlanUrl !== 'N/A' && (
                            <a 
                              href={request.lessonPlanUrl}
                              target="_blank"
                              rel="noopener noreferrer"
                              className="text-blue-600 hover:text-blue-900 ml-3"
                            >
                              Lesson Plan
                            </a>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* My Coverage Log */}
          <div className="bg-white rounded-xl shadow-sm border border-gray-200">
            <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-xl font-semibold text-gray-900">📊 My Coverage History</h2>
                <p className="text-sm text-gray-600 mt-1">Classes you&apos;ve covered for other teachers</p>
              </div>
              <button
                onClick={refreshCoverageLog}
                className="text-sm text-purple-600 hover:text-purple-700"
              >
                ↻ Refresh
              </button>
            </div>

            {coverageLog.length === 0 ? (
              <div className="p-8 text-center text-gray-500">
                <div className="text-4xl mb-2">📚</div>
                No coverage assignments yet. Accept opportunities above to start earning!
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Duration</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Payment</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {coverageLog.map((log) => (
                      <tr key={log.id} className="hover:bg-gray-50">
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-medium text-gray-900">{log.date}</div>
                          <div className="text-sm text-gray-500">{log.weekday}</div>
                        </td>
                        <td className="px-6 py-4">
                          <div className="font-medium text-gray-900">{log.course}</div>
                          <div className="text-sm text-gray-500">
                            For: {log.teacher} {log.periods && `• ${log.periods}`}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap text-gray-900">
                          {log.duration}
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                            log.status === 'paid' 
                              ? 'bg-green-100 text-green-800'
                              : log.status === 'verified'
                              ? 'bg-blue-100 text-blue-800'
                              : 'bg-yellow-100 text-yellow-800'
                          }`}>
                            {log.status === 'paid' ? '✓ Paid' : log.status === 'verified' ? '✓ Verified' : '⏳ Pending'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="font-semibold text-gray-900">${log.amount.toFixed(2)}</div>
                          {log.rate > 0 && <div className="text-sm text-gray-500">${log.rate}/hr</div>}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </>
      )}

      {/* Schedule Tab */}
      {activeTab === 'schedule' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">📚 My Teaching Schedule</h2>
            <p className="text-sm text-gray-600 mt-1">Your regular class assignments</p>
          </div>
          {teacherData.schedule.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">📅</div>
              No schedule data available. Contact admin if this seems incorrect.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Period</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Class</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Subject</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Room</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Grade</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Students</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teacherData.schedule.map((item) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-6 py-4 whitespace-nowrap font-medium text-gray-900">
                        Period {item.period}
                      </td>
                      <td className="px-6 py-4 font-medium text-gray-900">{item.className}</td>
                      <td className="px-6 py-4 text-gray-600">{item.subject}</td>
                      <td className="px-6 py-4 text-gray-600">{item.room}</td>
                      <td className="px-6 py-4 text-gray-600">{item.grade}</td>
                      <td className="px-6 py-4 text-gray-600">{item.students}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* Rotation Tab */}
      {activeTab === 'rotation' && (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200">
          <div className="px-6 py-4 border-b border-gray-200">
            <h2 className="text-xl font-semibold text-gray-900">🔄 Coverage Rotation List</h2>
            <p className="text-sm text-gray-600 mt-1">Teachers at your school ordered by coverage priority</p>
          </div>
          {teacherData.rotationList.length === 0 ? (
            <div className="p-8 text-center text-gray-500">
              <div className="text-4xl mb-2">👥</div>
              No rotation data available.
            </div>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Position</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Name</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Department</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Days Since Last</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Hours This Month</th>
                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {teacherData.rotationList.map((member) => (
                    <tr 
                      key={member.id} 
                      className={member.isMe ? 'bg-purple-50' : 'hover:bg-gray-50'}
                    >
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center justify-center w-8 h-8 rounded-full font-bold ${
                          member.position === 1 ? 'bg-yellow-100 text-yellow-800' :
                          member.position <= 3 ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.position}
                        </span>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <div className="flex items-center">
                          <span className="font-medium text-gray-900">{member.name}</span>
                          {member.isMe && (
                            <span className="ml-2 px-2 py-0.5 bg-purple-100 text-purple-700 text-xs rounded-full">
                              You
                            </span>
                          )}
                        </div>
                      </td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-600">{member.department}</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.daysSinceLast} days</td>
                      <td className="px-6 py-4 whitespace-nowrap text-gray-900">{member.hoursThisMonth} hrs</td>
                      <td className="px-6 py-4 whitespace-nowrap">
                        <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                          member.status === 'busy' ? 'bg-red-100 text-red-800' :
                          member.status === 'free' ? 'bg-green-100 text-green-800' :
                          'bg-gray-100 text-gray-800'
                        }`}>
                          {member.status || 'Available'}
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

      {/* Toast Container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 transform transition-all duration-300 max-w-sm ${
              t.type === 'success' ? 'bg-green-500' : 'bg-red-500'
            }`}
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
            <div className="font-medium flex-1">{t.message}</div>
            <button
              onClick={() => setToasts((x) => x.filter((y) => y.id !== t.id))}
              className="flex-shrink-0"
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        ))}
      </div>
    </div>
  );
}

// ==================== HELPER FUNCTIONS ====================

function formatDate(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' });
  } catch {
    return dateStr;
  }
}

function getWeekday(dateStr: string): string {
  if (!dateStr) return '';
  try {
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'long' });
  } catch {
    return '';
  }
}
