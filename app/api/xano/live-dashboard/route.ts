// app/api/xano/live-dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';
export const dynamic = 'force-dynamic';
export const revalidate = 0;
export const fetchCache = 'force-no-store';

/* ---------- helpers ---------- */

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

// Attendance CSV endpoint (download attendance)
function csvUrl() {
  return (
    process.env.XANO_CSV_DOWNLOAD_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/csv_from_table_blueberry_USE_test`
  ).replace(/\/$/, '');
}

// Subs list endpoint (to count substitutes)
function subsListUrl() {
  return (
    process.env.XANO_ADMIN_SUBS_LIST_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/adminSubAssignmentsList`
  ).replace(/\/$/, '');
}

// Class info endpoint
function classInfoUrl() {
  return (
    process.env.XANO_CLASS_INFO_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/class_info`
  ).replace(/\/$/, '');
}

// Class students endpoint
function classStudentsUrl() {
  return (
    process.env.XANO_CLASS_STUDENTS_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/class_students`
  ).replace(/\/$/, '');
}

// Students in classes endpoint
function studentsClassesUrl() {
  return (
    process.env.XANO_STUDENTS_CLASSES_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/student_classes`
  ).replace(/\/$/, '');
}

// Student search endpoint
function studentSearchUrl() {
  return (
    process.env.XANO_STUDENTS_SEARCH_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/students_search`
  ).replace(/\/$/, '');
}

// split by commas but ignore commas within quotes
const SPLIT_RE = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(SPLIT_RE).map((h) => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(SPLIT_RE).map((v) => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cols[idx] ?? ''));
    rows.push(row);
  }
  return rows;
}

function pick(row: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k];
    const found = Object.keys(row).find((h) => h.toLowerCase() === k.toLowerCase());
    if (found && row[found] !== '') return row[found];
  }
  return undefined;
}

function tsOf(row: Record<string, any>, keys: string[]) {
  const raw = pick(row, keys);
  if (!raw) return 0;
  const n = Number(raw);
  if (Number.isFinite(n)) return n < 2e10 ? n * 1000 : n; // seconds or ms
  const t = Date.parse(String(raw));
  return Number.isFinite(t) ? t : 0;
}

// Enhanced status mapping to include "late"
function normalizeStatus(v?: string) {
  const s = (v || '').trim().toLowerCase();
  if (s === 'present') return 'present';
  if (s === 'absent') return 'absent';
  if (s === 'pending') return 'pending';
  if (s === 'late' || s === 'tardy') return 'late';
  return ''; // unknown -> ignore
}

export async function GET(req: NextRequest) {
  const { searchParams } = new URL(req.url);
  
  // Check if this is a detail request
  const detailType = searchParams.get('detail');
  const period = searchParams.get('period');
  const classId = searchParams.get('classId');
  const studentId = searchParams.get('studentId');
  
  const email = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json(
      { error: 'Missing admin scope' }, 
      { 
        status: 401,
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      }
    );
  }

  const headers: HeadersInit = { 
    Accept: 'application/json', 
    'Cache-Control': 'no-store', 
    Pragma: 'no-cache' 
  };
  
  if (process.env.XANO_API_KEY) {
    headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  // Handle detail requests
  if (detailType === 'classes' && period) {
    // Get classes for a specific period
    const url = new URL(classInfoUrl());
    url.searchParams.set('district_code', district);
    url.searchParams.set('school_code', school);
    url.searchParams.set('period', period);
    url.searchParams.set('_ts', Date.now().toString());
    url.searchParams.set('_rand', Math.random().toString(36));
    if (email) url.searchParams.set('admin_email', email);
    
    const res = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
    const data = await res.json();
    
    return NextResponse.json(data, { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      } 
    });
  }
  
  if (detailType === 'students' && classId && period) {
    // Get students for a specific class using the class info endpoint
    const url = new URL(classInfoUrl());
    url.searchParams.set('district_code', district);
    url.searchParams.set('school_code', school);
    
    // Try with class_id first, then class_name
    if (classId.match(/^\d+$/) || classId.startsWith('CLS')) {
      url.searchParams.set('class_id', classId);
    } else {
      url.searchParams.set('class_name', classId);
    }
    
    if (period) url.searchParams.set('period', period);
    url.searchParams.set('_ts', Date.now().toString());
    url.searchParams.set('_rand', Math.random().toString(36));
    if (email) url.searchParams.set('admin_email', email);
    
    try {
      const res = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
      const classData = await res.json();
      
      // The XANO_CLASS_INFO_URL returns an array of students with attendance_status
      const students = Array.isArray(classData) ? classData : 
                      classData?.students || 
                      classData?.records || 
                      [];
      
      // Map the attendance_status field to our status field
      const studentsWithStatus = students.map((student: any) => ({
        id: student.student_id || student.id,
        student_id: student.student_id || student.id,
        name: student.student_name || student.name || '—',
        status: normalizeStatus(student.attendance_status) || 'pending',
        attendance_status: student.attendance_status,
        class: student.class_name,
        teacher: student.teacher_name,
      }));
      
      return NextResponse.json({ students: studentsWithStatus }, { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      });
    } catch (e) {
      console.error('Error fetching class students:', e);
      return NextResponse.json({ students: [] }, { 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      });
    }
  }
  
  if (detailType === 'student' && studentId) {
    // Get individual student details
    const url = new URL(studentSearchUrl());
    url.searchParams.set('district_code', district);
    url.searchParams.set('school_code', school);
    url.searchParams.set('student_id', studentId);
    url.searchParams.set('_ts', Date.now().toString());
    url.searchParams.set('_rand', Math.random().toString(36));
    if (email) url.searchParams.set('admin_email', email);
    
    const res = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
    const data = await res.json();
    
    return NextResponse.json(data, { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      } 
    });
  }

  // Main dashboard data
  const cUrl = new URL(csvUrl());
  cUrl.searchParams.set('district_code', district);
  cUrl.searchParams.set('school_code', school);
  if (email) {
    cUrl.searchParams.set('email', email);
    cUrl.searchParams.set('admin_email', email);
  }
  cUrl.searchParams.set('_ts', Date.now().toString());
  cUrl.searchParams.set('_rand', Math.random().toString(36));

  const sUrl = new URL(subsListUrl());
  sUrl.searchParams.set('district_code', district);
  sUrl.searchParams.set('school_code', school);
  if (email) {
    sUrl.searchParams.set('email', email);
    sUrl.searchParams.set('admin_email', email);
  }
  sUrl.searchParams.set('_ts', Date.now().toString());
  sUrl.searchParams.set('_rand', Math.random().toString(36));

  const headersCsv: HeadersInit = { Accept: 'text/csv', 'Cache-Control': 'no-store', Pragma: 'no-cache' };
  const headersJson: HeadersInit = { Accept: 'application/json', 'Cache-Control': 'no-store', Pragma: 'no-cache' };
  if (process.env.XANO_API_KEY) {
    headersCsv.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
    headersJson.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  console.log('Fetching dashboard data at:', new Date().toISOString());
  
  const [csvRes, subsRes] = await Promise.all([
    fetch(cUrl.toString(), { method: 'GET', headers: headersCsv, cache: 'no-store' }),
    fetch(sUrl.toString(), { method: 'GET', headers: headersJson, cache: 'no-store' }),
  ]);

  const csvText = await csvRes.text().catch(() => '');
  const subsPayload = await subsRes.json().catch(() => []);

  console.log('CSV Response cache-control:', csvRes.headers.get('cache-control'));

  if (!csvRes.ok) {
    return NextResponse.json(
      { error: 'Loading live data' },
      { 
        status: csvRes.status, 
        headers: { 
          'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
          'Pragma': 'no-cache',
          'Expires': '0',
          'Surrogate-Control': 'no-store'
        } 
      }
    );
  }

  const rows = parseCsv(csvText);
  console.log('Parsed rows count:', rows.length);

  const H = {
    id: ['student_id', 'studentid', 'id'],
    name: ['student_name', 'name', 'student'],
    status: ['attendance_status', 'status', 'attendance'],
    klass: ['class_name', 'class'],
    klassId: ['class_id', 'classid'],
    period: ['period'],
    teacher: ['teacher_name', 'teacher'],
    created: ['created_at', 'timestamp', 'time', 'created'],
  };

  type Latest = {
    ts: number;
    status: 'present' | 'absent' | 'pending' | 'late' | '';
    name?: string;
    class?: string;
    classId?: string;
    period?: string | number;
    teacher?: string;
  };

  const perStudent = new Map<string, Latest>();
  const rankStatus = (s: Latest['status']) => {
    if (s === 'present' || s === 'absent' || s === 'late') return 2;
    if (s === 'pending') return 1;
    return 0;
  };

  // Enhanced period tracking with all statuses and class grouping
  type PeriodStats = {
    present: number;
    absent: number;
    pending: number;
    late: number;
    total: number;
    presentPct: number;
    absentPct: number;
    students: Array<{
      id: string;
      name?: string;
      status: string;
      class?: string;
      classId?: string;
      teacher?: string;
    }>;
    classes: Map<string, {
      classId?: string;
      className: string;
      teacher?: string;
      present: number;
      absent: number;
      pending: number;
      late: number;
      total: number;
    }>;
  };
  
  const periodMap = new Map<string, Map<string, Latest>>();
  const PERIODS = ['1', '2', '3', '4', '5'];
  
  PERIODS.forEach(p => periodMap.set(p, new Map()));

  for (const r of rows) {
    const idRaw = pick(r, H.id);
    const id = String(idRaw ?? '').trim();
    if (!id) continue;

    const ts = tsOf(r, H.created);
    const status = normalizeStatus(pick(r, H.status) as string);
    if (!status) continue;

    const periodRaw = pick(r, H.period);
    const period = String(periodRaw ?? '').trim();

    const rec: Latest = {
      ts,
      status,
      name: pick(r, H.name),
      class: pick(r, H.klass),
      classId: pick(r, H.klassId),
      period: period || periodRaw,
      teacher: pick(r, H.teacher),
    };

    // Update overall attendance
    const prev = perStudent.get(id);
    if (!prev) {
      perStudent.set(id, rec);
    } else {
      if (ts > prev.ts) {
        perStudent.set(id, rec);
      } else if (ts === prev.ts && rankStatus(status) > rankStatus(prev.status)) {
        perStudent.set(id, rec);
      }
    }

    // Update period-specific attendance
    if (period && periodMap.has(period)) {
      const periodStudents = periodMap.get(period)!;
      const prevPeriod = periodStudents.get(id);
      
      if (!prevPeriod) {
        periodStudents.set(id, rec);
      } else {
        if (ts > prevPeriod.ts) {
          periodStudents.set(id, rec);
        } else if (ts === prevPeriod.ts && rankStatus(status) > rankStatus(prevPeriod.status)) {
          periodStudents.set(id, rec);
        }
      }
    }
  }

  // Calculate overall stats
  let present = 0, absent = 0, pending = 0, late = 0;
  const absent_students: Array<{
    id?: string;
    name?: string;
    class?: string;
    period?: string | number;
    teacher?: string;
  }> = [];

  for (const [id, rec] of perStudent.entries()) {
    if (rec.status === 'absent') {
      absent += 1;
      absent_students.push({
        id,
        name: rec.name,
        class: rec.class,
        period: rec.period,
        teacher: rec.teacher,
      });
    } else if (rec.status === 'present') {
      present += 1;
    } else if (rec.status === 'pending') {
      pending += 1;
    } else if (rec.status === 'late') {
      late += 1;
    }
  }

  // Calculate enhanced period stats with class grouping
  const periodStats: Record<string, PeriodStats> = {};
  
  PERIODS.forEach(period => {
    const periodStudents = periodMap.get(period)!;
    let periodPresent = 0, periodAbsent = 0, periodPending = 0, periodLate = 0;
    const students: PeriodStats['students'] = [];
    const classes = new Map<string, PeriodStats['classes'] extends Map<any, infer V> ? V : never>();
    
    for (const [id, rec] of periodStudents.entries()) {
      // Count by status
      if (rec.status === 'present') periodPresent += 1;
      else if (rec.status === 'absent') periodAbsent += 1;
      else if (rec.status === 'pending') periodPending += 1;
      else if (rec.status === 'late') periodLate += 1;
      
      // Add to students list
      students.push({
        id,
        name: rec.name,
        status: rec.status,
        class: rec.class,
        classId: rec.classId,
        teacher: rec.teacher,
      });
      
      // Group by class
      const className = rec.class || 'Unknown';
      if (!classes.has(className)) {
        classes.set(className, {
          classId: rec.classId,
          className,
          teacher: rec.teacher,
          present: 0,
          absent: 0,
          pending: 0,
          late: 0,
          total: 0,
        });
      }
      
      const classStats = classes.get(className)!;
      classStats.total += 1;
      if (rec.status === 'present') classStats.present += 1;
      else if (rec.status === 'absent') classStats.absent += 1;
      else if (rec.status === 'pending') classStats.pending += 1;
      else if (rec.status === 'late') classStats.late += 1;
    }
    
    const periodTotal = periodStudents.size || 0;
    
    periodStats[period] = {
      present: periodPresent,
      absent: periodAbsent,
      pending: periodPending,
      late: periodLate,
      total: periodTotal,
      presentPct: periodTotal ? Math.round((periodPresent / periodTotal) * 100) : 0,
      absentPct: periodTotal ? Math.round((periodAbsent / periodTotal) * 100) : 0,
      students,
      classes,
    };
  });

  const total = perStudent.size || 0;
  const presentPct = total ? Math.round((present / total) * 100) : 0;
  const absentPct = total ? Math.round((absent / total) * 100) : 0;

  // Subs count
  const subsItems: any[] = Array.isArray(subsPayload) ? subsPayload : subsPayload?.records || [];
  const subsSet = new Set<string>(
    subsItems
      .map((s) => (s?.substitute_email || s?.email || s?.sub_name || s?.name || '').toLowerCase())
      .filter(Boolean)
  );
  const subsCount = subsSet.size;

  const activity = absent_students.slice(0, 6).map((s) => ({
    id: s.id,
    title: 'Parent notification sent',
    detail: [s.name, s.class, s.period ? `Period ${s.period}` : ''].filter(Boolean).join(' - '),
    created_at: Date.now(),
  }));

  // Convert class Maps to arrays for JSON serialization
  const periodStatsForJson: any = {};
  for (const [period, stats] of Object.entries(periodStats)) {
    periodStatsForJson[period] = {
      ...stats,
      classes: Array.from(stats.classes.values()),
    };
  }

  return NextResponse.json(
    {
      present,
      absent,
      pending,
      late,
      total,
      presentPct,
      absentPct,
      subsCount,
      absent_students,
      periodStats: periodStatsForJson,
      activity,
      timestamp: Date.now(),
    },
    { 
      headers: { 
        'Cache-Control': 'no-store, no-cache, must-revalidate, proxy-revalidate, max-age=0',
        'Pragma': 'no-cache',
        'Expires': '0',
        'Surrogate-Control': 'no-store'
      } 
    }
  );
}
