'use client';

import React, { useEffect, useMemo, useRef, useState } from 'react';

type Role = 'admin' | 'teacher' | 'parent' | 'sub';

type Toast = { id: string; message: string; type: 'success' | 'error' };

export default function CoverageHub({ role, fullName }: { role: Role; fullName: string }) {
  const initial = useMemo(() => (fullName || 'User').split(' ')[0], [fullName]);
  const [currentView, setCurrentView] = useState<Role>(role);
  const [emergencyMode, setEmergencyMode] = useState(false);
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [uncoveredCount, setUncoveredCount] = useState(3);
  const [availableCount, setAvailableCount] = useState(12);

  // Keep view in sync with role prop (admin preview toggle)
  useEffect(() => {
    setCurrentView(role);
  }, [role]);

  // Toast helpers
  function pushToast(message: string, type: 'success' | 'error' = 'success') {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, message, type }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 4000);
  }

  // Simulate real-time updates to uncovered/available (demo)
  useEffect(() => {
    const i = setInterval(() => {
      if (currentView === 'admin') {
        setUncoveredCount((c) => (c > 0 && Math.random() > 0.7 ? c - 1 : c));
      }
    }, 10_000);
    return () => clearInterval(i);
  }, [currentView]);

  // Countdown timer for an urgent item (demo)
  const [urgentMM, setUrgentMM] = useState(42);
  const [urgentSS, setUrgentSS] = useState(15);
  useEffect(() => {
    const i = setInterval(() => {
      setUrgentSS((s) => {
        if (urgentMM <= 0 && s <= 0) return 0;
        if (s > 0) return s - 1;
        setUrgentMM((m) => (m > 0 ? m - 1 : 0));
        return 59;
      });
    }, 1000);
    return () => clearInterval(i);
  }, [urgentMM]);

  const urgentTimerText = useMemo(() => {
    const mm = String(Math.max(0, urgentMM)).padStart(2, '0');
    const ss = String(Math.max(0, urgentSS)).padStart(2, '0');
    return urgentMM <= 0 && urgentSS <= 0 ? 'OVERDUE' : `${mm}:${ss}`;
  }, [urgentMM, urgentSS]);

  // Emergency mode
  function toggleEmergencyMode() {
    setEmergencyMode((prev) => {
      const next = !prev;
      pushToast(
        next
          ? 'Emergency mode activated — skip approvals enabled'
          : 'Emergency mode deactivated',
        'success'
      );
      return next;
    });
  }

  // Admin actions (mock)
  function emergencyBatchAssign() {
    pushToast('Opening batch assignment interface…', 'success');
    setTimeout(() => pushToast('Select multiple teachers to send mass notifications', 'success'), 800);
  }
  function markTeacherAbsent() {
    pushToast('Select teacher to mark absent for entire day…', 'success');
    setTimeout(() => pushToast('Teacher marked absent — removed from rotation and availability', 'success'), 1200);
  }
  function emergencyAssign(classId: string) {
    pushToast(`Starting emergency assignment for ${classId}…`, 'success');
    setTimeout(() => {
      pushToast('Winner accepted! Assignment logged.', 'success');
      setUncoveredCount((c) => Math.max(0, c - 1));
    }, 1600);
  }
  function viewAvailableTeachers() {
    pushToast('Available teachers: Anna Smith, Bob Johnson, David Wilson', 'success');
  }

  // Teacher actions (mock)
  function instantAcceptCoverage() {
    pushToast('Coverage accepted! You won the race condition. Admin notified.', 'success');
  }

  // Substitute actions (mock)
  function acceptJob(kind: 'urgent' | 'normal') {
    pushToast(kind === 'urgent' ? 'Urgent job accepted — thank you!' : 'Job accepted!', 'success');
  }

  // UI helpers
  const NavButton: React.FC<
    React.PropsWithChildren<{ active: boolean; onClick: () => void }>
  > = ({ active, onClick, children }) => (
    <button
      onClick={onClick}
      className={[
        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
        active
          ? 'bg-white text-neutral-900 shadow-sm'
          : 'text-neutral-600 hover:text-neutral-900',
      ].join(' ')}
    >
      {children}
    </button>
  );

  return (
    <>
      {/* Top action strip: Emergency + quick status (kept lightweight; main page already has header) */}
      <div className="mb-6 flex items-center justify-between">
        {/* Role-local tab switcher (shown only if admin to mirror the design’s selector).
            Admins already have the server-side RoleViewToggle; this is a local UX helper that doesn't affect cookies. */}
        {role === 'admin' && (
          <div className="hidden md:flex items-center space-x-1 bg-neutral-100 rounded-lg p-1">
            <NavButton active={currentView === 'admin'} onClick={() => setCurrentView('admin')}>
              Admin
            </NavButton>
            <NavButton active={currentView === 'teacher'} onClick={() => setCurrentView('teacher')}>
              Teacher
            </NavButton>
            <NavButton active={currentView === 'sub'} onClick={() => setCurrentView('sub')}>
              Substitute
            </NavButton>
          </div>
        )}

        <div className="flex items-center gap-3 ml-auto">
          <button
            onClick={toggleEmergencyMode}
            className={[
              'relative px-3 py-2 rounded-lg transition-colors text-sm font-medium',
              emergencyMode
                ? 'bg-neutral-600 text-white hover:bg-neutral-700'
                : 'bg-[rgba(239,68,68,1)] text-white hover:bg-[rgba(239,68,68,0.9)]',
            ].join(' ')}
            aria-pressed={emergencyMode}
          >
            {!emergencyMode ? (
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.33 16.5C2.56 17.333 3.522 19 5.062 19z" />
                </svg>
                Emergency
              </span>
            ) : (
              <span className="inline-flex items-center">
                <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                </svg>
                Exit Emergency
              </span>
            )}
          </button>

          {/* Pulsing notification dot (cosmetic) */}
          <div className="relative p-2 text-neutral-400 hover:text-[rgba(239,68,68,1)] transition-colors">
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5-5-5h5v-5A7.5 7.5 0 017.5 5H7.5" />
            </svg>
            <div className="absolute -top-1 -right-1 w-3 h-3 bg-[rgba(239,68,68,1)] rounded-full animate-pulse" />
          </div>

          <div className="w-8 h-8 bg-[rgba(59,130,246,1)] rounded-full flex items-center justify-center">
            <span className="text-white text-sm font-medium">{(initial || 'A')[0]}</span>
          </div>
        </div>
      </div>

      {/* Urgent banner (admin only / when there are uncovered classes) */}
      {currentView === 'admin' && uncoveredCount > 0 && (
        <div className="bg-[rgba(239,68,68,1)] text-white px-4 py-3 rounded-lg mb-6">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-5 h-5 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.33 16.5C2.56 17.333 3.522 19 5.062 19z" />
              </svg>
              <span className="font-medium">{uncoveredCount} classes need immediate coverage</span>
            </div>
            <button
              onClick={() => setUncoveredCount(0)}
              className="text-white/80 hover:text-white"
              aria-label="Hide urgent banner"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
          </div>
        </div>
      )}

      {/* Views */}
      {currentView === 'admin' && (
        <AdminView
          uncoveredCount={uncoveredCount}
          availableCount={availableCount}
          emergencyAssign={emergencyAssign}
          emergencyBatchAssign={emergencyBatchAssign}
          markTeacherAbsent={markTeacherAbsent}
          viewAvailableTeachers={viewAvailableTeachers}
          urgentTimerText={urgentTimerText}
          pushToast={pushToast}
          setAvailableCount={setAvailableCount}
        />
      )}

      {currentView === 'teacher' && (
        <TeacherView
          firstName={(fullName || 'User').split(' ')[0]}
          urgentTimerText={urgentTimerText}
          instantAcceptCoverage={instantAcceptCoverage}
          pushToast={pushToast}
        />
      )}

      {currentView === 'sub' && (
        <SubView
          acceptJob={acceptJob}
          pushToast={pushToast}
        />
      )}

      {/* Toast container */}
      <div className="fixed top-4 right-4 z-50 space-y-2">
        {toasts.map((t) => (
          <div
            key={t.id}
            className={[
              'text-white px-4 py-3 rounded-xl shadow-lg flex items-center space-x-3 transform transition-transform duration-300 max-w-sm',
              t.type === 'success' ? 'bg-[rgba(34,197,94,1)]' : 'bg-[rgba(239,68,68,1)]',
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

/* ========================= ADMIN VIEW ========================= */

function AdminView(props: {
  uncoveredCount: number;
  availableCount: number;
  urgentTimerText: string;
  emergencyAssign: (id: string) => void;
  emergencyBatchAssign: () => void;
  markTeacherAbsent: () => void;
  viewAvailableTeachers: () => void;
  pushToast: (m: string, t?: 'success' | 'error') => void;
  setAvailableCount: React.Dispatch<React.SetStateAction<number>>;
}) {
  const {
    uncoveredCount,
    availableCount,
    urgentTimerText,
    emergencyAssign,
    emergencyBatchAssign,
    markTeacherAbsent,
    viewAvailableTeachers,
    pushToast,
    setAvailableCount,
  } = props;

  return (
    <div className="space-y-8">
      {/* Header strip */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Coverage Dashboard</h1>
          <p className="text-neutral-600 mt-1">Manage time-off requests and substitute assignments</p>
        </div>
        <button
          onClick={() => pushToast('Emergency mode is controlled above.', 'success')}
          className="px-4 py-2 bg-[rgba(239,68,68,1)] text-white rounded-lg hover:bg-[rgba(239,68,68,0.9)] transition-colors font-medium"
        >
          Emergency Mode
        </button>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-5 gap-6">
        <StatCard
          label="Pending Requests"
          value="7"
          icon={
            <svg className="w-6 h-6 text-[rgba(245,158,11,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          }
          badgeBg="bg-[rgba(245,158,11,0.1)]"
        />

        <StatCard
          label="Uncovered Classes"
          value={String(uncoveredCount)}
          valueClass="text-[rgba(239,68,68,1)]"
          icon={
            <svg className="w-6 h-6 text-[rgba(239,68,68,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.33 16.5C2.56 17.333 3.522 19 5.062 19z" />
            </svg>
          }
          badgeBg="bg-[rgba(239,68,68,0.1)]"
        />

        <StatCard
          label="Available Subs"
          value={String(availableCount)}
          valueClass="text-[rgba(34,197,94,1)]"
          icon={
            <svg className="w-6 h-6 text-[rgba(34,197,94,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0zm6 3a2 2 0 11-4 0 2 2 0 014 0zM7 10a2 2 0 11-4 0 2 2 0 014 0z" />
            </svg>
          }
          badgeBg="bg-[rgba(34,197,94,0.1)]"
        />

        <StatCard
          label="Coverage Rate"
          value="94%"
          valueClass="text-[rgba(34,197,94,1)]"
          icon={
            <svg className="w-6 h-6 text-[rgba(34,197,94,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
            </svg>
          }
          badgeBg="bg-[rgba(34,197,94,0.1)]"
        />

        <StatCard
          label="Payroll Pending"
          value="$2,340"
          valueClass="text-purple-600"
          icon={
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          }
          badgeBg="bg-purple-100"
        />
      </div>

      {/* Critical Unassigned Classes */}
      <div className="bg-[rgba(254,226,226,1)] border-2 border-[rgba(239,68,68,0.3)] rounded-xl shadow-lg overflow-hidden">
        <div className="px-6 py-4 bg-[rgba(239,68,68,1)] text-white">
          <div className="flex items-center justify-between">
            <div className="flex items-center space-x-3">
              <svg className="w-6 h-6 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.33 16.5C2.56 17.333 3.522 19 5.062 19z" />
              </svg>
              <h2 className="text-xl font-semibold">CRITICAL: Unassigned Classes</h2>
            </div>
            <div className="flex space-x-2">
              <button
                onClick={emergencyBatchAssign}
                className="px-4 py-2 bg-white text-[rgba(239,68,68,1)] rounded-lg hover:bg-neutral-100 transition-colors font-medium text-sm"
              >
                Batch Assign
              </button>
              <button
                onClick={markTeacherAbsent}
                className="px-4 py-2 bg-[rgba(185,28,28,1)] text-white rounded-lg hover:bg-[rgba(239,68,68,1)] transition-colors font-medium text-sm"
              >
                Mark Teacher Absent
              </button>
            </div>
          </div>
        </div>

        <div className="p-6 space-y-4">
          {/* Card 1 (URGENT) */}
          <div className="bg-white border-2 border-[rgba(239,68,68,0.2)] rounded-lg p-4 relative">
            <div className="absolute top-2 right-2 text-right">
              <div className="text-lg font-bold text-[rgba(239,68,68,1)] animate-pulse">{/* dynamic example */}38:42</div>
              <div className="text-xs text-neutral-500">until start</div>
            </div>
            <div className="pr-20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">Period 3 — Algebra II</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(254,226,226,1)] text-[rgba(239,68,68,1)]">
                  <span className="w-2 h-2 bg-[rgba(239,68,68,1)] rounded-full mr-1 animate-pulse" />
                  URGENT
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <Info label="Teacher" value="Ms. Johnson (Absent)" />
                <Info label="Room" value="204" />
                <Info label="Students" value="28 students" />
                <Info label="Expires" value={<span className="text-[rgba(239,68,68,1)]">End of Day</span>} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => emergencyAssign('class1')}
                  className="px-4 py-2 bg-[rgba(239,68,68,1)] text-white rounded-lg hover:bg-[rgba(239,68,68,0.9)] transition-colors text-sm font-medium"
                >
                  Emergency Assign
                </button>
                <button
                  onClick={viewAvailableTeachers}
                  className="px-4 py-2 border border-[rgba(239,68,68,1)] text-[rgba(239,68,68,1)] rounded-lg hover:bg-[rgba(239,68,68,0.05)] transition-colors text-sm"
                >
                  View Available (8)
                </button>
                <button
                  onClick={() => pushToast('Mass broadcast sent.', 'success')}
                  className="px-4 py-2 bg-[rgba(59,130,246,1)] text-white rounded-lg hover:bg-[rgba(30,64,175,1)] transition-colors text-sm"
                >
                  Mass Broadcast
                </button>
              </div>
            </div>
          </div>

          {/* Card 2 */}
          <div className="bg-white border border-[rgba(245,158,11,0.3)] rounded-lg p-4 relative">
            <div className="absolute top-2 right-2 text-right">
              <div className="text-lg font-bold text-[rgba(245,158,11,1)]">1:15:22</div>
              <div className="text-xs text-neutral-500">until start</div>
            </div>
            <div className="pr-20">
              <div className="flex items-center justify-between mb-2">
                <h3 className="text-lg font-semibold text-neutral-900">Period 5 — Biology Lab</h3>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(254,243,199,1)] text-[rgba(245,158,11,1)]">
                  Needs Coverage
                </span>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <Info label="Teacher" value="Dr. Chen (Sick)" />
                <Info label="Room" value="Lab 2" />
                <Info label="Students" value="24 students" />
                <Info label="Expires" value="End of Day" />
              </div>
              <div className="flex flex-wrap gap-3">
                <button
                  onClick={() => pushToast('Coverage assigned.', 'success')}
                  className="px-4 py-2 bg-[rgba(59,130,246,1)] text-white rounded-lg hover:bg-[rgba(30,64,175,1)] transition-colors text-sm font-medium"
                >
                  Assign Coverage
                </button>
                <button
                  onClick={viewAvailableTeachers}
                  className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
                >
                  View Available (12)
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Department Rotation System */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">Department Coverage Rotation</h2>
            <p className="text-sm text-neutral-600 mt-1">Fair rotation system for internal coverage assignments</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => pushToast('Opening creation form…', 'success')}
              className="px-4 py-2 bg-[rgba(59,130,246,1)] text-white rounded-lg hover:bg-[rgba(30,64,175,1)] transition-colors text-sm font-medium"
            >
              Create Opening
            </button>
            <button
              onClick={() => pushToast('Loading history…', 'success')}
              className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
            >
              Coverage History
            </button>
          </div>
        </div>

        <div className="p-6">
          {/* Department tabs */}
          <DepartmentTabs
            tabs={['Math', 'Science', 'English', 'History', 'Arts', 'PE', 'Languages']}
            onChange={(t) => pushToast(`Viewing ${t} department rotation`, 'success')}
          />

          {/* Availability grid */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-neutral-900 mb-4">Real-Time Teacher Availability</h3>
            <div className="bg-neutral-50 rounded-lg p-4 overflow-x-auto">
              <AvailabilityGrid />
              <div className="mt-4 flex items-center space-x-6 text-xs">
                <Legend swatchClass="bg-[rgba(34,197,94,1)]" label="Free (Available)" />
                <Legend swatchClass="bg-neutral-300" label="Teaching" />
                <Legend swatchClass="bg-[rgba(59,130,246,1)]" label="Covering" />
                <Legend swatchClass="bg-[rgba(239,68,68,1)]" label="Absent/Unavailable" />
              </div>
            </div>
          </div>

          {/* Rotation Queue Table */}
          <RotationQueue
            onAssign={() => pushToast('Assigned via rotation.', 'success')}
            onSkip={() => pushToast('Skipped in rotation.', 'success')}
            onOverride={() => pushToast('Override requested.', 'success')}
            onMarkPresent={() => pushToast('Teacher marked present and added back to rotation', 'success')}
          />

          {/* Fairness Metrics */}
          <div className="bg-neutral-50 rounded-lg p-4">
            <div className="flex items-center justify-between mb-3">
              <h3 className="font-semibold text-neutral-900">Department Fairness Score</h3>
              <span className="text-sm font-medium text-[rgba(34,197,94,1)]">92% Fair Distribution</span>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm">
              <Info label="Standard Deviation" value="2.3 hours" />
              <Info label="Max Variance" value="7.5 hours" />
              <Info label="Next Audit" value="Feb 1, 2024" />
            </div>
          </div>
        </div>
      </div>

      {/* Coverage Openings */}
      <Openings
        urgentTimerText={urgentTimerText}
        onViewOffers={() => pushToast('Viewing offers…', 'success')}
        onAssignDirect={() => pushToast('Directly assigned.', 'success')}
        onCancel={() => pushToast('Opening cancelled.', 'success')}
        onDailySchedule={() => pushToast('Opening daily schedule grid…', 'success')}
        onExport={() => pushToast('Exporting openings…', 'success')}
      />

      {/* Coverage & Compensation Tracker */}
      <CompensationTracker
        onExportPayroll={() => pushToast('Payroll exported.', 'success')}
        onFairnessReport={() => pushToast('Fairness report generated.', 'success')}
        onApprove={() => pushToast('Payroll approved.', 'success')}
        onView={() => pushToast('Opening detailed payroll view…', 'success')}
      />

      {/* Recent Coverage Activity */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
        <h3 className="text-lg font-semibold text-neutral-900 mb-4">Recent Coverage Activity</h3>
        <AuditEntry
          dotClass="bg-[rgba(34,197,94,1)]"
          title="John Davis covered Math 101"
          time="2:30 PM - 3:15 PM"
          detail="Period 6 • Room 204 • Approved by Admin"
          meta="Duration: 45 minutes • Rate: $30/hr • Amount: $22.50"
        />
        <AuditEntry
          dotClass="bg-[rgba(245,158,11,1)]"
          title="Anna Martinez covered English Lit"
          time="1:45 PM - 2:30 PM"
          detail="Period 5 • Room 108 • Pending verification"
          meta="Duration: 45 minutes • Rate: $30/hr • Amount: $22.50"
        />
      </div>

      {/* Available Now */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Available Now</h2>
          <p className="text-sm text-neutral-600 mt-1">Teachers with free blocks this period</p>
        </div>
        <div className="p-6 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          <AvailableCard initials="JD" name="John Davis" sub="Math Dept • Last sub: 2 weeks ago" onAssign={() => pushToast('Assigned John Davis.', 'success')} />
          <AvailableCard initials="AM" name="Anna Martinez" sub="English Dept • Last sub: 1 month ago" onAssign={() => pushToast('Assigned Anna Martinez.', 'success')} />
        </div>
      </div>
    </div>
  );
}

/* ========================= TEACHER VIEW ========================= */

function TeacherView(props: {
  firstName: string;
  urgentTimerText: string;
  instantAcceptCoverage: () => void;
  pushToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const { firstName, urgentTimerText, instantAcceptCoverage, pushToast } = props;

  function onSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    (e.currentTarget as HTMLFormElement).reset();
    pushToast('Time off request submitted successfully!', 'success');
  }

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">My Time Off</h1>
        <p className="text-neutral-600 mt-1">Request time off and manage your coverage</p>
      </div>

      {/* URGENT panel */}
      <div className="relative bg-[rgba(254,226,226,1)] border-2 border-[rgba(239,68,68,0.3)] rounded-xl p-6">
        <div className="flex items-start justify-between">
          <div className="flex items-start space-x-4">
            <div className="w-12 h-12 bg-[rgba(239,68,68,0.1)] rounded-lg flex items-center justify-center flex-shrink-0">
              <svg className="w-6 h-6 text-[rgba(239,68,68,1)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.33 16.5C2.56 17.333 3.522 19 5.062 19z" />
              </svg>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-neutral-900 mb-2">URGENT: Coverage Needed</h3>
              <p className="text-neutral-700 mb-3">
                <strong>Period 3 — Algebra II</strong> needs immediate coverage
              </p>
              <div className="text-sm text-neutral-600 mb-4">
                <div>• Room 204 • 28 students</div>
                <div>• Starts in <span className="font-bold text-[rgba(239,68,68,1)]">{urgentTimerText}</span></div>
                <div>• Pay: $30.00 for 45 minutes</div>
              </div>
            </div>
          </div>
          <div className="text-right">
            <div className="text-2xl font-bold text-[rgba(239,68,68,1)] animate-pulse mb-2">{urgentTimerText}</div>
            <div className="text-xs text-neutral-500 mb-4">until start</div>
            <button
              onClick={instantAcceptCoverage}
              className="px-6 py-3 bg-[rgba(239,68,68,1)] text-white rounded-lg hover:bg-[rgba(239,68,68,0.9)] transition-colors font-bold text-lg shadow-lg"
            >
              ACCEPT NOW
            </button>
          </div>
        </div>
      </div>

      {/* Today’s coverage note */}
      <div className="bg-[rgba(219,234,254,1)] border border-[rgba(59,130,246,0.2)] rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-[rgba(59,130,246,0.1)] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[rgba(59,130,246,1)]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Today's Coverage</h3>
            <p className="text-neutral-700 mb-3">Your classes are covered by <strong>Mike Thompson</strong> today.</p>
            <div className="text-sm text-neutral-600">
              <div>• Period 2: Math 101 (Room 204)</div>
              <div>• Period 4: Algebra II (Room 204)</div>
              <div>• Period 6: Geometry (Room 204)</div>
            </div>
          </div>
        </div>
      </div>

      {/* Earnings */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">My Extra Coverage Earnings</h3>
            <p className="text-neutral-600">Track your substitute teaching compensation</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <StatNumber value="$127.50" label="This Pay Period" valueClass="text-purple-600" />
          <StatNumber value="8.5" label="Hours Worked" />
          <StatNumber value="$67.50" label="Pending Approval" valueClass="text-[rgba(245,158,11,1)]" />
          <StatNumber value="$60.00" label="Approved" valueClass="text-[rgba(34,197,94,1)]" />
        </div>

        <div className="mt-4 pt-4 border-t border-purple-200">
          <button onClick={() => pushToast('Expanding earnings history…', 'success')} className="text-purple-600 hover:text-purple-700 text-sm font-medium">
            View Full History →
          </button>
        </div>
      </div>

      {/* Request form */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">Request Time Off</h2>
        </div>
        <div className="p-6">
          <form className="space-y-6" onSubmit={onSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <Field label="Start Date">
                <input type="date" className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[rgba(59,130,246,1)] focus:border-transparent" />
              </Field>
              <Field label="End Date">
                <input type="date" className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[rgba(59,130,246,1)] focus:border-transparent" />
              </Field>
            </div>

            <Field label="Reason">
              <select className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[rgba(59,130,246,1)] focus:border-transparent">
                <option>Personal</option>
                <option>Medical</option>
                <option>Family Emergency</option>
                <option>Professional Development</option>
                <option>Other</option>
              </select>
            </Field>

            <Field label="Notes">
              <textarea rows={3} className="w-full px-4 py-3 border border-neutral-200 rounded-lg focus:ring-2 focus:ring-[rgba(59,130,246,1)] focus:border-transparent" placeholder="Additional details..." />
            </Field>

            <Field label="Lesson Plan">
              <div className="border-2 border-dashed border-neutral-200 rounded-lg p-6 text-center hover:border-[rgba(59,130,246,0.5)] transition-colors cursor-pointer">
                <svg className="w-8 h-8 text-neutral-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-neutral-600">Click to upload lesson plan or drag and drop</p>
                <p className="text-sm text-neutral-500 mt-1">PDF, DOC, or DOCX files</p>
              </div>
            </Field>

            <button type="submit" className="w-full bg-[rgba(59,130,246,1)] text-white py-3 px-6 rounded-lg hover:bg-[rgba(30,64,175,1)] transition-colors font-medium">
              Request Time Off
            </button>
          </form>
        </div>
      </div>

      {/* My Requests */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">My Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <Th>Dates</Th>
                <Th>Status</Th>
                <Th>Substitute</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <tr>
                <Td>
                  <div className="font-medium text-neutral-900">Jan 15, 2024</div>
                  <div className="text-sm text-neutral-500">Personal</div>
                </Td>
                <Td>
                  <Badge color="green">Approved</Badge>
                </Td>
                <Td>
                  <div className="font-medium text-neutral-900">Mike Thompson</div>
                  <div className="text-sm text-neutral-500">Confirmed</div>
                </Td>
                <Td>
                  <button className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">View</button>
                </Td>
              </tr>

              <tr>
                <Td>
                  <div className="font-medium text-neutral-900">Jan 22–23, 2024</div>
                  <div className="text-sm text-neutral-500">Medical</div>
                </Td>
                <Td>
                  <Badge color="amber">Pending</Badge>
                </Td>
                <Td>
                  <div className="text-neutral-500">Not assigned</div>
                </Td>
                <Td className="space-x-3">
                  <button className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">Edit</button>
                  <button className="text-[rgba(239,68,68,1)] hover:text-[rgba(239,68,68,0.8)]">Cancel</button>
                </Td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* My Coverage Log */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900">My Coverage Log</h2>
            <p className="text-sm text-neutral-600 mt-1">Track your substitute teaching assignments and payments</p>
          </div>
          <button
            onClick={() => pushToast('Exporting coverage log for tax purposes…', 'success')}
            className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm"
          >
            Export for Taxes
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-neutral-50">
              <tr>
                <Th>Date</Th>
                <Th>Class</Th>
                <Th>Periods</Th>
                <Th>Status</Th>
                <Th>Payment</Th>
                <Th>Actions</Th>
              </tr>
            </thead>
            <tbody className="divide-y divide-neutral-200">
              <CoverageLogRow
                date="Jan 12, 2024"
                weekday="Friday"
                course="Biology Lab"
                teacher="Dr. Chen • Room 301"
                periods="Period 3–4"
                duration="1.5 hours"
                status={<Badge color="green">Verified</Badge>}
                amount="$45.00"
                rate="$30/hr"
                onView={() => pushToast('Viewing details for C001', 'success')}
              />
              <CoverageLogRow
                date="Jan 10, 2024"
                weekday="Wednesday"
                course="Algebra II"
                teacher="Ms. Rodriguez • Room 205"
                periods="Period 2"
                duration="0.75 hours"
                status={<Badge color="amber">Pending Verification</Badge>}
                amount="$22.50"
                rate="$30/hr"
                onView={() => pushToast('Viewing details for C002', 'success')}
                onDispute={() => pushToast('Dispute initiated; admin will review within 48 hours.', 'success')}
              />
              <CoverageLogRow
                date="Jan 8, 2024"
                weekday="Monday"
                course="World History"
                teacher="Mr. Johnson • Room 102"
                periods="Period 1, 5–6"
                duration="2.25 hours"
                status={<Badge color="green">Paid</Badge>}
                amount="$67.50"
                rate="$30/hr"
                onView={() => pushToast('Viewing details for C003', 'success')}
              />
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}

/* ========================= SUB VIEW ========================= */

function SubView(props: {
  acceptJob: (kind: 'urgent' | 'normal') => void;
  pushToast: (m: string, t?: 'success' | 'error') => void;
}) {
  const { acceptJob, pushToast } = props;
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold text-neutral-900">Available Jobs</h1>
        <p className="text-neutral-600 mt-1">Find and accept substitute teaching opportunities</p>
      </div>

      {/* Earnings */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">My Earnings Tracker</h3>
            <p className="text-neutral-600">Track your substitute teaching income</p>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-4">
          <StatNumber value="$85.50" label="Today" valueClass="text-purple-600" />
          <StatNumber value="$420.00" label="This Week" />
          <StatNumber value="$1,680.00" label="This Month" valueClass="text-[rgba(34,197,94,1)]" />
          <StatNumber value="$12,450.00" label="Year to Date" valueClass="text-[rgba(59,130,246,1)]" />
        </div>

        <div className="border-t border-purple-200 pt-4 flex items-center justify-between text-sm">
          <div>
            <span className="text-neutral-600">Breakdown by School:</span>
            <span className="ml-2 text-neutral-900">Lincoln High: $280 • Roosevelt Middle: $140</span>
          </div>
          <button onClick={() => pushToast('Earnings export ready for tax filing!', 'success')} className="text-purple-600 hover:text-purple-700 font-medium">
            Export W-2 Ready →
          </button>
        </div>
      </div>

      {/* Urgent panel */}
      <div className="bg-[rgba(254,226,226,1)] border border-[rgba(239,68,68,0.2)] rounded-xl p-6">
        <div className="flex items-start space-x-4">
          <div className="w-12 h-12 bg-[rgba(239,68,68,0.1)] rounded-lg flex items-center justify-center flex-shrink-0">
            <svg className="w-6 h-6 text-[rgba(239,68,68,1)] animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01M5.062 19h13.876c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.33 16.5C2.56 17.333 3.522 19 5.062 19z" />
            </svg>
          </div>
          <div className="flex-1">
            <h3 className="text-lg font-semibold text-neutral-900 mb-2">Urgent: Last Minute Coverage Needed</h3>
            <p className="text-neutral-700 mb-4">Math 101 — Period 3 starts in 45 minutes at Lincoln High School</p>
            <div className="flex flex-wrap gap-3">
              <button
                onClick={() => acceptJob('urgent')}
                className="px-4 py-2 bg-[rgba(34,197,94,1)] text-white rounded-lg hover:bg-[rgba(34,197,94,0.9)] transition-colors font-medium"
              >
                Accept Job ($22.50)
              </button>
              <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
                Decline
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 w-full md:w-auto">
        {(['today', 'week', 'all'] as const).map((key) => (
          <button
            key={key}
            onClick={() => {
              setFilter(key);
              pushToast(`Showing ${key} jobs`, 'success');
            }}
            className={[
              'px-4 py-2 text-sm font-medium rounded-md transition-colors',
              filter === key
                ? 'bg-white text-neutral-900 shadow-sm'
                : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            {key === 'today' ? 'Today' : key === 'week' ? 'This Week' : 'All Available'}
          </button>
        ))}
      </div>

      {/* Jobs grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <JobCard
          title="English Literature"
          school="Lincoln High School"
          badge={{ text: 'Full Day', color: 'blue' }}
          date="January 18, 2024"
          time="8:00 AM - 3:30 PM"
          teacher="Ms. Sarah Wilson"
          onAccept={() => acceptJob('normal')}
        />
        <JobCard
          title="Biology Lab"
          school="Roosevelt Middle School"
          badge={{ text: 'Half Day', color: 'amber' }}
          date="January 19, 2024"
          time="1:00 PM - 3:30 PM"
          teacher="Dr. Michael Chen"
          onAccept={() => acceptJob('normal')}
        />
      </div>

      {/* Simple assignments calendar (static scaffold) */}
      <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
        <div className="px-6 py-4 border-b border-neutral-200">
          <h2 className="text-xl font-semibold text-neutral-900">My Assignments</h2>
        </div>
        <div className="p-6">
          <div className="grid grid-cols-7 gap-1 mb-4">
            {['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'].map((d) => (
              <div key={d} className="text-center text-sm font-medium text-neutral-500 py-2">
                {d}
              </div>
            ))}
          </div>
          <div className="grid grid-cols-7 gap-1 text-sm">
            <div className="aspect-square p-2 text-center text-neutral-400">31</div>
            {[...Array(14)].map((_, i) => (
              <div key={i} className="aspect-square p-2 text-center">{i + 1}</div>
            ))}
            <div className="aspect-square p-2 text-center relative">
              15
              <div className="absolute bottom-1 left-1 right-1 h-1 bg-[rgba(59,130,246,1)] rounded-full" />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

/* ========================= SMALL UI BUILDING BLOCKS ========================= */

function StatCard({
  label,
  value,
  valueClass,
  icon,
  badgeBg,
}: {
  label: string;
  value: string;
  valueClass?: string;
  icon: React.ReactNode;
  badgeBg: string;
}) {
  return (
    <div className="bg-white rounded-xl p-6 shadow-sm border border-neutral-200">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-sm text-neutral-600">{label}</p>
          <p className={['text-2xl font-bold', valueClass ?? 'text-neutral-900'].join(' ')}>{value}</p>
        </div>
        <div className={['w-12 h-12 rounded-lg flex items-center justify-center', badgeBg].join(' ')}>
          {icon}
        </div>
      </div>
    </div>
  );
}

const Info: React.FC<{ label: React.ReactNode; value: React.ReactNode }> = ({ label, value }) => (
  <div>
    <div className="text-neutral-500">{label}</div>
    <div className="font-medium text-neutral-900">{value}</div>
  </div>
);

const Legend: React.FC<{ swatchClass: string; label: string }> = ({ swatchClass, label }) => (
  <div className="flex items-center space-x-2">
    <div className={['w-4 h-4 rounded', swatchClass].join(' ')} />
    <span className="text-neutral-600">{label}</span>
  </div>
);

function DepartmentTabs({
  tabs,
  onChange,
}: {
  tabs: string[];
  onChange?: (t: string) => void;
}) {
  const [active, setActive] = useState(tabs[0]);
  return (
    <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-6 overflow-x-auto">
      {tabs.map((t) => {
        const isActive = t === active;
        return (
          <button
            key={t}
            onClick={() => {
              setActive(t);
              onChange?.(t);
            }}
            className={[
              'px-4 py-2 text-sm font-medium rounded-md transition-colors whitespace-nowrap',
              isActive ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900',
            ].join(' ')}
          >
            {t}
          </button>
        );
      })}
    </div>
  );
}

function AvailabilityGrid() {
  const cell = (cls: string, title: string, onClick?: () => void) => (
    <div
      className={['w-8 h-8 rounded text-center text-xs flex items-center justify-center cursor-default', cls].join(' ')}
      title={title}
      onClick={onClick}
    />
  );
  return (
    <div className="grid grid-cols-9 gap-2 min-w-max">
      <div className="text-xs font-medium text-neutral-500 p-2">Teacher</div>
      {['P1','P2','P3','P4','P5','P6','P7','Days Since Last'].map((h) => (
        <div key={h} className="text-xs font-medium text-neutral-500 p-2 text-center">{h}</div>
      ))}

      {/* Anna Smith */}
      <div className="text-sm font-medium text-neutral-900 p-2 bg-white rounded">Anna Smith</div>
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      <div className="text-sm font-bold text-[rgba(34,197,94,1)] p-2 bg-white rounded text-center">21 days</div>

      {/* Bob Johnson */}
      <div className="text-sm font-medium text-neutral-900 p-2 bg-white rounded">Bob Johnson</div>
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      <div className="text-sm font-bold text-[rgba(245,158,11,1)] p-2 bg-white rounded text-center">7 days</div>

      {/* Carol Davis (Absent) */}
      <div className="text-sm font-medium text-neutral-900 p-2 bg-white rounded opacity-50">Carol Davis</div>
      {Array.from({ length: 7 }).map((_, i) => (
        <div key={i} className="w-8 h-8 bg-[rgba(239,68,68,1)] rounded text-center text-xs flex items-center justify-center text-white" title="Absent">✗</div>
      ))}
      <div className="text-sm font-bold text-neutral-400 p-2 bg-white rounded text-center">3 days</div>

      {/* David Wilson */}
      <div className="text-sm font-medium text-neutral-900 p-2 bg-white rounded">David Wilson</div>
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(59,130,246,1)] text-white', 'Currently Covering')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      {cell('bg-neutral-300 text-neutral-600', 'Teaching')}
      {cell('bg-[rgba(34,197,94,1)] text-white cursor-pointer', 'Free — Available')}
      <div className="text-sm font-bold text-neutral-900 p-2 bg-white rounded text-center">5 days</div>
    </div>
  );
}

function RotationQueue(props: {
  onAssign: () => void;
  onSkip: () => void;
  onOverride: () => void;
  onMarkPresent: () => void;
}) {
  const { onAssign, onSkip, onOverride, onMarkPresent } = props;
  const ThSm: React.FC<React.PropsWithChildren> = ({ children }) => (
    <th className="px-4 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{children}</th>
  );
  const TdSm: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
    <td className={['px-4 py-4 whitespace-nowrap', className].join(' ')}>{children}</td>
  );

  return (
    <div className="overflow-x-auto mb-6">
      <table className="w-full">
        <thead className="bg-neutral-50">
          <tr>
            <ThSm>Up to Bat #</ThSm>
            <ThSm>Teacher</ThSm>
            <ThSm>Days Since Last</ThSm>
            <ThSm>Hours/$ This Month</ThSm>
            <ThSm>Status</ThSm>
            <ThSm>Actions</ThSm>
          </tr>
        </thead>
        <tbody className="divide-y divide-neutral-200">
          {/* Anna */}
          <tr>
            <TdSm>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-[rgba(59,130,246,1)] text-white rounded-full text-sm font-bold">1</span>
            </TdSm>
            <TdSm>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center mr-3">
                  <span className="text-[rgba(34,197,94,1)] text-sm font-medium">AS</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">Anna Smith</div>
                  <div className="text-sm text-neutral-500">Math Department</div>
                </div>
              </div>
            </TdSm>
            <TdSm>
              <div className="text-lg font-bold text-[rgba(34,197,94,1)]">21 days</div>
              <div className="text-sm text-neutral-500">Longest without coverage</div>
            </TdSm>
            <TdSm>
              <div className="text-sm text-neutral-900">4.5 hrs / $135.00</div>
              <div className="text-sm text-neutral-500">Below average</div>
            </TdSm>
            <TdSm>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(220,252,231,1)] text-[rgba(34,197,94,1)]">
                <span className="w-2 h-2 bg-[rgba(34,197,94,1)] rounded-full mr-1" />
                Free
              </span>
            </TdSm>
            <TdSm className="text-sm font-medium space-x-2">
              <button onClick={onAssign} className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">Assign</button>
              <button onClick={onSkip} className="text-[rgba(245,158,11,1)] hover:text-[rgba(245,158,11,0.8)]">Skip</button>
              <button onClick={onOverride} className="text-neutral-600 hover:text-neutral-800">Override</button>
            </TdSm>
          </tr>

          {/* Bob */}
          <tr>
            <TdSm>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-neutral-300 text-neutral-700 rounded-full text-sm font-bold">2</span>
            </TdSm>
            <TdSm>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[rgba(254,243,199,1)] rounded-full flex items-center justify-center mr-3">
                  <span className="text-[rgba(245,158,11,1)] text-sm font-medium">BJ</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">Bob Johnson</div>
                  <div className="text-sm text-neutral-500">Math Department</div>
                </div>
              </div>
            </TdSm>
            <TdSm>
              <div className="text-lg font-bold text-[rgba(245,158,11,1)]">7 days</div>
              <div className="text-sm text-neutral-500">Second in rotation</div>
            </TdSm>
            <TdSm>
              <div className="text-sm text-neutral-900">12.0 hrs / $360.00</div>
              <div className="text-sm text-neutral-500">Above average</div>
            </TdSm>
            <TdSm>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(220,252,231,1)] text-[rgba(34,197,94,1)]">
                <span className="w-2 h-2 bg-[rgba(34,197,94,1)] rounded-full mr-1" />
                Free
              </span>
            </TdSm>
            <TdSm className="text-sm font-medium space-x-2">
              <button onClick={onAssign} className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">Assign</button>
              <button onClick={onSkip} className="text-[rgba(245,158,11,1)] hover:text-[rgba(245,158,11,0.8)]">Skip</button>
              <button onClick={onOverride} className="text-neutral-600 hover:text-neutral-800">Override</button>
            </TdSm>
          </tr>

          {/* Carol (absent) */}
          <tr className="opacity-50">
            <TdSm>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-neutral-300 text-neutral-700 rounded-full text-sm font-bold">-</span>
            </TdSm>
            <TdSm>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[rgba(254,226,226,1)] rounded-full flex items-center justify-center mr-3">
                  <span className="text-[rgba(239,68,68,1)] text-sm font-medium">CD</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">Carol Davis</div>
                  <div className="text-sm text-neutral-500">Math Department</div>
                </div>
              </div>
            </TdSm>
            <TdSm>
              <div className="text-lg font-bold text-neutral-400">3 days</div>
              <div className="text-sm text-neutral-500">Removed from rotation</div>
            </TdSm>
            <TdSm>
              <div className="text-sm text-neutral-900">8.5 hrs / $255.00</div>
              <div className="text-sm text-neutral-500">Average</div>
            </TdSm>
            <TdSm>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(254,226,226,1)] text-[rgba(239,68,68,1)]">
                <span className="w-2 h-2 bg-[rgba(239,68,68,1)] rounded-full mr-1" />
                Absent Today
              </span>
            </TdSm>
            <TdSm className="text-sm font-medium space-x-2">
              <button disabled className="text-neutral-400 cursor-not-allowed">Assign</button>
              <button disabled className="text-neutral-400 cursor-not-allowed">Skip</button>
              <button onClick={onMarkPresent} className="text-[rgba(34,197,94,1)] hover:text-[rgba(34,197,94,0.8)]">Mark Present</button>
            </TdSm>
          </tr>

          {/* David */}
          <tr>
            <TdSm>
              <span className="inline-flex items-center justify-center w-8 h-8 bg-neutral-300 text-neutral-700 rounded-full text-sm font-bold">3</span>
            </TdSm>
            <TdSm>
              <div className="flex items-center">
                <div className="w-8 h-8 bg-[rgba(59,130,246,0.1)] rounded-full flex items-center justify-center mr-3">
                  <span className="text-[rgba(59,130,246,1)] text-sm font-medium">DW</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">David Wilson</div>
                  <div className="text-sm text-neutral-500">Math Department</div>
                </div>
              </div>
            </TdSm>
            <TdSm>
              <div className="text-lg font-bold text-neutral-900">5 days</div>
              <div className="text-sm text-neutral-500">Third in rotation</div>
            </TdSm>
            <TdSm>
              <div className="text-sm text-neutral-900">6.0 hrs / $180.00</div>
              <div className="text-sm text-neutral-500">Below average</div>
            </TdSm>
            <TdSm>
              <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(219,234,254,1)] text-[rgba(59,130,246,1)]">
                <span className="w-2 h-2 bg-[rgba(59,130,246,1)] rounded-full mr-1" />
                Covering P3
              </span>
            </TdSm>
            <TdSm className="text-sm font-medium space-x-2">
              <button disabled className="text-neutral-400 cursor-not-allowed">Assign</button>
              <button onClick={onSkip} className="text-[rgba(245,158,11,1)] hover:text-[rgba(245,158,11,0.8)]">Skip</button>
              <button onClick={onOverride} className="text-neutral-600 hover:text-neutral-800">Override</button>
            </TdSm>
          </tr>
        </tbody>
      </table>
    </div>
  );
}

function Openings(props: {
  urgentTimerText: string;
  onViewOffers: () => void;
  onAssignDirect: () => void;
  onCancel: () => void;
  onDailySchedule: () => void;
  onExport: () => void;
}) {
  const { urgentTimerText, onViewOffers, onAssignDirect, onCancel, onDailySchedule, onExport } = props;
  const [tab, setTab] = useState<'urgent' | 'today' | 'upcoming'>('urgent');

  const TabBtn: React.FC<React.PropsWithChildren<{ id: typeof tab; label: string }>> = ({ id, label }) => (
    <button
      onClick={() => setTab(id)}
      className={[
        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
        tab === id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900',
      ].join(' ')}
    >
      {label}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 overflow-hidden">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Coverage Openings</h2>
          <p className="text-sm text-neutral-600 mt-1">Manage current and upcoming coverage needs</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onDailySchedule} className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm">
            Daily Schedule
          </button>
          <button onClick={onExport} className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm">
            Export
          </button>
        </div>
      </div>

      <div className="p-6">
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-6">
          <TabBtn id="urgent" label="Urgent (<2hrs)" />
          <TabBtn id="today" label="Today" />
          <TabBtn id="upcoming" label="Upcoming (30 days)" />
        </div>

        {tab === 'urgent' && (
          <div className="space-y-4 mb-6">
            <div className="bg-[rgba(254,226,226,1)] border-2 border-[rgba(239,68,68,0.3)] rounded-lg p-4 relative overflow-hidden">
              <div className="absolute top-0 right-0 w-16 h-16 bg-[rgba(239,68,68,0.1)] rounded-full -mr-8 -mt-8" />
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center space-x-2 mb-1">
                    <h3 className="font-semibold text-neutral-900">Period 3 — Algebra II</h3>
                    <div className="w-2 h-2 bg-[rgba(239,68,68,1)] rounded-full animate-pulse" />
                  </div>
                  <div className="text-sm text-neutral-600">Room 204 • Ms. Johnson absent</div>
                </div>
                <div className="text-right">
                  <div className="text-lg font-bold text-[rgba(239,68,68,1)]">{urgentTimerText}</div>
                  <div className="text-xs text-neutral-500">until start</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3 text-sm">
                <Info label="Time" value="10:15 – 11:00 AM" />
                <Info label="Students" value="28 students" />
                <Info label="Posted" value="1 hour ago" />
                <Info label="Offers" value={<span className="text-[rgba(239,68,68,1)]">0 offers</span>} />
              </div>
              <div className="flex flex-wrap gap-3">
                <button onClick={onViewOffers} className="px-4 py-2 bg-[rgba(239,68,68,1)] text-white rounded-lg hover:bg-[rgba(239,68,68,0.9)] transition-colors text-sm font-medium">
                  View Offers
                </button>
                <button onClick={onAssignDirect} className="px-4 py-2 border border-[rgba(239,68,68,1)] text-[rgba(239,68,68,1)] rounded-lg hover:bg-[rgba(239,68,68,0.05)] transition-colors text-sm">
                  Assign Directly
                </button>
                <button onClick={onCancel} className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm">
                  Cancel
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'today' && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-4 hover:shadow-md transition-shadow">
              <div className="flex items-start justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">Period 5 — Biology</h3>
                  <div className="text-sm text-neutral-600">Lab 2 • Dr. Chen</div>
                </div>
                <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-[rgba(254,243,199,1)] text-[rgba(245,158,11,1)]">
                  Pending
                </span>
              </div>
              <div className="space-y-1 mb-3 text-sm">
                <div className="flex justify-between"><span className="text-neutral-500">Time:</span><span>1:15 – 2:00 PM</span></div>
                <div className="flex justify-between"><span className="text-neutral-500">Offers:</span><span className="text-[rgba(34,197,94,1)]">2 offers</span></div>
              </div>
              <div className="flex gap-2">
                <button onClick={onViewOffers} className="flex-1 bg-[rgba(59,130,246,1)] text-white py-2 px-3 rounded-md hover:bg-[rgba(30,64,175,1)] transition-colors text-sm">
                  View Offers
                </button>
                <button onClick={onAssignDirect} className="px-3 py-2 border border-neutral-300 text-neutral-700 rounded-md hover:bg-neutral-50 transition-colors text-sm">
                  Assign
                </button>
              </div>
            </div>
          </div>
        )}

        {tab === 'upcoming' && (
          <div className="space-y-4">
            <div className="bg-white border border-neutral-200 rounded-lg p-4">
              <div className="flex items-center justify-between mb-3">
                <div>
                  <h3 className="font-semibold text-neutral-900">January 18, 2024 — Full Day</h3>
                  <div className="text-sm text-neutral-600">Ms. Wilson • English Literature</div>
                </div>
                <div className="text-right">
                  <div className="text-sm font-medium text-[rgba(34,197,94,1)]">3 advance accepts</div>
                  <div className="text-xs text-neutral-500">Posted 2 days ago</div>
                </div>
              </div>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                <Info label="Periods" value="1, 3, 5, 7" />
                <Info label="Rooms" value="108, 110" />
                <Info label="Pay" value="$240.00" />
                <Info label="Status" value={<span className="text-[rgba(34,197,94,1)]">Covered</span>} />
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}

function CompensationTracker(props: {
  onExportPayroll: () => void;
  onFairnessReport: () => void;
  onApprove: () => void;
  onView: () => void;
}) {
  const { onExportPayroll, onFairnessReport, onApprove, onView } = props;
  const [tab, setTab] = useState<'today' | 'week' | 'month' | 'payPeriod'>('today');

  const TabBtn: React.FC<React.PropsWithChildren<{ id: typeof tab }>> = ({ id, children }) => (
    <button
      onClick={() => setTab(id)}
      className={[
        'px-4 py-2 text-sm font-medium rounded-md transition-colors',
        tab === id ? 'bg-white text-neutral-900 shadow-sm' : 'text-neutral-600 hover:text-neutral-900',
      ].join(' ')}
    >
      {children}
    </button>
  );

  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200">
      <div className="px-6 py-4 border-b border-neutral-200 flex items-center justify-between">
        <div>
          <h2 className="text-xl font-semibold text-neutral-900">Coverage & Compensation Tracker</h2>
          <p className="text-sm text-neutral-600 mt-1">Track coverage hours and ensure fair rotation</p>
        </div>
        <div className="flex gap-2">
          <button onClick={onExportPayroll} className="px-4 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 transition-colors text-sm font-medium">
            Export Payroll
          </button>
          <button onClick={onFairnessReport} className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors text-sm">
            Fairness Report
          </button>
        </div>
      </div>

      <div className="p-6">
        {/* Period tabs */}
        <div className="flex space-x-1 bg-neutral-100 rounded-lg p-1 mb-6">
          <TabBtn id="today">Today</TabBtn>
          <TabBtn id="week">This Week</TabBtn>
          <TabBtn id="month">This Month</TabBtn>
          <TabBtn id="payPeriod">Pay Period</TabBtn>
        </div>

        {/* Hours distribution */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Coverage Hours Distribution</h3>
          <div className="bg-neutral-50 rounded-lg p-6 space-y-4">
            <HoursRow initials="JD" name="John Davis" dept="Math Department" hours="12.5 hrs" amount="$375.00" barPct={85} verdict="Fair" verdictColor="text-[rgba(34,197,94,1)]" barClass="bg-[rgba(34,197,94,1)]" />
            <HoursRow initials="AM" name="Anna Martinez" dept="English Department" hours="8.0 hrs" amount="$240.00" barPct={55} verdict="Under" verdictColor="text-[rgba(245,158,11,1)]" barClass="bg-[rgba(245,158,11,1)]" />
            <HoursRow initials="RW" name="Robert Wilson" dept="Science Department" hours="18.5 hrs" amount="$555.00" barPct={100} verdict="Over" verdictColor="text-[rgba(239,68,68,1)]" barClass="bg-[rgba(239,68,68,1)]" />
          </div>
        </div>

        {/* Payroll summary */}
        <div className="mb-8">
          <h3 className="text-lg font-semibold text-neutral-900 mb-4">Payroll Summary</h3>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead className="bg-neutral-50">
                <tr>
                  <Th>Teacher</Th>
                  <Th>Extra Periods</Th>
                  <Th>Hourly Rate</Th>
                  <Th>Total Owed</Th>
                  <Th>Status</Th>
                  <Th>Actions</Th>
                </tr>
              </thead>
              <tbody className="divide-y divide-neutral-200">
                <tr>
                  <Td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center mr-3">
                        <span className="text-[rgba(34,197,94,1)] text-sm font-medium">JD</span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">John Davis</div>
                        <div className="text-sm text-neutral-500">ID: T001</div>
                      </div>
                    </div>
                  </Td>
                  <Td>25</Td>
                  <Td>$30.00</Td>
                  <Td className="font-semibold text-neutral-900">$750.00</Td>
                  <Td><Badge color="green">Approved</Badge></Td>
                  <Td className="space-x-2">
                    <button onClick={onView} className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">View</button>
                    <button onClick={onExportPayroll} className="text-purple-600 hover:text-purple-700">Export</button>
                  </Td>
                </tr>

                <tr>
                  <Td>
                    <div className="flex items-center">
                      <div className="w-8 h-8 bg-[rgba(254,243,199,1)] rounded-full flex items-center justify-center mr-3">
                        <span className="text-[rgba(245,158,11,1)] text-sm font-medium">AM</span>
                      </div>
                      <div>
                        <div className="font-medium text-neutral-900">Anna Martinez</div>
                        <div className="text-sm text-neutral-500">ID: T002</div>
                      </div>
                    </div>
                  </Td>
                  <Td>16</Td>
                  <Td>$30.00</Td>
                  <Td className="font-semibold text-neutral-900">$480.00</Td>
                  <Td><Badge color="amber">Pending</Badge></Td>
                  <Td className="space-x-2">
                    <button onClick={onApprove} className="text-[rgba(34,197,94,1)] hover:text-[rgba(34,197,94,0.8)]">Approve</button>
                    <button onClick={onView} className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">View</button>
                  </Td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        {/* Audit section provided above */}
      </div>
    </div>
  );
}

/* ------------------------ tiny components ------------------------ */

const Th: React.FC<React.PropsWithChildren> = ({ children }) => (
  <th className="px-6 py-3 text-left text-xs font-medium text-neutral-500 uppercase tracking-wider">{children}</th>
);
const Td: React.FC<React.PropsWithChildren<{ className?: string }>> = ({ children, className }) => (
  <td className={['px-6 py-4 whitespace-nowrap', className].join(' ')}>{children}</td>
);

const Badge: React.FC<React.PropsWithChildren<{ color: 'green' | 'amber' | 'red' | 'blue' }>> = ({
  children,
  color,
}) => {
  const map = {
    green: 'bg-[rgba(220,252,231,1)] text-[rgba(34,197,94,1)]',
    amber: 'bg-[rgba(254,243,199,1)] text-[rgba(245,158,11,1)]',
    red: 'bg-[rgba(254,226,226,1)] text-[rgba(239,68,68,1)]',
    blue: 'bg-[rgba(219,234,254,1)] text-[rgba(59,130,246,1)]',
  } as const;
  return (
    <span className={['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', map[color]].join(' ')}>
      {children}
    </span>
  );
};

const StatNumber: React.FC<{ value: string; label: string; valueClass?: string }> = ({ value, label, valueClass }) => (
  <div className="text-center">
    <div className={['text-2xl font-bold', valueClass ?? 'text-neutral-900'].join(' ')}>{value}</div>
    <div className="text-sm text-neutral-600">{label}</div>
  </div>
);

const Field: React.FC<React.PropsWithChildren<{ label: string }>> = ({ label, children }) => (
  <div>
    <label className="block text-sm font-medium text-neutral-700 mb-2">{label}</label>
    {children}
  </div>
);

function CoverageLogRow(props: {
  date: string;
  weekday: string;
  course: string;
  teacher: string;
  periods: string;
  duration: string;
  status: React.ReactNode;
  amount: string;
  rate: string;
  onView: () => void;
  onDispute?: () => void;
}) {
  const { date, weekday, course, teacher, periods, duration, status, amount, rate, onView, onDispute } = props;
  return (
    <tr>
      <Td>
        <div className="font-medium text-neutral-900">{date}</div>
        <div className="text-sm text-neutral-500">{weekday}</div>
      </Td>
      <Td>
        <div className="font-medium text-neutral-900">{course}</div>
        <div className="text-sm text-neutral-500">{teacher}</div>
      </Td>
      <Td>
        <div className="text-sm text-neutral-900">{periods}</div>
        <div className="text-sm text-neutral-500">{duration}</div>
      </Td>
      <Td>{status}</Td>
      <Td>
        <div className="font-semibold text-neutral-900">{amount}</div>
        <div className="text-sm text-neutral-500">{rate}</div>
      </Td>
      <Td className="text-sm font-medium">
        {onDispute && (
          <button onClick={onDispute} className="text-[rgba(239,68,68,1)] hover:text-[rgba(239,68,68,0.8)] mr-3">
            Dispute
          </button>
        )}
        <button onClick={onView} className="text-[rgba(59,130,246,1)] hover:text-[rgba(30,64,175,1)]">
          View Details
        </button>
      </Td>
    </tr>
  );
}

function AuditEntry(props: { dotClass: string; title: string; time: string; detail: string; meta: string }) {
  const { dotClass, title, time, detail, meta } = props;
  return (
    <div className="flex items-start space-x-4 p-4 bg-neutral-50 rounded-lg mb-4">
      <div className={['w-2 h-2 rounded-full mt-2', dotClass].join(' ')} />
      <div className="flex-1">
        <div className="flex items-center justify-between mb-1">
          <div className="font-medium text-neutral-900">{title}</div>
          <div className="text-sm text-neutral-500">{time}</div>
        </div>
        <div className="text-sm text-neutral-600">{detail}</div>
        <div className="text-xs text-neutral-500 mt-1">{meta}</div>
      </div>
    </div>
  );
}

function AvailableCard(props: { initials: string; name: string; sub: string; onAssign: () => void }) {
  const { initials, name, sub, onAssign } = props;
  return (
    <div className="flex items-center space-x-3 p-4 bg-neutral-50 rounded-lg">
      <div className="w-10 h-10 bg-[rgba(34,197,94,0.1)] rounded-full flex items-center justify-center">
        <span className="text-[rgba(34,197,94,1)] font-medium">{initials}</span>
      </div>
      <div className="flex-1">
        <div className="font-medium text-neutral-900">{name}</div>
        <div className="text-sm text-neutral-600">{sub}</div>
      </div>
      <button onClick={onAssign} className="px-3 py-1 bg-[rgba(59,130,246,1)] text-white text-sm rounded-md hover:bg-[rgba(30,64,175,1)] transition-colors">
        Assign
      </button>
    </div>
  );
}

function JobCard(props: {
  title: string;
  school: string;
  badge: { text: string; color: 'blue' | 'amber' };
  date: string;
  time: string;
  teacher: string;
  onAccept: () => void;
}) {
  const { title, school, badge, date, time, teacher, onAccept } = props;
  const badgeClass =
    badge.color === 'blue'
      ? 'bg-[rgba(219,234,254,1)] text-[rgba(59,130,246,1)]'
      : 'bg-[rgba(254,243,199,1)] text-[rgba(245,158,11,1)]';
  return (
    <div className="bg-white rounded-xl shadow-sm border border-neutral-200 p-6">
      <div className="flex items-start justify-between mb-4">
        <div>
          <h3 className="text-lg font-semibold text-neutral-900">{title}</h3>
          <p className="text-neutral-600">{school}</p>
        </div>
        <span className={['inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium', badgeClass].join(' ')}>
          {badge.text}
        </span>
      </div>
      <div className="space-y-2 mb-4 text-sm text-neutral-600">
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          {date}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
          </svg>
          {time}
        </div>
        <div className="flex items-center">
          <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
          </svg>
          {teacher}
        </div>
      </div>
      <div className="flex gap-3">
        <button onClick={onAccept} className="flex-1 bg-[rgba(59,130,246,1)] text-white py-2 px-4 rounded-lg hover:bg-[rgba(30,64,175,1)] transition-colors font-medium">
          Accept Job
        </button>
        <button className="px-4 py-2 border border-neutral-300 text-neutral-700 rounded-lg hover:bg-neutral-50 transition-colors">
          Details
        </button>
      </div>
    </div>
  );
}

function HoursRow(props: {
  initials: string;
  name: string;
  dept: string;
  hours: string;
  amount: string;
  barPct: number;
  verdict: string;
  verdictColor: string;
  barClass: string;
}) {
  const { initials, name, dept, hours, amount, barPct, verdict, verdictColor, barClass } = props;
  return (
    <div className="flex items-center justify-between">
      <div className="flex items-center space-x-3">
        <div className="w-8 h-8 bg-neutral-200 rounded-full flex items-center justify-center">
          <span className="text-neutral-700 text-sm font-medium">{initials}</span>
        </div>
        <div>
          <div className="font-medium text-neutral-900">{name}</div>
          <div className="text-sm text-neutral-600">{dept}</div>
        </div>
      </div>
      <div className="flex items-center space-x-4">
        <div className="text-right">
          <div className="font-semibold text-neutral-900">{hours}</div>
          <div className="text-sm text-neutral-600">{amount}</div>
        </div>
        <div className="w-32 bg-neutral-200 rounded-full h-2">
          <div className={['h-2 rounded-full', barClass].join(' ')} style={{ width: `${Math.min(100, Math.max(0, barPct))}%` }} />
        </div>
        <span className={['text-sm font-medium', verdictColor].join(' ')}>{verdict}</span>
      </div>
    </div>
  );
}
