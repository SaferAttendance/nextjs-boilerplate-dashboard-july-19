import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeacherCoverageClient from './TeacherCoverageClient';

export const runtime = 'nodejs';

// Xano API base URLs
const XANO_TEACHER_API = 'https://xgeu-jqgf-nnju.n7e.xano.io/api:t_J13ik1';  // Teacher endpoints
const XANO_MAIN_API = 'https://xgeu-jqgf-nnju.n7e.xano.io/api:aeQ3kHz2';     // Main coverage system (admin/sub)

// ==================== TYPE DEFINITIONS ====================

type TeacherInfo = {
  id: number;
  employee_id: string;
  name: string;
  teacher_id: string;
  department: string;
  position: number;
  days_since_last: number;
  hours_this_month: number;
  amount_this_month: number;
  school_code: string;
  status: string | null;
};

type TimeOffRequest = {
  id: number;
  teacher_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes: string;
  status: 'pending' | 'approved' | 'denied' | 'cancelled';
  substitute_id: string | null;
  lesson_plan_url: string | null;
  created_at: number | null;
  approved_by: number | null;
  approved_at: number | null;
};

type CoverageLog = {
  id: number;
  date: string;
  teacher_id: string;
  substitute_id: string;
  coverage_request_id: number;
  periods: string;
  duration: number;
  rate: number;
  amount: number;
  status: 'pending' | 'verified' | 'paid';
  school_code: string;
  created_at: number | null;
  paid_at: number | null;
  department: string | null;
  assignment_type: string | null;
  assigned_name: string | null;
  class_name: string | null;
};

type CoverageOpening = {
  id: number;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  department: string;
  date: string;
  start_time: number | null;
  end_time: number | null;
  room: string;
  students: number;
  subject: string;
  grade: string;
  status: string;
  substitute_id: string | null;
  substitute_name: string | null;
  pay_amount: number;
  urgent: boolean;
  school_code: string;
  district_code: string;
};

type TodaysCoverage = {
  id: number;
  class_name: string;
  room: string;
  substitute_id: string;
  substitute_name?: string;
  date: string;
  status: string;
};

type TeacherSchedule = {
  id: number;
  teacher_id: string;
  period: number;
  class_name: string;
  room: string;
  subject: string;
  grade: string;
  students: number;
  days: string[];
};

type RotationTeacher = {
  id: number;
  employee_id: string;
  name: string;
  department: string;
  position: number;
  days_since_last: number;
  hours_this_month: number;
  status: string | null;
};

// ==================== FETCH HELPERS ====================

async function fetchFromTeacherAPI<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${XANO_TEACHER_API}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`Teacher API error for ${endpoint}:`, response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

async function fetchFromMainAPI<T>(endpoint: string, params: Record<string, string>): Promise<T | null> {
  try {
    const url = new URL(`${XANO_MAIN_API}${endpoint}`);
    Object.entries(params).forEach(([key, value]) => {
      if (value) url.searchParams.append(key, value);
    });
    
    const response = await fetch(url.toString(), {
      cache: 'no-store',
      headers: { 'Content-Type': 'application/json' },
    });
    
    if (!response.ok) {
      console.error(`Main API error for ${endpoint}:`, response.status);
      return null;
    }
    
    return await response.json();
  } catch (error) {
    console.error(`Failed to fetch ${endpoint}:`, error);
    return null;
  }
}

// ==================== MAIN PAGE COMPONENT ====================

export default async function TeacherCoveragePage() {
  const jar = await cookies();

  // ========== AUTH CHECK ==========
  const rawToken = jar.get('token')?.value ?? jar.get('sa_session')?.value;
  if (!rawToken) redirect('/admin/login');

  let email: string | undefined;
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const decoded = await getAdminAuth().verifyIdToken(rawToken);
    email = decoded.email ?? jar.get('email')?.value ?? undefined;
    if (!email) redirect('/admin/login');
  } catch {
    redirect('/admin/login');
  }

  // ========== GET USER PROFILE FROM COOKIES ==========
  const profileRole = jar.get('role')?.value;
  const profileFullName = jar.get('full_name')?.value || jar.get('fullname')?.value || 'Teacher';
  const profileDistrictCode = jar.get('district_code')?.value || '0001';
  const profileSchoolCode = jar.get('school_code')?.value || 'blueberry';
  const profileEmail = jar.get('email')?.value;
  const profileEmployeeId = jar.get('employee_id')?.value || jar.get('employeeId')?.value;

  // Ensure teacher role (allow admin to view as teacher too for testing)
  const normalizedRole = (profileRole || '').toLowerCase();
  if (normalizedRole !== 'teacher' && normalizedRole !== 'admin') {
    redirect('/dashboard/coverage');
  }

  // Determine teacher_id - use employee_id from cookies or derive from email
  const teacherId = profileEmployeeId || `TEACH-${email?.split('@')[0]?.toUpperCase() || 'UNKNOWN'}`;

  // ========== FETCH ALL DATA IN PARALLEL ==========
  const [
    teacherInfoResponse,
    timeOffResponse,
    coverageLogResponse,
    earningsResponse,
    availableCoverageResponse,
    todaysCoverageResponse,
    scheduleResponse,
    rotationResponse,
  ] = await Promise.all([
    // Teacher profile from teacher_rotations
    fetchFromTeacherAPI<{ teacher: TeacherInfo | null }>('/teachers/info', { teacher_id: teacherId }),
    // Time-off requests
    fetchFromTeacherAPI<{ requests: TimeOffRequest[] }>('/teachers/my-time-off', { teacher_id: teacherId }),
    // Coverage work done by this teacher
    fetchFromTeacherAPI<{ logs: CoverageLog[] }>('/teachers/my-coverage-log', { teacher_id: teacherId }),
    // Earnings summary
    fetchFromTeacherAPI<{ total_earnings: number | null; total_jobs: number; logs: CoverageLog[] }>('/teachers/my-earnings', { teacher_id: teacherId }),
    // Available coverage opportunities at school
    fetchFromTeacherAPI<{ openings: CoverageOpening[] }>('/teachers/available-coverage', { teacher_id: teacherId, school_code: profileSchoolCode }),
    // Who's covering my classes today
    fetchFromTeacherAPI<{ todays_coverage: TodaysCoverage[]; date: string }>('/teachers/todays-coverage', { teacher_id: teacherId }),
    // My teaching schedule
    fetchFromTeacherAPI<{ schedules: TeacherSchedule[] }>('/teachers/my-schedule', { teacher_id: teacherId, school_code: profileSchoolCode }),
    // Rotation list for my school
    fetchFromTeacherAPI<{ rotations: RotationTeacher[] }>('/teachers/rotation-status', { school_code: profileSchoolCode }),
  ]);

  // ========== PROCESS TEACHER INFO ==========
  const teacherInfo = teacherInfoResponse?.teacher;
  const teacherName = teacherInfo?.name || profileFullName;
  const teacherDepartment = teacherInfo?.department || 'General';
  const rotationPosition = teacherInfo?.position || 0;
  const daysSinceLast = teacherInfo?.days_since_last || 0;

  // ========== PROCESS TIME-OFF REQUESTS ==========
  const myRequests = (timeOffResponse?.requests || []).map(req => ({
    id: String(req.id),
    startDate: formatDate(req.start_date),
    endDate: formatDate(req.end_date),
    startDateRaw: req.start_date,
    endDateRaw: req.end_date,
    reason: req.reason,
    notes: req.notes || '',
    status: req.status as 'pending' | 'approved' | 'denied' | 'cancelled',
    substitute: req.substitute_id || undefined,
    lessonPlanUrl: req.lesson_plan_url || undefined,
    createdAt: req.created_at,
    approvedBy: req.approved_by,
    approvedAt: req.approved_at,
  }));

  // ========== PROCESS COVERAGE LOGS ==========
  const coverageLog = (coverageLogResponse?.logs || []).map(log => ({
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
    department: log.department,
    assignmentType: log.assignment_type,
  }));

  // ========== CALCULATE EARNINGS ==========
  const logs = earningsResponse?.logs || coverageLogResponse?.logs || [];
  const totalEarnings = logs.reduce((sum, log) => sum + (log.amount || 0), 0);
  const pendingAmount = logs.filter(l => l.status === 'pending').reduce((sum, l) => sum + (l.amount || 0), 0);
  const verifiedAmount = logs.filter(l => l.status === 'verified').reduce((sum, l) => sum + (l.amount || 0), 0);
  const paidAmount = logs.filter(l => l.status === 'paid').reduce((sum, l) => sum + (l.amount || 0), 0);
  const totalHours = logs.reduce((sum, log) => sum + (log.duration || 0), 0);

  // ========== PROCESS AVAILABLE COVERAGE ==========
  const availableCoverage = (availableCoverageResponse?.openings || [])
    .filter(o => o.status === 'uncovered' && o.teacher_id !== teacherId) // Exclude own classes
    .map(opening => ({
      id: opening.id,
      classId: opening.class_id,
      className: opening.class_name,
      teacherName: opening.teacher_name,
      teacherId: opening.teacher_id,
      department: opening.department,
      date: formatDate(opening.date),
      dateRaw: opening.date,
      startTime: opening.start_time,
      endTime: opening.end_time,
      room: opening.room,
      students: opening.students,
      subject: opening.subject,
      grade: opening.grade,
      payAmount: opening.pay_amount,
      urgent: opening.urgent,
      schoolCode: opening.school_code,
    }));

  // ========== PROCESS TODAY'S COVERAGE ==========
  const todaysCoverage = todaysCoverageResponse?.todays_coverage || [];
  const todaysDate = todaysCoverageResponse?.date || new Date().toISOString().split('T')[0];
  
  // Also check coverage_requests for classes being covered today
  const myClassesCoveredToday = (availableCoverageResponse?.openings || [])
    .filter(o => o.teacher_id === teacherId && o.status === 'covered' && o.date === todaysDate);

  const hasTodaysCoverage = todaysCoverage.length > 0 || myClassesCoveredToday.length > 0;

  // ========== PROCESS SCHEDULE ==========
  const schedule = (scheduleResponse?.schedules || []).map(s => ({
    id: s.id,
    period: s.period,
    className: s.class_name,
    room: s.room,
    subject: s.subject,
    grade: s.grade,
    students: s.students,
    days: s.days || [],
  }));

  // ========== PROCESS ROTATION LIST ==========
  const rotationList = (rotationResponse?.rotations || []).map(r => ({
    id: r.id,
    employeeId: r.employee_id,
    name: r.name,
    department: r.department,
    position: r.position,
    daysSinceLast: r.days_since_last,
    hoursThisMonth: r.hours_this_month,
    status: r.status,
    isMe: r.employee_id === teacherId,
  }));

  // ========== BUILD TEACHER DATA OBJECT ==========
  const teacherData = {
    // Profile
    email: profileEmail || email,
    fullName: teacherName,
    department: teacherDepartment,
    employeeId: teacherId,
    schoolCode: profileSchoolCode,
    districtCode: profileDistrictCode,
    
    // Rotation info
    rotationPosition,
    daysSinceLast,
    
    // Earnings summary
    monthlyEarnings: totalEarnings,
    yearToDateEarnings: totalEarnings, // Could be separate query for YTD
    hoursThisMonth: totalHours,
    pendingApproval: pendingAmount,
    verifiedAmount: verifiedAmount,
    paidAmount: paidAmount,
    approvedAmount: verifiedAmount + paidAmount,
    totalJobs: earningsResponse?.total_jobs || logs.length,
    
    // Today's coverage info (who's covering MY classes)
    todaysCoverage: hasTodaysCoverage ? {
      date: todaysDate,
      substitute: myClassesCoveredToday[0]?.substitute_name || 
                  todaysCoverage[0]?.substitute_name || 
                  todaysCoverage[0]?.substitute_id || 
                  'Assigned Substitute',
      classes: myClassesCoveredToday.length > 0 
        ? myClassesCoveredToday.map((tc, idx) => ({
            period: idx + 1,
            name: tc.class_name || 'Class',
            room: tc.room || '',
            substituteId: tc.substitute_id || undefined,
            substituteName: tc.substitute_name || undefined,
          }))
        : todaysCoverage.map((tc, idx) => ({
            period: idx + 1,
            name: tc.class_name || 'Class',
            room: tc.room || '',
            substituteId: tc.substitute_id || undefined,
            substituteName: tc.substitute_name || undefined,
          })),
    } : null,
    
    // Data arrays for client component
    myRequests,
    coverageLog,
    availableCoverage,
    schedule,
    rotationList,
    
    // API URLs for client-side calls
    apiUrls: {
      teacher: XANO_TEACHER_API,
      main: XANO_MAIN_API,
    },
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 16l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">My Coverage & Earnings</h1>
              <p className="text-xs text-gray-500">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </a>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">
                {teacherName} | {teacherDepartment}
              </span>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TeacherCoverageClient teacherData={teacherData} />
      </div>
    </main>
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
