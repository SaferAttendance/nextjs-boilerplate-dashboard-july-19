'use client';

import React, { useEffect, useState, useMemo } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type SubData = {
  email: string;
  fullName: string;
  employeeId: string;
  todayEarnings: number;
  weekEarnings: number;
  monthEarnings: number;
  yearToDateEarnings: number;
  schoolBreakdown: Record<string, number>;
  currentAssignment?: string | null;
  certifications: string[];
  preferredSchools: string[];
};

type Job = {
  id: string;
  title: string;
  school: string;
  type: 'full-day' | 'half-day' | 'period';
  date: string;
  startTime: string;
  endTime: string;
  teacher: string;
  room: string;
  pay: number;
  urgent: boolean;
  subject: string;
  grade: string;
  accepted?: boolean;
};

type Assignment = {
  date: string;
  school: string;
  classes: string[];
  status: 'upcoming' | 'completed' | 'current';
  pay: number;
};

export default function SubCoverageClient({ subData }: { subData: SubData }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');
  const [showUrgentJob, setShowUrgentJob] = useState(true);
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  
  // Mock available jobs
  const [availableJobs] = useState<Job[]>([
    {
      id: 'J1',
      title: 'English Literature',
      school: 'Lincoln High School',
      type: 'full-day',
      date: 'January 18, 2024',
      startTime: '8:00 AM',
      endTime: '3:30 PM',
      teacher: 'Ms. Sarah Wilson',
      room: '108',
      pay: 240,
      urgent: false,
      subject: 'English',
      grade: '10th',
    },
    {
      id: 'J2',
      title: 'Biology Lab',
      school: 'Roosevelt Middle School',
      type: 'half-day',
      date: 'January 19, 2024',
      startTime: '1:00 PM',
      endTime: '3:30 PM',
      teacher: 'Dr. Michael Chen',
      room: 'Lab 2',
      pay: 75,
      urgent: false,
      subject: 'Science',
      grade: '8th',
    },
    {
      id: 'J3',
      title: 'Algebra II',
      school: 'Lincoln High School',
      type: 'period',
      date: 'January 17, 2024',
      startTime: '10:15 AM',
      endTime: '11:00 AM',
      teacher: 'Mr. Johnson',
      room: '204',
      pay: 22.50,
      urgent: false,
      subject: 'Mathematics',
      grade: '11th',
    },
    {
      id: 'J4',
      title: 'World History',
      school: 'Lincoln High School',
      type: 'full-day',
      date: 'January 20, 2024',
      startTime: '8:00 AM',
      endTime: '3:30 PM',
      teacher: 'Ms. Thompson',
      room: '112',
      pay: 240,
      urgent: false,
      subject: 'History',
      grade: '9th',
    },
  ]);

  // Mock assignments
  const [myAssignments] = useState<Assignment[]>([
    {
      date: '2024-01-15',
      school: 'Lincoln High School',
      classes: ['Period 1: Math 101', 'Period 3: Algebra II', 'Period 5: Geometry'],
      status: 'completed',
      pay: 90,
    },
    {
      date: '2024-01-22',
      school: 'Roosevelt Middle School',
      classes: ['Full Day: 7th Grade Science'],
      status: 'upcoming',
      pay: 240,
    },
  ]);

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

  // Handlers
  function handleAcceptUrgentJob() {
    setShowUrgentJob(false);
    pushToast('Urgent job accepted! Thank you for the quick response. Directions sent to your phone.', 'success');
  }

  function handleAcceptJob(jobId: string) {
    setAcceptedJobs(prev => new Set(prev).add(jobId));
    const job = availableJobs.find(j => j.id === jobId);
    if (job) {
      pushToast(`Job accepted: ${job.title} at ${job.school}. Confirmation sent to your email.`, 'success');
    }
  }

  function handleExportW2() {
    pushToast('Generating W-2 ready export...', 'success');
    setTimeout(() => {
      pushToast('Earnings export ready for tax filing!', 'success');
    }, 1500);
  }

  // Filter jobs based on selected filter
  const filteredJobs = useMemo(() => {
    const today = new Date().toDateString();
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toDateString();
    
    return availableJobs.filter(job => {
      if (acceptedJobs.has(job.id)) return false;
      
      const jobDate = new Date(job.date).toDateString();
      
      switch (filter) {
        case 'today':
          return jobDate === today;
        case 'week':
          return new Date(jobDate) <= new Date(weekFromNow);
        case 'all':
        default:
          return true;
      }
    });
  }, [filter, availableJobs, acceptedJobs]);

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
            <div className="text-2xl font-bold text-purple-600">${subData.todayEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Today</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">${subData.weekEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600">This Week</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${subData.monthEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600">This Month</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-blue-600">${subData.yearToDateEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Year to Date</div>
          </div>
        </div>

        <div className="border-t border-purple-200 pt-4 flex items-center justify-between text-sm">
          <div>
            <span className="text-gray-600">Breakdown by School:</span>
            <span className="ml-2 text-gray-900">
              {Object.entries(subData.schoolBreakdown).map(([school, amount]) => 
                `${school}: $${amount}`
              ).join(' • ')}
            </span>
          </div>
          <button onClick={handleExportW2} className="text-purple-600 hover:text-purple-700 font-medium">
            Export W-2 Ready →
          </button>
        </div>
      </div>

      {/* Urgent Job Alert */}
      {showUrgentJob && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
              </svg>
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Urgent: Last Minute Coverage Needed</h3>
              <p className="text-gray-700 mb-4">Math 101 - Period 3 starts in {urgentTimerText} at Lincoln High School</p>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm text-gray-600 mb-4">
                <div>
                  <span className="font-medium">Room:</span> 204
                </div>
                <div>
                  <span className="font-medium">Students:</span> 28
                </div>
                <div>
                  <span className="font-medium">Grade:</span> 10th
                </div>
                <div>
                  <span className="font-medium">Pay:</span> $22.50
                </div>
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={handleAcceptUrgentJob}
                  className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 transition-colors font-medium"
                >
                  Accept Job ($22.50)
                </button>
                <button 
                  onClick={() => setShowUrgentJob(false)}
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
      <div className="flex space-x-1 bg-gray-100 rounded-lg p-1 w-full md:w-auto">
        {(['today', 'week', 'all'] as const).map((key) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              pushToast(`Showing ${key === 'all' ? 'all available' : key} jobs`, 'success');
            }}
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

      {/* Available Jobs Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {filteredJobs.map((job) => (
          <div key={job.id} className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">{job.title}</h3>
                <p className="text-gray-600">{job.school}</p>
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
                {job.startTime} - {job.endTime}
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
                {job.subject} • {job.grade} Grade
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
                <button 
                  onClick={() => pushToast(`Viewing details for ${job.title}`, 'success')}
                  className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors"
                >
                  Details
                </button>
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* My Assignments Calendar */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Assignments</h2>
        </div>
        <div className="p-6">
          {/* Simple Calendar Grid */}
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((day) => (
              <div key={day} className="text-center text-sm font-medium text-gray-500 py-2">
                {day}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            {/* Previous month days */}
            <div className="aspect-square p-2 text-center text-gray-400">31</div>
            
            {/* Current month days */}
            {[...Array(31)].map((_, i) => {
              const day = i + 1;
              const hasAssignment = day === 15 || day === 22; // Mock assignments on these days
              
              return (
                <div 
                  key={i} 
                  className={`aspect-square p-2 text-center relative ${
                    hasAssignment ? 'font-medium text-blue-600' : ''
                  }`}
                >
                  {day}
                  {hasAssignment && (
                    <div className="absolute bottom-1 left-1 right-1 h-1 bg-blue-600 rounded-full" />
                  )}
                </div>
              );
            })}
          </div>

          {/* Upcoming Assignments List */}
          <div className="mt-6 pt-6 border-t border-gray-200">
            <h3 className="font-medium text-gray-900 mb-4">Upcoming Assignments</h3>
            <div className="space-y-3">
              {myAssignments
                .filter(a => a.status === 'upcoming')
                .map((assignment, idx) => (
                  <div key={idx} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <div>
                      <div className="font-medium text-gray-900">{assignment.date}</div>
                      <div className="text-sm text-gray-600">{assignment.school}</div>
                      <div className="text-xs text-gray-500">{assignment.classes.join(' • ')}</div>
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
          </div>
        </div>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Jobs Completed This Month</h3>
          <div className="text-3xl font-bold text-gray-900">42</div>
          <div className="text-sm text-green-600 mt-1">↑ 12% from last month</div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Average Rating</h3>
          <div className="text-3xl font-bold text-gray-900">4.8</div>
          <div className="flex items-center mt-1">
            {[...Array(5)].map((_, i) => (
              <svg 
                key={i} 
                className={`w-4 h-4 ${i < 5 ? 'text-yellow-400' : 'text-gray-300'}`} 
                fill="currentColor" 
                viewBox="0 0 20 20"
              >
                <path d="M9.049 2.927c.3-.921 1.603-.921 1.902 0l1.07 3.292a1 1 0 00.95.69h3.462c.969 0 1.371 1.24.588 1.81l-2.8 2.034a1 1 0 00-.364 1.118l1.07 3.292c.3.921-.755 1.688-1.54 1.118l-2.8-2.034a1 1 0 00-1.175 0l-2.8 2.034c-.784.57-1.838-.197-1.539-1.118l1.07-3.292a1 1 0 00-.364-1.118L2.98 8.72c-.783-.57-.38-1.81.588-1.81h3.461a1 1 0 00.951-.69l1.07-3.292z" />
              </svg>
            ))}
            <span className="ml-2 text-sm text-gray-600">from 42 schools</span>
          </div>
        </div>
        
        <div className="bg-white rounded-xl shadow-sm border border-gray-200 p-6">
          <h3 className="text-sm font-medium text-gray-500 mb-2">Preferred Schools</h3>
          <div className="space-y-2">
            {subData.preferredSchools.map((school, idx) => (
              <div key={idx} className="text-sm text-gray-900">{school}</div>
            ))}
            <button 
              onClick={() => pushToast('Opening school preferences...', 'success')}
              className="text-sm text-blue-600 hover:text-blue-700"
            >
              Manage preferences →
            </button>
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
