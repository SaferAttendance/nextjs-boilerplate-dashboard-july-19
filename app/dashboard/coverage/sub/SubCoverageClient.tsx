'use client';

import React, { useEffect, useState, useMemo, useRef } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type SubData = {
  email: string;
  fullName: string;
  employeeId: string;
  schoolCode: string;
  districtCode: string;
};

type SchoolAddress = {
  street: string;
  city: string;
  state: string;
  zip: string;
  full: string;
};

type SchoolAdmin = {
  name: string;
  email: string;
  phone: string;
};

type Job = {
  id: string;
  title: string;
  school: string;
  school_name: string;
  district_code: string;
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
  school_address: SchoolAddress;
  school_admin: SchoolAdmin;
};

type Assignment = {
  id: number;
  coverage_request_id?: number;
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
  status?: 'pending' | 'verified' | 'paid';
  subject?: string;
  grade?: string;
  students?: number;
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

type District = {
  id?: number;
  district_code: string;
  district_name: string;
  state?: string;
  status?: string;
  applied_at?: string | number;
  denial_reason?: string;
};

type School = {
  id: number;
  school_code: string;
  school_name: string;
  district_code: string;
  full_address: string;
  admin_name: string;
  admin_email: string;
  admin_phone: string;
};

type CoverageDetail = {
  id: number;
  class_name: string;
  teacher_name: string;
  teacher_id: string;
  date: string;
  room: string;
  subject: string;
  grade: string;
  students: number;
  department: string;
  pay_amount: number;
  status: string;
  substitute_id: string | null;
  substitute_name: string | null;
  school_code: string;
  start_time?: number;
  end_time?: number;
  notes?: string;
  lesson_plan_url?: string;
};

const XANO_BASE = 'https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2';
const XANO_TEACHER_API = 'https://xgeu-jqgf-nnju.n7e.xano.io/api:t_J13ik1';

const CALL_OUT_REASONS = [
  { id: 'illness', label: 'Personal Illness', icon: '🤒' },
  { id: 'family_emergency', label: 'Family Emergency', icon: '👨‍👩‍👧' },
  { id: 'car_trouble', label: 'Car Trouble / Transportation', icon: '🚗' },
  { id: 'weather', label: 'Weather Conditions', icon: '🌧️' },
  { id: 'schedule_conflict', label: 'Schedule Conflict', icon: '📅' },
  { id: 'other', label: 'Other', icon: '📝' },
];

const WITHDRAW_REASONS = [
  { id: 'schedule_conflict', label: 'Schedule Conflict' },
  { id: 'personal_emergency', label: 'Personal Emergency' },
  { id: 'health_issue', label: 'Health Issue' },
  { id: 'transportation', label: 'Transportation Issue' },
  { id: 'accepted_error', label: 'Accepted in Error' },
  { id: 'other', label: 'Other' },
];

export default function SubCoverageClient({ subData }: { subData: SubData }) {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [activeTab, setActiveTab] = useState<'jobs' | 'districts'>('jobs');
  
  // Filters
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('all');
  const [subjectFilter, setSubjectFilter] = useState<string>('all');
  const [districtFilter, setDistrictFilter] = useState<string>('all');
  const [schoolFilter, setSchoolFilter] = useState<string>('all');
  
  const [subjects, setSubjects] = useState<string[]>([]);
  const [acceptedJobs, setAcceptedJobs] = useState<Set<string>>(new Set());
  
  // District data
  const [allDistricts, setAllDistricts] = useState<District[]>([]);
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [myDistricts, setMyDistricts] = useState<{
    approved: District[];
    pending: District[];
    denied: District[];
    available: District[];
    counts: { approved: number; pending: number; denied: number; available: number };
  }>({ approved: [], pending: [], denied: [], available: [], counts: { approved: 0, pending: 0, denied: 0, available: 0 } });
  
  // Jobs data
  const [availableJobs, setAvailableJobs] = useState<Job[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<Job[]>([]);
  const [myAssignments, setMyAssignments] = useState<{ upcoming: Assignment[]; current: Assignment[]; completed: Assignment[] }>({ upcoming: [], current: [], completed: [] });
  const [earnings, setEarnings] = useState<Earnings>({ today: 0, week: 0, month: 0, yearToDate: 0, schoolBreakdown: {}, totalJobs: 0, recentLogs: [] });
  const [loading, setLoading] = useState(true);
  
  // Track if initial load is complete - prevents re-fetch loops
  const initialLoadComplete = useRef(false);
  const prevApprovedCodesRef = useRef<string>('');
  
  // Modal states
  const [showUrgentJob, setShowUrgentJob] = useState(true);
  const [showCallOutModal, setShowCallOutModal] = useState(false);
  const [callOutJob, setCallOutJob] = useState<Assignment | null>(null);
  const [callOutReason, setCallOutReason] = useState('');
  const [callOutNotes, setCallOutNotes] = useState('');
  const [callOutSubmitting, setCallOutSubmitting] = useState(false);
  const [showApplyModal, setShowApplyModal] = useState(false);
  const [applyingDistrict, setApplyingDistrict] = useState<District | null>(null);
  const [applyNotes, setApplyNotes] = useState('');
  const [applySubmitting, setApplySubmitting] = useState(false);
  
  // NEW: Withdraw modal states
  const [showWithdrawModal, setShowWithdrawModal] = useState(false);
  const [withdrawJob, setWithdrawJob] = useState<Assignment | null>(null);
  const [withdrawReason, setWithdrawReason] = useState('');
  const [withdrawSubmitting, setWithdrawSubmitting] = useState(false);
  
  // NEW: Detail view modal states
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [detailJob, setDetailJob] = useState<CoverageDetail | null>(null);
  const [detailLoading, setDetailLoading] = useState(false);
  
  // Stat card modals
  const [showCompletedModal, setShowCompletedModal] = useState(false);
  const [showAvailableModal, setShowAvailableModal] = useState(false);
  const [showUpcomingModal, setShowUpcomingModal] = useState(false);
  const [expandedJobId, setExpandedJobId] = useState<string | null>(null);
  
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

  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => setToasts((t) => t.filter((x) => x.id !== id)), 4000);
  }

  // Get approved district codes as a stable string for dependency tracking
  const approvedDistrictCodesStr = useMemo(() => {
    return myDistricts.approved.map(d => d.district_code).join(',');
  }, [myDistricts.approved]);

  // Fetch functions
  async function fetchDistricts() {
    try {
      const response = await fetch(`${XANO_BASE}/districts/list?state=%20`);
      const data = await response.json();
      if (data.districts) setAllDistricts(data.districts);
    } catch (e) {
      console.error('Failed to fetch districts:', e);
    }
  }

  async function fetchSchools() {
    try {
      const response = await fetch(`${XANO_BASE}/schools/list?district_code=%20`);
      const data = await response.json();
      if (data.schools) setAllSchools(data.schools);
    } catch (e) {
      console.error('Failed to fetch schools:', e);
    }
  }

  async function fetchMyDistricts() {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/my-districts?substitute_id=${subData.employeeId}`);
      const data = await response.json();
      if (data && data.approved) setMyDistricts(data);
    } catch (e) {
      console.error('Failed to fetch my districts:', e);
    }
  }

  async function fetchJobs(approvedCodes?: string) {
    try {
      const approvedStr = approvedCodes || subData.districtCode || ' ';
      const params = new URLSearchParams({
        school: ' ',
        district: ' ',
        approved_districts: approvedStr
      });
      const response = await fetch(`${XANO_BASE}/substitutes/available-jobs?${params}`);
      const data = await response.json();
      if (data.available) setAvailableJobs(data.available);
      if (data.urgent) setUrgentJobs(data.urgent);
    } catch (e) {
      console.error('Failed to fetch jobs:', e);
    }
  }

  async function fetchSubjects() {
    try {
      const response = await fetch(`${XANO_BASE}/coverage/subjects?school=${subData.schoolCode || 'blueberry'}`);
      const data = await response.json();
      if (data.subjects) setSubjects(data.subjects);
    } catch (e) {
      console.error('Failed to fetch subjects:', e);
    }
  }

  async function fetchEarnings() {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/my-earnings?substitute_id=${subData.employeeId}`);
      const data = await response.json();
      if (data && typeof data.today !== 'undefined') {
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
  }

  async function fetchAssignments() {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/my-assignments?substitute_id=${subData.employeeId}`);
      const data = await response.json();
      if (data) {
        const now = new Date();
        const today = now.toISOString().split('T')[0];
        const currentHour = now.getHours();
        const currentMinute = now.getMinutes();
        
        const allAssignments = [...(data.upcoming || []), ...(data.current || []), ...(data.completed || [])];
        const upcoming: Assignment[] = [];
        const current: Assignment[] = [];
        const completed: Assignment[] = [];
        
        for (const a of allAssignments) {
          let endHour = 15, endMinute = 30, startHour = 8, startMinute = 0;
          if (typeof a.end_time === 'number') {
            const d = new Date(a.end_time);
            endHour = d.getHours();
            endMinute = d.getMinutes();
          }
          if (typeof a.start_time === 'number') {
            const d = new Date(a.start_time);
            startHour = d.getHours();
            startMinute = d.getMinutes();
          }
          
          const assignment = { ...a };
          if (a.date < today) {
            assignment.displayStatus = 'completed';
            completed.push(assignment);
          } else if (a.date > today) {
            assignment.displayStatus = 'upcoming';
            upcoming.push(assignment);
          } else {
            const currentMins = currentHour * 60 + currentMinute;
            if (currentMins >= endHour * 60 + endMinute) {
              assignment.displayStatus = 'completed';
              completed.push(assignment);
            } else if (currentMins >= startHour * 60 + startMinute) {
              assignment.displayStatus = 'current';
              current.push(assignment);
            } else {
              assignment.displayStatus = 'upcoming';
              upcoming.push(assignment);
            }
          }
        }
        upcoming.sort((a, b) => a.date.localeCompare(b.date));
        setMyAssignments({ upcoming, current, completed });
      }
    } catch (e) {
      console.error('Failed to fetch assignments:', e);
    }
  }

  // Initial load - runs ONCE on mount
  useEffect(() => {
    let mounted = true;
    
    async function loadData() {
      if (!mounted) return;
      setLoading(true);
      
      // First, fetch districts data
      await Promise.all([fetchDistricts(), fetchSchools(), fetchMyDistricts()]);
      
      if (!mounted) return;
      
      // Then fetch everything else
      await Promise.all([fetchJobs(), fetchEarnings(), fetchAssignments(), fetchSubjects()]);
      
      if (!mounted) return;
      setLoading(false);
      initialLoadComplete.current = true;
    }
    
    loadData();
    
    return () => { mounted = false; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // Re-fetch jobs when approved districts change (but NOT on initial load)
  useEffect(() => {
    if (initialLoadComplete.current && 
        approvedDistrictCodesStr && 
        approvedDistrictCodesStr !== prevApprovedCodesRef.current) {
      prevApprovedCodesRef.current = approvedDistrictCodesStr;
      fetchJobs(approvedDistrictCodesStr);
    }
  }, [approvedDistrictCodesStr]);

  // Accept job handler
  async function handleAcceptJob(jobId: string, isUrgent = false) {
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/accept-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: parseInt(jobId),
          substitute_id: subData.employeeId,
          substitute_name: subData.fullName
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
        fetchAssignments();
        fetchEarnings();
      } else {
        pushToast(result.message || 'Failed to accept job', 'error');
      }
    } catch {
      pushToast('Failed to accept job. Please try again.', 'error');
    }
  }

  // Call out handler (emergency - same day or very short notice)
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
        pushToast('Call out recorded. Job is now available for others.', 'success');
        setShowCallOutModal(false);
        setCallOutJob(null);
        setCallOutReason('');
        setCallOutNotes('');
        fetchAssignments();
        fetchJobs();
      } else {
        pushToast(result.message || 'Failed to submit call out', 'error');
      }
    } catch {
      pushToast('Failed to submit call out.', 'error');
    } finally {
      setCallOutSubmitting(false);
    }
  }

  // NEW: Withdraw handler (advance notice cancellation)
  async function handleWithdraw() {
    if (!withdrawJob || !withdrawReason) return;
    setWithdrawSubmitting(true);
    try {
      const jobId = withdrawJob.coverage_request_id || withdrawJob.id;
      const response = await fetch(`${XANO_TEACHER_API}/substitutes/withdraw-job`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          job_id: jobId,
          substitute_id: subData.employeeId,
          reason: WITHDRAW_REASONS.find(r => r.id === withdrawReason)?.label || withdrawReason,
        }),
      });
      const result = await response.json();
      if (result.success) {
        pushToast('Successfully withdrawn from job. It\'s now available for others.', 'success');
        setShowWithdrawModal(false);
        setWithdrawJob(null);
        setWithdrawReason('');
        fetchAssignments();
        fetchJobs();
        fetchEarnings();
      } else {
        pushToast(result.message || 'Failed to withdraw from job', 'error');
      }
    } catch {
      pushToast('Failed to withdraw from job.', 'error');
    } finally {
      setWithdrawSubmitting(false);
    }
  }

  // NEW: View job details
  async function handleViewDetails(jobId: number) {
    setDetailLoading(true);
    setShowDetailModal(true);
    try {
      const response = await fetch(`${XANO_TEACHER_API}/coverage/full-details?coverage_request_id=${jobId}`);
      const result = await response.json();
      if (result.success && result.coverage) {
        setDetailJob(result.coverage);
      } else {
        pushToast('Failed to load job details', 'error');
        setShowDetailModal(false);
      }
    } catch {
      pushToast('Failed to load job details', 'error');
      setShowDetailModal(false);
    } finally {
      setDetailLoading(false);
    }
  }

  // Apply to district
  async function handleApplyDistrict() {
    if (!applyingDistrict) return;
    setApplySubmitting(true);
    try {
      const response = await fetch(`${XANO_BASE}/substitutes/apply-district`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          substitute_id: subData.employeeId,
          substitute_name: subData.fullName,
          substitute_email: subData.email,
          district_code: applyingDistrict.district_code,
          notes: applyNotes.trim() || 'N/A',
        }),
      });
      const result = await response.json();
      if (result.success) {
        pushToast(`Application submitted to ${applyingDistrict.district_name}!`, 'success');
        setShowApplyModal(false);
        setApplyingDistrict(null);
        setApplyNotes('');
        fetchMyDistricts();
      } else {
        pushToast(result.message || 'Failed to submit application', 'error');
      }
    } catch {
      pushToast('Failed to submit application.', 'error');
    } finally {
      setApplySubmitting(false);
    }
  }

  // W-2 Export
  function handleExportW2() {
    pushToast('Generating W-2 ready export...', 'success');
    const content = `SUBSTITUTE TEACHER EARNINGS REPORT
${'='.repeat(36)}
Generated: ${new Date().toLocaleDateString()}

PERSONAL INFORMATION
${'-'.repeat(20)}
Name: ${subData.fullName}
Employee ID: ${subData.employeeId}
Email: ${subData.email}

EARNINGS SUMMARY
${'-'.repeat(16)}
Today: $${earnings.today.toFixed(2)}
This Week: $${earnings.week.toFixed(2)}
This Month: $${earnings.month.toFixed(2)}
Year to Date: $${earnings.yearToDate.toFixed(2)}

BREAKDOWN BY SCHOOL
${'-'.repeat(19)}
${Object.entries(earnings.schoolBreakdown).map(([s, a]) => `${s}: $${a.toFixed(2)}`).join('\n') || 'No breakdown available'}

TOTAL JOBS: ${earnings.totalJobs}

---
This document is for tax preparation purposes.`;
    
    const blob = new Blob([content], { type: 'text/plain' });
    const url = window.URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `W2_Earnings_${subData.employeeId}_${new Date().toISOString().split('T')[0]}.txt`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    window.URL.revokeObjectURL(url);
    setTimeout(() => pushToast('Earnings export downloaded!', 'success'), 500);
  }

  function formatTime(time: string | number): string {
    if (typeof time === 'number') {
      return new Date(time).toLocaleTimeString('en-US', {
        hour: 'numeric',
        minute: '2-digit',
        hour12: true
      });
    }
    return time;
  }

  function formatDate(dateStr: string | number): string {
    if (typeof dateStr === 'number') {
      return new Date(dateStr).toLocaleDateString();
    }
    const date = new Date(dateStr);
    return date.toLocaleDateString('en-US', { weekday: 'short', month: 'short', day: 'numeric' });
  }

  // Helper to determine if a job can be withdrawn (future date, not same day)
  function canWithdraw(assignment: Assignment): boolean {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(assignment.date);
    jobDate.setHours(0, 0, 0, 0);
    return jobDate > today;
  }

  // Helper to get status badge for assignments
  function getStatusBadge(assignment: Assignment) {
    const today = new Date();
    today.setHours(0, 0, 0, 0);
    const jobDate = new Date(assignment.date);
    jobDate.setHours(0, 0, 0, 0);
    const isFutureJob = jobDate >= today;
    
    // Check payment/verification status
    if (assignment.status === 'paid') {
      return { label: '💰 Paid', className: 'bg-green-100 text-green-700' };
    }
    if (assignment.status === 'verified') {
      return { label: '✓ Verified', className: 'bg-blue-100 text-blue-700' };
    }
    if (!isFutureJob && assignment.displayStatus === 'completed') {
      return { label: '⏳ Pending Verification', className: 'bg-yellow-100 text-yellow-700' };
    }
    if (isFutureJob) {
      return { label: '📅 Scheduled', className: 'bg-blue-100 text-blue-700' };
    }
    if (assignment.displayStatus === 'current') {
      return { label: '▶ In Progress', className: 'bg-green-100 text-green-700' };
    }
    return { label: assignment.displayStatus, className: 'bg-gray-100 text-gray-700' };
  }

  // Filter jobs
  const filteredJobs = useMemo(() => {
    const today = new Date().toISOString().split('T')[0];
    const weekFromNow = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];
    
    return availableJobs.filter(job => {
      if (acceptedJobs.has(job.id)) return false;
      if (filter === 'today' && job.date !== today) return false;
      if (filter === 'week' && job.date > weekFromNow) return false;
      if (subjectFilter !== 'all' && job.subject?.toLowerCase() !== subjectFilter.toLowerCase()) return false;
      if (districtFilter !== 'all' && job.district_code !== districtFilter) return false;
      if (schoolFilter !== 'all' && job.school !== schoolFilter) return false;
      return true;
    });
  }, [filter, subjectFilter, districtFilter, schoolFilter, availableJobs, acceptedJobs]);

  // Schools for current district filter
  const filteredSchools = useMemo(() => {
    if (districtFilter === 'all') return allSchools;
    return allSchools.filter(s => s.district_code === districtFilter);
  }, [districtFilter, allSchools]);

  // Unique districts from jobs
  const jobDistricts = useMemo(() => {
    const codes = new Set([...availableJobs.map(j => j.district_code), ...urgentJobs.map(j => j.district_code)]);
    return allDistricts.filter(d => codes.has(d.district_code));
  }, [availableJobs, urgentJobs, allDistricts]);

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
          onClick={() => setActiveTab('jobs')}
          className={`px-6 py-2 rounded-md font-medium transition-colors ${
            activeTab === 'jobs' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          Available Jobs
        </button>
        <button
          onClick={() => setActiveTab('districts')}
          className={`px-6 py-2 rounded-md font-medium transition-colors flex items-center space-x-2 ${
            activeTab === 'districts' ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600 hover:text-gray-900'
          }`}
        >
          <span>My Districts</span>
          {myDistricts.counts.pending > 0 && (
            <span className="bg-orange-500 text-white text-xs px-1.5 py-0.5 rounded-full">
              {myDistricts.counts.pending}
            </span>
          )}
        </button>
      </div>

      {activeTab === 'jobs' ? (
        <>
          {/* Earnings Tracker */}
          <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
            <div className="flex items-start justify-between mb-4">
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-1">My Earnings Tracker</h3>
                <p className="text-sm text-gray-600">Track your substitute teaching income</p>
              </div>
              <button
                onClick={handleExportW2}
                className="text-purple-600 hover:text-purple-700 font-medium text-sm flex items-center space-x-1"
              >
                <span>Export W-2 →</span>
              </button>
            </div>
            <div className="grid grid-cols-4 gap-4">
              <div className="text-center">
                <div className="text-2xl font-bold text-purple-600">${earnings.today.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Today</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-gray-900">${earnings.week.toFixed(2)}</div>
                <div className="text-xs text-gray-600">This Week</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-green-600">${earnings.month.toFixed(2)}</div>
                <div className="text-xs text-gray-600">This Month</div>
              </div>
              <div className="text-center">
                <div className="text-2xl font-bold text-blue-600">${earnings.yearToDate.toFixed(2)}</div>
                <div className="text-xs text-gray-600">Year to Date</div>
              </div>
            </div>
          </div>

          {/* Urgent Job Alert */}
          {showUrgentJob && currentUrgentJob && (
            <div className="bg-red-50 border border-red-200 rounded-xl p-5">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <h3 className="text-lg font-semibold text-gray-900 mb-1">
                    🚨 Urgent: {currentUrgentJob.title}
                  </h3>
                  <p className="text-gray-700 text-sm mb-3">
                    {currentUrgentJob.school_name} • {currentUrgentJob.subject} • Grade {currentUrgentJob.grade}
                  </p>
                  <div className="grid grid-cols-4 gap-2 text-xs text-gray-600 mb-3">
                    <div><span className="font-medium">Room:</span> {currentUrgentJob.room}</div>
                    <div><span className="font-medium">Date:</span> {currentUrgentJob.date}</div>
                    <div><span className="font-medium">Time:</span> {formatTime(currentUrgentJob.startTime)}</div>
                    <div><span className="font-medium">Pay:</span> ${currentUrgentJob.pay.toFixed(2)}</div>
                  </div>
                  {currentUrgentJob.school_address?.full && (
                    <p className="text-xs text-gray-500 mb-3">📍 {currentUrgentJob.school_address.full}</p>
                  )}
                  <div className="flex gap-2">
                    <button
                      onClick={() => handleAcceptJob(currentUrgentJob.id, true)}
                      className="px-4 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium"
                    >
                      Accept (${currentUrgentJob.pay.toFixed(2)})
                    </button>
                    <button
                      onClick={() => {
                        setShowUrgentJob(false);
                        if (urgentJobs.length > 1) {
                          setUrgentJobs(prev => prev.slice(1));
                          setShowUrgentJob(true);
                        }
                      }}
                      className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 text-sm"
                    >
                      Decline
                    </button>
                  </div>
                </div>
                <div className="text-right ml-4">
                  <div className="text-2xl font-bold text-red-600 animate-pulse">{urgentTimerText}</div>
                  <div className="text-xs text-gray-500">until start</div>
                </div>
              </div>
            </div>
          )}

          {/* Filters */}
          <div className="flex flex-wrap items-center gap-3">
            <div className="flex space-x-1 bg-gray-100 rounded-lg p-1">
              {(['today', 'week', 'all'] as const).map((key) => (
                <button
                  key={key}
                  onClick={() => setFilter(key)}
                  className={`px-3 py-1.5 text-sm font-medium rounded-md transition-colors ${
                    filter === key ? 'bg-white shadow-sm text-gray-900' : 'text-gray-600'
                  }`}
                >
                  {key === 'today' ? 'Today' : key === 'week' ? 'This Week' : 'All'}
                </button>
              ))}
            </div>
            <select
              value={districtFilter}
              onChange={(e) => {
                setDistrictFilter(e.target.value);
                setSchoolFilter('all');
              }}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Districts</option>
              {jobDistricts.map(d => (
                <option key={d.district_code} value={d.district_code}>{d.district_name}</option>
              ))}
            </select>
            <select
              value={schoolFilter}
              onChange={(e) => setSchoolFilter(e.target.value)}
              className="px-3 py-1.5 border border-gray-300 rounded-lg text-sm"
            >
              <option value="all">All Schools</option>
              {filteredSchools.map(s => (
                <option key={s.school_code} value={s.school_code}>{s.school_name}</option>
              ))}
            </select>
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
                fetchJobs(approvedDistrictCodesStr || subData.districtCode);
                pushToast('Refreshed!', 'success');
              }}
              className="px-3 py-1.5 text-sm text-gray-600 hover:text-gray-900"
            >
              🔄 Refresh
            </button>
          </div>

          {/* Jobs Grid */}
          {filteredJobs.length === 0 ? (
            <div className="bg-white rounded-xl shadow-sm border p-12 text-center">
              <div className="text-4xl mb-4">📭</div>
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Jobs Available</h3>
              <p className="text-gray-600 text-sm">Try adjusting your filters or check back later.</p>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {filteredJobs.map((job) => (
                <div key={job.id} className="bg-white rounded-xl shadow-sm border p-5 hover:shadow-md transition-shadow">
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <h3 className="font-semibold text-gray-900">{job.title}</h3>
                      <p className="text-sm text-gray-600">{job.school_name}</p>
                    </div>
                    <span className={`text-xs px-2 py-1 rounded-full ${
                      job.type === 'full-day' ? 'bg-blue-100 text-blue-700' :
                      job.type === 'half-day' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-green-100 text-green-700'
                    }`}>
                      {job.type === 'full-day' ? 'Full Day' : job.type === 'half-day' ? 'Half Day' : 'Period'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-2 text-xs text-gray-600 mb-3">
                    <div>📅 {job.date}</div>
                    <div>🕐 {formatTime(job.startTime)} - {formatTime(job.endTime)}</div>
                    <div>📚 {job.subject} • Grade {job.grade}</div>
                    <div>🚪 Room {job.room}</div>
                  </div>

                  {/* Expandable School Details */}
                  <button
                    onClick={() => setExpandedJobId(expandedJobId === job.id ? null : job.id)}
                    className="text-xs text-blue-600 hover:text-blue-700 mb-3"
                  >
                    {expandedJobId === job.id ? '▼ Hide details' : '▶ Show school details'}
                  </button>
                  
                  {expandedJobId === job.id && (
                    <div className="bg-gray-50 rounded-lg p-3 mb-3 text-xs space-y-2">
                      {job.school_address?.full && (
                        <div><span className="font-medium">📍 Address:</span> {job.school_address.full}</div>
                      )}
                      {job.school_admin?.name && (
                        <div><span className="font-medium">👤 Admin:</span> {job.school_admin.name}</div>
                      )}
                      {job.school_admin?.email && (
                        <div>
                          <span className="font-medium">✉️ Email:</span>{' '}
                          <a href={`mailto:${job.school_admin.email}`} className="text-blue-600">
                            {job.school_admin.email}
                          </a>
                        </div>
                      )}
                      {job.school_admin?.phone && (
                        <div>
                          <span className="font-medium">📞 Phone:</span>{' '}
                          <a href={`tel:${job.school_admin.phone}`} className="text-blue-600">
                            {job.school_admin.phone}
                          </a>
                        </div>
                      )}
                    </div>
                  )}

                  <div className="flex items-center justify-between pt-3 border-t">
                    <div className="text-lg font-semibold text-gray-900">${job.pay.toFixed(2)}</div>
                    <button
                      onClick={() => handleAcceptJob(job.id)}
                      disabled={acceptedJobs.has(job.id)}
                      className={`px-4 py-2 rounded-lg text-sm font-medium ${
                        acceptedJobs.has(job.id)
                          ? 'bg-gray-200 text-gray-500'
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

          {/* My Assignments - ENHANCED with smart status and withdraw */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b">
              <h2 className="text-lg font-semibold text-gray-900">My Assignments</h2>
              <p className="text-sm text-gray-500">Your accepted coverage jobs</p>
            </div>
            <div className="p-5 space-y-4">
              {myAssignments.upcoming.length === 0 && myAssignments.current.length === 0 ? (
                <p className="text-gray-500 text-sm">No assignments. Accept some jobs above!</p>
              ) : (
                <>
                  {/* Current/In Progress */}
                  {myAssignments.current.map((a) => {
                    const badge = getStatusBadge(a);
                    return (
                      <div key={a.id} className="p-4 bg-green-50 rounded-lg border border-green-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{a.class_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{a.school_name || a.school} • Room {a.room}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatTime(a.start_time)} - {formatTime(a.end_time)} • ${(a.pay || 0).toFixed(2)}
                            </div>
                          </div>
                          <button
                            onClick={() => handleViewDetails(a.coverage_request_id || a.id)}
                            className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                          >
                            View Details
                          </button>
                        </div>
                      </div>
                    );
                  })}
                  
                  {/* Upcoming */}
                  {myAssignments.upcoming.map((a) => {
                    const badge = getStatusBadge(a);
                    const canWithdrawJob = canWithdraw(a);
                    
                    return (
                      <div key={a.id} className="p-4 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div className="flex-1">
                            <div className="flex items-center gap-2 mb-1">
                              <span className="font-medium text-gray-900">{a.class_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-sm text-gray-600">{a.school_name || a.school} • Room {a.room}</div>
                            <div className="text-xs text-gray-500 mt-1">
                              {formatDate(a.date)} • {formatTime(a.start_time)} - {formatTime(a.end_time)} • ${(a.pay || 0).toFixed(2)}
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => handleViewDetails(a.coverage_request_id || a.id)}
                              className="text-xs text-blue-600 hover:text-blue-700 px-2 py-1"
                            >
                              View Details
                            </button>
                            {canWithdrawJob ? (
                              <button
                                onClick={() => {
                                  setWithdrawJob(a);
                                  setShowWithdrawModal(true);
                                }}
                                className="text-xs text-red-600 hover:text-red-700 px-2 py-1 border border-red-200 rounded hover:bg-red-50"
                              >
                                Withdraw
                              </button>
                            ) : (
                              <button
                                onClick={() => {
                                  setCallOutJob(a);
                                  setShowCallOutModal(true);
                                }}
                                className="text-xs text-orange-600 hover:text-orange-700 px-2 py-1 border border-orange-200 rounded hover:bg-orange-50"
                              >
                                Call Out
                              </button>
                            )}
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </>
              )}
            </div>
          </div>

          {/* Quick Stats */}
          <div className="grid grid-cols-3 gap-4">
            <button
              onClick={() => setShowCompletedModal(true)}
              className="text-left bg-white rounded-xl shadow-sm border p-5 hover:shadow-md"
            >
              <h3 className="text-xs font-medium text-gray-500 mb-1">Completed</h3>
              <div className="text-2xl font-bold text-gray-900">{myAssignments.completed.length}</div>
            </button>
            <button
              onClick={() => setShowAvailableModal(true)}
              className="text-left bg-white rounded-xl shadow-sm border p-5 hover:shadow-md"
            >
              <h3 className="text-xs font-medium text-gray-500 mb-1">Available Now</h3>
              <div className="text-2xl font-bold text-blue-600">{availableJobs.length + urgentJobs.length}</div>
            </button>
            <button
              onClick={() => setShowUpcomingModal(true)}
              className="text-left bg-white rounded-xl shadow-sm border p-5 hover:shadow-md"
            >
              <h3 className="text-xs font-medium text-gray-500 mb-1">Upcoming</h3>
              <div className="text-2xl font-bold text-purple-600">{myAssignments.upcoming.length}</div>
            </button>
          </div>
        </>
      ) : (
        /* Districts Tab - UNCHANGED */
        <div className="space-y-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Districts</h1>
            <p className="text-gray-600 text-sm">
              Manage your district applications and see opportunities across all approved districts
            </p>
          </div>

          {/* Approved Districts */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b bg-green-50">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-green-500 rounded-full mr-2"></span>
                Approved Districts ({myDistricts.approved.length})
              </h2>
            </div>
            <div className="p-5">
              {myDistricts.approved.length === 0 ? (
                <p className="text-gray-500 text-sm">No approved districts yet. Apply below!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myDistricts.approved.map((d) => (
                    <div
                      key={d.district_code}
                      className="flex items-center justify-between p-3 bg-green-50 rounded-lg border border-green-200"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{d.district_name}</div>
                        <div className="text-xs text-gray-600">{d.state}</div>
                      </div>
                      <span className="text-xs bg-green-100 text-green-700 px-2 py-1 rounded-full">✓ Approved</span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Pending Applications */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b bg-orange-50">
              <h2 className="font-semibold text-gray-900 flex items-center">
                <span className="w-2 h-2 bg-orange-500 rounded-full mr-2 animate-pulse"></span>
                Pending Applications ({myDistricts.pending.length})
              </h2>
            </div>
            <div className="p-5">
              {myDistricts.pending.length === 0 ? (
                <p className="text-gray-500 text-sm">No pending applications.</p>
              ) : (
                <div className="space-y-3">
                  {myDistricts.pending.map((d) => (
                    <div
                      key={d.id || d.district_code}
                      className="flex items-center justify-between p-3 bg-orange-50 rounded-lg border border-orange-200"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{d.district_name}</div>
                        <div className="text-xs text-gray-600">
                          Applied: {d.applied_at ? formatDate(d.applied_at) : 'Recently'}
                        </div>
                      </div>
                      <span className="text-xs bg-orange-100 text-orange-700 px-2 py-1 rounded-full">
                        ⏳ Pending Review
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Available Districts to Apply */}
          <div className="bg-white rounded-xl shadow-sm border">
            <div className="px-5 py-4 border-b">
              <h2 className="font-semibold text-gray-900">Available Districts ({myDistricts.available.length})</h2>
              <p className="text-xs text-gray-600">Apply to work in additional districts</p>
            </div>
            <div className="p-5">
              {myDistricts.available.length === 0 ? (
                <p className="text-gray-500 text-sm">You&apos;ve applied to all available districts!</p>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                  {myDistricts.available.map((d) => (
                    <div
                      key={d.district_code}
                      className="flex items-center justify-between p-3 bg-gray-50 rounded-lg border"
                    >
                      <div>
                        <div className="font-medium text-gray-900">{d.district_name}</div>
                        <div className="text-xs text-gray-600">{d.state}</div>
                      </div>
                      <button
                        onClick={() => {
                          setApplyingDistrict(d);
                          setShowApplyModal(true);
                        }}
                        className="text-sm bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700"
                      >
                        Apply
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          {/* Denied Applications */}
          {myDistricts.denied.length > 0 && (
            <div className="bg-white rounded-xl shadow-sm border">
              <div className="px-5 py-4 border-b bg-red-50">
                <h2 className="font-semibold text-gray-900">Denied Applications ({myDistricts.denied.length})</h2>
              </div>
              <div className="p-5 space-y-3">
                {myDistricts.denied.map((d) => (
                  <div key={d.id || d.district_code} className="p-3 bg-red-50 rounded-lg border border-red-200">
                    <div className="flex justify-between items-start">
                      <div>
                        <div className="font-medium text-gray-900">{d.district_name}</div>
                        {d.denial_reason && (
                          <div className="text-xs text-red-600 mt-1">Reason: {d.denial_reason}</div>
                        )}
                      </div>
                      <span className="text-xs bg-red-100 text-red-700 px-2 py-1 rounded-full">Denied</span>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      )}

      {/* Call Out Modal (Emergency - same day) */}
      {showCallOutModal && callOutJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4">
            <div className="bg-orange-50 px-5 py-4 border-b border-orange-200">
              <h2 className="font-semibold text-gray-900">🚨 Emergency Call Out</h2>
              <p className="text-sm text-gray-600">{callOutJob.class_name} on {formatDate(callOutJob.date)}</p>
              <p className="text-xs text-orange-600 mt-1">Use this for same-day or urgent cancellations</p>
            </div>
            <div className="p-5 space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason *</label>
                <div className="grid grid-cols-2 gap-2">
                  {CALL_OUT_REASONS.map(r => (
                    <button
                      key={r.id}
                      onClick={() => setCallOutReason(r.id)}
                      className={`p-2 rounded-lg border text-left text-sm ${
                        callOutReason === r.id
                          ? 'border-orange-500 bg-orange-50 ring-2 ring-orange-500'
                          : 'border-gray-200'
                      }`}
                    >
                      {r.icon} {r.label}
                    </button>
                  ))}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Notes (Optional)</label>
                <textarea
                  value={callOutNotes}
                  onChange={(e) => setCallOutNotes(e.target.value)}
                  placeholder="Additional info..."
                  rows={2}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowCallOutModal(false);
                  setCallOutJob(null);
                  setCallOutReason('');
                  setCallOutNotes('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleCallOut}
                disabled={!callOutReason || callOutSubmitting}
                className="px-4 py-2 bg-orange-600 text-white rounded-lg hover:bg-orange-700 disabled:opacity-50 text-sm font-medium"
              >
                {callOutSubmitting ? 'Submitting...' : 'Confirm Call Out'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Withdraw Modal (Advance notice cancellation) */}
      {showWithdrawModal && withdrawJob && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="bg-red-50 px-5 py-4 border-b border-red-200">
              <h2 className="font-semibold text-gray-900">⚠️ Withdraw from Job</h2>
              <p className="text-sm text-gray-600">{withdrawJob.class_name} on {formatDate(withdrawJob.date)}</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-600">
                Are you sure you want to withdraw from this job? It will be returned to the available pool for others to accept.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Reason for Withdrawal *</label>
                <select
                  value={withdrawReason}
                  onChange={(e) => setWithdrawReason(e.target.value)}
                  className="w-full p-3 border rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-red-500"
                >
                  <option value="">Select a reason...</option>
                  {WITHDRAW_REASONS.map(r => (
                    <option key={r.id} value={r.id}>{r.label}</option>
                  ))}
                </select>
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowWithdrawModal(false);
                  setWithdrawJob(null);
                  setWithdrawReason('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleWithdraw}
                disabled={!withdrawReason || withdrawSubmitting}
                className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700 disabled:opacity-50 text-sm font-medium"
              >
                {withdrawSubmitting ? 'Withdrawing...' : 'Confirm Withdrawal'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* NEW: Job Detail Modal */}
      {showDetailModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-lg mx-4 overflow-hidden">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">📋 Job Details</h2>
              <button 
                onClick={() => {
                  setShowDetailModal(false);
                  setDetailJob(null);
                }} 
                className="text-gray-500 hover:text-gray-700"
              >
                ✕
              </button>
            </div>
            <div className="p-5">
              {detailLoading ? (
                <div className="text-center py-8">
                  <div className="animate-spin h-8 w-8 border-4 border-blue-500 border-t-transparent rounded-full mx-auto mb-2"></div>
                  <p className="text-gray-500">Loading details...</p>
                </div>
              ) : detailJob ? (
                <div className="space-y-4">
                  <div className="bg-blue-50 rounded-lg p-4">
                    <h3 className="font-semibold text-blue-900 text-lg">{detailJob.class_name}</h3>
                    <p className="text-blue-700">Covering for {detailJob.teacher_name}</p>
                  </div>
                  
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-xs uppercase mb-1">Date</div>
                      <div className="font-medium">{formatDate(detailJob.date)}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-xs uppercase mb-1">Room</div>
                      <div className="font-medium">{detailJob.room}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-xs uppercase mb-1">Subject</div>
                      <div className="font-medium">{detailJob.subject}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-xs uppercase mb-1">Grade</div>
                      <div className="font-medium">{detailJob.grade}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-xs uppercase mb-1">Students</div>
                      <div className="font-medium">{detailJob.students}</div>
                    </div>
                    <div className="bg-gray-50 rounded-lg p-3">
                      <div className="text-gray-500 text-xs uppercase mb-1">Department</div>
                      <div className="font-medium">{detailJob.department}</div>
                    </div>
                  </div>

                  {detailJob.notes && (
                    <div className="bg-yellow-50 rounded-lg p-3 border border-yellow-200">
                      <div className="text-yellow-700 text-xs uppercase mb-1 font-medium">📝 Notes</div>
                      <div className="text-sm text-gray-700">{detailJob.notes}</div>
                    </div>
                  )}

                  {detailJob.lesson_plan_url && (
                    <a 
                      href={detailJob.lesson_plan_url} 
                      target="_blank" 
                      rel="noopener noreferrer"
                      className="block bg-purple-50 rounded-lg p-3 border border-purple-200 hover:bg-purple-100"
                    >
                      <div className="text-purple-700 font-medium text-sm">📄 View Lesson Plan →</div>
                    </a>
                  )}

                  <div className="bg-green-50 rounded-lg p-4 flex justify-between items-center">
                    <span className="text-green-700 font-medium">Compensation</span>
                    <span className="text-2xl font-bold text-green-600">${detailJob.pay_amount.toFixed(2)}</span>
                  </div>

                  <div className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                    <span className="text-gray-600">Status</span>
                    <span className={`px-3 py-1 rounded-full text-sm font-medium ${
                      detailJob.status === 'covered' ? 'bg-blue-100 text-blue-700' :
                      detailJob.status === 'completed' ? 'bg-green-100 text-green-700' :
                      detailJob.status === 'uncovered' ? 'bg-yellow-100 text-yellow-700' :
                      'bg-gray-100 text-gray-700'
                    }`}>
                      {detailJob.status === 'covered' ? '📅 Scheduled' : 
                       detailJob.status === 'completed' ? '✓ Completed' :
                       detailJob.status}
                    </span>
                  </div>
                </div>
              ) : (
                <p className="text-center text-gray-500 py-8">No details available</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Apply to District Modal */}
      {showApplyModal && applyingDistrict && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-md mx-4">
            <div className="bg-blue-50 px-5 py-4 border-b border-blue-200">
              <h2 className="font-semibold text-gray-900">Apply to District</h2>
              <p className="text-sm text-gray-600">{applyingDistrict.district_name}</p>
            </div>
            <div className="p-5 space-y-4">
              <p className="text-sm text-gray-700">
                Your application will be reviewed by the district administrator. You&apos;ll be notified once approved.
              </p>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Notes for Administrator (Optional)
                </label>
                <textarea
                  value={applyNotes}
                  onChange={(e) => setApplyNotes(e.target.value)}
                  placeholder="Any relevant experience or certifications..."
                  rows={3}
                  className="w-full p-2 border rounded-lg text-sm"
                />
              </div>
            </div>
            <div className="px-5 py-4 border-t flex justify-end space-x-2">
              <button
                onClick={() => {
                  setShowApplyModal(false);
                  setApplyingDistrict(null);
                  setApplyNotes('');
                }}
                className="px-4 py-2 text-gray-700 hover:bg-gray-100 rounded-lg text-sm"
              >
                Cancel
              </button>
              <button
                onClick={handleApplyDistrict}
                disabled={applySubmitting}
                className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:opacity-50 text-sm font-medium"
              >
                {applySubmitting ? 'Submitting...' : 'Submit Application'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Completed Jobs Modal */}
      {showCompletedModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Completed Jobs ({myAssignments.completed.length})</h2>
              <button onClick={() => setShowCompletedModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto">
              {myAssignments.completed.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No completed jobs yet.</p>
              ) : (
                <div className="space-y-3">
                  {myAssignments.completed.map((a) => {
                    const badge = getStatusBadge(a);
                    return (
                      <div key={a.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{a.class_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">{a.school_name || a.school} • Room {a.room}</div>
                            <div className="text-xs text-gray-500 mt-1">{formatDate(a.date)}</div>
                          </div>
                          <div className="text-right">
                            <span className="text-sm font-medium text-green-600">${(a.pay || 0).toFixed(2)}</span>
                            <button
                              onClick={() => {
                                handleViewDetails(a.coverage_request_id || a.id);
                                setShowCompletedModal(false);
                              }}
                              className="block text-xs text-blue-600 hover:text-blue-700 mt-1"
                            >
                              View Details
                            </button>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Available Jobs Modal */}
      {showAvailableModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Available Jobs ({availableJobs.length + urgentJobs.length})</h2>
              <button onClick={() => setShowAvailableModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto">
              {urgentJobs.length > 0 && (
                <div className="mb-4">
                  <h3 className="text-sm font-medium text-red-600 mb-2">🚨 Urgent</h3>
                  <div className="space-y-2">
                    {urgentJobs.map((job) => (
                      <div key={job.id} className="p-3 bg-red-50 rounded-lg border border-red-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{job.title}</div>
                            <div className="text-xs text-gray-600">{job.school_name} • {job.date}</div>
                          </div>
                          <button
                            onClick={() => {
                              handleAcceptJob(job.id, true);
                              setShowAvailableModal(false);
                            }}
                            className="text-sm bg-green-600 text-white px-3 py-1 rounded hover:bg-green-700"
                          >
                            Accept ${job.pay.toFixed(2)}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {availableJobs.length > 0 && (
                <div>
                  <h3 className="text-sm font-medium text-gray-700 mb-2">Regular Jobs</h3>
                  <div className="space-y-2">
                    {availableJobs.slice(0, 10).map((job) => (
                      <div key={job.id} className="p-3 bg-gray-50 rounded-lg border">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="font-medium text-gray-900">{job.title}</div>
                            <div className="text-xs text-gray-600">{job.school_name} • {job.date}</div>
                          </div>
                          <button
                            onClick={() => {
                              handleAcceptJob(job.id);
                              setShowAvailableModal(false);
                            }}
                            className="text-sm bg-blue-600 text-white px-3 py-1 rounded hover:bg-blue-700"
                          >
                            Accept ${job.pay.toFixed(2)}
                          </button>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              )}
              {availableJobs.length === 0 && urgentJobs.length === 0 && (
                <p className="text-gray-500 text-sm text-center py-8">No jobs available right now.</p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Upcoming Jobs Modal */}
      {showUpcomingModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
          <div className="bg-white rounded-xl w-full max-w-2xl mx-4 max-h-[80vh] overflow-hidden flex flex-col">
            <div className="px-5 py-4 border-b flex justify-between items-center">
              <h2 className="font-semibold text-gray-900">Upcoming Assignments ({myAssignments.upcoming.length})</h2>
              <button onClick={() => setShowUpcomingModal(false)} className="text-gray-500 hover:text-gray-700">✕</button>
            </div>
            <div className="p-5 overflow-y-auto">
              {myAssignments.upcoming.length === 0 ? (
                <p className="text-gray-500 text-sm text-center py-8">No upcoming assignments. Accept some jobs!</p>
              ) : (
                <div className="space-y-3">
                  {myAssignments.upcoming.map((a) => {
                    const badge = getStatusBadge(a);
                    const canWithdrawJob = canWithdraw(a);
                    
                    return (
                      <div key={a.id} className="p-3 bg-blue-50 rounded-lg border border-blue-200">
                        <div className="flex justify-between items-start">
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{a.class_name}</span>
                              <span className={`text-xs px-2 py-0.5 rounded-full ${badge.className}`}>
                                {badge.label}
                              </span>
                            </div>
                            <div className="text-xs text-gray-600">{a.school_name || a.school} • Room {a.room}</div>
                            <div className="text-xs text-gray-500 mt-1">{formatDate(a.date)} • {formatTime(a.start_time)} - {formatTime(a.end_time)}</div>
                          </div>
                          <div className="text-right flex flex-col items-end gap-1">
                            <span className="text-sm font-medium text-blue-600">${(a.pay || 0).toFixed(2)}</span>
                            <div className="flex gap-1">
                              <button
                                onClick={() => {
                                  handleViewDetails(a.coverage_request_id || a.id);
                                  setShowUpcomingModal(false);
                                }}
                                className="text-xs text-blue-600 hover:text-blue-700"
                              >
                                Details
                              </button>
                              {canWithdrawJob ? (
                                <button
                                  onClick={() => {
                                    setWithdrawJob(a);
                                    setShowWithdrawModal(true);
                                    setShowUpcomingModal(false);
                                  }}
                                  className="text-xs text-red-600 hover:text-red-700"
                                >
                                  Withdraw
                                </button>
                              ) : (
                                <button
                                  onClick={() => {
                                    setCallOutJob(a);
                                    setShowCallOutModal(true);
                                    setShowUpcomingModal(false);
                                  }}
                                  className="text-xs text-orange-600 hover:text-orange-700"
                                >
                                  Call Out
                                </button>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                    );
                  })}
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
