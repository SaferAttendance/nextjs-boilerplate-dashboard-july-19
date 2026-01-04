// lib/xano/api.ts
// Centralized Xano API service for all coverage operations

const XANO_API_BASE =
  process.env.XANO_API_BASE ||
  process.env.NEXT_PUBLIC_XANO_API_URL ||
  'https://your-instance.xano.io/api:your-api';

// Prefer server-side key, but allow NEXT_PUBLIC fallback for now
const XANO_API_KEY = process.env.XANO_API_KEY || process.env.NEXT_PUBLIC_XANO_API_KEY;

// Helper function for API calls
async function xanoFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${XANO_API_BASE}${endpoint}`;

  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as any),
  };

  // Only attach Authorization if key exists
  if (XANO_API_KEY && String(XANO_API_KEY).trim().length > 0) {
    headers['Authorization'] = `Bearer ${XANO_API_KEY}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    const text = await response.text().catch(() => '');
    throw new Error(`Xano API error: ${response.status} ${response.statusText} ${text}`);
  }

  return response.json();
}

// ============= SHARED DATA TYPES =============
export interface CoverageRequest {
  id: string;
  class_id: string;
  class_name: string;
  teacher_id: string;
  teacher_name: string;
  date: string;
  start_time: string;
  end_time: string;
  room: string;
  students: number;
  subject: string;
  grade: string;
  status: 'uncovered' | 'pending' | 'covered' | 'completed';
  substitute_id?: string;
  substitute_name?: string;
  pay_amount: number;
  urgent: boolean;
  created_at: string;
  updated_at: string;
}

export interface Teacher {
  id: string;
  name: string;
  email: string;
  department: string;
  days_since_last: number;
  position: number | null;
  status: 'free' | 'covering' | 'absent';
  hours_this_month: number;
  amount_this_month: number;
  school_code: string;
  district_code: string;
}

export interface Substitute {
  id: string;
  name: string;
  email: string;
  employee_id: string;
  certifications: string[];
  preferred_schools: string[];
  availability_status: 'available' | 'busy' | 'offline';
  today_earnings: number;
  week_earnings: number;
  month_earnings: number;
  ytd_earnings: number;
}

export interface TimeOffRequest {
  id: string;
  teacher_id: string;
  teacher_name: string;
  start_date: string;
  end_date: string;
  reason: string;
  notes?: string;
  status: 'pending' | 'approved' | 'denied';
  substitute_id?: string;
  substitute_name?: string;
  lesson_plan_url?: string;
  created_at: string;
}

export interface CoverageLog {
  id: string;
  date: string;
  teacher_id: string;
  teacher_name: string;
  substitute_id: string;
  substitute_name: string;
  class_name: string;
  periods: string;
  duration: number; // in hours
  rate: number;
  amount: number;
  status: 'pending' | 'verified' | 'paid';
  school_code: string;
}

// ============= ADMIN API FUNCTIONS =============
export const adminAPI = {
  async getDashboardStats(schoolCode: string, districtCode: string) {
    return xanoFetch(`/admin/dashboard-stats?school=${encodeURIComponent(schoolCode)}&district=${encodeURIComponent(districtCode)}`);
  },

  async getUncoveredClasses(schoolCode: string) {
    return xanoFetch(`/coverage/uncovered?school=${encodeURIComponent(schoolCode)}`);
  },

  async getAvailableTeachers(schoolCode: string, datetime: string) {
    return xanoFetch(`/teachers/available?school=${encodeURIComponent(schoolCode)}&datetime=${encodeURIComponent(datetime)}`);
  },

  async createEmergencyCoverage(data: {
    class_id: string;
    urgent: boolean;
    broadcast_to_all: boolean;
  }) {
    return xanoFetch('/coverage/emergency', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async assignCoverage(coverageId: string, teacherId: string) {
    return xanoFetch(`/coverage/${encodeURIComponent(coverageId)}/assign`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    });
  },

  async markTeacherAbsent(teacherId: string, date: string) {
    return xanoFetch('/teachers/mark-absent', {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId, date }),
    });
  },

  async getDepartmentRotations(schoolCode: string) {
    return xanoFetch(`/departments/rotations?school=${encodeURIComponent(schoolCode)}`);
  },

  async getCoverageHistory(schoolCode: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ school: schoolCode });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return xanoFetch(`/coverage/history?${params.toString()}`);
  },
};

// ============= TEACHER API FUNCTIONS =============
export const teacherAPI = {
  async getCoverageOpportunities(teacherId: string) {
    return xanoFetch(`/teachers/${encodeURIComponent(teacherId)}/coverage-opportunities`);
  },

  async acceptCoverage(coverageId: string, teacherId: string) {
    return xanoFetch(`/coverage/${encodeURIComponent(coverageId)}/accept`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    });
  },

  async requestTimeOff(data: {
    teacher_id: string;
    start_date: string;
    end_date: string;
    reason: string;
    notes?: string;
    lesson_plan_url?: string;
  }) {
    return xanoFetch('/time-off/request', {
      method: 'POST',
      body: JSON.stringify(data),
    });
  },

  async getTimeOffRequests(teacherId: string) {
    return xanoFetch(`/teachers/${encodeURIComponent(teacherId)}/time-off-requests`);
  },

  async getCoverageLog(teacherId: string) {
    return xanoFetch(`/teachers/${encodeURIComponent(teacherId)}/coverage-log`);
  },

  async getEarningsSummary(teacherId: string) {
    return xanoFetch(`/teachers/${encodeURIComponent(teacherId)}/earnings-summary`);
  },

  async cancelTimeOffRequest(requestId: string) {
    return xanoFetch(`/time-off/${encodeURIComponent(requestId)}/cancel`, {
      method: 'DELETE',
    });
  },
};

// ============= SUBSTITUTE API FUNCTIONS =============
export const substituteAPI = {
  async getAvailableJobs(subId: string, filter: 'today' | 'week' | 'all' = 'all') {
    return xanoFetch(`/substitutes/${encodeURIComponent(subId)}/available-jobs?filter=${encodeURIComponent(filter)}`);
  },

  async acceptJob(jobId: string, subId: string) {
    return xanoFetch(`/jobs/${encodeURIComponent(jobId)}/accept`, {
      method: 'POST',
      body: JSON.stringify({ substitute_id: subId }),
    });
  },

  async getAssignments(subId: string) {
    return xanoFetch(`/substitutes/${encodeURIComponent(subId)}/assignments`);
  },

  async getEarnings(subId: string) {
    return xanoFetch(`/substitutes/${encodeURIComponent(subId)}/earnings`);
  },

  async updateAvailability(subId: string, status: 'available' | 'busy' | 'offline') {
    return xanoFetch(`/substitutes/${encodeURIComponent(subId)}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  async getUrgentJobs(subId: string) {
    return xanoFetch(`/substitutes/${encodeURIComponent(subId)}/urgent-jobs`);
  },
};

// ============= REAL-TIME UPDATES =============
class CoverageWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string, role: string) {
    const wsUrl = process.env.NEXT_PUBLIC_XANO_WS_URL || 'wss://your-instance.xano.io/ws';
    this.ws = new WebSocket(`${wsUrl}?user=${encodeURIComponent(userId)}&role=${encodeURIComponent(role)}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      setTimeout(() => this.connect(userId, role), 5000);
    };
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) this.listeners.set(event, new Set());
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach((callback) => callback(data));
  }

  disconnect() {
    this.ws?.close();
  }
}

// ✅ IMPORTANT: these must be exported
export const coverageSocket = new CoverageWebSocket();

// ============= POLLING FOR UPDATES (Fallback) =============
export class CoveragePoller {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startPolling(key: string, callback: () => Promise<void>, intervalMs = 10000) {
    if (this.intervals.has(key)) this.stopPolling(key);

    const interval = setInterval(async () => {
      try {
        await callback();
      } catch (error) {
        console.error(`Polling error for ${key}:`, error);
      }
    }, intervalMs);

    this.intervals.set(key, interval);
  }

  stopPolling(key: string) {
    const interval = this.intervals.get(key);
    if (interval) {
      clearInterval(interval);
      this.intervals.delete(key);
    }
  }

  stopAllPolling() {
    this.intervals.forEach((interval) => clearInterval(interval));
    this.intervals.clear();
  }
}

// ✅ IMPORTANT: this must be exported
export const coveragePoller = new CoveragePoller();

// ============= SHARED UTILITIES =============
export const coverageUtils = {
  formatTime(time: string): string {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', {
      hour: 'numeric',
      minute: '2-digit',
      hour12: true,
    });
  },

  calculatePay(duration: number, rate: number): number {
    return duration * rate;
  },

  isUrgent(startTime: string): boolean {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins <= 60 && diffMins > 0;
  },

  getCountdownText(targetTime: string): string {
    const target = new Date(targetTime);
    const now = new Date();
    const diffMs = target.getTime() - now.getTime();

    if (diffMs <= 0) return 'OVERDUE';

    const mins = Math.floor(diffMs / (1000 * 60));
    const secs = Math.floor((diffMs % (1000 * 60)) / 1000);

    return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
  },
};
