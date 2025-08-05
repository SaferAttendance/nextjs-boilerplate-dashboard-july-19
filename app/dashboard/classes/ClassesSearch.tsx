'use client';

import React, { useState } from 'react';

/* ------------ types ------------------------------------------------------ */

type ClassMatch = {
  id: string;
  name: string;
  period?: string | number;
  teacher_email: string;
  teacher_name?: string;
};

/* ------------ helpers ---------------------------------------------------- */

function heading(text: string) {
  return <h3 className="mb-6 text-xl font-bold text-gray-800">{text}</h3>;
}

/* ------------ main component -------------------------------------------- */

export default function ClassesSearch() {
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [matches, setMatches] = useState<ClassMatch[] | null>(null);

  const [activeClass, setActiveClass] = useState<ClassMatch | null>(null);
  const [modal, setModal] = useState<'assign' | 'info' | null>(null);

  /* ---------- search ---------------------------------------------------- */

  async function handleSearch(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setMatches(null);

    const q = query.trim();
    if (!q) return alert('Enter a class name or ID');

    setLoading(true);
    try {
      const res = await fetch(`/api/xano/classes?q=${encodeURIComponent(q)}`, {
        cache: 'no-store',
      });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || `Failed (${res.status})`);

      const rows: any[] = Array.isArray(payload) ? payload : payload?.records;
      const list: ClassMatch[] =
        rows?.map((r) => ({
          id: r.class_id || r.id || '',
          name: r.class_name || 'Class',
          period: r.period,
          teacher_email: r.teacher_email || '',
          teacher_name: r.teacher_name,
        })) || [];

      setMatches(list);
      if (!list.length) setError('No class found');
    } catch (e: any) {
      setError(e?.message || 'Search failed');
    } finally {
      setLoading(false);
    }
  }

  /* ---------- substitute assign flow ----------------------------------- */

  const [subEmail, setSubEmail] = useState('');
  const [subBusy, setSubBusy] = useState(false);
  const [subMsg, setSubMsg] = useState<string | null>(null);

  async function submitSubstitute() {
    if (!activeClass) return;
    const email = subEmail.trim().toLowerCase();
    if (!email) return alert('Enter a substitute email');

    setSubBusy(true);
    setSubMsg(null);
    try {
      /* Build GET URL with 5 front-end parameters ----------------------- */
      const url = new URL('/api/xano/assign-sub', window.location.origin);
      Object.entries({
        sub_email: email,
        teacher_email: activeClass.teacher_email,
        class_id: activeClass.id,
        class_name: activeClass.name,
        period: String(activeClass.period ?? ''),
      }).forEach(([k, v]) => url.searchParams.set(k, v));

      const res   = await fetch(url.toString(), { cache: 'no-store' });
      const text  = await res.text();                 // Xano may return ''
      const json  = text ? JSON.parse(text) : null;

      if (!res.ok) throw new Error(json?.error || text || `Failed (${res.status})`);
      setSubMsg('Substitute assigned successfully ✔');
    } catch (e: any) {
      setSubMsg(e?.message || 'Failed to assign substitute');
    } finally {
      setSubBusy(false);
    }
  }

  /* ---------- class-info flow ------------------------------------------ */

  const [infoBusy, setInfoBusy] = useState(false);
  const [infoError, setInfoError] = useState<string | null>(null);
  const [infoRows, setInfoRows] = useState<any[] | null>(null);

  async function loadClassInfo(c: ClassMatch) {
    setInfoBusy(true);
    setInfoError(null);
    setInfoRows(null);
    try {
      const url = `/api/xano/class-info?class_id=${encodeURIComponent(
        c.id
      )}&class_name=${encodeURIComponent(
        c.name
      )}&teacher_email=${encodeURIComponent(c.teacher_email)}`;

      const res = await fetch(url, { cache: 'no-store' });
      const payload = await res.json();
      if (!res.ok) throw new Error(payload?.error || `Failed (${res.status})`);
      setInfoRows(Array.isArray(payload) ? payload : payload?.records);
    } catch (e: any) {
      setInfoError(e?.message || 'Failed to load roster');
    } finally {
      setInfoBusy(false);
    }
  }

  /* ---------- modal wrapper -------------------------------------------- */

  function closeModal() {
    setModal(null);
    setActiveClass(null);
    setSubEmail('');
    setSubMsg(null);
    setInfoRows(null);
    setInfoError(null);
  }

  /* ---------- ui -------------------------------------------------------- */

  return (
    <>
      {/* hero */}
      <div className="mb-12 text-center">
        <h2 className="mb-4 text-4xl font-bold text-gray-800">Find a Class</h2>
        <p className="mx-auto mb-8 max-w-2xl text-lg text-gray-600">
          Search by <strong>class name</strong> (e.g.&nbsp;“Math”) or{' '}
          <strong>class&nbsp;ID</strong> (e.g.&nbsp;“AA001”). After finding a
          class you can either <em>view its roster&nbsp;/ attendance</em> or{' '}
          <em>assign a substitute teacher</em>. <br />Remember: you’ll remove
          substitute access later from the{' '}
          <strong>Substitute Assignments</strong> card on the dashboard.
        </p>

        {/* search bar */}
        <form
          onSubmit={handleSearch}
          className="relative mx-auto flex max-w-xl items-center"
        >
          <input
            className="w-full rounded-l-2xl border border-white/20 bg-white/90 px-6 py-4 text-lg shadow-lg backdrop-blur-sm focus:border-transparent focus:outline-none focus:ring-2 focus:ring-brand-blue"
            placeholder="Enter class name or ID…"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
          />
          <button
            type="submit"
            disabled={loading}
            className="rounded-r-2xl bg-brand-dark px-6 py-4 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
          >
            {loading ? 'Searching…' : 'Search'}
          </button>
        </form>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>

      {/* results */}
      <div className="grid gap-6">
        {matches?.map((c) => (
          <div
            key={c.id}
            className="flex flex-col gap-6 rounded-2xl bg-white/90 p-6 shadow-lg backdrop-blur-sm sm:flex-row sm:items-center sm:justify-between"
          >
            <div>
              <h4 className="text-xl font-bold text-gray-800">{c.name}</h4>
              <p className="text-sm text-gray-500">
                ID&nbsp;•&nbsp;{c.id}
                {c.period && (
                  <>
                    {' '}
                    &nbsp;|&nbsp; <span className="capitalize">Period {c.period}</span>
                  </>
                )}
              </p>
              <p className="mt-1 text-sm text-gray-600">
                Teacher:&nbsp;{c.teacher_name || c.teacher_email}
              </p>
            </div>

            <div className="flex flex-col gap-4 sm:flex-row">
              <button
                className="rounded-xl bg-brand-dark px-6 py-3 text-white transition-opacity hover:opacity-90"
                onClick={() => {
                  setActiveClass(c);
                  setModal('assign');
                }}
              >
                Assign&nbsp;Substitute
              </button>
              <button
                className="rounded-xl border border-brand-dark px-6 py-3 text-brand-dark transition-colors hover:bg-brand-dark/10"
                onClick={() => {
                  setActiveClass(c);
                  setModal('info');
                  loadClassInfo(c);
                }}
              >
                View&nbsp;Class&nbsp;Info
              </button>
            </div>
          </div>
        ))}
      </div>

      {/* ---------------------- modal overlay ---------------------------- */}
      {modal && activeClass && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center bg-black/30 backdrop-blur-sm"
          onClick={closeModal}
        >
          <div
            className="relative max-h-[90vh] w-full max-w-xl overflow-y-auto rounded-2xl bg-white p-8 shadow-2xl"
            onClick={(e) => e.stopPropagation()}
          >
            <button
              className="absolute right-4 top-4 text-gray-500 hover:text-gray-700"
              onClick={closeModal}
            >
              ✕
            </button>

            {/* assign substitute modal */}
            {modal === 'assign' && (
              <>
                {heading(`Assign a Substitute for ${activeClass.name}`)}
                <p className="mb-6 text-sm text-gray-600">
                  Enter the substitute’s email below. The primary teacher’s
                  access will be revoked immediately.
                </p>

                <input
                  type="email"
                  placeholder="substitute@example.com"
                  className="mb-4 w-full rounded-xl border border-gray-200 px-4 py-3 shadow-sm focus:outline-none focus:ring-2 focus:ring-brand-blue"
                  value={subEmail}
                  onChange={(e) => setSubEmail(e.target.value)}
                />

                {subMsg && (
                  <p
                    className={`mb-4 text-sm ${
                      subMsg.includes('success') ? 'text-green-600' : 'text-red-600'
                    }`}
                  >
                    {subMsg}
                  </p>
                )}

                <button
                  onClick={submitSubstitute}
                  disabled={subBusy}
                  className="w-full rounded-xl bg-brand-dark px-6 py-3 text-white transition-opacity hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {subBusy ? 'Assigning…' : 'Assign Substitute'}
                </button>

                <p className="mt-4 text-xs text-gray-500">
                  You can remove substitute access later from the&nbsp;
                  <strong>Substitute Assignments</strong> card.
                </p>
              </>
            )}

            {/* class-info modal */}
            {modal === 'info' && (
              <>
                {heading(`Roster • ${activeClass.name}`)}
                {infoBusy && <p>Loading roster…</p>}
                {infoError && (
                  <p className="text-sm text-red-600">{infoError}</p>
                )}

                {infoRows && (
                  <div className="overflow-x-auto">
                    <table className="min-w-full divide-y divide-gray-200 text-sm">
                      <thead className="bg-gray-50">
                        <tr>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">
                            Student
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">
                            ID
                          </th>
                          <th className="px-4 py-2 text-left font-medium text-gray-600">
                            Status
                          </th>
                        </tr>
                      </thead>
                      <tbody className="divide-y divide-gray-100 bg-white">
                        {infoRows.map((r: any) => (
                          <tr key={r.id}>
                            <td className="px-4 py-2 text-gray-800">
                              {r.student_name || '—'}
                            </td>
                            <td className="px-4 py-2 text-gray-600">
                              {r.student_id || '—'}
                            </td>
                            <td className="px-4 py-2">
                              {r.attendance_status || '—'}
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                )}
              </>
            )}
          </div>
        </div>
      )}
    </>
  );
}
