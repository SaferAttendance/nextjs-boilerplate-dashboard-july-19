'use client';

import { useState } from 'react';

type ClassItem = {
  id?: string | number;
  name?: string;
  class_name?: string;
  course?: string;
  period?: string | number;
  room?: string;
  room_number?: string;
};

type TeacherItem = {
  id?: string | number;
  teacher_name?: string;
  name?: string;
  full_name?: string;
  teacher_email?: string;
  email?: string;
  classes?: ClassItem[];
  class_list?: ClassItem[];
};

function getTeacherName(t: TeacherItem) {
  return t.teacher_name || t.name || t.full_name || 'Unnamed';
}

function getTeacherEmail(t: TeacherItem) {
  return t.teacher_email || t.email || '';
}

function getClasses(t: TeacherItem): ClassItem[] {
  return (t.classes || t.class_list || []) as ClassItem[];
}

export default function TeachersSearch() {
  const [q, setQ] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [results, setResults] = useState<TeacherItem[]>([]);
  const [touched, setTouched] = useState(false);

  async function doSearch(e?: React.FormEvent) {
    e?.preventDefault();
    setTouched(true);
    setError(null);

    const query = q.trim();
    if (!query) return;

    setLoading(true);
    try {
      const res = await fetch(`/api/xano/teachers?q=${encodeURIComponent(query)}`, {
        method: 'GET',
        cache: 'no-store',
      });

      const payload = await res.json();
      if (!res.ok) {
        throw new Error(payload?.error || 'Search failed');
      }

      const items: TeacherItem[] = Array.isArray(payload)
        ? payload
        : (payload?.items || payload?.data || payload?.results || []);

      setResults(items || []);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
      setResults([]);
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="space-y-8">
      {/* Search bar */}
      <form onSubmit={doSearch} className="flex w-full max-w-2xl items-center gap-3">
        <div className="relative w-full">
          <input
            value={q}
            onChange={(e) => setQ(e.target.value)}
            onBlur={() => setTouched(true)}
            placeholder="Search teacher by name or email…"
            className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-11 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20"
            type="text"
          />
          <svg
            className="pointer-events-none absolute left-3 top-3.5 text-gray-400"
            width="18"
            height="18"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
          >
            <circle cx="11" cy="11" r="8" strokeWidth="2" />
            <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        </div>

        <button
          type="submit"
          disabled={loading || !q.trim()}
          className="rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg transition hover:brightness-110 disabled:cursor-not-allowed disabled:opacity-50"
        >
          {loading ? 'Searching…' : 'Search'}
        </button>
      </form>

      {/* Hints / errors */}
      {!loading && !error && results.length === 0 && touched && q.trim() && (
        <p className="text-sm text-gray-500">No results found for “{q.trim()}”.</p>
      )}
      {error && (
        <div className="rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
          {error}
        </div>
      )}

      {/* Results */}
      <div className="grid grid-cols-1 gap-6 lg:grid-cols-2">
        {results.map((t, idx) => {
          const name = getTeacherName(t);
          const email = getTeacherEmail(t);
          const classes = getClasses(t);

          return (
            <div
              key={(t.id as any) ?? `${email}-${idx}`}
              className="rounded-2xl border border-gray-100 bg-white p-6 shadow-sm transition hover:-translate-y-0.5 hover:shadow-xl"
            >
              <div className="mb-4 flex items-start justify-between">
                <div>
                  <h3 className="text-lg font-semibold text-gray-900">{name}</h3>
                  {email && <p className="text-sm text-gray-600">{email}</p>}
                </div>
                <div className="inline-flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-r from-blue-400 to-blue-600 text-white">
                  <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <circle cx="11" cy="11" r="8" strokeWidth="2" />
                    <path d="M21 21l-4.35-4.35" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                  </svg>
                </div>
              </div>

              {/* Classes for this teacher */}
              {classes?.length ? (
                <div className="grid grid-cols-1 gap-4 sm:grid-cols-2">
                  {classes.map((c, cIdx) => {
                    const title = c.class_name || c.name || c.course || `Class ${cIdx + 1}`;
                    const period = c.period;
                    const room = c.room || c.room_number;
                    return (
                      <div
                        key={(c.id as any) ?? `${title}-${cIdx}`}
                        className="rounded-xl border border-gray-100 bg-gray-50 p-4"
                      >
                        <div className="mb-1 text-sm font-medium text-gray-900">{title}</div>
                        <div className="text-xs text-gray-600">
                          {period ? <>Period: {period}</> : null}
                          {period && room ? ' • ' : null}
                          {room ? <>Room: {room}</> : null}
                        </div>
                      </div>
                    );
                  })}
                </div>
              ) : (
                <p className="text-sm text-gray-500">No classes found for this teacher.</p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
