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
  start_time: string;
  end_time: string;
  pay: number;
  displayStatus: 'upcoming' | 'completed' | 'current';
  teacher_name?: string;
  department?: string;
};

type Earnings = {
  today: number;
  week: number;
  month: number;
  yearToDate: number;
  schoolBreakdown: Record<string, number>;
  totalJobs: number;
};

const XANO_BASE = 'https://x8ki-letl-twmt.n7.xano.io/api:aeQ3kHz2';

export default function SubCoverageClient({ subData }: { subData: SubData }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('all');
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  
  // Data from API
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<Job[]>([]);
  const [myAssignments, setMyAssignments] = useState<{ upcoming: Assignment[]; current: Assignment[]; completed: Assignment[] }>({ upcoming: [], current: [], completed: [] });
  const [earnings, setEarnings] = useState<Earnings>({ today: 0, week: 0, month: 0, yearToDate: 0, schoolBreakdown: {}, totalJobs: 0 });
  const [loading, setLoading] = useState(true);
  
  // Show first urgent job
  const [showUrgentJob, setShowUrgentJob] = useState(true);
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
        });
      }
    } catch (e) {
      console.error('Failed to fetch earnings:', e);
    }
  }, [subData.employeeId]);

  // Fetch assignments
  const fetchAssignments = useCallback(async () => {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/my-assignments?substitute_id=${subData.employeeId}`);
      const data = await response.json();
      if (data) {
        setMyAssignments({
          upcoming: data.upcoming || [],
          current: data.current || [],
          completed: data.completed || [],
        });
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    }
  }, [subData.employeeId]);

  // Initial data load
  useEffect(() => {
    async function loadData() {
      setLoading(true);
      await Promise.all([fetchJobs(), fetchEarnings(), fetchAssignments()]);
      setLoading(false);
    }
    loadData();
  }, [fetchJobs, fetchEarnings, fetchAssignments]);

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

  function handleExportW2() {
    pushToast('Generating W-2 ready export...', 'success');
    setTimeout(() => {
      pushToast('Earnings export ready for tax filing!', 'success');
    }, 1500);
  }

  // Format time display
  function formatTime(time: string | number): string {
    if (typeof time === 'number') {
      // Unix timestamp
      const date = new Date(time);
      return date.toLocaleTimeString('en-US', { hour: 'numeric', minute: '2-digit', hour12: true });
    }
    return time;
  }

  // Filter jobs based on selected filter
  const filteredJobs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return availableJobs.filter(job => {
      if (acceptedJobs.has(job.id)) return false;
      
      const jobDate = job.date;
      
      switch (filter) {
        case 'today':
          return jobDate === today;
        case 'week':
          return jobDate <= weekFromNow;
        case 'all':
        default:
          return true;
      }
    });
  }, [filter, availableJobs, acceptedJobs]);

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
          <button onClick={handleExportW2} className="text-purple-600 hover:text-purple-700 font-medium">
            Export W-2 Ready →
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
      <div className="flex items-center justify-between">
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
                <div className="flex gap-2">
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
            </div>
          ))}
        </div>
      )}

      {/* My Assignments */}
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
                      <div className="text-xs text-gray-500">{assignment.start_time} - {assignment.end_time}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${assignment.pay.toFixed(2)}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-green-100 text-green-800">
                        In Progress
                      </span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Upcoming Assignments */}
          <div className="mb-6">
            <h3 className="font-medium text-gray-900 mb-3">Upcoming ({myAssignments.upcoming.length})</h3>
            {myAssignments.upcoming.length === 0 ? (
              <p className="text-gray-500 text-sm">No upcoming assignments. Accept some jobs above!</p>
            ) : (
              <div className="space-y-3">
                {myAssignments.upcoming.map((assignment) => (
                  <div key={assignment.id} className="flex items-center justify-between p-4 bg-blue-50 rounded-lg border border-blue-200">
                    <div>
                      <div className="font-medium text-gray-900">{assignment.class_name}</div>
                      <div className="text-sm text-gray-600">{assignment.school_name} • Room {assignment.room}</div>
                      <div className="text-xs text-gray-500">{assignment.date} • {assignment.start_time} - {assignment.end_time}</div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-gray-900">${assignment.pay.toFixed(2)}</div>
                      <span className="inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800">
                        Confirmed
                      </span>
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
                    <div className="font-medium text-green-600">${assignment.pay.toFixed(2)}</div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Total Jobs Completed</h3>
          <div className="text-3xl font-bold text-gray-900">{earnings.totalJobs}</div>
          <div className="text-sm text-green-600 mt-1">Keep up the great work!</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Available Now</h3>
          <div className="text-3xl font-bold text-blue-600">{availableJobs.length + urgentJobs.length}</div>
          <div className="text-sm text-gray-600 mt-1">
            {urgentJobs.length > 0 && <span className="text-red-600">{urgentJobs.length} urgent</span>}
            {urgentJobs.length > 0 && availableJobs.length > 0 && ' • '}
            {availableJobs.length} regular
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Upcoming Assignments</h3>
          <div className="text-3xl font-bold text-purple-600">{myAssignments.upcoming.length}</div>
          <div className="text-sm text-gray-600 mt-1">
            {myAssignments.upcoming.length > 0 
              ? `Next: ${myAssignments.upcoming[0]?.date}` 
              : 'None scheduled'}
          </div>
        </div>
      </div>

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
