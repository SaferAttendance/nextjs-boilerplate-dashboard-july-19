// app/api/xano/live-dashboard/route.ts
import { NextRequest, NextResponse } from 'next/server';

export const runtime = 'nodejs';

function readCookie(req: NextRequest, name: string): string | undefined {
  const c: any = req.cookies.get(name);
  return typeof c === 'string' ? c : c?.value;
}

function endpoint() {
  // We’ll derive live numbers from the existing Admin_Student_Search
  // You already have this env var set.
  return (process.env.XANO_STUDENTS_SEARCH_URL ||
    `${(process.env.XANO_BASE_URL || process.env.NEXT_PUBLIC_XANO_BASE || '')
      .replace(/\/$/, '')}/Admin_Student_Search`).replace(/\/$/, '');
}

function isToday(ts?: number | string | null) {
  if (ts == null) return false;
  const d = typeof ts === 'number' ? new Date(ts * (ts < 2e10 ? 1000 : 1)) : new Date(String(ts));
  const now = new Date();
  return (
    d.getFullYear() === now.getFullYear() &&
    d.getMonth() === now.getMonth() &&
    d.getDate() === now.getDate()
  );
}

export async function GET(req: NextRequest) {
  // scope from cookies (same pattern as your other routes)
  const email = readCookie(req, 'email') || readCookie(req, 'session_email') || undefined;
  const district = readCookie(req, 'district_code');
  const school = readCookie(req, 'school_code');

  if (!district || !school) {
    return NextResponse.json({ error: 'Missing admin scope' }, { status: 401 });
  }

  const url = new URL(endpoint());
  url.searchParams.set('district_code', district);
  url.searchParams.set('school_code', school);
  if (email) {
    url.searchParams.set('email', email);
    url.searchParams.set('admin_email', email);
  }
  // optional hints some Xano flows accept; harmless if ignored
  url.searchParams.set('limit', '500');
  url.searchParams.set('only_today', '1');

  const headers: HeadersInit = { Accept: 'application/json' };
  if (process.env.XANO_API_KEY) headers.Authorization = `Bearer ${process.env.XANO_API_KEY}`;

  const r = await fetch(url.toString(), { method: 'GET', headers, cache: 'no-store' });
  const payload = await r.json().catch(() => ({}));
  if (!r.ok) {
    return NextResponse.json({ error: payload?.error || 'Upstream error' }, { status: r.status });
  }

  // Normalize array
  const items: any[] = Array.isArray(payload) ? payload : payload?.records || [];

  // Keep today’s rows if created_at is present; otherwise use all
  const todays = items.filter((row) => (row?.created_at ? isToday(row.created_at) : true));

  let present = 0;
  let absent = 0;
  const activity: Array<{
    id?: string | number;
    title: string;
    detail?: string;
    created_at?: number | string;
    level: 'info' | 'warning' | 'critical';
  }> = [];

  for (const row of todays) {
    const status = String(row?.attendance_status || '').trim().toLowerCase();
    if (status === 'present') present += 1;
    else if (status === 'absent') absent += 1;

    // Build a recent-activity style feed from rows
    const title =
      status === 'absent'
        ? 'Parent notification sent'
        : status === 'present'
        ? 'Attendance verified'
        : 'Attendance updated';

    const detailParts = [
      row?.student_name,
      row?.class_name,
      row?.period ? `Period ${row.period}` : undefined,
    ].filter(Boolean);

    activity.push({
      id: row?.id,
      title,
      detail: detailParts.join(' - '),
      created_at: row?.created_at,
      level: status === 'absent' ? 'warning' : 'info',
    });
  }

  // Sort newest first and limit
  activity.sort((a, b) => (Number(b.created_at) || 0) - (Number(a.created_at) || 0));
  const limited = activity.slice(0, 6);

  return NextResponse.json({
    present,
    absent,
    timestamp: Date.now(),
    activity: limited,
  });
}
