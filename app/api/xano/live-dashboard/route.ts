// app/api/xano/live-dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

// ----- helpers -----
function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}
function csvUrl() {
  // uses your env var for the CSV API
  return (process.env.XANO_CSV_DOWNLOAD_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/csv_from_table_blueberry_USE_test`).replace(/\/$/, '');
}
function subsListUrl() {
  return (process.env.XANO_ADMIN_SUBS_LIST_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/adminSubAssignmentsList`).replace(/\/$/, '');
}

// split line by commas but ignore commas inside quotes
const SPLIT_RE = /,(?=(?:[^"]*"[^"]*")*[^"]*$)/g;
function parseCsv(text: string): Array<Record<string, string>> {
  const lines = text.replace(/\r/g, '').split('\n').filter(Boolean);
  if (!lines.length) return [];
  const headers = lines[0].split(SPLIT_RE).map(h => h.trim().replace(/^"|"$/g, ''));
  const rows: Record<string, string>[] = [];
  for (let i = 1; i < lines.length; i++) {
    const cols = lines[i].split(SPLIT_RE).map(v => v.trim().replace(/^"|"$/g, ''));
    const row: Record<string, string> = {};
    headers.forEach((h, idx) => (row[h] = cols[idx] ?? ''));
    rows.push(row);
  }
  return rows;
}
function pick(row: Record<string, any>, keys: string[]) {
  for (const k of keys) {
    if (row[k] != null && row[k] !== '') return row[k];
    const found = Object.keys(row).find(h => h.toLowerCase() === k.toLowerCase());
    if (found && row[found] !== '') return row[found];
  }
  return undefined;
}

export async function GET(req: NextRequest) {
  // ----- scope -----
  const email = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  const district = readCookie(req, 'district_code');
  const school   = readCookie(req, 'school_code');
  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const headers: HeadersInit = { Accept: 'text/csv' };
  if (process.env.XANO_API_KEY) headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;

  // ----- build URLs with same scoping params -----
  const cUrl = new URL(csvUrl());
  cUrl.searchParams.set('district_code', district);
  cUrl.searchParams.set('school_code', school);
  if (email) {
    cUrl.searchParams.set('email', email);
    cUrl.searchParams.set('admin_email', email);
  }

  const sUrl = new URL(subsListUrl());
  sUrl.searchParams.set('district_code', district);
  sUrl.searchParams.set('school_code', school);
  if (email) {
    sUrl.searchParams.set('email', email);
    sUrl.searchParams.set('admin_email', email);
  }

  // ----- fetch both in parallel -----
  const [csvRes, subsRes] = await Promise.all([
    fetch(cUrl.toString(), { method: 'GET', headers, cache: 'no-store' }),
    fetch(sUrl.toString(), { method: 'GET', headers: { Accept: 'application/json', ...(process.env.XANO_API_KEY ? { Authorization: `Bearer ${process.env.XANO_API_KEY}` } : {}) }, cache: 'no-store' }),
  ]);

  const csvText = await csvRes.text().catch(() => '');
  const subsPayload = await subsRes.json().catch(() => ([]));

  if (!csvRes.ok) {
    return NextResponse.json({ error: 'Failed to fetch CSV' }, { status: csvRes.status });
  }

  // ----- parse CSV & compute metrics (by latest status per student) -----
  const rows = parseCsv(csvText);

  // header variants we’ll accept
  const H = {
    id: ['student_id', 'id', 'studentid'],
    name: ['student_name', 'name', 'student'],
    status: ['attendance_status', 'status', 'attendance'],
    klass: ['class_name', 'class'],
    period: ['period'],
    teacher: ['teacher_name', 'teacher'],
    created: ['created_at', 'timestamp', 'time'],
  };

  type SRec = { status?: string; name?: string; class?: string; period?: string | number; teacher?: string };
  const perStudent = new Map<string, SRec>();

  for (const r of rows) {
    const id = String(pick(r, H.id) ?? pick(r, H.name) ?? Math.random()).trim();
    const status = String(pick(r, H.status) ?? '').trim().toLowerCase();
    const rec: SRec = {
      status,
      name: pick(r, H.name),
      class: pick(r, H.klass),
      period: pick(r, H.period),
      teacher: pick(r, H.teacher),
    };
    // assume CSV is chronological; last one wins
    perStudent.set(id, rec);
  }

  let present = 0, absent = 0;
  const absent_students: Array<{ id?: string; name?: string; class?: string; period?: string | number; teacher?: string }> = [];
  for (const [id, rec] of perStudent.entries()) {
    if (rec.status === 'absent') {
      absent += 1;
      absent_students.push({ id, name: rec.name, class: rec.class, period: rec.period, teacher: rec.teacher });
    } else if (rec.status === 'present') {
      present += 1;
    }
  }

  const total = perStudent.size || 0;
  const presentPct = total ? Math.round((present / total) * 100) : 0;
  const absentPct  = total ? Math.round((absent  / total) * 100) : 0;

  // subs count (best-effort unique by email or name)
  const subsItems: any[] = Array.isArray(subsPayload) ? subsPayload : subsPayload?.records || [];
  const subsSet = new Set<string>(
    subsItems
      .map(s => (s?.substitute_email || s?.email || s?.sub_name || s?.name || '').toLowerCase())
      .filter(Boolean),
  );
  const subsCount = subsSet.size;

  // simple activity from absent list
  const activity = absent_students.slice(0, 6).map((s) => ({
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
