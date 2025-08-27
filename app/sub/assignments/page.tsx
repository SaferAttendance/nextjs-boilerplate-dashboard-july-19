'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import Link from 'next/link';

/** -------------------------------------------------------
 * Types
 * ----------------------------------------------------- */
type AssignmentType = 'SINGLE_DAY' | 'MULTI_DAY' | 'PARTIAL_DAY';
type AssignmentStatus = 'OPEN' | 'REQUESTED' | 'CLAIMED';

interface Assignment {
  assignment_id: string;
  district_id: string;
  district_name: string;
  school_id: string;
  school_name: string;
  subject: string;
  grade: string;
  start_date: string; // ISO
  end_date: string;   // ISO
  type: AssignmentType;
  status: AssignmentStatus;
  notes?: string | null;
  location?: string | null;       // newline-separated
  requirements?: string | null;
  contact?: string | null;        // newline-separated
  created_at: string;
}

/** -------------------------------------------------------
 * Sample data (used if API not available)
 * ----------------------------------------------------- */
const SAMPLE: Record<string, Assignment> = {
  assign_1: {
    assignment_id: 'assign_1',
    district_id: 'dist_1',
    district_name: 'Springfield School District',
    school_id: 'school_1',
    school_name: 'Lincoln Elementary',
    subject: 'Mathematics',
    grade: '3',
    start_date: '2024-02-15T08:00:00Z',
    end_date: '2024-02-15T15:30:00Z',
    type: 'SINGLE_DAY',
    status: 'OPEN',
    notes:
      'Lesson plans provided. Experience with elementary math preferred. Students are working on multiplication and division concepts this week.',
    location: 'Lincoln Elementary School\nRoom 205',
    requirements: null,
    contact: null,
    created_at: '2024-02-10T10:00:00Z',
  },
  assign_2: {
    assignment_id: 'assign_2',
    district_id: 'dist_1',
    district_name: 'Springfield School District',
    school_id: 'school_2',
    school_name: 'Washington Middle School',
    subject: 'Science',
    grade: '6-8',
    start_date: '2024-02-16T08:30:00Z',
    end_date: '2024-02-18T15:00:00Z',
    type: 'MULTI_DAY',
    status: 'OPEN',
    notes:
      'Long-term substitute needed for teacher on medical leave. Detailed curriculum provided with daily lesson plans. Students are currently studying the solar system and will be working on a group project about planets.',
    location: 'Washington Middle School\nScience Lab B (Room 142)',
    requirements:
      'Science teaching experience preferred. Must be comfortable with lab equipment and safety procedures.',
    contact: 'Main Office: (555) 123-4567\nDepartment Head: Ms. Johnson',
    created_at: '2024-02-11T14:30:00Z',
  },
  assign_3: {
    assignment_id: 'assign_3',
    district_id: 'dist_2',
    district_name: 'Riverside Unified',
    school_id: 'school_4',
    school_name: 'Riverside Elementary',
    subject: 'Art',
    grade: 'K-5',
    start_date: '2024-02-17T09:00:00Z',
    end_date: '2024-02-17T12:00:00Z',
    type: 'PARTIAL_DAY',
    status: 'REQUESTED',
    notes:
      'Morning art classes only. Art supplies and lesson plans ready. Students will be working on watercolor techniques.',
    location: 'Riverside Elementary\nArt Room (Building C)',
    requirements: null,
    contact: null,
    created_at: '2024-02-12T09:15:00Z',
  },
  assign_4: {
    assignment_id: 'assign_4',
    district_id: 'dist_1',
    district_name: 'Springfield School District',
    school_id: 'school_3',
    school_name: 'Roosevelt High School',
    subject: 'English Literature',
    grade: '11',
    start_date: '2024-02-19T08:00:00Z',
    end_date: '2024-02-19T15:30:00Z',
    type: 'SINGLE_DAY',
    status: 'CLAIMED',
    notes:
      'Teaching Shakespeare unit. Detailed lesson plans available. Students are currently reading Hamlet and will be discussing Act III.',
    location: 'Roosevelt High School\nRoom 301',
    requirements:
      'English or Literature teaching background required. Familiarity with Shakespeare preferred.',
    contact: 'English Department: (555) 987-6543',
    created_at: '2024-02-13T11:00:00Z',
  },
};

/** -------------------------------------------------------
 * Helpers
 * ----------------------------------------------------- */
const formatDate = (iso: string) =>
  new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
  }).format(new Date(iso));

const formatRange = (startISO: string, endISO: string) => {
  const s = new Date(startISO);
  const e = new Date(endISO);
  const sameDay = s.toDateString() === e.toDateString();
  return sameDay
    ? `${formatDate(startISO)} → ${new Intl.DateTimeFormat('en-US', {
        hour: 'numeric',
        minute: '2-digit',
      }).format(e)}`
    : `${formatDate(startISO)} → ${formatDate(endISO)}`;
};

const typeBadge = (t: AssignmentType) => {
  const base =
    'px-3 py-1 rounded-full text-xs font-medium ring-1';
  switch (t) {
    case 'SINGLE_DAY':
      return `${base} bg-blue-50 ring-blue-500/20 text-blue-900`;
    case 'MULTI_DAY':
      return `${base} bg-cyan-50 ring-cyan-500/20 text-cyan-900`;
    case 'PARTIAL_DAY':
      return `${base} bg-amber-100 ring-amber-500/20 text-amber-900`;
    default:
      return `${base} bg-gray-100 ring-gray-300 text-gray-700`;
  }
};

const statusBadge = (s: AssignmentStatus) => {
  const base =
    'px-3 py-1 rounded-full text-xs font-medium ring-1';
  switch (s) {
    case 'OPEN':
      return `${base} bg-blue-50 ring-blue-500/20 text-blue-900`;
    case 'REQUESTED':
      return `${base} bg-amber-100 ring-amber-500/20 text-amber-900`;
    case 'CLAIMED':
      return `${base} bg-emerald-100 ring-emerald-500/20 text-emerald-900`;
    default:
      return `${base} bg-gray-100 ring-gray-300 text-gray-700`;
  }
};

/** -------------------------------------------------------
 * Toasts
 * ----------------------------------------------------- */
type ToastKind = 'success' | 'warning' | 'error' | 'info';
type Toast = { id: number; kind: ToastKind; msg: string };

function useToasts() {
  const [toasts, setToasts] = useState<Toast[]>([]);
  const push = (kind: ToastKind, msg: string) =>
    setToasts((t) => [...t, { id: Date.now() + Math.random(), kind, msg }]);
  const remove = (id: number) =>
    setToasts((t) => t.filter((x) => x.id !== id));
  return { toasts, push, remove };
}

const toastClasses: Record<ToastKind, string> = {
  success: 'bg-emerald-500',
  warning: 'bg-amber-500',
  error: 'bg-red-500',
  info: 'bg-blue-500',
};

/** -------------------------------------------------------
 * API shim (falls back to SAMPLE)
 * ----------------------------------------------------- */
async function apiFetchMyAssignments(): Promise<Assignment[]> {
  try {
    const res = await fetch('/api/sub/assignments?mine=1', {
      headers: { 'X-Requested-With': 'XMLHttpRequest' },
      cache: 'no-store',
    });
    if (!res.ok) throw new Error('Request failed');
    const json = await res.json();
    // Expecting { data: Assignment[] }
    return json?.data ?? [];
  } catch {
    // Demo fallback to SAMPLE “my assignments” = requested + claimed + open demo items
    return Object.values(SAMPLE);
  }
}

async function apiRequestAssignment(assignment_id: string) {
  // Simulate success
  await new Promise((r) => setTimeout(r, 900));
  return { ok: true, assignment_id };
}

/** -------------------------------------------------------
 * Page
 * ----------------------------------------------------- */
export default function MyAssignmentsPage() {
  const { toasts, push, remove } = useToasts();

  const [loading, setLoading] = useState(true);
  const [items, setItems] = useState<Assignment[]>([]);
  const [active, setActive] = useState<Assignment | null>(null);
  const [requesting, setRequesting] = useState(false);

  // Drawer focus trap
  const drawerRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const requested = useMemo(
    () => items.filter((a) => a.status === 'REQUESTED'),
    [items]
  );
  const claimed = useMemo(
    () => items.filter((a) => a.status === 'CLAIMED'),
    [items]
  );
  const open = useMemo(
    () => items.filter((a) => a.status === 'OPEN'),
    [items]
  );

  useEffect(() => {
    let alive = true;
    (async () => {
      setLoading(true);
      const data = await apiFetchMyAssignments();
      if (!alive) return;
      setItems(data);
      setLoading(false);
    })();
    return () => {
      alive = false;
    };
  }, []);

  const openDrawer = useCallback((a: Assignment) => {
    lastFocusRef.current = document.activeElement as HTMLElement;
    setActive(a);
    // focus will be set on drawer in effect below
  }, []);

  const closeDrawer = useCallback(() => {
    setActive(null);
    setRequesting(false);
    setTimeout(() => {
      lastFocusRef.current?.focus?.();
    }, 0);
  }, []);

  // focus trap + esc
  useEffect(() => {
    if (!active) return;

    const panel = drawerRef.current;
    if (panel) panel.focus();

    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        e.preventDefault();
        closeDrawer();
      }
      if (e.key === 'Tab' && panel) {
        const focusables = panel.querySelectorAll<HTMLElement>(
          'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
        );
        if (!focusables.length) return;
        const first = focusables[0];
        const last = focusables[focusables.length - 1];
        const isShift = e.shiftKey;

        if (isShift && document.activeElement === first) {
          e.preventDefault();
          last.focus();
        } else if (!isShift && document.activeElement === last) {
          e.preventDefault();
          first.focus();
        }
      }
    };
    document.addEventListener('keydown', onKey);
    return () => document.removeEventListener('keydown', onKey);
  }, [active, closeDrawer]);

  const onRequest = useCallback(async () => {
    if (!active || requesting) return;
    if (active.status !== 'OPEN') {
      push('warning', active.status === 'CLAIMED' ? 'This assignment is already claimed.' : 'You already requested this assignment.');
      return;
    }
    setRequesting(true);
    try {
      await apiRequestAssignment(active.assignment_id);
      // optimistic update
      setItems((prev) =>
        prev.map((x) =>
          x.assignment_id === active.assignment_id ? { ...x, status: 'REQUESTED' } : x
        )
      );
      setActive({ ...active, status: 'REQUESTED' });
      push('success', 'Assignment requested successfully');
    } catch {
      push('error', "Couldn't submit request — try again");
    } finally {
      setRequesting(false);
    }
  }, [active, requesting, push]);

  const Card: React.FC<{ a: Assignment }> = ({ a }) => (
    <div className="bg-white rounded-xl border border-gray-200 p-6 transition hover:-translate-y-0.5 hover:shadow-lg">
      <div className="flex justify-between items-start">
        <div className="flex-1 min-w-0 pr-4">
          <p className="text-sm text-gray-500 mb-2">{a.school_name}</p>
          <h3 className="font-bold text-gray-900 text-lg mb-2">
            {a.subject} • Grade {a.grade}
          </h3>
          <p className="text-sm text-gray-600 mb-3">{formatRange(a.start_date, a.end_date)}</p>
          <div className="flex gap-2 mb-3">
            <span className={typeBadge(a.type)}>
              {a.type === 'SINGLE_DAY' ? 'Single day' : a.type === 'MULTI_DAY' ? 'Multi day' : 'Partial day'}
            </span>
            <span className={statusBadge(a.status)}>
              {a.status === 'OPEN' ? 'Open' : a.status === 'REQUESTED' ? 'Requested' : 'Claimed'}
            </span>
          </div>
          {a.notes && <p className="text-sm text-gray-600">{a.notes}</p>}
        </div>
        <div className="flex flex-col items-end space-y-2">
          <button
            onClick={() => openDrawer(a)}
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors min-h-[44px] whitespace-nowrap"
          >
            View Details
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <>
      {/* Page header */}
      <header className="bg-white border-b border-gray-200 sticky top-0 z-30">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-blue-600 rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <p className="text-lg font-semibold text-gray-900">Safer Attendance</p>
                <p className="text-xs text-gray-500">Substitute Portal</p>
              </div>
            </div>
            <div className="flex items-center gap-3">
              <Link href="/sub/browse" className="text-sm text-blue-600 hover:text-blue-700 font-medium">
                Browse assignments
              </Link>
              <button
                onClick={() => {
                  push('success', 'Signed out successfully');
                  setTimeout(() => (window.location.href = '/sub'), 700);
                }}
                className="text-gray-500 hover:text-gray-700 text-sm font-medium"
              >
                Sign out
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
          <p className="text-lg text-gray-600">Track requests you’ve made and assignments you’ve claimed.</p>
        </div>

        {/* Loading skeleton */}
        {loading ? (
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="bg-white rounded-xl border border-gray-200 p-6 animate-pulse">
                <div className="flex justify-between items-start">
                  <div className="flex-1">
                    <div className="h-4 bg-gray-200 rounded w-1/3 mb-2"></div>
                    <div className="h-5 bg-gray-200 rounded w-2/3 mb-3"></div>
                    <div className="h-4 bg-gray-200 rounded w-1/2 mb-3"></div>
                    <div className="flex gap-2">
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                      <div className="h-6 bg-gray-200 rounded-full w-20"></div>
                    </div>
                  </div>
                  <div className="h-10 bg-gray-200 rounded w-24"></div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <>
            {/* Claimed */}
            {claimed.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Claimed</h2>
                  <span className="text-xs text-gray-500">{claimed.length} item{claimed.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {claimed.map((a) => (
                    <Card a={a} key={a.assignment_id} />
                  ))}
                </div>
              </section>
            )}

            {/* Requested */}
            {requested.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Requested</h2>
                  <span className="text-xs text-gray-500">{requested.length} item{requested.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {requested.map((a) => (
                    <Card a={a} key={a.assignment_id} />
                  ))}
                </div>
              </section>
            )}

            {/* Open (for demo visibility in “My Assignments”) */}
            {open.length > 0 && (
              <section className="mb-10">
                <div className="flex items-center justify-between mb-3">
                  <h2 className="text-sm font-semibold text-gray-700 uppercase tracking-wider">Open (demo)</h2>
                  <span className="text-xs text-gray-500">{open.length} item{open.length === 1 ? '' : 's'}</span>
                </div>
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {open.map((a) => (
                    <Card a={a} key={a.assignment_id} />
                  ))}
                </div>
              </section>
            )}

            {/* Empty state */}
            {claimed.length === 0 && requested.length === 0 && open.length === 0 && (
              <div className="bg-white rounded-xl border-2 border-dashed border-gray-300 p-12 text-center">
                <svg className="w-16 h-16 text-gray-400 mx-auto mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                </svg>
                <h3 className="text-lg font-medium text-gray-900 mb-2">No assignments yet</h3>
                <p className="text-gray-600 mb-4">When you request or claim assignments, they’ll show up here.</p>
                <Link href="/sub/browse" className="text-blue-600 hover:text-blue-700 font-medium">
                  Browse assignments
                </Link>
              </div>
            )}
          </>
        )}
      </main>

      {/* Drawer */}
      {active && (
        <div className="fixed inset-0 z-50">
          {/* Overlay */}
          <div
            className="absolute inset-0 bg-black/50 backdrop-blur-sm"
            onClick={closeDrawer}
            aria-hidden="true"
          />
          {/* Panel */}
          <div
            ref={drawerRef}
            role="dialog"
            aria-modal="true"
            aria-label="Assignment details"
            tabIndex={-1}
            className="absolute right-0 top-0 h-full w-full max-w-md md:max-w-2xl lg:max-w-3xl bg-white shadow-xl outline-none"
          >
            {/* Header */}
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <div className="min-w-0">
                <div className="flex items-center flex-wrap gap-2 mb-1">
                  <p className="text-sm text-gray-500">{active.school_name}</p>
                  <span className="text-gray-300">•</span>
                  <p className="text-sm text-gray-500">{active.district_name}</p>
                  <span className={statusBadge(active.status)}> 
                    {active.status === 'OPEN' ? 'Open' : active.status === 'REQUESTED' ? 'Requested' : 'Claimed'}
                  </span>
                </div>
                <h2 className="text-xl font-bold text-gray-900 truncate">
                  {active.subject} • Grade {active.grade}
                </h2>
              </div>
              <button
                onClick={closeDrawer}
                className="text-gray-400 hover:text-gray-600 p-2"
                aria-label="Close"
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            {/* Body */}
            <div className="p-6 space-y-6 overflow-y-auto h-[calc(100%-160px)]">
              {/* Date & Time */}
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Date & Time</p>
                  <p className="text-sm text-gray-900 mt-1">{formatRange(active.start_date, active.end_date)}</p>
                </div>
              </div>

              {/* Type */}
              <div className="flex items-start gap-3">
                <svg className="w-6 h-6 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z"/>
                </svg>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-700">Assignment Type</p>
                  <div className="mt-2">
                    <span className={typeBadge(active.type)}>
                      {active.type === 'SINGLE_DAY' ? 'Single day' : active.type === 'MULTI_DAY' ? 'Multi day' : 'Partial day'}
                    </span>
                  </div>
                </div>
              </div>

              {/* Notes */}
              {active.notes && (
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Notes</p>
                    <p className="text-sm text-gray-900 mt-1 leading-relaxed">{active.notes}</p>
                  </div>
                </div>
              )}

              {/* Requirements (optional) */}
              {active.requirements && (
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Requirements</p>
                    <p className="text-sm text-gray-900 mt-1 leading-relaxed">{active.requirements}</p>
                  </div>
                </div>
              )}

              {/* Location */}
              {active.location && (
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"/>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Location</p>
                    <p
                      className="text-sm text-gray-900 mt-1 whitespace-pre-wrap"
                    >
                      {active.location}
                    </p>
                  </div>
                </div>
              )}

              {/* Contact (optional) */}
              {active.contact && (
                <div className="flex items-start gap-3">
                  <svg className="w-6 h-6 text-gray-500 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                  </svg>
                  <div className="flex-1">
                    <p className="text-sm font-medium text-gray-700">Contact</p>
                    <p className="text-sm text-gray-900 mt-1 whitespace-pre-wrap">{active.contact}</p>
                  </div>
                </div>
              )}

              {/* Demo schedule conflict (for assign_2) */}
              {active.assignment_id === 'assign_2' && (
                <div className="rounded-lg border border-amber-300/50 bg-amber-100 px-4 py-3">
                  <div className="flex items-start gap-3">
                    <svg className="w-5 h-5 text-amber-700 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L3.732 16.5c-.77.833.192 2.5 1.732 2.5z"/>
                    </svg>
                    <div>
                      <p className="text-sm font-medium text-amber-900">Schedule Conflict</p>
                      <p className="text-sm text-amber-800 mt-1">
                        This assignment overlaps with another request you&apos;ve made. You can still request it, but
                        you may need to choose between them if both are approved.
                      </p>
                    </div>
                  </div>
                </div>
              )}
            </div>

            {/* Footer */}
            <div className="p-6 border-t border-gray-200 bg-gray-50">
              {active.status === 'OPEN' && (
                <div className="flex gap-3">
                  <button
                    onClick={closeDrawer}
                    className="flex-1 bg-white hover:bg-gray-50 text-gray-700 border border-gray-300 py-3 px-6 rounded-lg font-medium transition-colors min-h-[44px]"
                  >
                    Cancel
                  </button>
                  <button
                    onClick={onRequest}
                    disabled={requesting}
                    aria-label={`Request ${active.subject} grade ${active.grade} at ${active.school_name}, ${formatRange(
                      active.start_date,
                      active.end_date
                    )}`}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 disabled:bg-gray-400 text-white py-3 px-6 rounded-lg font-medium transition-colors min-h-[44px] inline-flex items-center justify-center gap-2"
                  >
                    {requesting && (
                      <svg className="w-4 h-4 animate-spin" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15"/>
                      </svg>
                    )}
                    {requesting ? 'Requesting…' : 'Request'}
                  </button>
                </div>
              )}

              {active.status === 'REQUESTED' && (
                <div className="text-center">
                  <span className={statusBadge('REQUESTED') + ' px-4 py-2'}>Requested</span>
                  <p className="text-sm text-gray-600 mt-2">You&apos;ve requested this assignment</p>
                </div>
              )}

              {active.status === 'CLAIMED' && (
                <div className="text-center">
                  <span className={statusBadge('CLAIMED') + ' px-4 py-2'}>Claimed</span>
                  <p className="text-sm text-gray-600 mt-2">This assignment has been claimed</p>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div
        aria-live="polite"
        aria-label="Notifications"
        className="fixed top-4 right-4 z-[60] space-y-2"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            className={`px-6 py-4 rounded-lg text-sm font-medium text-white max-w-sm shadow-lg ${toastClasses[t.kind]}`}
            role="alert"
            tabIndex={-1}
            onAnimationEnd={() => {}}
          >
            <div className="flex items-start justify-between gap-4">
              <span>{t.msg}</span>
              <button
                onClick={() => remove(t.id)}
                className="opacity-90 hover:opacity-100 focus:outline-none"
                aria-label="Dismiss"
              >
                ×
              </button>
            </div>
          </div>
        ))}
      </div>
    </>
  );
}
