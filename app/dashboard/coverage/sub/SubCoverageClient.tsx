'use client';

import React, { useEffect, useState, useMemo, useCallback } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type SubData = {
  email: string;
  fullName: string;
  employeeId: string;
  schoolCode: string;
  districtCode: string;
};

type Job = {
  id: string;
  title: string;
  school: string;
  school_name: string;
  type: 'full-day' | 'half-day' | 'period';
  date: string;
  startTime: string | number;
  endTime: string | number;
  teacher: string;
  room: string;
  pay: number;
  urgent: boolean;
  subject: string;
  grade: string;
  class_id: string;
  reason?: string;
  notes?: string;
};

type Assignment = {
  id: number;
  date: string;
  school: string;
  school_name: string;
  class_name: string;
  room: string;
  start_time: string | number;
  end_time: string | number;
  pay: number;
  displayStatus: 'upcoming' | 'completed' | 'current';
  teacher_name?: string;
  department?: string;
  status?: string;
};

type Earnings = {
  today: number;
  week: number;
  month: number;
  yearToDate: number;
  schoolBreakdown: Record<string, number>;
  totalJobs: number;
  recentLogs?: { id: number; date: string; school: string; class_name: string; amount: number; status: string }[];
};

const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:aeQ3kHz2';

const CALL_OUT_REASONS = [
  { id: 'illness', label: 'Personal Illness', icon: '🤒' },
  { id: 'family_emergency', label: 'Family Emergency', icon: '👨‍👩‍👧' },
  { id: 'car_trouble', label: 'Car Trouble / Transportation', icon: '🚗' },
  { id: 'weather', label: 'Weather Conditions', icon: '🌧️' },
  { id: 'schedule_conflict', label: 'Schedule Conflict', icon: '📅' },
  { id: 'other', label: 'Other', icon: '📝' },
];

export default function SubCoverageClient({ subData }: { subData: SubData }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [subjects, setSubjects] = useState<string[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  
  // Data from API
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<Job[]>([]);
  const [myAssignments, setMyAssignments] = useState<{ upcoming: Assignment[]; current: Assignment[]; completed: Assignment[] }>({ upcoming: [], current: [], completed: [] });
  const [earnings, setEarnings] = useState<Earnings>({ today: 0, week: 0, month: 0, yearToDate: 0, schoolBreakdown: {}, totalJobs: 0, recentLogs: [] });
  const [loading, setLoading] = useState(true);
  
  // Modal states
  const [showUrgentJob, setShowUrgentJob] = useState(true);
  const [showCallOutModal, setShowCallOutModal] = useState(false);
  const [callOutJob, setCallOutJob] = useState<Assignment | null>(null);
  const [callOutReason, setCallOutReason] = useState('');
  const [callOutNotes, setCallOutNotes] = useState('');
  const [callOutSubmitting, setCallOutSubmitting] = useState(false);
  
  // Stat card modals
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  
  const currentUrgentJob = urgentJobs[0];

  // Countdown timer for urgent job
  const [urgentMM, setUrgentMM] = useState(45);
  const [urgentSS, setUrgentSS] = useState(0);
  
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
    return urgentMM <= 0 && urgentSS <= 0 ? 'EXPIRED' : `${mm}:${ss}`;
  }, [urgentMM, urgentSS]);

  // Toast helpers
  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }

  // Fetch subjects for filtering
  const fetchSubjects = useCallback(async () => {
    try {
      const response = await fetch(`${XANO_BASE}/coverage/subjects?school=${subData.schoolCode}`);
      const data = await response.json();
      if (data.subjects) {
        setSubjects(data.subjects);
      }
    } catch (e) {
      console.error('Failed to fetch subjects:', e);
    }
  }, [subData.schoolCode]);

  // Fetch available jobs
  const fetchJobs = useCallback(async () => {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/available-jobs?school=${subData.schoolCode}`);
      const data = await response.json();
      if (data.available) {
        setAvailableJobs(data.available);
      }
      if (data.urgent) {
        setUrgentJobs(data.urgent);
      }
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
    }
  }, [subData.schoolCode]);

  // Fetch earnings
  const fetchEarnings = useCallback(async () => {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/my-earnings?substitute_id=${subData.employeeId}`);
      const data = await response.json();
      if (data) {
        setEarnings({
          today: data.today || 0,
          week: data.week || 0,
          month: data.month || 0,
          yearToDate: data.yearToDate || 0,
          schoolBreakdown: data.schoolBreakdown || {},
          totalJobs: data.totalJobs || 0,
          recentLogs: data.recentLogs || [],
        });
      }
    } catch (e) {
      console.error('Failed to fetch earnings:', e);
    }
  }, [subData.employeeId]);

  // Fetch assignments with time-based status
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/my-assignments?substitute_id=${subData.employeeId}`);
      const data = await response.json();
      if (data) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        // Re-categorize based on actual time
        const allAssignments = [...(data.upcoming || []), ...(data.current || []), ...(data.completed || [])];
        
        const upcoming: Assignment[] = [];
        const current: Assignment[] = [];
        const completed: Assignment[] = [];
        
        for (const a of allAssignments) {
          // Parse end time
          let endHour = 15, endMinute = 30; // Default 3:30 PM
          if (typeof a.end_time === 'number') {
            const endDate = new Date(a.end_time);
            endHour = endDate.getHours();
            endMinute = endDate.getMinutes();
          } else if (typeof a.end_time === 'string') {
            const match = a.end_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (match) {
              endHour = parseInt(match[1]);
              if (match[3]?.toUpperCase() === 'PM' && endHour !== 12) endHour += 12;
              if (match[3]?.toUpperCase() === 'AM' && endHour === 12) endHour = 0;
              endMinute = parseInt(match[2]);
            }
          }
          
          // Parse start time similarly
          let startHour = 8, startMinute = 0;
          if (typeof a.start_time === 'number') {
            const startDate = new Date(a.start_time);
            startHour = startDate.getHours();
            startMinute = startDate.getMinutes();
          } else if (typeof a.start_time === 'string') {
            const match = a.start_time.match(/(\d+):(\d+)\s*(AM|PM)?/i);
            if (match) {
              startHour = parseInt(match[1]);
              if (match[3]?.toUpperCase() === 'PM' && startHour !== 12) startHour += 12;
              if (match[3]?.toUpperCase() === 'AM' && startHour === 12) startHour = 0;
              startMinute = parseInt(match[2]);
            }
          }
          
          const assignment = { ...a };
          
          if (a.date < today) {
            // Past date = completed
            assignment.displayStatus = 'completed';
            completed.push(assignment);
          } else if (a.date > today) {
            // Future date = upcoming
            assignment.displayStatus = 'upcoming';
            upcoming.push(assignment);
          } else {
            // Today - check time
            const currentTimeMinutes = currentHour * 60 + currentMinute;
            const startTimeMinutes = startHour * 60 + startMinute;
            const endTimeMinutes = endHour * 60 + endMinute;
            
            if (currentTimeMinutes >= endTimeMinutes) {
              // Class has ended
              assignment.displayStatus = 'completed';
              completed.push(assignment);
            } else if (currentTimeMinutes >= startTimeMinutes) {
              // Currently in progress
              assignment.displayStatus = 'current';
              current.push(assignment);
            } else {
              // Hasn't started yet
              assignment.displayStatus = 'upcoming';
              upcoming.push(assignment);
            }
          }
        }
        
        // Sort upcoming by date ascending
        upcoming.sort((a, b) => a.date.localeCompare(b.date));
        
        setMyAssignments({ upcoming, current, completed });
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    }
  }, [subData.employeeId]);

  // Initial data load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchEarnings(), fetchAssignments(), fetchSubjects()]);
      setLoading(false);
    }
    loadData();
  }, [fetchJobs, fetchEarnings, fetchAssignments, fetchSubjects]);

  // Accept job handler
  async function handleAcceptJob(jobId: string, isUrgent = false) {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/accept-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: parseInt(jobId),
          substitute_id: subData.employeeId,
          substitute_name: subData.fullName,
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        setAcceptedJobs(prev => new Set(prev).add(jobId));
        if (isUrgent) {
          setShowUrgentJob(false);
          setUrgentJobs(prev => prev.filter(j => j.id !== jobId));
        } else {
          setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
        }
        pushToast(`✓ Job accepted! ${result.assignment?.class_name || 'Assignment'} confirmed.`, 'success');
        
        // Refresh data
        fetchAssignments();
        fetchEarnings();
      } else {
        pushToast(result.message || 'Failed to accept job', 'error');
      }
    } catch (e) {
      pushToast('Failed to accept job. Please try again.', 'error');
    }
  }

  // Call out handler
  async function handleCallOut() {
    if (!callOutJob || !callOutReason) return;
    
    setCallOutSubmitting(true);
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/call-out`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: callOutJob.id,
          substitute_id: subData.employeeId,
          reason: CALL_OUT_REASONS.find(r => r.id === callOutReason)?.label || callOutReason,
          notes: callOutNotes.trim() || 'N/A',
        }),
      });
      
      const result = await response.json();
      
      if (result.success) {
        pushToast('Call out recorded. The job is now available for other substitutes.', 'success');
        setShowCallOutModal(false);
        setCallOutJob(null);
        setCallOutReason('');
        setCallOutNotes('');
        
        // Refresh data
        fetchAssignments();
        fetchJobs();
      } else {
        pushToast(result.message || 'Failed to submit call out', 'error');
      }
    } catch (e) {
      pushToast('Failed to submit call out. Please try again.', 'error');
    } finally {
      setCallOutSubmitting(false);
    }
  }

  // W-2 PDF Export
  function handleExportW2() {
    pushToast('Generating W-2 ready export...', 'success');
    
    // Create PDF content
    const pdfContent = `
SUBSTITUTE TEACHER EARNINGS REPORT
==================================
Generated: ${new Date().toLocaleDateString()}

PERSONAL INFORMATION
--------------------
Name: ${subData.fullName}
Employee ID: ${subData.employeeId}
Email: ${subData.email}

EARNINGS SUMMARY
----------------
Today:          $${earnings.today.toFixed(2)}
This Week:      $${earnings.week.toFixed(2)}
This Month:     $${earnings.month.toFixed(2)}
Year to Date:   $${earnings.yearToDate.toFixed(2)}

BREAKDOWN BY SCHOOL
-------------------
${Object.entries(earnings.schoolBreakdown).map(([school, amount]) => 
  `${school}: $${amount.toFixed(2)}`
).join('\n') || 'No breakdown available'}

TOTAL JOBS COMPLETED: ${earnings.totalJobs}

RECENT ASSIGNMENTS
------------------
${(earnings.recentLogs || []).slice(0, 10).map(log => 
  `${log.date} - ${log.class_name} at ${log.school}: $${log.amount?.toFixed(2) || '0.00'} (${log.status})`
).join('\n') || 'No recent assignments'}

---
This document is for tax preparation purposes.
Please consult with a tax professional for official W-2 filing.
    `.trim();

    // Create and download file
    const blob = new Blob([pdfContent], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `W2_Earnings_${subData.employeeId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    
    setTimeout(() => {
      pushToast('Earnings export downloaded!', 'success');
    }, 500);
  }

  // Format time display
  function formatTime(time: string | number): string {
    if (typeof time === 'number') {
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return time;
  }

  // Filter jobs based on selected filters
  const filteredJobs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return availableJobs.filter(job => {
      if (acceptedJobs.has(job.id)) return false;
      
      // Time filter
      const jobDate = job.date;
      let passesTimeFilter = true;
      switch (filter) {
        case 'today':
          passesTimeFilter = jobDate === today;
          break;
        case 'week':
          passesTimeFilter = jobDate <= weekFromNow;
          break;
      }
      
      // Subject filter
      let passesSubjectFilter = true;
      if (subjectFilter !== 'all') {
        passesSubjectFilter = job.subject === subjectFilter || job.subject?.toLowerCase() === subjectFilter.toLowerCase();
      }
      
      return passesTimeFilter && passesSubjectFilter;
    });
  }, [filter, subjectFilter, availableJobs, acceptedJobs]);

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
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">Available Jobs</h1>
        <p className="text-gray-600 mt-1">Find and accept substitute teaching opportunities</p>
      </div>

      {/* Earnings Tracker */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Earnings Tracker</h3>
            <p className="text-gray-600">Track your substitute teaching income</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${earnings.today.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${earnings.week.toFixed(2)}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${earnings.month.toFixed(2)}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${earnings.yearToDate.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Year to Date</div>
          </div>
        </div>

        <div className="border-t border-purple-200 pt-4 flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Breakdown by School:</span>
            <span className="ml-2 text-gray-900">
              {Object.keys(earnings.schoolBreakdown).length > 0 
                ? Object.entries(earnings.schoolBreakdown).map(([school, amount]) => 
                    `${school}: $${amount}`
                  ).join(' • ')
                : 'No earnings yet'}
            </span>
          </div>
          <button onClick={handleExportW2} className="text-purple-600 hover:text-purple-700 font-medium flex items-center space-x-1">
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
            </svg>
            <span>Export W-2 Ready →</span>
          </button>
        </div>
      </div>

      {/* Urgent Job Alert */}
      {showUrgentJob && currentUrgentJob && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">🚨 Urgent: Last Minute Coverage Needed</h3>
              <p className="text-gray-700 mb-4">
                {currentUrgentJob.title} - {currentUrgentJob.subject} at {currentUrgentJob.school_name}
              </p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Room:</span> {currentUrgentJob.room}
                </div>
                <div>
                  <span className="font-medium">Date:</span> {currentUrgentJob.date}
                </div>
                <div>
                  <span className="font-medium">Grade:</span> {currentUrgentJob.grade}
                </div>
                <div>
                  <span className="font-medium">Pay:</span> ${currentUrgentJob.pay.toFixed(2)}
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => handleAcceptJob(currentUrgentJob.id, true)}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Accept Job (${currentUrgentJob.pay.toFixed(2)})
                </button>
                <button 
                  onClick={() => {
                    setShowUrgentJob(false);
                    if (urgentJobs.length > 1) {
                      setUrgentJobs(prev => prev.slice(1));
                      setShowUrgentJob(true);
                    }
                  }}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Decline
                </button>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600 animate-pulse">{urgentTimerText}</div>
              <div className="text-xs text-gray-500">until start</div>
            </div>
          </div>
        </div>
      )}

      {/* Job Filters */}
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex flex-wrap items-center gap-3">
          {/* Time Filter */}
          <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
            {(['today', 'week', 'all'] as const).map((key) => (
              <button
                key={key}
                onClick={() => setFilter(key)}
                className={`px-4 py-2 text-sm font-medium rounded-md transition-colors ${
                  filter === key
                    ? 'bg-white text-gray-900 shadow-sm'
                    : 'text-gray-600 hover:text-gray-900'
                }`}
              >
                {key === 'today' ? 'Today' : key === 'week' ? 'This Week' : 'All Available'}
              </button>
            ))}
          </div>
          
          {/* Subject Filter */}
          <select
            value={subjectFilter}
            onChange={(e) => setSubjectFilter(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-purple-500 focus:border-purple-500"
          >
            <option value="all">All Subjects</option>
            {subjects.map(subject => (
              <option key={subject} value={subject}>{subject}</option>
            ))}
          </select>
        </div>
        
        <button
          onClick={() => { fetchJobs(); pushToast('Jobs refreshed!', 'success'); }}
          className="px-3 py-2 text-sm text-gray-600 hover:text-gray-900 flex items-center space-x-1"
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
          </svg>
          <span>Refresh</span>
        </button>
      </div>

      {/* Available Jobs Grid */}
      {filteredJobs.length === 0 ? (
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-12 text-center">
          <div className="text-4xl mb-4">📭</div>
          <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Available</h3>
          <p className="text-gray-600">
            {filter === 'today' 
              ? 'No coverage opportunities for today. Try checking "This Week" or "All Available".'
              : subjectFilter !== 'all'
              ? `No ${subjectFilter} jobs available. Try selecting "All Subjects".`
              : 'Check back later for new coverage opportunities.'}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {filteredJobs.map((job) => (
            <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-4">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                  <p className="text-gray-600">{job.school_name}</p>
                </div>
                <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                  job.type === 'full-day' 
                    ? 'bg-blue-100 text-blue-800'
                    : job.type === 'half-day'
                    ? 'bg-yellow-100 text-yellow-800'
                    : 'bg-green-100 text-green-800'
                }`}>
                  {job.type === 'full-day' ? 'Full Day' : job.type === 'half-day' ? 'Half Day' : 'Period'}
                </span>
              </div>
              
              <div className="space-y-2 mb-4 text-sm text-gray-600">
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                  </svg>
                  {job.date}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                  {formatTime(job.startTime)} - {formatTime(job.endTime)}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                  </svg>
                  {job.teacher} • Room {job.room}
                </div>
                <div className="flex items-center">
                  <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                  </svg>
                  {job.subject} • Grade {job.grade}
                </div>
              </div>

              <div className="flex items-center justify-between pt-4 border-t border-gray-200">
                <div className="text-lg font-semibold text-gray-900">${job.pay.toFixed(2)}</div>
                <button
                  onClick={() => handleAcceptJob(job.id)}
                  disabled={acceptedJobs.has(job.id)}
                  className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                    acceptedJobs.has(job.id)
                      ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                      : 'bg-blue-600 text-white hover:bg-blue-700'
                  }`}
                >
                  {acceptedJobs.has(job.id) ? 'Accepted' : 'Accept Job'}
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* My Assignments with Call Out */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Assignments</h2>
        </div>
        <div className="p-6">
          {/* Current Assignments */}
          {myAssignments.current.length > 0 && (
            <div className="mb-6">
              <h3 className="font-medium text-green-700 mb-3 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2 animate-pulse"></span>
                Currently Active
              </h3>
              <div className="space-y-3">
                {myAssignments.current.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-green-50 rounded-lg border border-green-200">
                    <div>
                      <div className="font-medium text-gray-900">{assignment.class_name}</div>
                      <div className="text-sm text-gray-600">{assignment.school_name} • Room {assignment.room}</div>
                      <div className="text-xs text-gray-500">{formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${assignment.pay?.toFixed(2) || '0.00'}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Progress
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Assignments with Call Out */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Upcoming ({myAssignments.upcoming.length})</h3>
            {myAssignments.upcoming.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming assignments. Accept some jobs above!</p>
            ) : (
              <div className="space-y-3">
                {myAssignments.upcoming.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div className="flex-1">
                      <div className="font-medium text-gray-900">{assignment.class_name}</div>
                      <div className="text-sm text-gray-600">{assignment.school_name} • Room {assignment.room}</div>
                      <div className="text-xs text-gray-500">{assignment.date} • {formatTime(assignment.start_time)} - {formatTime(assignment.end_time)}</div>
                    </div>
                    <div className="flex items-center space-x-3">
                      <div className="text-right">
                        <div className="font-semibold text-gray-900">${assignment.pay?.toFixed(2) || '0.00'}</div>
                        <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                          Confirmed
                        </span>
                      </div>
                      <button
                        onClick={() => {
                          setCallOutJob(assignment);
                          setShowCallOutModal(true);
                        }}
                        className="px-3 py-1.5 text-xs text-red-600 hover:text-red-700 hover:bg-red-50 rounded-lg border border-red-200 font-medium transition-colors"
                      >
                        Call Out
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>

          {/* Recent Completed */}
          {myAssignments.completed.length > 0 && (
            <div>
              <h3 className="font-medium text-gray-500 mb-3">Recently Completed</h3>
              <div className="space-y-2">
                {myAssignments.completed.slice(0, 5).map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-700">{assignment.class_name}</div>
                      <div className="text-xs text-gray-500">{assignment.date} • {assignment.school_name}</div>
                    </div>
                    <div className="font-medium text-green-600">${assignment.pay?.toFixed(2) || '0.00'}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats - CLICKABLE */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <button
          onClick={() => setShowCompletedModal(true)}
          className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-gray-300 transition-all"
        >
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Jobs Completed</h3>
          <div className="text-3xl font-bold text-gray-900">{myAssignments.completed.length}</div>
          <div className="text-sm text-blue-600 mt-1">Click to view details →</div>
        </button>
        
        <button
          onClick={() => setShowAvailableModal(true)}
          className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-blue-300 transition-all"
        >
          <h3 className="text-sm font-medium text-gray-500 mb-2">Available Now</h3>
          <div className="text-3xl font-bold text-blue-600">{availableJobs.length + urgentJobs.length}</div>
          <div className="text-sm text-gray-600 mt-1">
            {urgentJobs.length > 0 && <span className="text-red-600">{urgentJobs.length} urgent</span>}
            {urgentJobs.length > 0 && availableJobs.length > 0 && ' • '}
            {availableJobs.length} regular
          </div>
          <div className="text-sm text-blue-600 mt-1">Click to browse all →</div>
        </button>
        
        <button
          onClick={() => setShowUpcomingModal(true)}
          className="text-left bg-white rounded-xl shadow-sm border border-gray-200 p-6 hover:shadow-md hover:border-purple-300 transition-all"
        >
          <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Assignments</h3>
          <div className="text-3xl font-bold text-purple-600">{myAssignments.upcoming.length}</div>
          <div className="text-sm text-gray-600 mt-1">
            {myAssignments.upcoming.length > 0 
              ? `Next: ${myAssignments.upcoming[0]?.date}` 
              : 'None scheduled'}
          </div>
          <div className="text-sm text-purple-600 mt-1">Click to view schedule →</div>
        </button>
      </div>

      {/* Call Out Modal */}
      {showCallOutModal && callOutJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="bg-red-50 px-6 py-4 border-b border-red-200">
              <h2 className="text-lg font-semibold text-gray-900">Call Out from Assignment</h2>
              <p className="text-sm text-gray-600">{callOutJob.class_name} on {callOutJob.date}</p>
            </div>
            
            <div className="p-6 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for calling out *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CALL_OUT_REASONS.map(reason => (
                    <button
                      key={reason.id}
                      onClick={() => setCallOutReason(reason.id)}
                      className={`p-3 rounded-lg border text-left transition-all ${
                        callOutReason === reason.id
                          ? 'border-red-500 bg-red-50 ring-2 ring-red-500'
                          : 'border-gray-200 hover:border-red-300'
                      }`}
                    >
                      <span className="text-lg mr-2">{reason.icon}</span>
                      <span className="text-sm font-medium">{reason.label}</span>
                    </button>
                  ))}
                </div>
              </div>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Additional Notes (Optional)</label>
                <textarea
                  value={callOutNotes}
                  onChange={(e) => setCallOutNotes(e.target.value)}
                  placeholder="Any additional information..."
                  rows={2}
                  className="w-full p-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-red-500"
                />
              </div>

              <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3 text-sm text-yellow-800">
                ⚠️ This will release the job back to the available pool. Other substitutes will be notified.
              </div>
            </div>
            
            <div className="px-6 py-4 border-t border-gray-200 flex justify-end space-x-3">
              <button
                onClick={() => {
                  setShowCallOutModal(false);
                  setCallOutJob(null);
                  setCallOutReason('');
                  setCallOutNotes('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg"
              >
                Cancel
              </button>
              <button
                onClick={handleCallOut}
                disabled={!callOutReason || callOutSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 font-medium"
              >
                {callOutSubmitting ? 'Submitting...' : 'Confirm Call Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Jobs Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-gray-50 px-6 py-4 border-b border-gray-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Completed Jobs</h2>
                <p className="text-sm text-gray-600">{myAssignments.completed.length} jobs completed</p>
              </div>
              <button onClick={() => setShowCompletedModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {myAssignments.completed.length === 0 ? (
                <p className="text-center text-gray-500 py-8">No completed jobs yet.</p>
              ) : (
                <div className="space-y-3">
                  {myAssignments.completed.map((job) => (
                    <div key={job.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{job.class_name}</div>
                          <div className="text-sm text-gray-600">{job.school_name} • Room {job.room}</div>
                          <div className="text-xs text-gray-500 mt-1">{job.date} • {formatTime(job.start_time)} - {formatTime(job.end_time)}</div>
                        </div>
                        <div className="text-right">
                          <div className="font-semibold text-green-600">${job.pay?.toFixed(2) || '0.00'}</div>
                          <span className="text-xs text-gray-500">Completed</span>
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

      {/* Available Jobs Modal */}
      {showAvailableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-3xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-blue-50 px-6 py-4 border-b border-blue-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">All Available Jobs</h2>
                <p className="text-sm text-gray-600">{availableJobs.length + urgentJobs.length} jobs available</p>
              </div>
              <button onClick={() => setShowAvailableModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            
            {/* Subject Filter in Modal */}
            <div className="px-6 py-3 border-b border-gray-200 flex flex-wrap gap-2">
              <span className="text-sm text-gray-600 py-1">Filter by subject:</span>
              <button
                onClick={() => setSubjectFilter('all')}
                className={`px-3 py-1 rounded-full text-xs font-medium ${subjectFilter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600'}`}
              >
                All
              </button>
              {subjects.slice(0, 8).map(subject => (
                <button
                  key={subject}
                  onClick={() => setSubjectFilter(subject)}
                  className={`px-3 py-1 rounded-full text-xs font-medium ${subjectFilter === subject ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-600 hover:bg-gray-200'}`}
                >
                  {subject}
                </button>
              ))}
            </div>
            
            <div className="flex-1 overflow-auto p-6">
              {/* Urgent Jobs */}
              {urgentJobs.length > 0 && (
                <div className="mb-6">
                  <h3 className="font-medium text-red-700 mb-3">🚨 Urgent ({urgentJobs.length})</h3>
                  <div className="space-y-3">
                    {urgentJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-red-50 rounded-lg border border-red-200 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-600">{job.school_name} • {job.subject} • Grade {job.grade}</div>
                          <div className="text-xs text-gray-500">{job.date} • {formatTime(job.startTime)} - {formatTime(job.endTime)}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-semibold text-gray-900">${job.pay.toFixed(2)}</div>
                          <button
                            onClick={() => { handleAcceptJob(job.id, true); setShowAvailableModal(false); }}
                            className="px-3 py-1.5 bg-green-600 text-white rounded-lg text-sm font-medium hover:bg-green-700"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              
              {/* Regular Jobs */}
              <div>
                <h3 className="font-medium text-gray-700 mb-3">Available Jobs ({filteredJobs.length})</h3>
                {filteredJobs.length === 0 ? (
                  <p className="text-center text-gray-500 py-8">No jobs match your filter.</p>
                ) : (
                  <div className="space-y-3">
                    {filteredJobs.map((job) => (
                      <div key={job.id} className="p-4 bg-gray-50 rounded-lg border border-gray-200 flex justify-between items-center">
                        <div>
                          <div className="font-medium text-gray-900">{job.title}</div>
                          <div className="text-sm text-gray-600">{job.school_name} • {job.subject} • Grade {job.grade}</div>
                          <div className="text-xs text-gray-500">{job.date} • {formatTime(job.startTime)} - {formatTime(job.endTime)}</div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <div className="text-lg font-semibold text-gray-900">${job.pay.toFixed(2)}</div>
                          <button
                            onClick={() => { handleAcceptJob(job.id); setShowAvailableModal(false); }}
                            className="px-3 py-1.5 bg-blue-600 text-white rounded-lg text-sm font-medium hover:bg-blue-700"
                          >
                            Accept
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Assignments Modal */}
      {showUpcomingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="bg-purple-50 px-6 py-4 border-b border-purple-200 flex items-center justify-between">
              <div>
                <h2 className="text-lg font-semibold text-gray-900">Upcoming Assignments</h2>
                <p className="text-sm text-gray-600">{myAssignments.upcoming.length} scheduled</p>
              </div>
              <button onClick={() => setShowUpcomingModal(false)} className="text-gray-500 hover:text-gray-700">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
              </button>
            </div>
            <div className="flex-1 overflow-auto p-6">
              {myAssignments.upcoming.length === 0 ? (
                <div className="text-center py-8">
                  <div className="text-4xl mb-4">📅</div>
                  <p className="text-gray-500">No upcoming assignments.</p>
                  <p className="text-sm text-gray-400 mt-1">Accept some jobs to fill your schedule!</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {myAssignments.upcoming.map((job) => (
                    <div key={job.id} className="p-4 bg-purple-50 rounded-lg border border-purple-200">
                      <div className="flex justify-between items-start">
                        <div>
                          <div className="font-medium text-gray-900">{job.class_name}</div>
                          <div className="text-sm text-gray-600">{job.school_name} • Room {job.room}</div>
                          <div className="text-xs text-gray-500 mt-1">{job.date} • {formatTime(job.start_time)} - {formatTime(job.end_time)}</div>
                        </div>
                        <div className="text-right flex flex-col items-end space-y-2">
                          <div className="font-semibold text-gray-900">${job.pay?.toFixed(2) || '0.00'}</div>
                          <button
                            onClick={() => {
                              setCallOutJob(job);
                              setShowUpcomingModal(false);
                              setShowCallOutModal(true);
                            }}
                            className="text-xs text-red-600 hover:text-red-700"
                          >
                            Call Out
                          </button>
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
            className={`text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 transform transition-transform duration-300 max-w-sm ${
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
    </div>
  );
}
