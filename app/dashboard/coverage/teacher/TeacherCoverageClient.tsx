'use client';

import React, { useEffect, useMemo, useState } from 'react';

type Toast = { id: string; message: string; type: 'success' | 'error' };

type TeacherData = {
  email: string;
  fullName: string;
  department: string;
  employeeId: string;
  monthlyEarnings: number;
  yearToDateEarnings: number;
  hoursThisMonth: number;
  pendingApproval: number;
  approvedAmount: number;
  todaysCoverage: {
    substitute: string;
    classes: Array<{ period: number; name: string; room: string }>;
  };
};

type TimeOffRequest = {
  id: string;
  startDate: string;
  endDate: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  substitute?: string;
};

type CoverageLog = {
  id: string;
  date: string;
  weekday: string;
  course: string;
  teacher: string;
  room: string;
  periods: string;
  duration: string;
  status: 'verified' | 'pending' | 'paid';
  amount: number;
  rate: number;
};

export default function TeacherCoverageClient({ teacherData }: { teacherData: TeacherData }) {
  const firstName = teacherData.fullName.split(' ')[0];
  const [toasts, setToasts] = useState<Toast[]>([]);
  const [showUrgentCoverage, setShowUrgentCoverage] = useState(true);
  
  // Mock data
  const [myRequests] = useState<TimeOffRequest[]>([
    {
      id: 'R1',
      startDate: 'Jan 15, 2024',
      endDate: 'Jan 15, 2024',
      reason: 'Personal',
      status: 'approved',
      substitute: 'Mike Thompson',
    },
    {
      id: 'R2',
      startDate: 'Jan 22, 2024',
      endDate: 'Jan 23, 2024',
      reason: 'Medical',
      status: 'pending',
    },
  ]);

  const [coverageLog] = useState<CoverageLog[]>([
    {
      id: 'C001',
      date: 'Jan 12, 2024',
      weekday: 'Friday',
      course: 'Biology Lab',
      teacher: 'Dr. Chen',
      room: '301',
      periods: 'Period 3-4',
      duration: '1.5 hours',
      status: 'verified',
      amount: 45.00,
      rate: 30.00,
    },
    {
      id: 'C002',
      date: 'Jan 10, 2024',
      weekday: 'Wednesday',
      course: 'Algebra II',
      teacher: 'Ms. Rodriguez',
      room: '205',
      periods: 'Period 2',
      duration: '0.75 hours',
      status: 'pending',
      amount: 22.50,
      rate: 30.00,
    },
    {
      id: 'C003',
      date: 'Jan 8, 2024',
      weekday: 'Monday',
      course: 'World History',
      teacher: 'Mr. Johnson',
      room: '102',
      periods: 'Period 1, 5-6',
      duration: '2.25 hours',
      status: 'paid',
      amount: 67.50,
      rate: 30.00,
    },
  ]);

  // Countdown timer for urgent coverage
  const [urgentMM, setUrgentMM] = useState(38);
  const [urgentSS, setUrgentSS] = useState(42);
  
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
    return urgentMM <= 0 && urgentSS <= 0 ? 'OVERDUE' : `${mm}:${ss}`;
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
  function handleAcceptCoverage() {
    setShowUrgentCoverage(false);
    pushToast('Coverage accepted! You won the race condition. Admin notified.', 'success');
  }

  function handleTimeOffSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    const form = e.currentTarget;
    const formData = new FormData(form);
    
    // Extract form data
    const startDate = formData.get('startDate');
    const endDate = formData.get('endDate');
    const reason = formData.get('reason');
    
    pushToast('Time off request submitted successfully!', 'success');
    form.reset();
  }

  function handleExportForTaxes() {
    pushToast('Exporting coverage log for tax purposes...', 'success');
    setTimeout(() => {
      pushToast('Tax-ready export completed!', 'success');
    }, 1500);
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div>
        <h1 className="text-3xl font-bold text-gray-900">My Time Off & Coverage</h1>
        <p className="text-gray-600 mt-1">Request time off, view coverage opportunities, and track earnings</p>
      </div>

      {/* Urgent Coverage Opportunity */}
      {showUrgentCoverage && (
        <div className="bg-red-50 border-2 border-red-300 rounded-xl p-6 mb-6">
          <div className="flex items-start justify-between">
            <div className="flex items-start space-x-4">
              <div className="w-12 h-12 bg-red-100 rounded-lg flex items-center justify-center flex-shrink-0">
                <svg className="w-6 h-6 text-red-600 animate-pulse" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
              <div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">URGENT: Coverage Needed</h3>
                <p className="text-gray-700 mb-3">
                  <strong>Period 3 - Algebra II</strong> needs immediate coverage
                </p>
                <div className="text-sm text-gray-600 mb-4">
                  <div>• Room 204 • 28 students</div>
                  <div>• Starts in <span className="font-bold text-red-600">{urgentTimerText}</span></div>
                  <div>• Pay: $30.00 for 45 minutes</div>
                </div>
              </div>
            </div>
            <div className="text-right">
              <div className="text-2xl font-bold text-red-600 animate-pulse mb-2">{urgentTimerText}</div>
              <div className="text-xs text-gray-500 mb-4">until start</div>
              <button
                onClick={handleAcceptCoverage}
                className="px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors font-bold text-lg shadow-lg"
              >
                ACCEPT NOW
              </button>
            </div>
          </div>
        </div>
      )}

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
              <h3 className="text-lg font-semibold text-gray-900 mb-2">Today's Coverage</h3>
              <p className="text-gray-700 mb-3">
                Your classes are covered by <strong>{teacherData.todaysCoverage.substitute}</strong> today.
              </p>
              <div className="text-sm text-gray-600">
                {teacherData.todaysCoverage.classes.map((cls, idx) => (
                  <div key={idx}>• Period {cls.period}: {cls.name} (Room {cls.room})</div>
                ))}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Earnings Tracker */}
      <div className="bg-purple-50 border border-purple-200 rounded-xl p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">My Extra Coverage Earnings</h3>
            <p className="text-gray-600">Track your substitute teaching compensation</p>
          </div>
          <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center">
            <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
            </svg>
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="text-center">
            <div className="text-2xl font-bold text-purple-600">${teacherData.monthlyEarnings.toFixed(2)}</div>
            <div className="text-sm text-gray-600">This Pay Period</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-gray-900">{teacherData.hoursThisMonth}</div>
            <div className="text-sm text-gray-600">Hours Worked</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-yellow-600">${teacherData.pendingApproval.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Pending Approval</div>
          </div>
          <div className="text-center">
            <div className="text-2xl font-bold text-green-600">${teacherData.approvedAmount.toFixed(2)}</div>
            <div className="text-sm text-gray-600">Approved</div>
          </div>
        </div>

        <div className="mt-4 pt-4 border-t border-purple-200">
          <button 
            onClick={() => pushToast('Expanding earnings history...', 'success')} 
            className="text-purple-600 hover:text-purple-700 text-sm font-medium"
          >
            View Full History →
          </button>
        </div>
      </div>

      {/* Request Time Off Form */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">Request Time Off</h2>
        </div>
        <div className="p-6">
          <form className="space-y-6" onSubmit={handleTimeOffSubmit}>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">Start Date</label>
                <input 
                  type="date" 
                  name="startDate"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">End Date</label>
                <input 
                  type="date" 
                  name="endDate"
                  required
                  className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                />
              </div>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Reason</label>
              <select 
                name="reason"
                required
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
              >
                <option value="">Select a reason...</option>
                <option value="personal">Personal</option>
                <option value="medical">Medical</option>
                <option value="family">Family Emergency</option>
                <option value="professional">Professional Development</option>
                <option value="other">Other</option>
              </select>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Notes</label>
              <textarea 
                name="notes"
                rows={3} 
                className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent" 
                placeholder="Additional details..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">Lesson Plan</label>
              <div className="border-2 border-dashed border-gray-200 rounded-lg p-6 text-center hover:border-blue-500 transition-colors cursor-pointer">
                <svg className="w-8 h-8 text-gray-400 mx-auto mb-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
                <p className="text-gray-600">Click to upload lesson plan or drag and drop</p>
                <p className="text-sm text-gray-500 mt-1">PDF, DOC, or DOCX files</p>
              </div>
            </div>

            <button 
              type="submit" 
              className="w-full bg-blue-600 text-white py-3 px-6 rounded-lg hover:bg-blue-700 transition-colors font-medium"
            >
              Request Time Off
            </button>
          </form>
        </div>
      </div>

      {/* My Requests Table */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200 overflow-hidden">
        <div className="px-6 py-4 border-b border-gray-200">
          <h2 className="text-xl font-semibold text-gray-900">My Requests</h2>
        </div>
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Dates</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Substitute</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {myRequests.map((request) => (
                <tr key={request.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{request.startDate}</div>
                    <div className="text-sm text-gray-500">{request.reason}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      request.status === 'approved' 
                        ? 'bg-green-100 text-green-800' 
                        : request.status === 'pending'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-red-100 text-red-800'
                    }`}>
                      {request.status.charAt(0).toUpperCase() + request.status.slice(1)}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {request.substitute ? (
                      <>
                        <div className="font-medium text-gray-900">{request.substitute}</div>
                        <div className="text-sm text-gray-500">Confirmed</div>
                      </>
                    ) : (
                      <div className="text-gray-500">Not assigned</div>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {request.status === 'pending' ? (
                      <>
                        <button className="text-blue-600 hover:text-blue-900 mr-3">Edit</button>
                        <button className="text-red-600 hover:text-red-900">Cancel</button>
                      </>
                    ) : (
                      <button className="text-blue-600 hover:text-blue-900">View</button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* My Coverage Log */}
      <div className="bg-white rounded-xl shadow-sm border border-gray-200">
        <div className="px-6 py-4 border-b border-gray-200 flex items-center justify-between">
          <div>
            <h2 className="text-xl font-semibold text-gray-900">My Coverage Log</h2>
            <p className="text-sm text-gray-600 mt-1">Track your substitute teaching assignments and payments</p>
          </div>
          <button
            onClick={handleExportForTaxes}
            className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 transition-colors text-sm"
          >
            Export for Taxes
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Date</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Class</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Periods</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Payment</th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {coverageLog.map((log) => (
                <tr key={log.id}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{log.date}</div>
                    <div className="text-sm text-gray-500">{log.weekday}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-medium text-gray-900">{log.course}</div>
                    <div className="text-sm text-gray-500">{log.teacher} • Room {log.room}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-gray-900">{log.periods}</div>
                    <div className="text-sm text-gray-500">{log.duration}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium ${
                      log.status === 'verified' 
                        ? 'bg-green-100 text-green-800'
                        : log.status === 'paid'
                        ? 'bg-green-100 text-green-800'
                        : 'bg-yellow-100 text-yellow-800'
                    }`}>
                      {log.status === 'verified' ? 'Verified' : log.status === 'paid' ? 'Paid' : 'Pending Verification'}
                    </span>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="font-semibold text-gray-900">${log.amount.toFixed(2)}</div>
                    <div className="text-sm text-gray-500">${log.rate}/hr</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {log.status === 'pending' && (
                      <button 
                        onClick={() => pushToast(`Dispute initiated for ${log.id}. Admin will review within 48 hours.`, 'success')}
                        className="text-red-600 hover:text-red-900 mr-3"
                      >
                        Dispute
                      </button>
                    )}
                    <button 
                      onClick={() => pushToast(`Viewing details for ${log.id}`, 'success')}
                      className="text-blue-600 hover:text-blue-900"
                    >
                      View Details
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
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
