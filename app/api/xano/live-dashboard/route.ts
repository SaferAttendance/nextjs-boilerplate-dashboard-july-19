// app/api/xano/live-dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

// Existing students search
function studentsSearchUrl() {
  return (process.env.XANO_STUDENTS_SEARCH_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/Admin_Student_Search`).replace(/\/$/, '');
}

// Sub assignments list (you have this var)
function subsListUrl() {
  return (process.env.XANO_ADMIN_SUBS_LIST_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/adminSubAssignmentsList`).replace(/\/$/, '');
}

function isToday(ts?: number | string | null) {
  if (ts == null) return false;
  const n = Number(ts);
  const d = Number.isFinite(n) ? new Date(n < 2e10 ? n * 1000 : n) : new Date(String(ts));
  const now = new Date();
  return d.getFullYear() === now.getFullYear() &&
         d.getMonth() === now.getMonth() &&
         d.getDate() === now.getDate();
}

export async function GET(req: NextRequest) {
  const email = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const headers: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;

  // Build students query
  const sUrl = new URL(studentsSearchUrl());
  sUrl.searchParams.set('district_code', district);
  sUrl.searchParams.set('school_code',  school);
  if (email) {
    sUrl.searchParams.set('email', email);
    sUrl.searchParams.set('admin_email', email);
  }
  sUrl.searchParams.set('limit', '2000');     // raise if needed
  sUrl.searchParams.set('only_today', '1');   // harmless if ignored upstream

  // Build subs list query
  const subUrl = new URL(subsListUrl());
  subUrl.searchParams.set('district_code', district);
  subUrl.searchParams.set('school_code',  school);
  if (email) {
    subUrl.searchParams.set('email', email);
    subUrl.searchParams.set('admin_email', email);
  }

  const [sr, subr] = await Promise.all([
    fetch(sUrl.toString(),  { method: 'GET', headers, cache: 'no-store' }),
    fetch(subUrl.toString(),{ method: 'GET', headers, cache: 'no-store' }),
  ]);

  const studentsPayload = await sr.json().catch(() => ({}));
  const subsPayload     = await subr.json().catch(() => ([]));

  if (!sr.ok) {
    return NextResponse.json({ error: studentsPayload?.error || 'Upstream error' }, { status: sr.status });
  }

  const rows: any[] = Array.isArray(studentsPayload) ? studentsPayload : studentsPayload?.records || [];
  const todays = rows.filter(r => (r?.created_at ? isToday(r.created_at) : true));

  let present = 0, absent = 0;
  const uniqueStudents = new Set<string | number>();
  const absent_students: Array<{ id?: string|number; name?: string; class?: string; period?: string|number; teacher?: string }> = [];

  for (const r of todays) {
    const status = String(r?.attendance_status || '').toLowerCase().trim();
    const sid = r?.student_id ?? r?.id;
    if (sid != null) uniqueStudents.add(sid);
    if (status === 'present') present += 1;
    else if (status === 'absent') {
      absent += 1;
      absent_students.push({
        id: sid,
        name: r?.student_name,
        class: r?.class_name,
        period: r?.period,
        teacher: r?.teacher_name,
      });
    }
  }

  const total = uniqueStudents.size || present + absent || rows.length || 0;
  const presentPct = total ? Math.round((present / total) * 100) : 0;
  const absentPct  = total ? Math.round((absent  / total) * 100) : 0;

  const subsItems: any[] = Array.isArray(subsPayload) ? subsPayload : subsPayload?.records || [];
  // best-effort unique subs today (fallback: all returned)
  const subsSet = new Set<string>(subsItems.map(s => (s?.substitute_email || s?.email || s?.sub_name || '').toLowerCase()).filter(Boolean));
  const subsCount = subsSet.size;

  // Minimal activity feed (keep what you already had)
  const activity = absent_students.slice(0, 6).map(s => ({
    id: s.id,
    title: 'Parent notification sent',
    detail: [s.name, s.class, s.period ? `Period ${s.period}` : ''].filter(Boolean).join(' - '),
    created_at: Date.now(),
  }));

  return NextResponse.json({
    present,
    absent,
    total,
    presentPct,
    absentPct,
    subsCount,
    absent_students,
    activity,
    timestamp: Date.now(),
  });
}
