'use client';

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import { useRouter } from 'next/navigation';

type Screen = 'dashboard' | 'today' | 'timesheets' | 'profile';
type Tab = 'requested' | 'approved' | 'claimed' | 'completed' | 'canceled';
type TimesheetTab = 'pending' | 'approved' | 'rejected';
type ToastType = 'success' | 'warning' | 'error' | 'info';

type Toast = { id: number; type: ToastType; message: string };

export default function DashboardPage() {
  const router = useRouter();

  // --- App State ---
  const [screen, setScreen] = useState<Screen>('dashboard');
  const [tab, setTab] = useState<Tab>('requested');
  const [timesheetTab, setTimesheetTab] = useState<TimesheetTab>('pending');

  // Notifications drawer
  const [notifOpen, setNotifOpen] = useState(false);
  const notifPanelRef = useRef<HTMLDivElement | null>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  // Checkout modal
  const [checkoutOpen, setCheckoutOpen] = useState(false);
  const checkoutRef = useRef<HTMLDivElement | null>(null);

  // Toasts
  const [toasts, setToasts] = useState<Toast[]>([]);
  const toastIdRef = useRef(1);

  // Today screen timer
  const [checkedIn, setCheckedIn] = useState(false);
  const [startTime, setStartTime] = useState<Date | null>(null);
  const [elapsed, setElapsed] = useState('0:00:00');

  // --- Helpers ---
  const showToast = useCallback((type: ToastType, message: string) => {
    const id = toastIdRef.current++;
    setToasts(prev => [...prev, { id, type, message }]);
    setTimeout(() => setToasts(prev => prev.filter(t => t.id !== id)), 5000);
  }, []);

  const getToastBg = (type: ToastType) =>
    type === 'success' ? 'bg-accent'
    : type === 'warning' ? 'bg-warning'
    : type === 'error' ? 'bg-danger'
    : 'bg-primary';

  // --- Navigation ---
  const onNav = useCallback((target: Screen | 'browse') => {
    if (target === 'browse') {
      // Step 4 route integration
      router.push('/sub/assignments');
      return;
    }
    setScreen(target);
  }, [router]);

  // --- Tabs ---
  const onTab = (t: Tab) => setTab(t);
  const onTimesheetTab = (t: TimesheetTab) => setTimesheetTab(t);

  // --- Today Screen Timer ---
  useEffect(() => {
    if (!checkedIn || !startTime) return;
    const id = setInterval(() => {
      const ms = Date.now() - startTime.getTime();
      const h = Math.floor(ms / 3600000);
      const m = Math.floor((ms % 3600000) / 60000);
      const s = Math.floor((ms % 60000) / 1000);
      setElapsed(`${h}:${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`);
    }, 1000);
    return () => clearInterval(id);
  }, [checkedIn, startTime]);

  const checkIn = () => {
    setCheckedIn(true);
    setStartTime(new Date());
    showToast('success', 'Checked in successfully!');
  };

  const openCheckout = () => setCheckoutOpen(true);
  const closeCheckout = () => setCheckoutOpen(false);

  const confirmCheckout = () => {
    setCheckedIn(false);
    setStartTime(null);
    closeCheckout();
    showToast('success', 'Checked out successfully! Timesheet created.');
  };

  // --- Accessible Overlays (ESC + focus restore) ---
  // Notifications
  const openNotif = () => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setNotifOpen(true);
  };
  const closeNotif = () => {
    setNotifOpen(false);
    lastFocusRef.current?.focus?.();
  };

  // ESC to close drawers/modals
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === 'Escape') {
        if (notifOpen) closeNotif();
        if (checkoutOpen) closeCheckout();
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [notifOpen, checkoutOpen]);

  // Simple focus trap for notifications drawer
  useEffect(() => {
    if (!notifOpen || !notifPanelRef.current) return;
    const root = notifPanelRef.current;
    const focusables = root.querySelectorAll<HTMLElement>(
      'button, [href], input, select, textarea, [tabindex]:not([tabindex="-1"])'
    );
    const first = focusables[0];
    const last = focusables[focusables.length - 1];
    first?.focus();

    const trap = (e: KeyboardEvent) => {
      if (e.key !== 'Tab' || focusables.length === 0) return;
      if (e.shiftKey && document.activeElement === first) {
        e.preventDefault(); (last as HTMLElement)?.focus?.();
      } else if (!e.shiftKey && document.activeElement === last) {
        e.preventDefault(); (first as HTMLElement)?.focus?.();
      }
    };
    root.addEventListener('keydown', trap as any);
    return () => root.removeEventListener('keydown', trap as any);
  }, [notifOpen]);

  // --- Assignment actions (demo) ---
  const viewAssignmentDetails = (id: string) => showToast('info', 'Opening assignment details...');
  const cancelRequest = (id: string) => showToast('success', 'Assignment request canceled');
  const claimAssignment = (id: string) => showToast('success', 'Assignment claimed successfully!');
  const unclaimAssignment = (id: string) => showToast('success', 'Assignment unclaimed');
  const addToCalendar = (id: string) => showToast('success', 'Added to calendar');
  const getDirections = (id?: string) => showToast('info', 'Opening directions...');
  const viewSummary = (id: string) => showToast('info', 'Opening assignment summary...');
  const viewTimesheet = (id: string) => setScreen('timesheets');

  // Timesheets (demo)
  const createTimesheet = () => showToast('info', 'Opening new timesheet form...');
  const editTimesheet = (id: string) => showToast('info', 'Opening timesheet editor...');
  const deleteTimesheet = (id: string) => showToast('success', 'Timesheet deleted');
  const downloadTimesheet = (id: string) => showToast('success', 'Timesheet downloaded');
  const viewRejectionReason = (id: string) => showToast('info', 'Rejection reason: Hours exceed assignment duration');
  const resubmitTimesheet = (id: string) => showToast('info', 'Opening timesheet for resubmission...');

  // Profile (demo)
  const saveProfile = () => showToast('success', 'Profile updated successfully');
  const uploadDocument = () => showToast('info', 'Opening document upload...');
  const replaceDocument = (doc: string) => showToast('info', `Replacing ${doc} document...`);
  const viewDocument = (doc: string) => showToast('info', `Opening ${doc} document...`);
  const renewDocument = (doc: string) => showToast('info', `Opening ${doc} renewal process...`);
  const changePassword = () => showToast('info', 'Opening password change form...');
  const setup2FA = () => showToast('info', 'Opening 2FA setup...');
  const manageSessions = () => showToast('info', 'Opening session management...');
  const logout = () => showToast('success', 'Signed out successfully');

  // --- Render ---
  return (
    <div className="min-h-screen">
      {/* Header */}
      <header className="bg-surface border-b border-gray-200 sticky top-0 z-40">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary rounded-lg flex items-center justify-center">
                <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                </svg>
              </div>
              <div>
                <h1 className="text-lg font-semibold text-gray-900">Safer Attendance</h1>
                <p className="text-xs text-gray-500">Substitute Portal</p>
              </div>
            </div>

            <div className="flex items-center space-x-4">
              <button
                onClick={openNotif}
                className="relative p-2 text-gray-500 hover:text-gray-700 rounded-lg hover:bg-gray-100"
                aria-haspopup="dialog"
                aria-controls="notificationsPanel"
                aria-expanded={notifOpen}
              >
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-5 5v-5zM11 19H6.5A2.5 2.5 0 014 16.5v-9A2.5 2.5 0 016.5 5h11A2.5 2.5 0 0120 7.5v3"/>
                </svg>
                <span className="absolute -top-1 -right-1 w-5 h-5 bg-danger text-white text-xs rounded-full flex items-center justify-center">3</span>
              </button>

              <div className="flex items-center space-x-3">
                <div className="flex items-center space-x-2">
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

      {/* Shell */}
      <div className="flex min-h-screen">
        {/* Sidebar */}
        <nav className="w-64 bg-white border-r border-gray-200 flex-shrink-0">
          <div className="p-4 space-y-1">
            <button onClick={() => onNav('dashboard')} id="nav-dashboard" className={`flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${screen==='dashboard' ? 'nav-active' : 'nav-inactive'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2H5a2 2 0 00-2-2z"/>
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 5a2 2 0 012-2h4a2 2 0 012 2v6H8V5z"/>
              </svg>
              <span>My Assignments</span>
            </button>

            <button onClick={() => onNav('browse')} id="nav-browse" className="nav-inactive flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium">
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"/>
              </svg>
              <span>Browse Assignments</span>
            </button>

            <button onClick={() => onNav('today')} id="nav-today" className={`flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${screen==='today' ? 'nav-active' : 'nav-inactive'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
              </svg>
              <span>Today</span>
              <span className="ml-auto bg-accent text-white text-xs px-2 py-1 rounded-full">1</span>
            </button>

            <button onClick={() => onNav('timesheets')} id="nav-timesheets" className={`flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${screen==='timesheets' ? 'nav-active' : 'nav-inactive'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5H7a2 2 0 00-2 2v10a2 2 0 002 2h8a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"/>
              </svg>
              <span>Timesheets</span>
              <span className="ml-auto bg-warning text-white text-xs px-2 py-1 rounded-full">2</span>
            </button>

            <button onClick={() => onNav('profile')} id="nav-profile" className={`flex w-full items-center space-x-3 px-3 py-2 rounded-lg text-sm font-medium ${screen==='profile' ? 'nav-active' : 'nav-inactive'}`}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"/>
              </svg>
              <span>Profile & Documents</span>
            </button>
          </div>
        </nav>

        {/* Main */}
        <main className="flex-1 overflow-hidden">
          {/* Dashboard Screen */}
          {screen === 'dashboard' && (
            <div id="screen-dashboard" className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">My Assignments</h1>
                  <p className="text-lg text-gray-600">Track your requested, approved, and completed assignments.</p>
                </div>

                {/* Tabs */}
                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {(['requested','approved','claimed','completed','canceled'] as Tab[]).map((t) => (
                      <button
                        key={t}
                        onClick={() => onTab(t)}
                        id={`tab-${t}`}
                        className={`${tab===t ? 'tab-active' : 'tab-inactive'} px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                      >
                        {t === 'requested' && 'Requested (2)'}
                        {t === 'approved' && 'Approved (1)'}
                        {t === 'claimed' && 'Claimed (1)'}
                        {t === 'completed' && 'Completed (3)'}
                        {t === 'canceled' && 'Canceled (1)'}
                      </button>
                    ))}
                  </div>
                </div>

                {/* Filters */}
                <div className="mb-6 flex flex-wrap gap-4">
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Districts</option>
                    <option>Springfield School District</option>
                    <option>Riverside Unified</option>
                    <option>Mountain View Elementary</option>
                  </select>
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Schools</option>
                    <option>Lincoln Elementary</option>
                    <option>Roosevelt High School</option>
                    <option>Washington Middle School</option>
                  </select>
                  <input type="date" className="border border-gray-300 rounded-lg px-3 py-2 text-sm" />
                  <select className="border border-gray-300 rounded-lg px-3 py-2 text-sm">
                    <option>All Types</option>
                    <option>Single Day</option>
                    <option>Multi Day</option>
                    <option>Partial Day</option>
                  </select>
                </div>

                {/* Tab Content */}
                <div id="assignments-content">
                  {/* Requested */}
                  {tab === 'requested' && (
                    <div id="content-requested" className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm text-gray-500">Lincoln Elementary</p>
                              <span className="badge-requested px-2 py-1 rounded-full text-xs font-medium">Requested</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Mathematics • Grade 3</h3>
                            <p className="text-sm text-gray-600 mb-3">Feb 15, 8:00 AM → 3:30 PM</p>
                            <div className="flex gap-2 mb-3">
                              <span className="badge-single px-3 py-1 rounded-full text-xs font-medium">Single day</span>
                            </div>
                            <p className="text-sm text-gray-600">Lesson plans provided. Experience with elementary math preferred.</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button onClick={() => viewAssignmentDetails('assign_1')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">View Details</button>
                            <button onClick={() => cancelRequest('assign_1')} className="text-danger hover:bg-red-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors">Cancel Request</button>
                          </div>
                        </div>
                      </div>

                      <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm text-gray-500">Washington Middle School</p>
                              <span className="badge-requested px-2 py-1 rounded-full text-xs font-medium">Requested</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Science • Grade 6-8</h3>
                            <p className="text-sm text-gray-600 mb-3">Feb 16, 8:30 AM → Feb 18, 3:00 PM</p>
                            <div className="flex gap-2 mb-3">
                              <span className="badge-multi px-3 py-1 rounded-full text-xs font-medium">Multi day</span>
                            </div>
                            <p className="text-sm text-gray-600">Long-term substitute needed for teacher on medical leave.</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button onClick={() => viewAssignmentDetails('assign_2')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">View Details</button>
                            <button onClick={() => cancelRequest('assign_2')} className="text-danger hover:bg-red-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors">Cancel Request</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Approved */}
                  {tab === 'approved' && (
                    <div id="content-approved" className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm text-gray-500">Roosevelt High School</p>
                              <span className="badge-approved px-2 py-1 rounded-full text-xs font-medium">Approved</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">English Literature • Grade 11</h3>
                            <p className="text-sm text-gray-600 mb-3">Feb 19, 8:00 AM → 3:30 PM</p>
                            <div className="flex gap-2 mb-3">
                              <span className="badge-single px-3 py-1 rounded-full text-xs font-medium">Single day</span>
                            </div>
                            <p className="text-sm text-gray-600">Teaching Shakespeare unit. Detailed lesson plans available.</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button onClick={() => claimAssignment('assign_4')} className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">Claim Assignment</button>
                            <div className="flex space-x-2">
                              <button onClick={() => addToCalendar('assign_4')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">📅 Calendar</button>
                              <button onClick={() => getDirections('assign_4')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-3 rounded-lg text-sm font-medium transition-colors">🗺️ Directions</button>
                            </div>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Claimed */}
                  {tab === 'claimed' && (
                    <div id="content-claimed" className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm text-gray-500">Riverside Elementary</p>
                              <span className="badge-claimed px-2 py-1 rounded-full text-xs font-medium">Claimed</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Art • Grade K-5</h3>
                            <p className="text-sm text-gray-600 mb-3">Tomorrow, Feb 17, 9:00 AM → 12:00 PM</p>
                            <div className="flex gap-2 mb-3">
                              <span className="badge-partial px-3 py-1 rounded-full text-xs font-medium">Partial day</span>
                            </div>
                            <p className="text-sm text-gray-600">Morning art classes only. Art supplies and lesson plans ready.</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button onClick={() => viewAssignmentDetails('assign_3')} className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">View Details</button>
                            <button onClick={() => unclaimAssignment('assign_3')} className="text-danger hover:bg-red-50 py-2 px-4 rounded-lg text-sm font-medium transition-colors">Unclaim</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Completed */}
                  {tab === 'completed' && (
                    <div id="content-completed" className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm text-gray-500">Lincoln Elementary</p>
                              <span className="badge-completed px-2 py-1 rounded-full text-xs font-medium">Completed</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Mathematics • Grade 2</h3>
                            <p className="text-sm text-gray-600 mb-3">Feb 10, 8:00 AM → 3:30 PM</p>
                            <div className="flex gap-2 mb-3">
                              <span className="badge-single px-3 py-1 rounded-full text-xs font-medium">Single day</span>
                            </div>
                            <p className="text-sm text-gray-600">Successfully completed. 7.5 hours worked.</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button onClick={() => viewSummary('assign_5')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">View Summary</button>
                            <button onClick={() => viewTimesheet('assign_5')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">Timesheet</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Canceled */}
                  {tab === 'canceled' && (
                    <div id="content-canceled" className="space-y-4">
                      <div className="bg-white rounded-xl border border-gray-200 p-6 card-hover">
                        <div className="flex justify-between items-start">
                          <div className="flex-1 min-w-0 pr-4">
                            <div className="flex items-center space-x-2 mb-2">
                              <p className="text-sm text-gray-500">Mountain View Elementary</p>
                              <span className="badge-canceled px-2 py-1 rounded-full text-xs font-medium">Canceled</span>
                            </div>
                            <h3 className="font-bold text-gray-900 text-lg mb-2">Physical Education • Grade 4-6</h3>
                            <p className="text-sm text-gray-600 mb-3">Feb 12, 8:00 AM → 3:30 PM</p>
                            <div className="flex gap-2 mb-3">
                              <span className="badge-single px-3 py-1 rounded-full text-xs font-medium">Single day</span>
                            </div>
                            <p className="text-sm text-gray-600">Canceled by school - teacher returned early.</p>
                          </div>
                          <div className="flex flex-col space-y-2">
                            <button onClick={() => viewAssignmentDetails('assign_6')} className="bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg text-sm font-medium transition-colors">View Details</button>
                          </div>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Today Screen */}
          {screen === 'today' && (
            <div id="screen-today" className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Today's Assignment</h1>
                  <p className="text-lg text-gray-600">February 17, 2024</p>
                </div>

                <div id="todayAssignment" className="bg-white rounded-xl border border-gray-200 p-8 mb-8">
                  <div className="flex items-start justify-between mb-6">
                    <div>
                      <div className="flex items-center space-x-2 mb-2">
                        <p className="text-sm text-gray-500">Riverside Elementary</p>
                        <span className="badge-claimed px-2 py-1 rounded-full text-xs font-medium">Claimed</span>
                      </div>
                      <h2 className="text-2xl font-bold text-gray-900 mb-2">Art • Grade K-5</h2>
                      <p className="text-lg text-gray-600 mb-4">9:00 AM → 12:00 PM (3 hours)</p>
                      <div className="flex gap-2 mb-4">
                        <span className="badge-partial px-3 py-1 rounded-full text-xs font-medium">Partial day</span>
                      </div>
                    </div>
                    <div className="text-right">
                      <p className="text-sm text-gray-500 mb-1">Room</p>
                      <p className="font-semibold text-gray-900">Art Room (Building C)</p>
                    </div>
                  </div>

                  {/* Check-in Section */}
                  <div id="checkinSection" className="border-t border-gray-200 pt-6">
                    {!checkedIn ? (
                      <div id="notCheckedIn" className="text-center">
                        <div className="mb-4">
                          <div className="w-16 h-16 bg-primary rounded-full flex items-center justify-center mx-auto mb-4">
                            <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <h3 className="text-lg font-semibold text-gray-900 mb-2">Ready to Check In?</h3>
                          <p className="text-gray-600 mb-6">Tap the button below when you arrive at the school.</p>
                        </div>
                        <button onClick={checkIn} className="bg-accent hover:bg-green-600 text-white py-3 px-8 rounded-lg text-lg font-medium transition-colors">
                          Check In
                        </button>
                      </div>
                    ) : (
                      <div id="checkedIn">
                        <div className="flex items-center justify-between mb-6">
                          <div className="flex items-center space-x-4">
                            <div className="w-12 h-12 bg-accent rounded-full flex items-center justify-center">
                              <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7"/>
                              </svg>
                            </div>
                            <div>
                              <h3 className="text-lg font-semibold text-gray-900">Checked In</h3>
                              <p className="text-gray-600">Started just now</p>
                            </div>
                          </div>
                          <div className="text-right">
                            <div className="text-2xl font-bold text-gray-900 timer-pulse" id="workTimer">{elapsed}</div>
                            <p className="text-sm text-gray-500">Time worked</p>
                          </div>
                        </div>

                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-6">
                          <button onClick={() => showToast('info','Issue report form opened')} className="bg-warning hover:bg-yellow-600 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                            Report Issue
                          </button>
                          <button onClick={openCheckout} className="bg-primary hover:bg-blue-700 text-white py-3 px-4 rounded-lg font-medium transition-colors">
                            Check Out
                          </button>
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Notes */}
                  <div className="border-t border-gray-200 pt-6 mt-6">
                    <h4 className="font-semibold text-gray-900 mb-3">Assignment Notes</h4>
                    <p className="text-gray-600 leading-relaxed">
                      Morning art classes only. Art supplies and lesson plans ready. Students will be working on watercolor techniques.
                      Supplies are in the cabinet marked "Watercolors" - please ensure students wear aprons.
                    </p>
                  </div>
                </div>

                {/* Quick Actions */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <button onClick={() => getDirections()} className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-1.447-.894L15 4m0 13V4m0 0L9 7"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Get Directions</h3>
                        <p className="text-sm text-gray-500">Navigate to school</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => showToast('info','Calling school...')} className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 5a2 2 0 012-2h3.28a1 1 0 01.948.684l1.498 4.493a1 1 0 01-.502 1.21l-2.257 1.13a11.042 11.042 0 005.516 5.516l1.13-2.257a1 1 0 011.21-.502l4.493 1.498a1 1 0 01.684.949V19a2 2 0 01-2 2h-1C9.716 21 3 14.284 3 6V5z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Contact School</h3>
                        <p className="text-sm text-gray-500">(555) 123-4567</p>
                      </div>
                    </div>
                  </button>

                  <button onClick={() => showToast('info','Opening lesson plans...')} className="bg-white border border-gray-200 rounded-lg p-4 text-left hover:bg-gray-50 transition-colors">
                    <div className="flex items-center space-x-3">
                      <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center">
                        <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                        </svg>
                      </div>
                      <div>
                        <h3 className="font-medium text-gray-900">Lesson Plans</h3>
                        <p className="text-sm text-gray-500">View materials</p>
                      </div>
                    </div>
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* Timesheets Screen */}
          {screen === 'timesheets' && (
            <div id="screen-timesheets" className="h-full overflow-y-auto">
              <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="flex justify-between items-center mb-8">
                  <div>
                    <h1 className="text-3xl font-bold text-gray-900 mb-2">Timesheets</h1>
                    <p className="text-lg text-gray-600">Track your hours and submit timesheets for approval.</p>
                  </div>
                  <button onClick={createTimesheet} className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                    New Timesheet
                  </button>
                </div>

                <div className="mb-6">
                  <div className="flex space-x-1 bg-gray-100 p-1 rounded-lg w-fit">
                    {(['pending','approved','rejected'] as TimesheetTab[]).map(t => (
                      <button
                        key={t}
                        onClick={() => onTimesheetTab(t)}
                        id={`timesheet-tab-${t}`}
                        className={`${timesheetTab===t ? 'tab-active' : 'tab-inactive'} px-4 py-2 rounded-md text-sm font-medium transition-colors`}
                      >
                        {t==='pending' && 'Pending (2)'}
                        {t==='approved' && 'Approved (5)'}
                        {t==='rejected' && 'Rejected (1)'}
                      </button>
                    ))}
                  </div>
                </div>

                <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
                  {/* Pending */}
                  {timesheetTab === 'pending' && (
                    <div id="timesheet-content-pending">
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
                            <tr className="hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-medium text-gray-900">Mathematics • Grade 2</p>
                                  <p className="text-sm text-gray-500">Lincoln Elementary</p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-900">Feb 10, 2024</td>
                              <td className="py-4 px-6 text-sm text-gray-900">7.5 hours</td>
                              <td className="py-4 px-6">
                                <span className="badge-pending px-2 py-1 rounded-full text-xs font-medium">Pending</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <button onClick={() => editTimesheet('ts_1')} className="text-primary hover:text-blue-700 text-sm font-medium">Edit</button>
                                  <button onClick={() => deleteTimesheet('ts_1')} className="text-danger hover:text-red-700 text-sm font-medium">Delete</button>
                                </div>
                              </td>
                            </tr>
                            <tr className="hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-medium text-gray-900">Art • Grade K-5</p>
                                  <p className="text-sm text-gray-500">Riverside Elementary</p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-900">Feb 17, 2024</td>
                              <td className="py-4 px-6 text-sm text-gray-900">3.0 hours</td>
                              <td className="py-4 px-6">
                                <span className="badge-pending px-2 py-1 rounded-full text-xs font-medium">Pending</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <button onClick={() => editTimesheet('ts_2')} className="text-primary hover:text-blue-700 text-sm font-medium">Edit</button>
                                  <button onClick={() => deleteTimesheet('ts_2')} className="text-danger hover:text-red-700 text-sm font-medium">Delete</button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Approved */}
                  {timesheetTab === 'approved' && (
                    <div id="timesheet-content-approved">
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
                            <tr className="hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-medium text-gray-900">Science • Grade 7</p>
                                  <p className="text-sm text-gray-500">Washington Middle School</p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-900">Feb 8, 2024</td>
                              <td className="py-4 px-6 text-sm text-gray-900">7.5 hours</td>
                              <td className="py-4 px-6">
                                <span className="badge-verified px-2 py-1 rounded-full text-xs font-medium">Approved</span>
                              </td>
                              <td className="py-4 px-6">
                                <button onClick={() => downloadTimesheet('ts_3')} className="text-primary hover:text-blue-700 text-sm font-medium">Download</button>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}

                  {/* Rejected */}
                  {timesheetTab === 'rejected' && (
                    <div id="timesheet-content-rejected">
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
                            <tr className="hover:bg-gray-50">
                              <td className="py-4 px-6">
                                <div>
                                  <p className="font-medium text-gray-900">Physical Education • Grade 4-6</p>
                                  <p className="text-sm text-gray-500">Mountain View Elementary</p>
                                </div>
                              </td>
                              <td className="py-4 px-6 text-sm text-gray-900">Feb 5, 2024</td>
                              <td className="py-4 px-6 text-sm text-gray-900">8.0 hours</td>
                              <td className="py-4 px-6">
                                <span className="badge-rejected px-2 py-1 rounded-full text-xs font-medium">Rejected</span>
                              </td>
                              <td className="py-4 px-6">
                                <div className="flex space-x-2">
                                  <button onClick={() => viewRejectionReason('ts_4')} className="text-primary hover:text-blue-700 text-sm font-medium">View Reason</button>
                                  <button onClick={() => resubmitTimesheet('ts_4')} className="text-accent hover:text-green-700 text-sm font-medium">Resubmit</button>
                                </div>
                              </td>
                            </tr>
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            </div>
          )}

          {/* Profile Screen */}
          {screen === 'profile' && (
            <div id="screen-profile" className="h-full overflow-y-auto">
              <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
                <div className="mb-8">
                  <h1 className="text-3xl font-bold text-gray-900 mb-2">Profile & Documents</h1>
                  <p className="text-lg text-gray-600">Manage your personal information and required documents.</p>
                </div>

                <div className="space-y-8">
                  {/* Profile Info */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
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
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option>Pacific Time (PT)</option>
                          <option>Mountain Time (MT)</option>
                          <option>Central Time (CT)</option>
                          <option>Eastern Time (ET)</option>
                        </select>
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-gray-700 mb-2">Default District</label>
                        <select className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm">
                          <option>Springfield School District</option>
                          <option>Riverside Unified</option>
                          <option>Mountain View Elementary</option>
                        </select>
                      </div>
                    </div>
                    <div className="mt-6">
                      <button onClick={saveProfile} className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Save Changes
                      </button>
                    </div>
                  </div>

                  {/* Documents */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <div className="flex justify-between items-center mb-6">
                      <h2 className="text-xl font-semibold text-gray-900">Documents & Certifications</h2>
                      <button onClick={uploadDocument} className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                        Upload Document
                      </button>
                    </div>

                    <div className="space-y-4">
                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Teaching License</h3>
                            <p className="text-sm text-gray-500">Expires: June 2025</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="badge-verified px-2 py-1 rounded-full text-xs font-medium">Verified</span>
                          <button onClick={() => replaceDocument('license')} className="text-primary hover:text-blue-700 text-sm font-medium">Replace</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">Background Check</h3>
                            <p className="text-sm text-gray-500">Completed: January 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="badge-verified px-2 py-1 rounded-full text-xs font-medium">Verified</span>
                          <button onClick={() => viewDocument('background')} className="text-primary hover:text-blue-700 text-sm font-medium">View</button>
                        </div>
                      </div>

                      <div className="flex items-center justify-between p-4 border border-gray-200 rounded-lg">
                        <div className="flex items-center space-x-4">
                          <div className="w-10 h-10 bg-yellow-100 rounded-lg flex items-center justify-center">
                            <svg className="w-5 h-5 text-yellow-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                            </svg>
                          </div>
                          <div>
                            <h3 className="font-medium text-gray-900">CPR Certification</h3>
                            <p className="text-sm text-gray-500">Expires: March 2024</p>
                          </div>
                        </div>
                        <div className="flex items-center space-x-3">
                          <span className="badge-pending px-2 py-1 rounded-full text-xs font-medium">Expiring Soon</span>
                          <button onClick={() => renewDocument('cpr')} className="text-warning hover:text-yellow-700 text-sm font-medium">Renew</button>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Security */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Security Settings</h2>
                    <div className="space-y-4">
                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Password</h3>
                          <p className="text-sm text-gray-500">Last changed 3 months ago</p>
                        </div>
                        <button onClick={changePassword} className="text-primary hover:text-blue-700 text-sm font-medium">Change Password</button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Two-Factor Authentication</h3>
                          <p className="text-sm text-gray-500">Add an extra layer of security</p>
                        </div>
                        <button onClick={setup2FA} className="bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg text-sm font-medium transition-colors">
                          Enable 2FA
                        </button>
                      </div>

                      <div className="flex items-center justify-between">
                        <div>
                          <h3 className="font-medium text-gray-900">Active Sessions</h3>
                          <p className="text-sm text-gray-500">Manage your logged-in devices</p>
                        </div>
                        <button onClick={manageSessions} className="text-primary hover:text-blue-700 text-sm font-medium">Manage Sessions</button>
                      </div>
                    </div>
                  </div>

                  {/* Notifications prefs */}
                  <div className="bg-white rounded-xl border border-gray-200 p-6">
                    <h2 className="text-xl font-semibold text-gray-900 mb-6">Notification Preferences</h2>
                    <div className="space-y-4">
                      {[
                        { title: 'Assignment Updates', desc: 'New assignments, approvals, and changes', checked: true },
                        { title: 'Timesheet Reminders', desc: 'Reminders to submit timesheets', checked: true },
                        { title: 'District News', desc: 'Updates from your districts', checked: false },
                      ].map((item, i) => (
                        <div className="flex items-center justify-between" key={i}>
                          <div>
                            <h3 className="font-medium text-gray-900">{item.title}</h3>
                            <p className="text-sm text-gray-500">{item.desc}</p>
                          </div>
                          <label className="relative inline-flex items-center cursor-pointer">
                            <input type="checkbox" defaultChecked={item.checked} className="sr-only peer" />
                            <div className="w-11 h-6 bg-gray-200 peer-focus:outline-none peer-focus:ring-4 peer-focus:ring-blue-300 rounded-full peer peer-checked:after:translate-x-full peer-checked:after:border-white
                              after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-blue-600">
                            </div>
                          </label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          )}
        </main>
      </div>

      {/* Notifications Drawer */}
      {notifOpen && (
        <div id="notificationsPanel" className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="notifTitle">
          <div className="drawer-overlay absolute inset-0" onClick={closeNotif} />
          <div ref={notifPanelRef} className="drawer-slide absolute right-0 top-0 h-full w-full max-w-md bg-white shadow-xl flex flex-col">
            <div className="flex items-center justify-between p-6 border-b border-gray-200">
              <h2 id="notifTitle" className="text-xl font-bold text-gray-900">Notifications</h2>
              <button onClick={closeNotif} className="text-gray-400 hover:text-gray-600 p-2" aria-label="Close notifications">
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"/>
                </svg>
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-6 space-y-4">
              <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-primary rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"/>
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
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"/>
                    </svg>
                  </div>
                  <div className="flex-1">
                    <h3 className="font-medium text-gray-900">Timesheet Reminder</h3>
                    <p className="text-sm text-gray-600 mt-1">Don't forget to submit your timesheet for Feb 10 assignment.</p>
                    <p className="text-xs text-gray-500 mt-2">1 day ago</p>
                  </div>
                </div>
              </div>

              <div className="bg-green-50 border border-green-200 rounded-lg p-4">
                <div className="flex items-start space-x-3">
                  <div className="w-8 h-8 bg-accent rounded-full flex items-center justify-center flex-shrink-0">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
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
              <button onClick={() => { showToast('success','All notifications marked as read'); closeNotif(); }} className="w-full bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
                Mark All as Read
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Checkout Modal */}
      {checkoutOpen && (
        <div id="checkoutModal" className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-labelledby="checkoutTitle">
          <div className="drawer-overlay absolute inset-0" onClick={closeCheckout} />
          <div className="absolute inset-0 flex items-center justify-center p-4">
            <div ref={checkoutRef} className="bg-white rounded-xl shadow-xl max-w-md w-full p-6">
              <h2 id="checkoutTitle" className="text-xl font-bold text-gray-900 mb-4">Check Out</h2>

              <div className="space-y-4 mb-6">
                <div className="bg-gray-50 rounded-lg p-4">
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Check-in Time:</span>
                    <span className="font-medium">9:05 AM</span>
                  </div>
                  <div className="flex justify-between items-center mb-2">
                    <span className="text-sm text-gray-600">Current Time:</span>
                    <span className="font-medium">12:05 PM</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Hours:</span>
                    <span className="font-bold text-lg">3.0 hours</span>
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">Notes (Optional)</label>
                  <textarea className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm" rows={3} placeholder="Any notes about today's assignment..."></textarea>
                </div>
              </div>

              <div className="flex space-x-3">
                <button onClick={closeCheckout} className="flex-1 bg-gray-100 hover:bg-gray-200 text-gray-700 py-2 px-4 rounded-lg font-medium transition-colors">
                  Cancel
                </button>
                <button onClick={confirmCheckout} className="flex-1 bg-primary hover:bg-blue-700 text-white py-2 px-4 rounded-lg font-medium transition-colors">
                  Check Out
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Toasts */}
      <div id="toastContainer" className="fixed top-4 right-4 z-50 space-y-2" aria-live="polite">
        {toasts.map(t => (
          <div key={t.id} className={`toast px-6 py-4 rounded-lg text-sm font-medium text-white max-w-sm shadow-lg ${getToastBg(t.type)}`}>
            {t.message}
          </div>
        ))}
      </div>

      {/* Keep your custom design tokens/animations.
          You can move this block to app/globals.css later. */}
      <style jsx global>{`
        body { background-color: #F8FAFC; }
        .card-hover { transition: all 0.2s ease; }
        .card-hover:hover { transform: translateY(-2px); box-shadow: 0 8px 25px rgba(37,99,235,0.15); }
        .loading-spinner { animation: spin 1s linear infinite; }
        @keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
        .fade-in { animation: fadeIn 0.3s ease-out; }
        @keyframes fadeIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
        .toast { animation: slideInRight 0.3s ease-out; }
        @keyframes slideInRight { from { transform: translateX(100%); opacity: 0; } to { transform: translateX(0); opacity: 1; } }
        .drawer-overlay { background: rgba(0,0,0,0.8); backdrop-filter: blur(4px); }
        .drawer-slide { animation: slideInFromRight 0.3s ease-out; }
        @keyframes slideInFromRight { from { transform: translateX(100%); } to { transform: translateX(0); } }
        .drawer-slide-out { animation: slideOutToRight 0.3s ease-out; }
        @keyframes slideOutToRight { from { transform: translateX(0); } to { transform: translateX(100%); } }
        .badge-single { background: linear-gradient(135deg, #EBF4FF, #DBEAFE); color:#1E40AF; border:1px solid #2563EB20; }
        .badge-multi { background: linear-gradient(135deg, #F0F9FF, #E0F2FE); color:#0C4A6E; border:1px solid #0EA5E920; }
        .badge-partial { background: linear-gradient(135deg, #FEF3C7, #FDE68A); color:#92400E; border:1px solid #F59E0B20; }
        .badge-requested { background: linear-gradient(135deg, #FEF3C7, #FDE68A); color:#92400E; border:1px solid #F59E0B20; }
        .badge-approved { background: linear-gradient(135deg, #DBEAFE, #BFDBFE); color:#1E40AF; border:1px solid #2563EB30; }
        .badge-claimed { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); color:#065F46; border:1px solid #22C55E20; }
        .badge-completed { background: linear-gradient(135deg, #E5E7EB, #D1D5DB); color:#374151; border:1px solid #6B728020; }
        .badge-canceled { background: linear-gradient(135deg, #FEE2E2, #FECACA); color:#991B1B; border:1px solid #EF444420; }
        .badge-pending { background: linear-gradient(135deg, #FEF3C7, #FDE68A); color:#92400E; border:1px solid #F59E0B20; }
        .badge-rejected { background: linear-gradient(135deg, #FEE2E2, #FECACA); color:#991B1B; border:1px solid #EF444420; }
        .badge-verified { background: linear-gradient(135deg, #D1FAE5, #A7F3D0); color:#065F46; border:1px solid #22C55E20; }
        .badge-expired { background: linear-gradient(135deg, #FEE2E2, #FECACA); color:#991B1B; border:1px solid #EF444420; }
        .tab-active { background:#2563EB; color:#fff; }
        .tab-inactive { background:#fff; color:#6B7280; border:1px solid #D1D5DB; }
        .tab-inactive:hover { background:#F9FAFB; color:#374151; }
        .nav-active { background:#EBF4FF; color:#2563EB; border-right:3px solid #2563EB; }
        .nav-inactive { color:#6B7280; }
        .nav-inactive:hover { background:#F9FAFB; color:#374151; }
        .timer-pulse { animation: pulse 2s infinite; }
        @keyframes pulse { 0%,100% { opacity:1; } 50% { opacity:0.7; } }
        .skeleton { background: linear-gradient(90deg, #f0f0f0 25%, #e0e0e0 50%, #f0f0f0 75%); background-size:200% 100%; animation: loading 1.5s infinite; }
        @keyframes loading { 0%{ background-position:200% 0; } 100%{ background-position:-200% 0; } }
        @media (max-width: 768px) {
          .drawer-slide { animation: slideInFromBottom 0.3s ease-out; }
          @keyframes slideInFromBottom { from { transform: translateY(100%); } to { transform: translateY(0); } }
          .drawer-slide-out { animation: slideOutToBottom 0.3s ease-out; }
          @keyframes slideOutToBottom { from { transform: translateY(0); } to { transform: translateY(100%); } }
        }
        @media (prefers-reduced-motion: reduce) {
          .drawer-slide, .drawer-slide-out, .fade-in, .toast, .loading-spinner, .timer-pulse, .skeleton { animation: none !important; }
          .card-hover:hover { transform: none !important; }
        }
        /* Fallbacks so design works even if Tailwind colors aren't yet extended */
        .bg-primary { background-color:#2563EB !important; }
        .text-primary { color:#2563EB !important; }
        .bg-accent { background-color:#22C55E !important; }
        .bg-warning { background-color:#F59E0B !important; }
        .bg-danger { background-color:#EF4444 !important; }
        .bg-surface { background-color:#FFFFFF !important; }
      `}</style>
    </div>
  );
}
