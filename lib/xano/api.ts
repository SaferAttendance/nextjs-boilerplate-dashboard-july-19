// lib/xano/api.ts
// Centralized Xano API service for all coverage operations

const XANO_API_BASE = process.env.NEXT_PUBLIC_XANO_API_URL || 'https://your-instance.xano.io/api:your-api';
const XANO_API_KEY = process.env.NEXT_PUBLIC_XANO_API_KEY;

// Helper function for API calls
async function xanoFetch(endpoint: string, options: RequestInit = {}) {
  const url = `${XANO_API_BASE}${endpoint}`;
  const headers = {
    'Content-Type': 'application/json',
    'Authorization': `Bearer ${XANO_API_KEY}`,
    ...options.headers,
  };

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    throw new Error(`Xano API error: ${response.status}`);
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
  // Get dashboard stats
  async getDashboardStats(schoolCode: string, districtCode: string) {
    return xanoFetch(`/admin/dashboard-stats?school=${schoolCode}&district=${districtCode}`);
  },

  // Get all uncovered classes
  async getUncoveredClasses(schoolCode: string) {
    return xanoFetch(`/coverage/uncovered?school=${schoolCode}`);
  },

  // Get available teachers for coverage
  async getAvailableTeachers(schoolCode: string, datetime: string) {
    return xanoFetch(`/teachers/available?school=${schoolCode}&datetime=${datetime}`);
  },

  // Create emergency coverage request
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

  // Assign coverage to teacher
  async assignCoverage(coverageId: string, teacherId: string) {
    return xanoFetch(`/coverage/${coverageId}/assign`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    });
  },

  // Mark teacher absent
  async markTeacherAbsent(teacherId: string, date: string) {
    return xanoFetch('/teachers/mark-absent', {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId, date }),
    });
  },

  // Get department rotations
  async getDepartmentRotations(schoolCode: string) {
    return xanoFetch(`/departments/rotations?school=${schoolCode}`);
  },

  // Get coverage history
  async getCoverageHistory(schoolCode: string, startDate?: string, endDate?: string) {
    const params = new URLSearchParams({ school: schoolCode });
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    return xanoFetch(`/coverage/history?${params}`);
  },
};

// ============= TEACHER API FUNCTIONS =============
export const teacherAPI = {
  // Get teacher's coverage opportunities
  async getCoverageOpportunities(teacherId: string) {
    return xanoFetch(`/teachers/${teacherId}/coverage-opportunities`);
  },

  // Accept coverage assignment
  async acceptCoverage(coverageId: string, teacherId: string) {
    return xanoFetch(`/coverage/${coverageId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ teacher_id: teacherId }),
    });
  },

  // Request time off
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

  // Get time off requests
  async getTimeOffRequests(teacherId: string) {
    return xanoFetch(`/teachers/${teacherId}/time-off-requests`);
  },

  // Get coverage log (earnings)
  async getCoverageLog(teacherId: string) {
    return xanoFetch(`/teachers/${teacherId}/coverage-log`);
  },

  // Get earnings summary
  async getEarningsSummary(teacherId: string) {
    return xanoFetch(`/teachers/${teacherId}/earnings-summary`);
  },

  // Cancel time off request
  async cancelTimeOffRequest(requestId: string) {
    return xanoFetch(`/time-off/${requestId}/cancel`, {
      method: 'DELETE',
    });
  },
};

// ============= SUBSTITUTE API FUNCTIONS =============
export const substituteAPI = {
  // Get available jobs
  async getAvailableJobs(subId: string, filter: 'today' | 'week' | 'all' = 'all') {
    return xanoFetch(`/substitutes/${subId}/available-jobs?filter=${filter}`);
  },

  // Accept substitute job
  async acceptJob(jobId: string, subId: string) {
    return xanoFetch(`/jobs/${jobId}/accept`, {
      method: 'POST',
      body: JSON.stringify({ substitute_id: subId }),
    });
  },

  // Get assignments
  async getAssignments(subId: string) {
    return xanoFetch(`/substitutes/${subId}/assignments`);
  },

  // Get earnings data
  async getEarnings(subId: string) {
    return xanoFetch(`/substitutes/${subId}/earnings`);
  },

  // Update availability
  async updateAvailability(subId: string, status: 'available' | 'busy' | 'offline') {
    return xanoFetch(`/substitutes/${subId}/availability`, {
      method: 'PUT',
      body: JSON.stringify({ status }),
    });
  },

  // Get urgent jobs
  async getUrgentJobs(subId: string) {
    return xanoFetch(`/substitutes/${subId}/urgent-jobs`);
  },
};

// ============= REAL-TIME UPDATES =============
// WebSocket connection for real-time updates
class CoverageWebSocket {
  private ws: WebSocket | null = null;
  private listeners: Map<string, Set<Function>> = new Map();

  connect(userId: string, role: string) {
    const wsUrl = process.env.NEXT_PUBLIC_XANO_WS_URL || 'wss://your-instance.xano.io/ws';
    this.ws = new WebSocket(`${wsUrl}?user=${userId}&role=${role}`);

    this.ws.onmessage = (event) => {
      const data = JSON.parse(event.data);
      this.emit(data.type, data.payload);
    };

    this.ws.onerror = (error) => {
      console.error('WebSocket error:', error);
    };

    this.ws.onclose = () => {
      // Attempt to reconnect after 5 seconds
      setTimeout(() => this.connect(userId, role), 5000);
    };
  }

  on(event: string, callback: Function) {
    if (!this.listeners.has(event)) {
      this.listeners.set(event, new Set());
    }
    this.listeners.get(event)!.add(callback);
  }

  off(event: string, callback: Function) {
    this.listeners.get(event)?.delete(callback);
  }

  emit(event: string, data: any) {
    this.listeners.get(event)?.forEach(callback => callback(data));
  }

  disconnect() {
    this.ws?.close();
  }
}

export const coverageSocket = new CoverageWebSocket();

// ============= POLLING FOR UPDATES (Fallback) =============
export class CoveragePoller {
  private intervals: Map<string, NodeJS.Timeout> = new Map();

  startPolling(key: string, callback: () => Promise<void>, intervalMs = 10000) {
    if (this.intervals.has(key)) {
      this.stopPolling(key);
    }
    
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
    this.intervals.forEach(interval => clearInterval(interval));
    this.intervals.clear();
  }
}

export const coveragePoller = new CoveragePoller();

// ============= SHARED UTILITIES =============
export const coverageUtils = {
  // Format time for display
  formatTime(time: string): string {
    const date = new Date(`2000-01-01T${time}`);
    return date.toLocaleTimeString('en-US', { 
      hour: 'numeric', 
      minute: '2-digit',
      hour12: true 
    });
  },

  // Calculate coverage pay
  calculatePay(duration: number, rate: number): number {
    return duration * rate;
  },

  // Check if coverage is urgent (starts within 1 hour)
  isUrgent(startTime: string): boolean {
    const start = new Date(startTime);
    const now = new Date();
    const diffMs = start.getTime() - now.getTime();
    const diffMins = diffMs / (1000 * 60);
    return diffMins <= 60 && diffMins > 0;
  },

  // Get countdown timer text
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
