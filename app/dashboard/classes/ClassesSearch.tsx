'use client';

import React, { useState } from 'react';

/* ---------- Types returned by /api/xano/classes ---------------------- */
type XanoClassRow = {
  id: number;
  class_id?: string;
  class_name?: string;
  period?: number | string;
  teacher_email?: string;
  teacher_name?: string;
  students_enrolled?: number;
};

/* UI view model for one class ---------------------------------------- */
type ClassVM = {
  id: number;
  code: string;
  name: string;
  period?: string | number;
  teacher?: string;
  students?: number;
};

/* Small helper – capital letter icon colours ------------------------- */
const cardColors = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

/* -------------------------------------------------------------------- */
export default function ClassesSearch() {
  const [query, setQuery]           = useState('');
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState<string | null>(null);
  const [noResults, setNoResults]   = useState(false);

  const [matches, setMatches]       = useState<ClassVM[] | null>(null);
  const [selected, setSelected]     = useState<ClassVM | null>(null);

  /* Convert rows -> unique classes (by class_id) */
  function normalise(rows: XanoClassRow[]): ClassVM[] {
    const map = new Map<string, ClassVM>();
    for (const r of rows) {
      const code = (r.class_id || '').trim();
      if (!code) continue;
      if (!map.has(code)) {
        map.set(code, {
          id: r.id,
          code,
          name: r.class_name || 'Class',
          period: r.period,
          teacher: r.teacher_name || r.teacher_email || '',
          students: r.students_enrolled,
        });
      }
    }
    /* sort by period then name */
    return Array.from(map.values()).sort((a, b) => {
      if (a.period && b.period && a.period !== b.period)
        return Number(a.period) - Number(b.period);
      return a.name.localeCompare(b.name);
    });
  }

  /* ---------------- SEARCH ----------------------------------------- */
  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setNoResults(false);
    setSelected(null);
    setMatches(null);

    const q = query.trim();
    if (!q) {
      alert('Please enter a class name or ID');
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/xano/classes?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data?.error || `Search failed (${res.status})`);

      const rows: XanoClassRow[] = Array.isArray(data) ? data : data?.records ?? [];
      if (!rows.length) { setNoResults(true); return; }

      const uniq = normalise(rows);
      setMatches(uniq);

      if (uniq.length === 1) setSelected(uniq[0]);
    } catch (err: any) {
      setError(err?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  /* ---------------- UI --------------------------------------------- */
  return (
    <>
      {/* ---- search bar ---- */}
      <div className="text-center mb-12">
        <h2 className="mb-4 text-4xl font-bold text-gray-800">Find a Class</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          Search by <strong>class name</strong> or <strong>class&nbsp;ID</strong> to see roster &amp; details.
        </p>

        <form onSubmit={handleSearch} className="relative mx-auto max-w-2xl" autoComplete="off">
          <input
            className="w-full rounded-2xl border border-white/20 bg-white/90 px-6 py-4 pl-14 pr-16 text-lg shadow-lg backdrop-blur-sm
                       focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="Enter class name or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <svg className="absolute left-5 top-1/2 h-6 w-6 -translate-y-1/2 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
          </svg>
          <button
            type="submit"
            className="absolute right-2 top-1/2 -translate-y-1/2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark
                       px-6 py-2 font-medium text-white shadow-lg transition-all duration-200 hover:from-brand-dark hover:to-brand-blue"
          >
            Search
          </button>
        </form>

        {error && <p className="mt-3 text-sm text-red-600">{error}</p>}
      </div>

      {/* ---- loading / empty ---- */}
      {loading && (
        <div className="py-16 text-center">
          <div className="mx-auto mb-4 h-12 w-12 animate-spin rounded-full border-4 border-brand-blue border-t-transparent"></div>
          <p className="font-medium text-gray-600">Searching for class…</p>
        </div>
      )}

      {noResults && !loading && (
        <div className="py-16 text-center">
          <p className="text-xl font-semibold text-gray-800">No class found</p>
        </div>
      )}

      {/* ---- choose one of many ---------------------------------- */}
      {matches && !selected && matches.length > 1 && (
        <section className="mx-auto mb-10 max-w-3xl">
          <h3 className="mb-3 text-lg font-semibold text-gray-800">Select a class</h3>
          <div className="grid gap-4 sm:grid-cols-2">
            {matches.map((c, idx) => (
              <button
                key={c.code}
                onClick={() => setSelected(c)}
                className="rounded-xl border border-gray-200 bg-white/90 p-4 text-left shadow-sm transition
                           hover:-translate-y-0.5 hover:shadow-md"
              >
                <div className="flex items-center gap-3">
                  <div
                    className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-full
                                bg-gradient-to-r ${cardColors[idx % cardColors.length]} text-white font-semibold`}
                  >
                    {c.name[0]?.toUpperCase() || c.code[0]}
                  </div>
                  <div>
                    <div className="font-semibold text-gray-900">{c.name}</div>
                    <div className="text-sm text-gray-600">{c.code}</div>
                  </div>
                </div>
              </button>
            ))}
          </div>
        </section>
      )}

      {/* ---- selected class detail card -------------------------- */}
      {selected && (
        <section className="mx-auto max-w-3xl rounded-2xl border border-white/20 bg-white/90 p-8 shadow-lg">
          <div className="mb-6 flex flex-wrap items-center justify-between gap-4">
            <div>
              <h3 className="mb-1 text-2xl font-bold text-gray-800">{selected.name}</h3>
              <p className="text-sm text-gray-600">
                ID&nbsp;•&nbsp;<span className="font-mono">{selected.code}</span>
              </p>
            </div>
            {selected.period && (
              <div className="rounded-lg bg-neutral-50 px-4 py-2 text-sm text-neutral-700">
                Period&nbsp;{selected.period}
              </div>
            )}
          </div>

          <ul className="space-y-2 text-sm text-gray-700">
            {selected.teacher && (
              <li>
                <span className="font-medium">Teacher: </span>
                {selected.teacher}
              </li>
            )}
            {selected.students !== undefined && (
              <li>
                <span className="font-medium">Students Enrolled: </span>
                {selected.students}
              </li>
            )}
          </ul>

          {/* Action buttons */}
          <div className="mt-8 flex flex-col items-stretch gap-4 sm:flex-row">
            <button
              onClick={() => {
                const email = prompt('Substitute teacher email to assign?');
                if (!email) return;
                alert(`(demo) Would call Xano assign-sub endpoint with ${email}`);
                /* A real call would POST → /api/xano/assign-sub … */
              }}
              className="flex-1 rounded-xl bg-brand-blue px-6 py-3 font-medium text-white shadow-sm transition hover:bg-brand-dark"
            >
              Assign Substitute
            </button>
            <button
              onClick={() => alert('(demo) Would fetch class roster / info')}
              className="flex-1 rounded-xl border border-brand-blue px-6 py-3 font-medium text-brand-blue transition hover:bg-brand-blue/10"
            >
              View Class Info
            </button>
          </div>
        </section>
      )}
    </>
  );
}
