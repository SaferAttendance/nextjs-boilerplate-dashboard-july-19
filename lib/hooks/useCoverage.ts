// lib/hooks/useCoverage.ts
// Custom hooks for managing coverage system state and data

import { useState, useEffect, useCallback } from 'react';
import { 
  adminAPI, 
  teacherAPI, 
  substituteAPI, 
  coverageSocket, 
  coveragePoller,
  type CoverageRequest,
  type Teacher,
  type Substitute,
  type TimeOffRequest,
  type CoverageLog
} from '@/lib/xano/api';

// ============= ADMIN HOOKS =============
export function useAdminDashboard(schoolCode: string, districtCode: string) {
  const [loading, setLoading] = useState(true);
  const [stats, setStats] = useState({
    uncoveredCount: 0,
    availableTeachers: 0,
    activeSubstitutes: 0,
    coverageRate: 0,
  });
  const [uncoveredClasses, setUncoveredClasses] = useState<CoverageRequest[]>([]);
  const [departmentRotations, setDepartmentRotations] = useState<Record<string, Teacher[]>>({});
  
  // Fetch initial data
  const fetchData = useCallback(async () => {
    try {
      const [statsData, uncovered, rotations] = await Promise.all([
        adminAPI.getDashboardStats(schoolCode, districtCode),
        adminAPI.getUncoveredClasses(schoolCode),
        adminAPI.getDepartmentRotations(schoolCode),
      ]);
      
      setStats(statsData);
      setUncoveredClasses(uncovered);
      setDepartmentRotations(rotations);
    } catch (error) {
      console.error('Error fetching admin dashboard:', error);
    } finally {
      setLoading(false);
    }
  }, [schoolCode, districtCode]);

  // Set up real-time updates
  useEffect(() => {
    fetchData();
    
    // WebSocket listeners
    coverageSocket.on('coverage:created', (data: CoverageRequest) => {
      setUncoveredClasses(prev => [...prev, data]);
      setStats(prev => ({ ...prev, uncoveredCount: prev.uncoveredCount + 1 }));
    });
    
    coverageSocket.on('coverage:assigned', (data: { id: string; substitute: string }) => {
      setUncoveredClasses(prev => prev.filter(c => c.id !== data.id));
      setStats(prev => ({ ...prev, uncoveredCount: Math.max(0, prev.uncoveredCount - 1) }));
    });

    // Polling fallback
    coveragePoller.startPolling('admin-dashboard', fetchData, 30000); // Poll every 30 seconds

    return () => {
      coveragePoller.stopPolling('admin-dashboard');
    };
  }, [fetchData]);

  // Action methods
  const assignEmergencyCoverage = async (classId: string) => {
    try {
      const result = await adminAPI.createEmergencyCoverage({
        class_id: classId,
        urgent: true,
        broadcast_to_all: true,
      });
      
      // Update local state optimistically
      setUncoveredClasses(prev => 
        prev.map(c => c.id === classId ? { ...c, status: 'pending' } : c)
      );
      
      return result;
    } catch (error) {
      console.error('Error creating emergency coverage:', error);
      throw error;
    }
  };

  const markTeacherAbsent = async (teacherId: string, date: string) => {
    try {
      const result = await adminAPI.markTeacherAbsent(teacherId, date);
      
      // Refresh data to show new coverage needs
      await fetchData();
      
      return result;
    } catch (error) {
      console.error('Error marking teacher absent:', error);
      throw error;
    }
  };

  return {
    loading,
    stats,
    uncoveredClasses,
    departmentRotations,
    assignEmergencyCoverage,
    markTeacherAbsent,
    refreshData: fetchData,
  };
}

// ============= TEACHER HOOKS =============
export function useTeacherCoverage(teacherId: string, email: string) {
  const [loading, setLoading] = useState(true);
  const [opportunities, setOpportunities] = useState<CoverageRequest[]>([]);
  const [timeOffRequests, setTimeOffRequests] = useState<TimeOffRequest[]>([]);
  const [coverageLog, setCoverageLog] = useState<CoverageLog[]>([]);
  const [earnings, setEarnings] = useState({
    monthly: 0,
    yearToDate: 0,
    hoursThisMonth: 0,
    pendingApproval: 0,
    approvedAmount: 0,
  });

  const fetchData = useCallback(async () => {
    try {
      const [opps, requests, log, earningsData] = await Promise.all([
        teacherAPI.getCoverageOpportunities(teacherId),
        teacherAPI.getTimeOffRequests(teacherId),
        teacherAPI.getCoverageLog(teacherId),
        teacherAPI.getEarningsSummary(teacherId),
      ]);
      
      setOpportunities(opps);
      setTimeOffRequests(requests);
      setCoverageLog(log);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error fetching teacher data:', error);
    } finally {
      setLoading(false);
    }
  }, [teacherId]);

  useEffect(() => {
    fetchData();
    
    // WebSocket for urgent coverage notifications
    coverageSocket.on('urgent:coverage', (data: CoverageRequest) => {
      if (data.urgent) {
        setOpportunities(prev => [data, ...prev]);
      }
    });

    // Poll for updates every minute
    coveragePoller.startPolling('teacher-coverage', fetchData, 60000);

    return () => {
      coveragePoller.stopPolling('teacher-coverage');
    };
  }, [fetchData]);

  const acceptCoverage = async (coverageId: string) => {
    try {
      const result = await teacherAPI.acceptCoverage(coverageId, teacherId);
      
      // Remove from opportunities
      setOpportunities(prev => prev.filter(o => o.id !== coverageId));
      
      // Update earnings optimistically
      const coverage = opportunities.find(o => o.id === coverageId);
      if (coverage) {
        setEarnings(prev => ({
          ...prev,
          pendingApproval: prev.pendingApproval + coverage.pay_amount,
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error accepting coverage:', error);
      throw error;
    }
  };

  const requestTimeOff = async (data: {
    start_date: string;
    end_date: string;
    reason: string;
    notes?: string;
    lesson_plan_url?: string;
  }) => {
    try {
      const result = await teacherAPI.requestTimeOff({
        teacher_id: teacherId,
        ...data,
      });
      
      // Add to local requests
      setTimeOffRequests(prev => [...prev, result]);
      
      return result;
    } catch (error) {
      console.error('Error requesting time off:', error);
      throw error;
    }
  };

  return {
    loading,
    opportunities,
    timeOffRequests,
    coverageLog,
    earnings,
    acceptCoverage,
    requestTimeOff,
    refreshData: fetchData,
  };
}

// ============= SUBSTITUTE HOOKS =============
export function useSubstituteJobs(subId: string) {
  const [loading, setLoading] = useState(true);
  const [availableJobs, setAvailableJobs] = useState<CoverageRequest[]>([]);
  const [urgentJobs, setUrgentJobs] = useState<CoverageRequest[]>([]);
  const [assignments, setAssignments] = useState<any[]>([]);
  const [earnings, setEarnings] = useState({
    today: 0,
    week: 0,
    month: 0,
    yearToDate: 0,
    schoolBreakdown: {} as Record<string, number>,
  });
  const [filter, setFilter] = useState<'today' | 'week' | 'all'>('today');

  const fetchData = useCallback(async () => {
    try {
      const [jobs, urgent, assigns, earningsData] = await Promise.all([
        substituteAPI.getAvailableJobs(subId, filter),
        substituteAPI.getUrgentJobs(subId),
        substituteAPI.getAssignments(subId),
        substituteAPI.getEarnings(subId),
      ]);
      
      setAvailableJobs(jobs);
      setUrgentJobs(urgent);
      setAssignments(assigns);
      setEarnings(earningsData);
    } catch (error) {
      console.error('Error fetching substitute data:', error);
    } finally {
      setLoading(false);
    }
  }, [subId, filter]);

  useEffect(() => {
    fetchData();
    
    // Real-time urgent job notifications
    coverageSocket.on('urgent:job', (job: CoverageRequest) => {
      setUrgentJobs(prev => [...prev, job]);
      
      // Show notification
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification('Urgent Coverage Needed!', {
          body: `${job.class_name} needs coverage immediately. Pay: $${job.pay_amount}`,
        });
      }
    });

    // Remove job when someone else accepts it
    coverageSocket.on('job:taken', (jobId: string) => {
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
      setUrgentJobs(prev => prev.filter(j => j.id !== jobId));
    });

    // Poll for new jobs every 30 seconds
    coveragePoller.startPolling('sub-jobs', fetchData, 30000);

    return () => {
      coveragePoller.stopPolling('sub-jobs');
    };
  }, [fetchData]);

  const acceptJob = async (jobId: string) => {
    try {
      const result = await substituteAPI.acceptJob(jobId, subId);
      
      // Remove from available lists
      setAvailableJobs(prev => prev.filter(j => j.id !== jobId));
      setUrgentJobs(prev => prev.filter(j => j.id !== jobId));
      
      // Add to assignments
      setAssignments(prev => [...prev, result]);
      
      // Update earnings
      const job = [...availableJobs, ...urgentJobs].find(j => j.id === jobId);
      if (job) {
        setEarnings(prev => ({
          ...prev,
          today: prev.today + job.pay_amount,
        }));
      }
      
      return result;
    } catch (error) {
      console.error('Error accepting job:', error);
      throw error;
    }
  };

  const updateAvailability = async (status: 'available' | 'busy' | 'offline') => {
    try {
      await substituteAPI.updateAvailability(subId, status);
    } catch (error) {
      console.error('Error updating availability:', error);
      throw error;
    }
  };

  return {
    loading,
    availableJobs,
    urgentJobs,
    assignments,
    earnings,
    filter,
    setFilter,
    acceptJob,
    updateAvailability,
    refreshData: fetchData,
  };
}

// ============= SHARED NOTIFICATION HOOK =============
export function useCoverageNotifications(userId: string, role: string) {
  useEffect(() => {
    // Request notification permission
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission();
    }

    // Connect WebSocket
    coverageSocket.connect(userId, role);

    return () => {
      coverageSocket.disconnect();
    };
  }, [userId, role]);
}

// ============= RACE CONDITION HANDLER =============
export function useRaceCondition() {
  const [activeRace, setActiveRace] = useState<string | null>(null);
  const [raceWinner, setRaceWinner] = useState<string | null>(null);

  useEffect(() => {
    coverageSocket.on('race:started', (data: { jobId: string }) => {
      setActiveRace(data.jobId);
      setRaceWinner(null);
    });

    coverageSocket.on('race:winner', (data: { jobId: string; winnerId: string; winnerName: string }) => {
      if (data.jobId === activeRace) {
        setRaceWinner(data.winnerName);
        setTimeout(() => {
          setActiveRace(null);
          setRaceWinner(null);
        }, 5000);
      }
    });
  }, [activeRace]);

  return { activeRace, raceWinner };
}
