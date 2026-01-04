// lib/xano/api.ts
export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  rotation_position: number | null;
  days_since_last: number;
  status: 'free' | 'covering' | 'absent';
  hours_this_month: number;
  amount_this_month: number;
}

export interface CoverageRequest {
  id: string;
  class_id: string;
  class_name: string;
  start_time: string;
  end_time: string;
  date: string;
  status: 'uncovered' | 'assigned' | 'completed';
  urgent: boolean;
  assigned_teacher_id?: string;
  assigned_teacher_name?: string;
}

export interface CoverageHistoryEntry {
  id: string;
  date: string;
  teacher_name: string;
  class_name: string;
  duration_hours: number;
  type: 'emergency' | 'planned';
  amount: number;
}

export interface TimeOffRequest {
  id: string;
  teacher_id: string;
  start_date: string;
  end_date: string;
  reason: string;
  status: 'pending' | 'approved' | 'denied';
  notes?: string;
}

export interface CoverageLog {
  id: string;
  coverage_id: string;
  date: string;
  class_name: string;
  duration_hours: number;
  amount: number;
}

export interface Substitute {
  id: string;
  name: string;
  email: string;
  phone?: string;
  status: 'active' | 'inactive';
  available: boolean;
}

const XANO_API_BASE = process.env.NEXT_PUBLIC_XANO_API_URL;
const XANO_API_KEY = process.env.NEXT_PUBLIC_XANO_API_KEY;

/**
 * IMPORTANT:
 * - If XANO_API_KEY is NOT set (public endpoints), we do NOT send Authorization.
 * - This prevents “Bearer undefined” causing auth failures.
 */
async function xanoFetch<T>(endpoint: string, options: RequestInit = {}): Promise<T> {
  if (!XANO_API_BASE) {
    throw new Error('XANO_API_URL not configured');
  }

  const url = `${XANO_API_BASE}${endpoint.startsWith('/') ? endpoint : `/${endpoint}`}`;

  const headers: Record<string, string> = {
    Accept: 'application/json',
    ...(options.body ? { 'Content-Type': 'application/json' } : {}),
    ...(options.headers ? (options.headers as Record<string, string>) : {}),
  };

  // Only attach Authorization if a real key exists
  if (XANO_API_KEY && XANO_API_KEY.trim().length > 0) {
    headers.Authorization = `Bearer ${XANO_API_KEY}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Xano API error (${response.status}): ${text || response.statusText}`);
  }

  return response.json();
}

export const adminAPI = {
  getAvailableTeachers: (schoolCode: string, datetime: string) =>
    xanoFetch<Teacher[]>(`/teachers/available?school=${encodeURIComponent(schoolCode)}&datetime=${encodeURIComponent(datetime)}`),

  getDashboardStats: (schoolCode: string, districtCode: string) =>
    xanoFetch<{
      uncoveredCount: number;
      availableTeachers: number;
      activeSubstitutes: number;
      coverageRate: number;
    }>(`/admin/dashboard-stats?school=${encodeURIComponent(schoolCode)}&district=${encodeURIComponent(districtCode)}`),

  getUncoveredClasses: (schoolCode: string) =>
    xanoFetch<CoverageRequest[]>(`/coverage/uncovered?school=${encodeURIComponent(schoolCode)}`),

  getDepartmentRotations: (schoolCode: string) =>
    xanoFetch<Record<string, Teacher[]>>(`/departments/rotations?school=${encodeURIComponent(schoolCode)}`),

  assignTeacherToCoverage: (coverageId: string, teacherId: string) =>
    xanoFetch<CoverageRequest>(`/coverage/${encodeURIComponent(coverageId)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    }),

  createEmergencyCoverage: (classId: string, urgent: boolean = true, broadcastToAll: boolean = false) =>
    xanoFetch<CoverageRequest>('/coverage/emergency', {
      method: 'POST',
      body: JSON.stringify({
        class_id: classId,
        urgent,
        broadcast_to_all: broadcastToAll,
      }),
    }),

  getCoverageHistory: (schoolCode: string, startDate?: string, endDate?: string) => {
    const params = new URLSearchParams({ school: schoolCode });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return xanoFetch<CoverageHistoryEntry[]>(`/coverage/history?${params.toString()}`);
  },

  markTeacherAbsent: (teacherId: string, date: string) =>
    xanoFetch<{ success: boolean }>(`/teachers/mark-absent`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId, date }),
    }),
};

export const teacherAPI = {
  getCoverageOpportunities: (teacherId: string) =>
    xanoFetch<CoverageRequest[]>(`/teachers/${encodeURIComponent(teacherId)}/coverage-opportunities`),

  acceptCoverage: (coverageId: string, teacherId: string) =>
    xanoFetch<{ success: boolean }>(`/coverage/${encodeURIComponent(coverageId)}/accept`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    }),

  getTimeOffRequests: (teacherId: string) =>
    xanoFetch<TimeOffRequest[]>(`/teachers/${encodeURIComponent(teacherId)}/time-off-requests`),

  requestTimeOff: (request: Omit<TimeOffRequest, 'id' | 'status'>) =>
    xanoFetch<TimeOffRequest>('/time-off/request', {
      method: 'POST',
      body: JSON.stringify(request),
    }),

  getCoverageLog: (teacherId: string) =>
    xanoFetch<CoverageLog[]>(`/teachers/${encodeURIComponent(teacherId)}/coverage-log`),

  getEarningsSummary: (teacherId: string) =>
    xanoFetch<{ month: string; totalHours: number; totalAmount: number }>(
      `/teachers/${encodeURIComponent(teacherId)}/earnings-summary`
    ),
};

export const substituteAPI = {
  getAvailableJobs: (subId: string) =>
    xanoFetch<CoverageRequest[]>(`/substitutes/${encodeURIComponent(subId)}/available-jobs`),

  acceptJob: (jobId: string, subId: string) =>
    xanoFetch<{ success: boolean }>(`/jobs/${encodeURIComponent(jobId)}/accept`, {
      method: 'POST',
      body: JSON.stringify({ sub_id: subId }),
    }),

  getAssignments: (subId: string) =>
    xanoFetch<CoverageRequest[]>(`/substitutes/${encodeURIComponent(subId)}/assignments`),

  getEarnings: (subId: string) =>
    xanoFetch<{ month: string; totalJobs: number; totalAmount: number }>(
      `/substitutes/${encodeURIComponent(subId)}/earnings`
    ),

  updateAvailability: (subId: string, available: boolean) =>
    xanoFetch<{ success: boolean }>(`/substitutes/${encodeURIComponent(subId)}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ available }),
    }),

  getUrgentJobs: (subId: string) =>
    xanoFetch<CoverageRequest[]>(`/substitutes/${encodeURIComponent(subId)}/urgent-jobs`),
};

export function setupCoverageWebSocket(onMessage: (data: any) => void) {
  const wsUrl = process.env.NEXT_PUBLIC_WS_URL;
  if (!wsUrl) return null;

  const ws = new WebSocket(wsUrl);

  ws.onopen = () => console.log('Coverage WebSocket connected');
  ws.onmessage = (event) => {
    try {
      onMessage(JSON.parse(event.data));
    } catch (e) {
      console.error('WebSocket message parse error:', e);
    }
  };
  ws.onerror = (error) => console.error('WebSocket error:', error);
  ws.onclose = () => console.log('Coverage WebSocket disconnected');

  return ws;
}

export const utils = {
  formatTime: (timeStr: string) => {
    const date = new Date(`2000-01-01T${timeStr}`);
    return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
  },

  calculateDuration: (startTime: string, endTime: string) => {
    const start = new Date(`2000-01-01T${startTime}`);
    const end = new Date(`2000-01-01T${endTime}`);
    return (end.getTime() - start.getTime()) / (1000 * 60 * 60);
  },
};
