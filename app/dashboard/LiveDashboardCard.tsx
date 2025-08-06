'use client';

import React, { useEffect, useState } from 'react';

type ActivityItem = {
  id?: number | string;
  title: string;
  detail?: string;
  created_at?: number | string;
};

type AbsentStudent = {
  id?: number | string;
  name?: string;
  class?: string;
  period?: string | number;
  teacher?: string;
};

type LivePayload = {
  present: number;
  absent: number;
  total?: number;           // unique student_id count from API
  presentPct?: number;      // based on unique IDs
  absentPct?: number;       // based on unique IDs
  subsCount?: number;
  absent_students?: AbsentStudent[];
  timestamp?: number | string | null;
  activity: ActivityItem[];
};

/* ---------- time helpers (America/New_York) ---------- */

function isActiveSchoolHoursET(d: Date = new Date()) {
  // 06:00 <= time < 21:00 in America/New_York (i.e., stop 9pm–6am ET)
  const parts = new Intl.DateTimeFormat('en-US', {
    timeZone: 'America/New_York',
    hour12: false,
    hour: '2-digit',
  }).formatToParts(d);
  const hourStr = parts.find((p) => p.type === 'hour')?.value ?? '00';
  const hour = Number(hourStr);
  return hour >= 6 && hour < 21;
}

function timeAgo(ts?: number | string | null) {
  if (!ts) return '';
  const d = typeof ts === 'number' ? new Date(ts) : new Date(String(ts));
  const diff = Math.max(0, Date.now() - d.getTime());
  const m = Math.floor(diff / 60000);
  if (m < 1) return 'just now';
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  return `${h}h ago`;
}

/* ---------- component ---------- */

export default function LiveDashboardCard({ pollMs = 5000 }: { pollMs?: number }) {
  const [data, setData] = useState<LivePayload | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [showAbsent, setShowAbsent] = useState(false);
  const [busy, setBusy] = useState(false);     // for emergency action
  const [paused, setPaused] = useState(!isActiveSchoolHoursET()); // after-hours flag

  const fetchLive = async () => {
    const allowed = isActiveSchoolHoursET();
    setPaused(!allowed);

    if (!allowed) {
      // Do not call the API after hours—leave last known data, clear loaders.
      setLoading(false);
      return;
    }

    try {
      setError(null);
      const res = await fetch('/api/xano/live-dashboard', {
        cache: 'no-store',
        headers: { 'Cache-Control': 'no-store' },
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || `Failed (${res.status})`);
      setData(payload);
    } catch (e: any) {
      setError(e?.message || 'Failed to load live data');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    // Initial try (will no-op if after hours)
    fetchLive();

    // Poller: checks the window every pollMs; only hits API if allowed.
    const id = setInterval(fetchLive, pollMs);
    return () => clearInterval(id);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [pollMs]);

  const total = data?.total ?? (data ? data.present + data.absent : 0);
  const presentPct = data?.presentPct ?? (total ? Math.round((data!.present / total) * 100) : 0);
  const absentPct = data?.absentPct ?? (total ? Math.round((data!.absent / total) * 100) : 0);

  const startEmergency = async () => {
    // Placeholder; wire this to a real Xano endpoint when available.
    try {
      setBusy(true);
      alert('Emergency Protocol triggered (placeholder).');
    } catch (e: any) {
      alert(e?.message || 'Failed to start emergency');
    } finally {
      setBusy(false);
    }
  };

  return (
    <>
      <div className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-2">
            <span className="inline-flex h-8 w-8 items-center justify-center rounded-lg bg-gradient-to-r from-blue-400 to-blue-600 text-white">
              <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M9 12l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <circle cx="12" cy="12" r="9" strokeWidth="2" />
              </svg>
            </span>
            <h3 className="text-base font-semibold text-gray-900">Live Dashboard</h3>
          </div>
          <div className="hidden sm:flex items-center space-x-2">
            <span
              className={`h-2 w-2 rounded-full ${
                paused ? 'bg-gray-300' : 'animate-pulse bg-green-400'
              }`}
            />
            <span className="text-xs text-gray-600">{paused ? 'Paused' : 'Live'}</span>
          </div>
        </div>

        {/* KPIs */}
        <div className="mb-4 grid grid-cols-2 gap-3">
          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Present %</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '—' : `${presentPct}%`}
            </p>
          </div>

          <button
            className="rounded-xl border border-gray-100 bg-white p-3 text-left hover:bg-gray-50"
            onClick={() => !loading && !paused && setShowAbsent(true)}
          >
            <p className="text-xs text-gray-500">Absent %</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '—' : `${absentPct}%`}
            </p>
            <p className="mt-1 text-[11px] text-gray-500">
              {loading ? '' : `${data?.absent ?? 0} student${(data?.absent ?? 0) === 1 ? '' : 's'}`}
              {!loading && !paused && <span className="ml-1 underline">View details</span>}
            </p>
          </button>

          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Substitute Teachers</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '—' : data?.subsCount ?? 0}
            </p>
          </div>

          <div className="rounded-xl border border-gray-100 bg-white p-3">
            <p className="text-xs text-gray-500">Absent (count)</p>
            <p className="mt-1 text-2xl font-bold text-gray-900">
              {loading ? '—' : data?.absent ?? 0}
            </p>
          </div>
        </div>

        {/* Activity */}
        <div className="mb-4">
          <h4 className="mb-2 text-xs font-semibold text-gray-700">Recent Activity</h4>
          <div className="divide-y divide-gray-100 overflow-hidden rounded-xl border border-gray-100">
            {error && <div className="px-3 py-4 text-center text-xs text-red-600">{error}</div>}
            {!error && (loading || !data?.activity?.length) && (
              <div className="px-3 py-6 text-center text-xs text-gray-500">
                {loading ? 'Loading…' : paused ? 'Auto-refresh paused after hours.' : 'No recent events.'}
              </div>
            )}
            {!loading &&
              !error &&
              !paused &&
              (data?.activity || []).slice(0, 2).map((a) => (
                <div
                  key={String(a.id ?? `${a.title}-${a.created_at}`)}
                  className="flex items-center justify-between px-3 py-3"
                >
                  <div className="min-w-0">
                    <p className="truncate text-sm font-medium text-gray-900">{a.title}</p>
                    {a.detail && <p className="truncate text-xs text-gray-500">{a.detail}</p>}
                  </div>
                  <span className="ml-3 shrink-0 whitespace-nowrap text-[11px] text-gray-500">
                    {timeAgo(a.created_at)}
                  </span>
                </div>
              ))}
          </div>
        </div>

        {/* CTA */}
        <button
          className="inline-flex w-full items-center justify-center rounded-lg bg-gradient-to-r from-rose-500 to-red-600 px-3 py-2 text-sm font-semibold text-white shadow transition hover:from-rose-600 hover:to-red-700 disabled:opacity-60"
          onClick={startEmergency}
          disabled={busy}
        >
          <span className="mr-2">🚨</span> {busy ? 'Starting…' : 'Emergency Protocol'}
        </button>

        {/* Footer */}
        <p className="mt-2 text-right text-[11px] text-gray-500">
          {paused ? 'Auto-refresh paused (9pm–6am ET)' : `Updated ${timeAgo(data?.timestamp ?? Date.now())}`}
        </p>
      </div>

      {/* Absent details modal */}
      {showAbsent && !paused && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4"
          onClick={() => setShowAbsent(false)}
        >
          <div
            className="max-h-[80vh] w-full max-w-lg overflow-y-auto rounded-2xl bg-white p-5 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="mb-3 flex items-center justify-between">
              <h4 className="text-lg font-semibold text-gray-900">Absent Students</h4>
              <button
                className="rounded-md p-2 hover:bg-gray-100"
                onClick={() => setShowAbsent(false)}
                aria-label="Close"
              >
                ✕
              </button>
            </div>
            {!data?.absent_students?.length ? (
              <p className="py-8 text-center text-sm text-gray-600">No absent students listed.</p>
            ) : (
              <ul className="divide-y divide-gray-100">
                {data.absent_students.map((s, i) => (
                  <li key={`${s.id ?? i}`} className="py-3">
                    <p className="text-sm font-medium text-gray-900">{s.name || '—'}</p>
                    <p className="text-xs text-gray-500">
                      {[s.class, s.period ? `Period ${s.period}` : '', s.teacher]
                        .filter(Boolean)
                        .join(' • ')}
                    </p>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>
      )}
    </>
  );
}
