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

// EXACT mapping to your statuses
function normalizeStatus(v?: string) {
  const s = (v || '').trim().toLowerCase();
  if (s === 'present') return 'present';
  if (s === 'absent') return 'absent';
  if (s === 'pending') return 'pending';
  return ''; // anything else ignored
}

/* ---------- handler ---------- */

export async function GET(req: NextRequest) {
  const email = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  // Scope & cache-busters
  const cUrl = new URL(csvUrl());
  cUrl.searchParams.set('district_code', district);
  cUrl.searchParams.set('school_code', school);
  if (email) {
    cUrl.searchParams.set('email', email);
    cUrl.searchParams.set('admin_email', email);
  }
  cUrl.searchParams.set('_ts', Date.now().toString());

  const sUrl = new URL(subsListUrl());
  sUrl.searchParams.set('district_code', district);
  sUrl.searchParams.set('school_code', school);
  if (email) {
    sUrl.searchParams.set('email', email);
    sUrl.searchParams.set('admin_email', email);
  }
  sUrl.searchParams.set('_ts', Date.now().toString());

  const headersCsv: HeadersInit = { Accept: 'text/csv' };
  const headersJson: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) {
    headersCsv.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
    headersJson.Authorization = `Bearer ${process.env.XANO_API_KEY}`;
  }

  const [csvRes, subsRes] = await Promise.all([
    fetch(cUrl.toString(), { method: 'GET', headers: headersCsv, cache: 'no-store' }),
    fetch(sUrl.toString(), { method: 'GET', headers: headersJson, cache: 'no-store' }),
  ]);

  const csvText = await csvRes.text().catch(() => '');
  const subsPayload = await subsRes.json().catch(() => []);

  if (!csvRes.ok) {
    return NextResponse.json(
      { error: 'Failed to fetch CSV' },
      { status: csvRes.status, headers: { 'Cache-Control': 'no-store' } }
    );
  }

  const rows = parseCsv(csvText);

  const H = {
    id: ['student_id', 'id', 'studentid'],
    name: ['student_name', 'name', 'student'],
    status: ['attendance_status', 'status', 'attendance'],
    klass: ['class_name', 'class'],
    period: ['period'],
    teacher: ['teacher_name', 'teacher'],
    created: ['created_at', 'timestamp', 'time', 'created'],
  };

  // latest status per student by timestamp
  type Latest = {
    ts: number;
    status: 'present' | 'absent' | 'pending' | '';
    name?: string;
    class?: string;
    period?: string | number;
    teacher?: string;
  };
  const perStudent = new Map<string, Latest>();

  for (const r of rows) {
    const id = String(pick(r, H.id) ?? pick(r, H.name) ?? Math.random()).trim();
    const ts = tsOf(r, H.created); // 0 if missing
    const status = normalizeStatus(pick(r, H.status) as string);
    const rec: Latest = {
      ts,
      status,
      name: pick(r, H.name),
      class: pick(r, H.klass),
      period: pick(r, H.period),
      teacher: pick(r, H.teacher),
    };
    const prev = perStudent.get(id);
    if (!prev || ts >= prev.ts) perStudent.set(id, rec);
  }

  let present = 0,
    absent = 0;
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
    }
  }

  // By default, total = all unique students (includes Pending)
  // If you want to ignore Pending, change to: const total = present + absent;
  const total = perStudent.size || 0;

  const presentPct = total ? Math.round((present / total) * 100) : 0;
  const absentPct = total ? Math.round((absent / total) * 100) : 0;

  // Subs count (unique by email/name best-effort)
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

  return NextResponse.json(
    {
      present,
      absent,
      total,
      presentPct,
      absentPct,
      subsCount,
      absent_students,
      activity,
      timestamp: Date.now(),
    },
    { headers: { 'Cache-Control': 'no-store' } }
  );
}
