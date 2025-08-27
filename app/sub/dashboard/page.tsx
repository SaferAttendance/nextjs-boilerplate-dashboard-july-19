//*app/sub/dashboard/page.tsx*//

'use client';

import { useEffect, useMemo, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { Inter } from 'next/font/google';

const inter = Inter({ subsets: ['latin'] });

type Role = 'substitute' | 'admin';
type Section =
  | 'browse'
  | 'dashboard'
  | 'today'
  | 'timesheets'
  | 'profile'
  | 'admin-overview'
  | 'admin-assignments'
  | 'admin-substitutes'
  | 'admin-reports';
type Tab = 'requested' | 'approved' | 'claimed' | 'completed';
type TimesheetTab = 'pending' | 'approved' | 'rejected';
type BadgeType =
  | 'single'
  | 'multi'
  | 'partial'
  | 'requested'
  | 'approved'
  | 'claimed'
  | 'completed'
  | 'canceled'
  | 'pending'
  | 'rejected'
  | 'verified'
  | 'expired';

type AssignmentStatus =
  | 'open'
  | 'requested'
  | 'approved'
  | 'claimed'
  | 'completed'
  | 'canceled';

type Assignment = {
  id: string;
  school: string;
  title: string; // "Mathematics • Grade 3"
  subject: string; // "Mathematics"
  grades: string; // "Grade 3"
  start: string; // ISO
  end: string; // ISO
  type: 'single' | 'multi' | 'partial';
  status: AssignmentStatus;
  pay: number; // dollars total
  distanceMiles: number;
  notes?: string;
  room?: string;
  multiDaysCount?: number; // for multi
  address?: string; // for directions
};

type Toast = { id: string; type: 'success' | 'warning' | 'error' | 'info'; message: string };

type Timesheet = {
  id: string;
  assignmentId: string;
  assignmentTitle: string;
  school: string;
  date: string; // ISO
  hours: number;
  status: 'pending' | 'approved' | 'rejected';
  rejectionReason?: string;
};

const TZ_FALLBACK = 'America/Los_Angeles';

function fmtDateRange(startISO: string, endISO: string, tz: string) {
  const start = new Date(startISO);
  const end = new Date(endISO);
  const dfDate = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    month: 'short',
    day: 'numeric',
  });
  const dfTime = new Intl.DateTimeFormat('en-US', {
    timeZone: tz,
    hour: 'numeric',
    minute: '2-digit',
  });

  const sameDay =
    start.toLocaleDateString('en-CA', { timeZone: tz }) ===
    end.toLocaleDateString('en-CA', { timeZone: tz });

  if (sameDay) {
    return `${dfDate.format(start)}, ${dfTime.format(start)} → ${dfTime.format(end)}`;
  }
  return `${dfDate.format(start)} ${dfTime.format(start)} → ${dfDate.format(end)}`;
}

function dollars(n: number) {
  return `$${n.toLocaleString(undefined, { maximumFractionDigits: 0 })}`;
}

function classNames(...cls: (string | false | null | undefined)[]) {
  return cls.filter(Boolean).join(' ');
}

function useLocalStorage<T>(key: string, initial: T) {
  const [value, setValue] = useState<T>(() => {
    if (typeof window === 'undefined') return initial;
    const raw = localStorage.getItem(key);
    return raw ? (JSON.parse(raw) as T) : initial;
  });
  useEffect(() => {
    try {
      localStorage.setItem(key, JSON.stringify(value));
    } catch {}
  }, [key, value]);
  return [value, setValue] as const;
}

function useQueryState(name: string, defaultValue: string) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const value = searchParams.get(name) ?? defaultValue;

  const setValue = (next: string) => {
    const sp = new URLSearchParams(searchParams.toString());
    if (next === defaultValue) sp.delete(name);
    else sp.set(name, next);
    router.replace(`?${sp.toString()}`, { scroll: false });
  };

  return [value, setValue] as const;
}

export default function SubsDashboardPage() {
  // --------- STATE ---------
  const [role, setRole] = useLocalStorage<Role>('saferatt_role', 'substitute');
  const [sectionQ, setSectionQ] = useQueryState('view', role === 'admin' ? 'admin-overview' : 'browse');
  const [section, setSection] = useState<Section>(sectionQ as Section);
  const [tabQ, setTabQ] = useQueryState('tab', 'requested');
  const [tab, setTab] = useState<Tab>(tabQ as Tab);
  const [timesheetTab, setTimesheetTab] = useState<TimesheetTab>('pending');
  const [tz, setTz] = useLocalStorage<string>('saferatt_tz', TZ_FALLBACK);

  // Browse filters
  const [filterDistrict, setFilterDistrict] = useState('All Districts');
  const [filterSubject, setFilterSubject] = useState('All Subjects');
  const [filterGrades, setFilterGrades] = useState('All Grades');
  const [filterDate, setFilterDate] = useState<string>('');

  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastsRef = useRef<HTMLDivElement | null>(null);

  // Request Modal
  const [requestOpen, setRequestOpen] = useState(false);
  const [requestStep, setRequestStep] = useState<1 | 2 | 3>(1);
  const [requestWhy, setRequestWhy] = useState('');
  const [requestConfirmAvail, setRequestConfirmAvail] = useState(false);
  const [selectedAssignment, setSelectedAssignment] = useState<Assignment | null>(null);
  const requestCloseBtnRef = useRef<HTMLButtonElement | null>(null);

  // Notifications panel
  const [notifsOpen, setNotifsOpen] = useState(false);

  // Checkout modal (Today)
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const [checkedIn, setCheckedIn] = useState(false);
  const [checkinTimeISO, setCheckinTimeISO] = useState<string | null>(null);
  const [timerTick, setTimerTick] = useState(0);

  // Timesheets
  const [timesheets, setTimesheets] = useState<Timesheet[]>([
    {
      id: 'ts_3',
      assignmentId: 'assign_science7',
      assignmentTitle: 'Science • Grade 7',
      school: 'Washington Middle School',
      date: new Date('2024-02-08T08:00:00').toISOString(),
      hours: 7.5,
      status: 'approved',
    },
    {
      id: 'ts_1',
      assignmentId: 'assign_math2_done',
      assignmentTitle: 'Mathematics • Grade 2',
      school: 'Lincoln Elementary',
      date: new Date('2024-02-10T08:00:00').toISOString(),
      hours: 7.5,
      status: 'pending',
    },
    {
      id: 'ts_4',
      assignmentId: 'assign_pe_rej',
      assignmentTitle: 'Physical Education • Grade 4-6',
      school: 'Mountain View Elementary',
      date: new Date('2024-02-05T08:00:00').toISOString(),
      hours: 8,
      status: 'rejected',
      rejectionReason: 'Hours exceed assignment duration',
    },
  ]);

  // Demo data - assignments
  const [assignments, setAssignments] = useState<Assignment[]>([
    {
      id: 'assign_1',
      school: 'Lincoln Elementary',
      title: 'Mathematics • Grade 3',
      subject: 'Mathematics',
      grades: 'Grade 3',
      start: new Date('2024-02-15T08:00:00').toISOString(),
      end: new Date('2024-02-15T15:30:00').toISOString(),
      type: 'single',
      status: 'open',
      pay: 180,
      distanceMiles: 2.3,
      notes: 'Lesson plans provided. Experience with elementary math preferred.',
      address: 'Lincoln Elementary, Springfield, USA',
    },
    {
      id: 'assign_2',
      school: 'Roosevelt High School',
      title: 'Science • Grade 6-8',
      subject: 'Science',
      grades: 'Grade 6-8',
      start: new Date('2024-02-16T08:30:00').toISOString(),
      end: new Date('2024-02-18T15:00:00').toISOString(),
      type: 'multi',
      status: 'open',
      pay: 540,
      distanceMiles: 5.1,
      notes: 'Long-term substitute needed for teacher on medical leave.',
      multiDaysCount: 3,
      address: 'Roosevelt High School, Springfield, USA',
    },
    {
      id: 'assign_3',
      school: 'Riverside Elementary',
      title: 'Art • Grade K-5',
      subject: 'Art',
      grades: 'Grade K-5',
      start: new Date('2024-02-17T09:00:00').toISOString(),
      end: new Date('2024-02-17T12:00:00').toISOString(),
      type: 'partial',
      status: 'claimed',
      pay: 72,
      distanceMiles: 1.8,
      notes: 'Morning art classes only. Art supplies and lesson plans ready.',
      room: 'Art Room (Building C)',
      address: 'Riverside Elementary, Springfield, USA',
    },
    {
      id: 'assign_4',
      school: 'Washington Middle School',
      title: 'English Literature • Grade 11',
      subject: 'English',
      grades: 'Grade 11',
      start: new Date('2024-02-19T08:00:00').toISOString(),
      end: new Date('2024-02-19T15:30:00').toISOString(),
      type: 'single',
      status: 'approved',
      pay: 195,
      distanceMiles: 3.7,
      notes: 'Teaching Shakespeare unit. Detailed lesson plans available.',
      address: 'Washington Middle School, Springfield, USA',
    },
    {
      id: 'assign_5',
      school: 'Lincoln Elementary',
      title: 'Mathematics • Grade 2',
      subject: 'Mathematics',
      grades: 'Grade 2',
      start: new Date('2024-02-10T08:00:00').toISOString(),
      end: new Date('2024-02-10T15:30:00').toISOString(),
      type: 'single',
      status: 'completed',
      pay: 180,
      distanceMiles: 2.3,
      notes: 'Successfully completed. 7.5 hours worked.',
      address: 'Lincoln Elementary, Springfield, USA',
    },
  ]);

  // Today’s assignment (from demo data: claimed Riverside Elementary)
  const todaysAssignment = useMemo(
    () => assignments.find((a) => a.status === 'claimed'),
    [assignments]
  );

  // --------- URL + STATE SYNC ---------
  useEffect(() => {
    // reflect section in URL when it changes
    setSectionQ(section);
  }, [section, setSectionQ]);

  useEffect(() => {
    // reflect tab in URL when it changes (only for dashboard)
    if (section === 'dashboard') setTabQ(tab);
  }, [tab, section, setTabQ]);

  useEffect(() => {
    // react to URL changes for deep links
    setSection(sectionQ as Section);
    setTab(tabQ as Tab);
  }, [sectionQ, tabQ]);

  useEffect(() => {
    // persist role
    // if admin role selected, default to admin overview
    if (role === 'admin' && !section.startsWith('admin-')) {
      setSection('admin-overview');
    } else if (role === 'substitute' && section.startsWith('admin-')) {
      setSection('browse');
    }
  }, [role]);

  // --------- TOASTS ---------
  function showToast(type: Toast['type'], message: string) {
    const id = Math.random().toString(36).slice(2);
    setToasts((t) => [...t, { id, type, message }]);
    setTimeout(() => {
      setToasts((t) => t.filter((x) => x.id !== id));
    }, 5000);
  }

  // --------- REQUEST MODAL (Step Flow) ---------
  function openRequestModal(a: Assignment) {
    setSelectedAssignment(a);
    setRequestWhy('');
    setRequestConfirmAvail(false);
    setRequestStep(1);
    setRequestOpen(true);
  }

  function closeRequestModal() {
    setRequestOpen(false);
  }

  function requestNext() {
    if (requestStep === 1) {
      if (!requestConfirmAvail || requestWhy.trim().length < 5) {
        showToast('warning', 'Please confirm availability and add a short note.');
        return;
      }
      setRequestStep(2);
    } else if (requestStep === 2) {
      // Submit
      if (selectedAssignment) {
        // Move assignment to requested
        setAssignments((list) =>
          list.map((x) => (x.id === selectedAssignment.id ? { ...x, status: 'requested' } : x))
        );
        setRequestStep(3);
      }
    } else {
      closeRequestModal();
      // Jump to dashboard requested tab
      setSection('dashboard');
      setTab('requested');
    }
  }

  function requestPrev() {
    if (requestStep === 2) setRequestStep(1);
  }

  // Progress connector class
  const stepLineClass = (from: number) => {
    if (requestStep > (from as 1 | 2)) return 'step-line-completed';
    if (requestStep === (from as 1 | 2)) return 'step-line-active';
    return 'step-line-inactive';
  };

  // Focus management for request modal
  useEffect(() => {
    if (requestOpen) {
      requestCloseBtnRef.current?.focus();
    }
  }, [requestOpen]);

  // --------- BROWSE FILTERING ---------
  const browseItems = useMemo(() => {
    let list = assignments.filter((a) => a.status === 'open');
    if (filterSubject !== 'All Subjects') list = list.filter((a) => a.subject === filterSubject);
    if (filterGrades !== 'All Grades') list = list.filter((a) => a.grades.includes(filterGrades.replace(/-/, '')));
    if (filterDistrict !== 'All Districts') list = list.filter((a) => a.school.includes(filterDistrict.split(' ')[0]));
    if (filterDate) {
      const d = new Date(filterDate);
      list = list.filter((a) => {
        const s = new Date(a.start);
        return s.toDateString() === d.toDateString();
      });
    }
    return list;
  }, [assignments, filterSubject, filterGrades, filterDistrict, filterDate]);

  function clearFilters() {
    setFilterDistrict('All Districts');
    setFilterSubject('All Subjects');
    setFilterGrades('All Grades');
    setFilterDate('');
    showToast('info', 'Filters cleared');
  }

  function applyFilters() {
    showToast('success', 'Filters applied');
  }

  // --------- ASSIGNMENT ACTIONS ---------
  function requestAssignmentById(id: string) {
    const a = assignments.find((x) => x.id === id);
    if (a) openRequestModal(a);
  }

  function cancelRequest(id: string) {
    // Move requested back to open
    setAssignments((list) => list.map((x) => (x.id === id ? { ...x, status: 'open' } : x)));
    showToast('success', 'Assignment request canceled');
  }

  function claimAssignment(id: string) {
    setAssignments((list) => list.map((x) => (x.id === id ? { ...x, status: 'claimed' } : x)));
    showToast('success', 'Assignment claimed successfully!');
  }

  function unclaimAssignment(id: string) {
    // Move claimed back to approved
    setAssignments((list) => list.map((x) => (x.id === id ? { ...x, status: 'approved' } : x)));
    showToast('success', 'Assignment unclaimed');
  }

  function addToCalendar(a: Assignment) {
    // Very simple ICS download
    const dt = (iso: string) =>
      new Date(iso)
        .toISOString()
        .replace(/[-:]/g, '')
        .replace(/\.\d{3}Z$/, 'Z');
    const ics = [
      'BEGIN:VCALENDAR',
      'VERSION:2.0',
      'BEGIN:VEVENT',
      `UID:${a.id}@saferattendance`,
      `DTSTAMP:${dt(new Date().toISOString())}`,
      `DTSTART:${dt(a.start)}`,
      `DTEND:${dt(a.end)}`,
      `SUMMARY:${a.title} - ${a.school}`,
      `DESCRIPTION:${a.notes ?? ''}`,
      `LOCATION:${a.address ?? a.school}`,
      'END:VEVENT',
      'END:VCALENDAR',
    ].join('\r\n');

    const blob = new Blob([ics], { type: 'text/calendar;charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `${a.title.replace(/\s+/g, '_')}.ics`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    showToast('success', 'Added to calendar');
  }

  function openDirections(a: Assignment) {
    const url = `https://www.google.com/maps/dir/?api=1&destination=${encodeURIComponent(a.address ?? a.school)}`;
    window.open(url, '_blank', 'noopener,noreferrer');
  }

  // --------- TODAY: CHECK-IN / CHECK-OUT ---------
  useEffect(() => {
    if (checkedIn) {
      const t = setInterval(() => setTimerTick((x) => x + 1), 1000);
      return () => clearInterval(t);
    }
  }, [checkedIn]);

  function checkIn() {
    if (!todaysAssignment) {
      showToast('warning', 'No assignment today to check into.');
      return;
    }
    setCheckedIn(true);
    setCheckinTimeISO(new Date().toISOString());
    showToast('success', 'Checked in successfully!');
  }

  function checkOutOpen() {
    setCheckoutOpen(true);
  }
  function checkOutCancel() {
    setCheckoutOpen(false);
  }
  function checkOutConfirm() {
    if (!checkinTimeISO || !todaysAssignment) return;
    const start = new Date(checkinTimeISO);
    const end = new Date();
    const hours = Math.max(0, (end.getTime() - start.getTime()) / (1000 * 60 * 60));

    const newTs: Timesheet = {
      id: Math.random().toString(36).slice(2),
      assignmentId: todaysAssignment.id,
      assignmentTitle: todaysAssignment.title,
      school: todaysAssignment.school,
      date: todaysAssignment.start,
      hours: Math.round(hours * 10) / 10,
      status: 'pending',
    };
    setTimesheets((t) => [newTs, ...t]);
    setCheckedIn(false);
    setCheckinTimeISO(null);
    setCheckoutOpen(false);
    showToast('success', 'Checked out successfully! Timesheet created.');
  }

  const workedHMS = useMemo(() => {
    if (!checkinTimeISO) return '0:00:00';
    const elapsed = Math.max(0, Date.now() - new Date(checkinTimeISO).getTime());
    const h = Math.floor(elapsed / 3_600_000);
    const m = Math.floor((elapsed % 3_600_000) / 60_000);
    const s = Math.floor((elapsed % 60_000) / 1000);
    return `${h}:${m.toString().padStart(2, '0')}:${s.toString().padStart(2, '0')}`;
  }, [timerTick, checkinTimeISO]);

  // --------- TIMESHEETS ---------
  const tsByStatus = useMemo(() => {
    return {
      pending: timesheets.filter((t) => t.status === 'pending'),
      approved: timesheets.filter((t) => t.status === 'approved'),
      rejected: timesheets.filter((t) => t.status === 'rejected'),
    };
  }, [timesheets]);

  function editTimesheet(id: string) {
    showToast('info', 'Opening timesheet editor...');
  }
  function deleteTimesheet(id: string) {
    setTimesheets((t) => t.filter((x) => x.id !== id));
    showToast('success', 'Timesheet deleted');
  }
  function downloadTimesheet(id: string) {
    showToast('success', 'Timesheet downloaded');
  }
  function viewRejectionReason(id: string) {
    const ts = timesheets.find((t) => t.id === id);
    showToast('info', `Rejection reason: ${ts?.rejectionReason ?? '—'}`);
  }
  function resubmitTimesheet(id: string) {
    setTimesheets((t) => t.map((x) => (x.id === id ? { ...x, status: 'pending', rejectionReason: undefined } : x)));
    setTimesheetTab('pending');
    showToast('success', 'Timesheet resubmitted');
  }
  function createTimesheet() {
    showToast('info', 'Opening new timesheet form...');
  }

  // --------- MISC ---------
  function logout() {
    showToast('success', 'Signed out successfully');
  }

  // --------- RENDER UTILS ---------
  function Badge({ kind, children }: { kind: BadgeType; children: React.ReactNode }) {
    const map: Record<BadgeType, string> = {
      single: 'badge-single',
      multi: 'badge-multi',
      partial: 'badge-partial',
      requested: 'badge-requested',
      approved: 'badge-approved',
      claimed: 'badge-claimed',
      completed: 'badge-completed',
      canceled: 'badge-canceled',
      pending: 'badge-pending',
      rejected: 'badge-rejected',
      verified: 'badge-verified',
      expired: 'badge-expired',
    };
    return <span className={classNames(map[kind], 'px-2 py-1 rounded-full text-xs font-medium')}>{children}</span>;
  }

  function SectionWrapper({ children }: { children: React.ReactNode }) {
    const maxWidth = section === 'today' ? 'max-w-4xl' : 'max-w-7xl';
    return <div className={`${maxWidth} mx-auto px-4 sm:px-6 lg:px-8 py-8`}>{children}</div>;
  }

  // --------- NAV HANDLERS ---------
  function goSection(next: Section) {
    setSection(next);
  }
  function setActiveTab(next: Tab) {
    setTab(next);
  }
  function setActiveTimesheetTab(next: TimesheetTab) {
    setTimesheetTab(next);
  }

  // Accessibility: close overlays on Escape
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        setNotifsOpen(false);
        setRequestOpen(false);
        setCheckoutOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  // --------- FILTERED ASSIGNMENTS BY STATUS ---------
  const requestedAssignments = assignments.filter((a) => a.status === 'requested');
  const approvedAssignments = assignments.filter((a) => a.status === 'approved');
  const claimedAssignments = assignments.filter((a) => a.status === 'claimed');
  const completedAssignments = assignments.filter((a) => a.status === 'completed');
  const canceledAssignments = assignments.filter((a) => a.status === 'canceled');

  // --------- UI ---------
  return (
    <div className={classNames(inter.className, 'min-h-screen bg-bg text-gray-900')}>
      {/* Global styles to match your original design */}
      <style jsx global>{`
        :root {
          color-scheme: light;
        }
        .card-hover {
          transition: all 0.2s ease;
        }
        .card-hover:hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 25px rgba(37, 99, 235, 0.15);
        }
        .loading-spinner {
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          from {
            transform: rotate(0deg);
          }
          to {
            transform: rotate(360deg);
          }
        }
        .fade-in {
          animation: fadeIn 0.3s ease-out;
        }
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(10px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .toast {
          animation: slideInRight 0.3s ease-out;
        }
        @keyframes slideInRight {
          from {
            transform: translateX(100%);
            opacity: 0;
          }
          to {
            transform: translateX(0);
            opacity: 1;
          }
        }
        .drawer-overlay {
          background: rgba(0, 0, 0, 0.8);
          backdrop-filter: blur(4px);
        }
        .drawer-slide {
          animation: slideInFromRight 0.3s ease-out;
        }
        @keyframes slideInFromRight {
          from {
            transform: translateX(100%);
          }
          to {
            transform: translateX(0);
          }
        }
        .drawer-slide-out {
          animation: slideOutToRight 0.3s ease-out;
        }
        @keyframes slideOutToRight {
          from {
            transform: translateX(0);
          }
          to {
            transform: translateX(100%);
          }
        }
        .badge-single {
          background: linear-gradient(135deg, #ebf4ff, #dbeafe);
          color: #1e40af;
          border: 1px solid #2563eb20;
        }
        .badge-multi {
          background: linear-gradient(135deg, #f0f9ff, #e0f2fe);
          color: #0c4a6e;
          border: 1px solid #0ea5e920;
        }
        .badge-partial {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          border: 1px solid #f59e0b20;
        }
        .badge-requested {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          border: 1px solid #f59e0b20;
        }
        .badge-approved {
          background: linear-gradient(135deg, #dbeafe, #bfdbfe);
          color: #1e40af;
          border: 1px solid #2563eb30;
        }
        .badge-claimed {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
          border: 1px solid #22c55e20;
        }
        .badge-completed {
          background: linear-gradient(135deg, #e5e7eb, #d1d5db);
          color: #374151;
          border: 1px solid #6b728020;
        }
        .badge-canceled {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #991b1b;
          border: 1px solid #ef444420;
        }
        .badge-pending {
          background: linear-gradient(135deg, #fef3c7, #fde68a);
          color: #92400e;
          border: 1px solid #f59e0b20;
        }
        .badge-rejected {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #991b1b;
          border: 1px solid #ef444420;
        }
        .badge-verified {
          background: linear-gradient(135deg, #d1fae5, #a7f3d0);
          color: #065f46;
          border: 1px solid #22c55e20;
        }
        .badge-expired {
          background: linear-gradient(135deg, #fee2e2, #fecaca);
          color: #991b1b;
          border: 1px solid #ef444420;
        }
        .tab-active {
          background: #2563eb;
          color: white;
        }
        .tab-inactive {
          background: white;
          color: #6b7280;
          border: 1px solid #d1d5db;
        }
        .tab-inactive:hover {
          background: #f9fafb;
          color: #374151;
        }
        .nav-active {
          background: #ebf4ff;
          color: #2563eb;
          border-right: 3px solid #2563eb;
        }
        .nav-inactive {
          color: #6b7280;
        }
        .nav-inactive:hover {
          background: #f9fafb;
          color: #374151;
        }
        .timer-pulse {
          animation: pulse 2s infinite;
        }
        @keyframes pulse {
          0%,
          100% {
            opacity: 1;
          }
          50% {
            opacity: 0.7;
          }
        }
        .skeleton {
          background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%);
          background-size: 200% 100%;
          animation: loading 1.5s infinite;
        }
        @keyframes loading {
          0% {
            background-position: 200% 0;
          }
          100% {
            background-position: -200% 0;
          }
        }
        .step-active {
          background: #2563eb;
          color: white;
        }
        .step-completed {
          background: #22c55e;
          color: white;
        }
        .step-inactive {
          background: #e5e7eb;
          color: #6b7280;
        }
        .step-line-active {
          background: #2563eb;
        }
        .step-line-completed {
          background: #22c55e;
        }
        .step-line-inactive {
          background: #e5e7eb;
        }
        @media (prefers-reduced-motion: reduce) {
          .drawer-slide,
          .drawer-slide-out,
          .fade-in,
          .toast,
          .loading-spinner,
          .timer-pulse,
          .skeleton {
            animation: none;
          }
          .card-hover:hover {
            transform: none;
          }
        }
      `}</style>

      {/* Header */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Safer Attendance</h1>
                <p className="text-xs text-gray-500">Substitute Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              {/* Role Switcher */}
              <label className="sr-only" htmlFor="roleSelector">
                Role
              </label>
              <select
                id="roleSelector"
                value={role}
                onChange={(e) => setRole(e.target.value as Role)}
                className="border border-gray-300 rounded-lg px-3 py-1 text-sm"
                aria-label="Switch role"
              >
                <option value="substitute">Substitute View</option>
                <option value="admin">Admin View</option>
              </select>

              {/* Notifications */}
              <button
                onClick={() => setNotifsOpen(true)}
                className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-haspopup="dialog"
                aria-controls="notificationsPanel"
                aria-expanded={notifsOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3" />
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">
                  3
                </span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2" aria-label="Current user">
                  <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                    S
                  </div>
                  <span className="text-sm font-medium text-gray-900">Sarah Thompson</span>
                </div>
                <button onClick={logout} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                  Sign out
                </button>
              </div>
            </div>
          </div>
        </div>
      </header>

      {/* App Shell */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0" aria-label="Sidebar">
          <div className="p-4 space-y-1">
            {/* Substitute Nav */}
            <div className={role === 'substitute' ? '' : 'hidden'}>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Substitute Portal</h3>
              </div>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('browse');
                }}
                className={classNames(
                  section === 'browse' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <span>Browse Assignments</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('dashboard');
                }}
                className={classNames(
                  section === 'dashboard' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z" />
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z" />
                </svg>
                <span>My Assignments</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('today');
                }}
                className={classNames(
                  section === 'today' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <span>Today</span>
                <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">1</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('timesheets');
                }}
                className={classNames(
                  section === 'timesheets' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                </svg>
                <span>Timesheets</span>
                <span className="ml-auto bg-warning text-white text-xs px-2 py-1 rounded-full">
                  {tsByStatus.pending.length}
                </span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('profile');
                }}
                className={classNames(
                  section === 'profile' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                </svg>
                <span>Profile & Documents</span>
              </a>
            </div>

            {/* Admin Nav */}
            <div className={role === 'admin' ? '' : 'hidden'}>
              <div className="mb-4">
                <h3 className="text-xs font-semibold text-gray-500 uppercase tracking-wider mb-2">Admin Dashboard</h3>
              </div>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('admin-overview');
                }}
                className={classNames(
                  section === 'admin-overview' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" />
                </svg>
                <span>Overview</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('admin-assignments');
                }}
                className={classNames(
                  section === 'admin-assignments' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" />
                </svg>
                <span>Manage Assignments</span>
                <span className="ml-auto bg-warning text-white text-xs px-2 py-1 rounded-full">12</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('admin-substitutes');
                }}
                className={classNames(
                  section === 'admin-substitutes' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z" />
                </svg>
                <span>Substitute Management</span>
              </a>

              <a
                href="#"
                onClick={(e) => {
                  e.preventDefault();
                  goSection('admin-reports');
                }}
                className={classNames(
                  section === 'admin-reports' ? 'nav-active' : 'nav-inactive',
                  'flex items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium'
                )}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-2m3 2v-4m3 4v-6m2 10H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                <span>Reports & Analytics</span>
              </a>
            </div>
          </div>
        </nav>

        {/* Main content */}
        <main className="flex-1 overflow-hidden">
          {/* BROWSE (Step 2) */}
          {section === 'browse' && (
            <div id="section-browse" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Browse Assignments</h1>
                  <p className="text-lg text-gray-600">Find and request substitute teaching opportunities.</p>
                </div>

                {/* Filters */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">District</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={filterDistrict}
                        onChange={(e) => setFilterDistrict(e.target.value)}
                      >
                        <option>All Districts</option>
                        <option>Springfield School District</option>
                        <option>Riverside Unified</option>
                        <option>Mountain View Elementary</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Subject</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={filterSubject}
                        onChange={(e) => setFilterSubject(e.target.value)}
                      >
                        <option>All Subjects</option>
                        <option>Mathematics</option>
                        <option>Science</option>
                        <option>English</option>
                        <option>Art</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Grade Level</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={filterGrades}
                        onChange={(e) => setFilterGrades(e.target.value)}
                      >
                        <option>All Grades</option>
                        <option>K-2</option>
                        <option>3-5</option>
                        <option>6-8</option>
                        <option>9-12</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Date</label>
                      <input
                        type="date"
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={filterDate}
                        onChange={(e) => setFilterDate(e.target.value)}
                      />
                    </div>
                  </div>
                  <div className="mt-4 flex justify-between items-center">
                    <button onClick={clearFilters} className="text-gray-500 hover:text-gray-700 text-sm font-medium">
                      Clear Filters
                    </button>
                    <button
                      onClick={applyFilters}
                      className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Apply Filters
                    </button>
                  </div>
                </div>

                {/* Assignment Cards */}
                <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                  {browseItems.length === 0 && (
                    <div className="col-span-full">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">
                        No assignments match your filters.
                      </div>
                    </div>
                  )}
                  {browseItems.map((a) => (
                    <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex-1">
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-sm text-gray-500">{a.school}</p>
                            <Badge kind={a.type === 'single' ? 'single' : a.type === 'multi' ? 'multi' : 'partial'}>
                              {a.type === 'single' ? 'Single day' : a.type === 'multi' ? 'Multi day' : 'Partial day'}
                            </Badge>
                          </div>
                          <h3 className="font-bold text-gray-900 text-lg mb-2">{a.title}</h3>
                          <p className="text-sm text-gray-600 mb-3">{fmtDateRange(a.start, a.end, tz)}</p>
                          <p className="text-sm text-gray-600">{a.notes}</p>
                        </div>
                        <div className="text-right">
                          <p className="text-lg font-bold text-primary">{dollars(a.pay)}</p>
                          <p className="text-xs text-gray-500">
                            {Math.round((new Date(a.end).getTime() - new Date(a.start).getTime()) / 36e5 * 10) / 10} hours
                          </p>
                        </div>
                      </div>
                      <div className="flex justify-between items-center">
                        <div className="flex items-center space-x-2">
                          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          <span className="text-sm text-gray-500">{a.distanceMiles} miles away</span>
                        </div>
                        <button
                          onClick={() => requestAssignmentById(a.id)}
                          className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                        >
                          Request Assignment
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* MY ASSIGNMENTS (Step 5) */}
          {section === 'dashboard' && (
            <div id="section-dashboard" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
                  <p className="text-lg text-gray-600">Track your requested, approved, and completed assignments.</p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {(['requested', 'approved', 'claimed', 'completed'] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTab(t)}
                        className={classNames(t === tab ? 'tab-active' : 'tab-inactive', 'px-4 py-2 rounded-md text-sm font-medium transition-colors')}
                      >
                        {t === 'requested' && `Requested (${requestedAssignments.length})`}
                        {t === 'approved' && `Approved (${approvedAssignments.length})`}
                        {t === 'claimed' && `Claimed (${claimedAssignments.length})`}
                        {t === 'completed' && `Completed (${completedAssignments.length})`}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Content */}
                <div id="assignments-content" className="space-y-4">
                  {/* Requested */}
                  {tab === 'requested' &&
                    (requestedAssignments.length ? (
                      requestedAssignments.map((a) => (
                        <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm text-gray-500">{a.school}</p>
                                <Badge kind="requested">Requested</Badge>
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-2">{a.title}</h3>
                              <p className="text-sm text-gray-600 mb-3">{fmtDateRange(a.start, a.end, tz)}</p>
                              <div className="flex gap-2 mb-3">
                                <Badge kind={a.type === 'single' ? 'single' : a.type === 'multi' ? 'multi' : 'partial'}>
                                  {a.type === 'single' ? 'Single day' : a.type === 'multi' ? 'Multi day' : 'Partial day'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{a.notes}</p>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => showToast('info', 'Opening assignment details...')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => cancelRequest(a.id)}
                                className="text-danger hover:bg-red-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                Cancel Request
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">No requested assignments.</div>
                    ))}

                  {/* Approved */}
                  {tab === 'approved' &&
                    (approvedAssignments.length ? (
                      approvedAssignments.map((a) => (
                        <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm text-gray-500">{a.school}</p>
                                <Badge kind="approved">Approved</Badge>
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-2">{a.title}</h3>
                              <p className="text-sm text-gray-600 mb-3">{fmtDateRange(a.start, a.end, tz)}</p>
                              <div className="flex gap-2 mb-3">
                                <Badge kind={a.type === 'single' ? 'single' : a.type === 'multi' ? 'multi' : 'partial'}>
                                  {a.type === 'single' ? 'Single day' : a.type === 'multi' ? 'Multi day' : 'Partial day'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{a.notes}</p>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => claimAssignment(a.id)}
                                className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                Claim Assignment
                              </button>
                              <div className="flex space-x-2">
                                <button
                                  onClick={() => addToCalendar(a)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                                  aria-label="Add to calendar"
                                >
                                  📅 Calendar
                                </button>
                                <button
                                  onClick={() => openDirections(a)}
                                  className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors"
                                  aria-label="Get directions"
                                >
                                  🗺️ Directions
                                </button>
                              </div>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">No approved assignments.</div>
                    ))}

                  {/* Claimed */}
                  {tab === 'claimed' &&
                    (claimedAssignments.length ? (
                      claimedAssignments.map((a) => (
                        <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm text-gray-500">{a.school}</p>
                                <Badge kind="claimed">Claimed</Badge>
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-2">{a.title}</h3>
                              <p className="text-sm text-gray-600 mb-3">{fmtDateRange(a.start, a.end, tz)}</p>
                              <div className="flex gap-2 mb-3">
                                <Badge kind={a.type === 'single' ? 'single' : a.type === 'multi' ? 'multi' : 'partial'}>
                                  {a.type === 'single' ? 'Single day' : a.type === 'multi' ? 'Multi day' : 'Partial day'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">{a.notes}</p>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => showToast('info', 'Opening assignment details...')}
                                className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                View Details
                              </button>
                              <button
                                onClick={() => unclaimAssignment(a.id)}
                                className="text-danger hover:bg-red-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                Unclaim
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">No claimed assignments.</div>
                    ))}

                  {/* Completed */}
                  {tab === 'completed' &&
                    (completedAssignments.length ? (
                      completedAssignments.map((a) => (
                        <div key={a.id} className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                          <div className="flex justify-between items-start">
                            <div className="flex-1 min-w-0 pr-4">
                              <div className="flex items-center space-x-2 mb-2">
                                <p className="text-sm text-gray-500">{a.school}</p>
                                <Badge kind="completed">Completed</Badge>
                              </div>
                              <h3 className="font-bold text-gray-900 text-lg mb-2">{a.title}</h3>
                              <p className="text-sm text-gray-600 mb-3">{fmtDateRange(a.start, a.end, tz)}</p>
                              <div className="flex gap-2 mb-3">
                                <Badge kind={a.type === 'single' ? 'single' : a.type === 'multi' ? 'multi' : 'partial'}>
                                  {a.type === 'single' ? 'Single day' : a.type === 'multi' ? 'Multi day' : 'Partial day'}
                                </Badge>
                              </div>
                              <p className="text-sm text-gray-600">Successfully completed.</p>
                            </div>
                            <div className="flex flex-col space-y-2">
                              <button
                                onClick={() => showToast('info', 'Opening assignment summary...')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                View Summary
                              </button>
                              <button
                                onClick={() => goSection('timesheets')}
                                className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors"
                              >
                                Timesheet
                              </button>
                            </div>
                          </div>
                        </div>
                      ))
                    ) : (
                      <div className="bg-white rounded-xl border border-gray-200 p-6 text-center text-gray-600">No completed assignments.</div>
                    ))}
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* TODAY */}
          {section === 'today' && (
            <div id="section-today" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Assignment</h1>
                  <p className="text-lg text-gray-600">
                    {new Intl.DateTimeFormat('en-US', { dateStyle: 'long', timeZone: tz }).format(new Date())}
                  </p>
                </div>

                {/* Card */}
                <div className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
                  {todaysAssignment ? (
                    <>
                      <div className="flex items-start justify-between mb-6">
                        <div>
                          <div className="flex items-center space-x-2 mb-2">
                            <p className="text-sm text-gray-500">{todaysAssignment.school}</p>
                            <Badge kind="claimed">Claimed</Badge>
                          </div>
                          <h2 className="text-2xl font-bold text-gray-900 mb-2">{todaysAssignment.title}</h2>
                          <p className="text-lg text-gray-600 mb-4">
                            {fmtDateRange(todaysAssignment.start, todaysAssignment.end, tz)} (
                            {Math.round(
                              ((new Date(todaysAssignment.end).getTime() - new Date(todaysAssignment.start).getTime()) / 36e5) * 10
                            ) / 10}{' '}
                            hours)
                          </p>
                          <div className="flex gap-2 mb-4">
                            <Badge kind="partial">Partial day</Badge>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-sm text-gray-500 mb-1">Room</p>
                          <p className="font-semibold text-gray-900">{todaysAssignment.room ?? '—'}</p>
                        </div>
                      </div>

                      {/* Check-in Status */}
                      <div className="border-t border-gray-200 pt-6">
                        {!checkedIn ? (
                          <div className="text-center">
                            <div className="mb-4">
                              <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                                <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                                </svg>
                              </div>
                              <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Check In?</h3>
                              <p className="text-gray-600 mb-6">Tap the button below when you arrive at the school.</p>
                            </div>
                            <button
                              onClick={checkIn}
                              className="bg-accent hover:bg-green-600 text-white py-3 px-8 rounded-lg text-lg font-medium transition-colors"
                            >
                              Check In
                            </button>
                          </div>
                        ) : (
                          <div>
                            <div className="flex items-center justify-between mb-6">
                              <div className="flex items-center space-x-4">
                                <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                                  <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                                  </svg>
                                </div>
                                <div>
                                  <h3 className="text-lg font-semibold text-gray-900">Checked In</h3>
                                  <p className="text-gray-600">
                                    Started at{' '}
                                    <span id="checkinTime">
                                      {new Intl.DateTimeFormat('en-US', {
                                        timeZone: tz,
                                        hour: 'numeric',
                                        minute: '2-digit',
                                      }).format(new Date(checkinTimeISO!))}
                                    </span>
                                  </p>
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-2xl font-bold text-gray-900 timer-pulse" id="workTimer">
                                  {workedHMS}
                                </div>
                                <p className="text-sm text-gray-500">Time worked</p>
                              </div>
                            </div>

                            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                              <button
                                onClick={() => showToast('info', 'Issue report form opened')}
                                className="bg-warning hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                              >
                                Report Issue
                              </button>
                              <button
                                onClick={checkOutOpen}
                                className="bg-primary hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors"
                              >
                                Check Out
                              </button>
                            </div>
                          </div>
                        )}
                      </div>

                      {/* Assignment Notes */}
                      <div className="border-t border-gray-200 pt-6 mt-6">
                        <h4 className="font-semibold text-gray-900 mb-3">Assignment Notes</h4>
                        <p className="text-gray-600 leading-relaxed">{todaysAssignment.notes}</p>
                      </div>

                      {/* Quick Actions */}
                      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
                        <button
                          onClick={() => openDirections(todaysAssignment)}
                          className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Get Directions</h3>
                              <p className="text-sm text-gray-500">Navigate to school</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => showToast('info', 'Calling school...')}
                          className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Contact School</h3>
                              <p className="text-sm text-gray-500">(555) 123-4567</p>
                            </div>
                          </div>
                        </button>

                        <button
                          onClick={() => showToast('info', 'Opening lesson plans...')}
                          className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors"
                        >
                          <div className="flex items-center space-x-3">
                            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                              </svg>
                            </div>
                            <div>
                              <h3 className="font-medium text-gray-900">Lesson Plans</h3>
                              <p className="text-sm text-gray-500">View materials</p>
                            </div>
                          </div>
                        </button>
                      </div>
                    </>
                  ) : (
                    <div className="text-gray-600">You have no claimed assignment today.</div>
                  )}
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* TIMESHEETS */}
          {section === 'timesheets' && (
            <div id="section-timesheets" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Timesheets</h1>
                    <p className="text-lg text-gray-600">Track your hours and submit timesheets for approval.</p>
                  </div>
                  <button
                    onClick={createTimesheet}
                    className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    New Timesheet
                  </button>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {(['pending', 'approved', 'rejected'] as TimesheetTab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => setActiveTimesheetTab(t)}
                        className={classNames(
                          t === timesheetTab ? 'tab-active' : 'tab-inactive',
                          'px-4 py-2 rounded-md text-sm font-medium transition-colors'
                        )}
                      >
                        {t === 'pending' && `Pending (${tsByStatus.pending.length})`}
                        {t === 'approved' && `Approved (${tsByStatus.approved.length})`}
                        {t === 'rejected' && `Rejected (${tsByStatus.rejected.length})`}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Assignment</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Date</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Hours</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        {(timesheetTab === 'pending' ? tsByStatus.pending : timesheetTab === 'approved' ? tsByStatus.approved : tsByStatus.rejected).map(
                          (ts) => (
                            <tr key={ts.id} className="hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-medium text-gray-900">{ts.assignmentTitle}</p>
                                  <p className="text-sm text-gray-500">{ts.school}</p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-900">
                                {new Intl.DateTimeFormat('en-US', { timeZone: tz, dateStyle: 'medium' }).format(new Date(ts.date))}
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-900">{ts.hours.toFixed(1)} hours</td>
                              <td className="py-4 px-6">
                                {ts.status === 'pending' && <Badge kind="pending">Pending</Badge>}
                                {ts.status === 'approved' && <Badge kind="verified">Approved</Badge>}
                                {ts.status === 'rejected' && <Badge kind="rejected">Rejected</Badge>}
                              </td>
                              <td className="py-4 px-6">
                                {ts.status === 'pending' && (
                                  <div className="flex space-x-2">
                                    <button onClick={() => editTimesheet(ts.id)} className="text-primary hover:text-blue-700 text-sm font-medium">
                                      Edit
                                    </button>
                                    <button onClick={() => deleteTimesheet(ts.id)} className="text-danger hover:text-red-700 text-sm font-medium">
                                      Delete
                                    </button>
                                  </div>
                                )}
                                {ts.status === 'approved' && (
                                  <button onClick={() => downloadTimesheet(ts.id)} className="text-primary hover:text-blue-700 text-sm font-medium">
                                    Download
                                  </button>
                                )}
                                {ts.status === 'rejected' && (
                                  <div className="flex space-x-2">
                                    <button onClick={() => viewRejectionReason(ts.id)} className="text-primary hover:text-blue-700 text-sm font-medium">
                                      View Reason
                                    </button>
                                    <button onClick={() => resubmitTimesheet(ts.id)} className="text-accent hover:text-green-700 text-sm font-medium">
                                      Resubmit
                                    </button>
                                  </div>
                                )}
                              </td>
                            </tr>
                          )
                        )}
                        {((timesheetTab === 'pending' && tsByStatus.pending.length === 0) ||
                          (timesheetTab === 'approved' && tsByStatus.approved.length === 0) ||
                          (timesheetTab === 'rejected' && tsByStatus.rejected.length === 0)) && (
                          <tr>
                            <td colSpan={5} className="py-8 px-6 text-center text-gray-600">
                              No {timesheetTab} timesheets.
                            </td>
                          </tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* PROFILE (light) */}
          {section === 'profile' && (
            <div id="section-profile" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Documents</h1>
                  <p className="text-lg text-gray-600">Manage your personal information and required documents.</p>
                </div>

                {/* Profile Information */}
                <div className="bg-white rounded-xl border border-gray-200 p-6 mb-8">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Profile Information</h2>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Full Name</label>
                      <input type="text" defaultValue="Sarah Thompson" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Email</label>
                      <input type="email" defaultValue="sarah.thompson@email.com" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Phone</label>
                      <input type="tel" defaultValue="(555) 123-4567" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Timezone</label>
                      <select
                        className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                        value={tz}
                        onChange={(e) => setTz(e.target.value)}
                      >
                        <option value="America/Los_Angeles">Pacific Time (PT)</option>
                        <option value="America/Denver">Mountain Time (MT)</option>
                        <option value="America/Chicago">Central Time (CT)</option>
                        <option value="America/New_York">Eastern Time (ET)</option>
                      </select>
                    </div>
                    <div>
                      <label className="block text-sm font-medium text-gray-700 mb-2">Default District</label>
                      <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" defaultValue="Springfield School District">
                        <option>Springfield School District</option>
                        <option>Riverside Unified</option>
                        <option>Mountain View Elementary</option>
                      </select>
                    </div>
                  </div>
                  <div className="mt-6">
                    <button
                      onClick={() => showToast('success', 'Profile updated successfully')}
                      className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Save Changes
                    </button>
                  </div>
                </div>

                {/* Documents (compact demo) */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <div className="flex justify-between items-center mb-6">
                    <h2 className="text-xl font-semibold text-gray-900">Documents & Certifications</h2>
                    <button
                      onClick={() => showToast('info', 'Opening document upload...')}
                      className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                    >
                      Upload Document
                    </button>
                  </div>

                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Teaching License</h3>
                          <p className="text-sm text-gray-500">Expires: June 2025</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge kind="verified">Verified</Badge>
                        <button onClick={() => showToast('info', 'Replacing license document...')} className="text-primary hover:text-blue-700 text-sm font-medium">
                          Replace
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">Background Check</h3>
                          <p className="text-sm text-gray-500">Completed: January 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge kind="verified">Verified</Badge>
                        <button onClick={() => showToast('info', 'Opening background document...')} className="text-primary hover:text-blue-700 text-sm font-medium">
                          View
                        </button>
                      </div>
                    </div>

                    <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                      <div className="flex items-center space-x-4">
                        <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                        </div>
                        <div>
                          <h3 className="font-medium text-gray-900">CPR Certification</h3>
                          <p className="text-sm text-gray-500">Expires: March 2024</p>
                        </div>
                      </div>
                      <div className="flex items-center space-x-3">
                        <Badge kind="pending">Expiring Soon</Badge>
                        <button onClick={() => showToast('info', 'Opening CPR renewal process...')} className="text-warning hover:text-yellow-700 text-sm font-medium">
                          Renew
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* ADMIN OVERVIEW (Step 4 demo) */}
          {role === 'admin' && section === 'admin-overview' && (
            <div id="section-admin-overview" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Admin Dashboard</h1>
                  <p className="text-lg text-gray-600">Overview of substitute assignments and system metrics.</p>
                </div>

                {/* Stats */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
                  {[
                    { title: 'Open Assignments', value: 24, tone: 'blue', delta: '+12% from last week' },
                    { title: 'Active Substitutes', value: 156, tone: 'green', delta: '+8 new this month' },
                    { title: 'Fill Rate', value: '87%', tone: 'yellow', delta: '-3% from target', danger: true },
                    { title: 'Pending Approvals', value: 12, tone: 'red', delta: 'Requires attention' },
                  ].map((c, i) => (
                    <div key={i} className="bg-white rounded-xl border border-gray-200 p-6">
                      <div className="flex items-center justify-between">
                        <div>
                          <p className="text-sm font-medium text-gray-600">{c.title}</p>
                          <p className="text-3xl font-bold text-gray-900">{c.value}</p>
                        </div>
                        <div
                          className={classNames(
                            'w-12 h-12 rounded-lg flex items-center justify-center',
                            c.tone === 'blue' && 'bg-blue-100',
                            c.tone === 'green' && 'bg-green-100',
                            c.tone === 'yellow' && 'bg-yellow-100',
                            c.tone === 'red' && 'bg-red-100'
                          )}
                        >
                          <svg
                            className={classNames(
                              'w-6 h-6',
                              c.tone === 'blue' && 'text-blue-600',
                              c.tone === 'green' && 'text-green-600',
                              c.tone === 'yellow' && 'text-yellow-600',
                              c.tone === 'red' && 'text-red-600'
                            )}
                            fill="none"
                            stroke="currentColor"
                            viewBox="0 0 24 24"
                            aria-hidden="true"
                          >
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2" />
                          </svg>
                        </div>
                      </div>
                      <div className="mt-4">
                        <span className={classNames('text-sm', c.danger ? 'text-red-600' : c.tone === 'yellow' ? 'text-yellow-600' : 'text-green-600')}>
                          {c.delta}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>

                {/* Recent Activity */}
                <div className="bg-white rounded-xl border border-gray-200 p-6">
                  <h2 className="text-xl font-semibold text-gray-900 mb-6">Recent Activity</h2>
                  <div className="space-y-4">
                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-green-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">Assignment Filled</p>
                        <p className="text-sm text-gray-600">Sarah Thompson claimed Math assignment at Lincoln Elementary</p>
                        <p className="text-xs text-gray-500">2 minutes ago</p>
                      </div>
                    </div>

                    <div className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg">
                      <div className="w-10 h-10 bg-blue-100 rounded-full flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6v6m0 0v6m0-6h6m-6 0H6" />
                        </svg>
                      </div>
                      <div className="flex-1">
                        <p className="font-medium text-gray-900">New Assignment Posted</p>
                        <p className="text-sm text-gray-600">Science teacher needed at Roosevelt High School</p>
                        <p className="text-xs text-gray-500">15 minutes ago</p>
                      </div>
                    </div>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* ADMIN ASSIGNMENTS */}
          {role === 'admin' && section === 'admin-assignments' && (
            <div id="section-admin-assignments" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Manage Assignments</h1>
                    <p className="text-lg text-gray-600">Create, edit, and manage substitute assignments.</p>
                  </div>
                  <button
                    onClick={() => showToast('info', 'Opening assignment creation form...')}
                    className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                  >
                    Create Assignment
                  </button>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Assignment</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">School</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Date</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Substitute</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div>
                              <p className="font-medium text-gray-900">Mathematics • Grade 3</p>
                              <p className="text-sm text-gray-500">Mrs. Johnson&apos;s class</p>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-900">Lincoln Elementary</td>
                          <td className="py-4 px-6 text-sm text-gray-900">
                            {new Intl.DateTimeFormat('en-US', { dateStyle: 'medium' }).format(new Date('2024-02-15'))}
                          </td>
                          <td className="py-4 px-6">
                            <Badge kind="claimed">Filled</Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-900">Sarah Thompson</td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <button onClick={() => showToast('info', 'Opening assignment editor...')} className="text-primary hover:text-blue-700 text-sm font-medium">
                                Edit
                              </button>
                              <button onClick={() => showToast('info', 'Opening assignment details...')} className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                                View
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* ADMIN SUBSTITUTES */}
          {role === 'admin' && section === 'admin-substitutes' && (
            <div id="section-admin-substitutes" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Substitute Management</h1>
                  <p className="text-lg text-gray-600">Manage substitute teachers and their qualifications.</p>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  <div className="overflow-x-auto">
                    <table className="w-full">
                      <thead className="bg-gray-50 border-b border-gray-200">
                        <tr>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Name</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Subjects</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Status</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Rating</th>
                          <th className="text-left py-3 px-6 text-sm font-medium text-gray-900">Actions</th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-200">
                        <tr className="hover:bg-gray-50">
                          <td className="py-4 px-6">
                            <div className="flex items-center space-x-3">
                              <div className="w-8 h-8 bg-gradient-to-r from-primary to-blue-600 rounded-full flex items-center justify-center text-white text-sm font-medium">
                                S
                              </div>
                              <div>
                                <p className="font-medium text-gray-900">Sarah Thompson</p>
                                <p className="text-sm text-gray-500">sarah.thompson@email.com</p>
                              </div>
                            </div>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-900">Math, Science, English</td>
                          <td className="py-4 px-6">
                            <Badge kind="verified">Active</Badge>
                          </td>
                          <td className="py-4 px-6 text-sm text-gray-900">4.8/5.0</td>
                          <td className="py-4 px-6">
                            <div className="flex space-x-2">
                              <button onClick={() => showToast('info', 'Opening substitute profile...')} className="text-primary hover:text-blue-700 text-sm font-medium">
                                View
                              </button>
                              <button onClick={() => showToast('info', 'Opening substitute editor...')} className="text-gray-600 hover:text-gray-800 text-sm font-medium">
                                Edit
                              </button>
                            </div>
                          </td>
                        </tr>
                      </tbody>
                    </table>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}

          {/* ADMIN REPORTS */}
          {role === 'admin' && section === 'admin-reports' && (
            <div id="section-admin-reports" className="h-full overflow-y-auto">
              <SectionWrapper>
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Reports & Analytics</h1>
                  <p className="text-lg text-gray-600">View system performance and generate reports.</p>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Fill Rate</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-primary mb-2">87%</div>
                      <p className="text-sm text-gray-600">Last 30 days</p>
                    </div>
                  </div>

                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Average Response Time</h3>
                    <div className="text-center">
                      <div className="text-4xl font-bold text-accent mb-2">2.3h</div>
                      <p className="text-sm text-gray-600">Time to fill assignments</p>
                    </div>
                  </div>
                </div>
              </SectionWrapper>
            </div>
          )}
        </main>
      </div>

      {/* Notifications Panel */}
      {notifsOpen && (
        <div
          id="notificationsPanel"
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="notificationsTitle"
        >
          <button className="drawer-overlay absolute inset-0" onClick={() => setNotifsOpen(false)} aria-label="Close notifications overlay" />
          <div className="drawer-slide absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl">
            <div className="flex flex-col h-full">
              <div className="flex items-center justify-between p-6 border-b border-gray-200">
                <h2 id="notificationsTitle" className="text-xl font-bold text-gray-900">
                  Notifications
                </h2>
                <button
                  onClick={() => setNotifsOpen(false)}
                  className="text-gray-400 hover:text-gray-600 p-2"
                  aria-label="Close notifications"
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <div className="flex-1 overflow-y-auto p-6 space-y-4">
                <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Assignment Approved</h3>
                      <p className="text-sm text-gray-600 mt-1">Your request for English Literature at Roosevelt High has been approved.</p>
                      <p className="text-xs text-gray-500 mt-2">2 hours ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-warning rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">Timesheet Reminder</h3>
                      <p className="text-sm text-gray-600 mt-1">Don&apos;t forget to submit your timesheet for Feb 10 assignment.</p>
                      <p className="text-xs text-gray-500 mt-2">1 day ago</p>
                    </div>
                  </div>
                </div>

                <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                  <div className="flex items-start space-x-3">
                    <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                      <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                      </svg>
                    </div>
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-900">District Update</h3>
                      <p className="text-sm text-gray-600 mt-1">Springfield School District has updated their substitute policies.</p>
                      <p className="text-xs text-gray-500 mt-2">3 days ago</p>
                    </div>
                  </div>
                </div>
              </div>

              <div className="p-6 border-t border-gray-200">
                <button
                  onClick={() => {
                    showToast('success', 'All notifications marked as read');
                    setNotifsOpen(false);
                  }}
                  className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Mark All as Read
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Request Assignment Modal (Step 3) */}
      {requestOpen && selectedAssignment && (
        <div
          id="requestModal"
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="requestTitle"
        >
          <button className="drawer-overlay absolute inset-0" onClick={closeRequestModal} aria-label="Close request overlay" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
              {/* Header / Steps */}
              <div className="p-6 border-b border-gray-200">
                <div className="flex items-center justify-between mb-4">
                  <h2 id="requestTitle" className="text-xl font-bold text-gray-900">
                    Request Assignment
                  </h2>
                  <button
                    onClick={closeRequestModal}
                    className="text-gray-400 hover:text-gray-600 p-2"
                    aria-label="Close request"
                    ref={requestCloseBtnRef}
                  >
                    <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                {/* Progress */}
                <div className="flex items-center space-x-4" aria-label="Progress">
                  <div className="flex items-center">
                    <div className={classNames(requestStep > 1 ? 'step-completed' : requestStep === 1 ? 'step-active' : 'step-inactive', 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium')}>1</div>
                    <span className="ml-2 text-sm font-medium text-gray-900">Review</span>
                  </div>
                  <div className={classNames('h-1 w-12 rounded', stepLineClass(1))} />
                  <div className="flex items-center">
                    <div className={classNames(requestStep > 2 ? 'step-completed' : requestStep === 2 ? 'step-active' : 'step-inactive', 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium')}>2</div>
                    <span className="ml-2 text-sm font-medium text-gray-900">Confirm</span>
                  </div>
                  <div className={classNames('h-1 w-12 rounded', stepLineClass(2))} />
                  <div className="flex items-center">
                    <div className={classNames(requestStep === 3 ? 'step-active' : 'step-inactive', 'w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium')}>3</div>
                    <span className="ml-2 text-sm font-medium text-gray-900">Complete</span>
                  </div>
                </div>
              </div>

              {/* Steps */}
              <div className="p-6">
                {/* Step 1 */}
                {requestStep === 1 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Assignment Details</h3>
                    <div className="bg-gray-50 rounded-lg p-4 mb-6">
                      <h4 className="font-bold text-gray-900 text-lg mb-2" id="modalAssignmentTitle">
                        {selectedAssignment.title}
                      </h4>
                      <p className="text-sm text-gray-600 mb-2" id="modalSchoolName">
                        {selectedAssignment.school}
                      </p>
                      <p className="text-sm text-gray-600 mb-3" id="modalDateTime">
                        {fmtDateRange(selectedAssignment.start, selectedAssignment.end, tz)}
                      </p>
                      <p className="text-sm text-gray-600" id="modalDescription">
                        {selectedAssignment.notes}
                      </p>
                    </div>

                    <div className="space-y-4 mb-6">
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="whyField">
                          Why are you interested in this assignment?
                        </label>
                        <textarea
                          id="whyField"
                          className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm"
                          rows={3}
                          placeholder="Share your relevant experience or interest..."
                          value={requestWhy}
                          onChange={(e) => setRequestWhy(e.target.value)}
                        />
                        <p className="text-xs text-gray-500 mt-1">Minimum 5 characters.</p>
                      </div>

                      <div>
                        <label className="flex items-center space-x-2">
                          <input
                            type="checkbox"
                            className="rounded border-gray-300"
                            checked={requestConfirmAvail}
                            onChange={(e) => setRequestConfirmAvail(e.target.checked)}
                          />
                          <span className="text-sm text-gray-700">
                            I confirm I am available for the entire duration of this assignment
                          </span>
                        </label>
                      </div>
                    </div>

                    <div className="flex justify-end space-x-3">
                      <button
                        onClick={closeRequestModal}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Cancel
                      </button>
                      <button
                        onClick={requestNext}
                        className={classNames(
                          'py-2 px-4 rounded-lg font-medium transition-colors',
                          requestConfirmAvail && requestWhy.trim().length >= 5
                            ? 'bg-primary hover:bg-blue-700 text-white'
                            : 'bg-gray-200 text-gray-500 cursor-not-allowed'
                        )}
                        disabled={!requestConfirmAvail || requestWhy.trim().length < 5}
                      >
                        Continue
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 2 */}
                {requestStep === 2 && (
                  <div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-4">Confirm Your Request</h3>
                    <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-6">
                      <h4 className="font-bold text-gray-900 mb-2">Request Summary</h4>
                      <p className="text-sm text-gray-600 mb-2">
                        Assignment: <span className="font-medium">{selectedAssignment.title}</span>
                      </p>
                      <p className="text-sm text-gray-600 mb-2">
                        School: <span className="font-medium">{selectedAssignment.school}</span>
                      </p>
                      <p className="text-sm text-gray-600">
                        Date: <span className="font-medium">{fmtDateRange(selectedAssignment.start, selectedAssignment.end, tz)}</span>
                      </p>
                    </div>

                    <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4 mb-6">
                      <div className="flex items-start space-x-3">
                        <svg className="w-5 h-5 text-yellow-600 mt-0.5" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <div>
                          <h4 className="font-medium text-yellow-800">Important Reminders</h4>
                          <ul className="text-sm text-yellow-700 mt-1 space-y-1">
                            <li>• You must arrive 15 minutes before the start time</li>
                            <li>• Check in with the main office upon arrival</li>
                            <li>• Cancellations must be made at least 2 hours in advance</li>
                          </ul>
                        </div>
                      </div>
                    </div>

                    <div className="flex justify-between">
                      <button
                        onClick={requestPrev}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Back
                      </button>
                      <button
                        onClick={requestNext}
                        className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Submit Request
                      </button>
                    </div>
                  </div>
                )}

                {/* Step 3 */}
                {requestStep === 3 && (
                  <div className="text-center">
                    <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                      <svg className="w-8 h-8 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24" aria-hidden="true">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                    </div>
                    <h3 className="text-lg font-semibold text-gray-900 mb-2">Request Submitted!</h3>
                    <p className="text-gray-600 mb-6">
                      Your request has been sent to {selectedAssignment.school}. You&apos;ll receive a notification when it&apos;s reviewed.
                    </p>

                    <div className="flex justify-center space-x-3">
                      <button
                        onClick={closeRequestModal}
                        className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        Close
                      </button>
                      <button
                        onClick={() => {
                          closeRequestModal();
                          setSection('dashboard');
                          setTab('requested');
                        }}
                        className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                      >
                        View My Requests
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div
          id="checkoutModal"
          className="fixed inset-0 z-50"
          role="dialog"
          aria-modal="true"
          aria-labelledby="checkoutTitle"
        >
          <button className="drawer-overlay absolute inset-0" onClick={checkOutCancel} aria-label="Close checkout overlay" />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 id="checkoutTitle" className="text-xl font-bold text-gray-900 mb-4">
                Check Out
              </h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Check-in Time:</span>
                    <span className="font-medium">
                      {checkinTimeISO
                        ? new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date(checkinTimeISO))
                        : '—'}
                    </span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Current Time:</span>
                    <span className="font-medium">
                      {new Intl.DateTimeFormat('en-US', { timeZone: tz, hour: 'numeric', minute: '2-digit' }).format(new Date())}
                    </span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Hours:</span>
                    <span className="font-bold text-lg">
                      {checkinTimeISO ? Math.round(((Date.now() - new Date(checkinTimeISO).getTime()) / 36e5) * 10) / 10 : 0} hours
                    </span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2" htmlFor="checkoutNotes">
                    Notes (Optional)
                  </label>
                  <textarea id="checkoutNotes" className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Any notes about today's assignment..." />
                </div>
              </div>

              <div className="flex space-x-3">
                <button
                  onClick={checkOutCancel}
                  className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={checkOutConfirm}
                  className="flex-1 bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors"
                >
                  Check Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div
        id="toastContainer"
        ref={toastsRef}
        className="fixed top-4 right-4 z-50 space-y-2"
        aria-live="polite"
        aria-atomic="true"
      >
        {toasts.map((t) => (
          <div
            key={t.id}
            role="status"
            className={classNames(
              'toast px-6 py-4 rounded-lg text-sm font-medium text-white max-w-sm shadow-lg',
              t.type === 'success' && 'bg-accent',
              t.type === 'warning' && 'bg-warning',
              t.type === 'error' && 'bg-danger',
              t.type === 'info' && 'bg-primary'
            )}
          >
            {t.message}
          </div>
        ))}
      </div>
    </div>
  );
}
