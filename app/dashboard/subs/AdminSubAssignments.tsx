'use client';

import React, { useEffect, useMemo, useState } from 'react';

/* ---------- Types (match minimally; pass-through friendly) ---------- */
type SubAssignment = {
  id?: number | string;
  class_id?: string | number;
  class_name?: string;
  period?: number | string;
  // Xano says "shows the ORIGINAL teacher"
  teacher_email?: string;                 // original teacher (most likely this key)
  original_teacher_email?: string;        // fallback if Xano uses this key name
  sub_email?: string;
  district_code?: string;
  school_code?: string;
};

function getOriginalTeacherEmail(r: SubAssignment) {
  return r.teacher_email || r.original_teacher_email || '';
}

/* ---------- UI helpers ---------- */
const cardGradients = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

/* ---------- Component ---------- */
export default function AdminSubAssignments() {
  const [loading, setLoading] = useState(false);
  const [rows, setRows] = useState<SubAssignment[] | null>(null);
  const [error, setError] = useState<string | null>(null);

  const [selected, setSelected] = useState<SubAssignment | null>(null);
  const [acting, setActing] = useState(false);
  const [actError, setActError] = useState<string | null>(null);
  const [actSuccess, setActSuccess] = useState<string | null>(null);
  const [confirmText, setConfirmText] = useState('');

  const total = rows?.length ?? 0;

  const canSubmit = useMemo(
    () => confirmText.trim().toUpperCase() === 'REMOVE',
    [confirmText]
  );

  async function fetchList() {
    setLoading(true);
    setError(null);
    setRows(null);
    try {
      const r = await fetch('/api/xano/admin-subs', { method: 'GET', cache: 'no-store' });
      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `Failed (${r.status})`);

      // Accept either array or {records: []}
      const list: SubAssignment[] = Array.isArray(data) ? data : data?.records ?? [];
      setRows(list);
    } catch (e: any) {
      setError(e?.message || 'Failed to load classes with substitutes');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchList();
  }, []);

  async function handleUnrestrict() {
    if (!selected) return;
    setActing(true);
    setActError(null);
    setActSuccess(null);

    try {
      const payload = {
        teacher_email: getOriginalTeacherEmail(selected),
        sub_email: selected.sub_email || '',
        class_id: selected.class_id ?? '',
        class_name: selected.class_name ?? '',
      };

      const r = await fetch('/api/xano/admin-subs', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        cache: 'no-store',
        body: JSON.stringify(payload),
      });

      const data = await r.json();
      if (!r.ok) throw new Error(data?.error || `Failed (${r.status})`);

      setActSuccess('Sub removed & original teacher access unrestricted.');
      // Optimistically remove this class from the list
      setRows((prev) =>
        (prev || []).filter(
          (x) => String(x.class_id ?? x.id) !== String(selected.class_id ?? selected.id)
        )
      );
      setSelected(null);
      setConfirmText('');
    } catch (e: any) {
      setActError(e?.message || 'Action failed');
    } finally {
      setActing(false);
    }
  }

  return (
    <>
      {/* Heading */}
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-bold text-gray-800">Substitute Assignments</h2>
          <p className="text-gray-600">View classes with substitutes and restore original teacher access.</p>
        </div>

        <div className="flex items-center gap-3">
          <div className="bg-white/90 backdrop-blur-sm rounded-lg px-3 py-1.5 shadow-sm border border-white/20 text-sm">
            Total: <span className="font-semibold text-brand-dark">{total}</span>
          </div>
          <button
            onClick={fetchList}
            className="inline-flex items-center gap-2 rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark text-white px-4 py-2 shadow-lg hover:shadow-xl"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M4 4v6h6M20 20v-6h-6M20 4l-7 7M4 20l7-7"/>
            </svg>
            Refresh
          </button>
        </div>
      </div>

      {/* Loading / Error / Empty */}
      {loading && (
        <div className="text-center py-16">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4" />
          <p className="text-gray-600">Loading classes…</p>
        </div>
      )}

      {error && !loading && (
        <div className="text-center py-6">
          <p className="text-sm text-red-600" role="alert">{error}</p>
        </div>
      )}

      {!loading && !error && rows && rows.length === 0 && (
        <div className="text-center py-12 text-gray-600">No classes currently have substitutes.</div>
      )}

      {/* Grid */}
      {!loading && !error && rows && rows.length > 0 && (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {rows.map((r, i) => {
            const originalTeacher = getOriginalTeacherEmail(r);
            return (
              <button
                key={`${r.class_id ?? r.id ?? i}`}
                onClick={() => setSelected(r)}
                className="text-left bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300"
              >
                <div className="flex items-start justify-between mb-4">
                  <div className={`w-12 h-12 bg-gradient-to-r ${cardGradients[i % cardGradients.length]} rounded-xl flex items-center justify-center shadow-lg`}>
                    <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
                    </svg>
                  </div>
                </div>

                <h4 className="text-xl font-bold text-gray-800 mb-1">{r.class_name || 'Class'}</h4>
                <p className="text-gray-600 mb-4">{r.class_id || '—'}</p>

                <div className="space-y-2 text-sm text-gray-600">
                  {r.period != null && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <span>Period {r.period}</span>
                    </div>
                  )}
                  {!!originalTeacher && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.003 5.884L12 10.882l9.997-4A2 2 0 0019 4H5a2 2 0 00-1.997 1.884z M22 8.118l-10 5-10-5V16a2 2 0 002 2h16a2 2 0 002-2V8.118z" />
                      </svg>
                      <span>Original: {originalTeacher}</span>
                    </div>
                  )}
                  {!!r.sub_email && (
                    <div className="flex items-center gap-2">
                      <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5.121 17.804A13.937 13.937 0 0112 15c2.5 0 4.847.655 6.879 1.804M15 10a3 3 0 11-6 0 3 3 0 016 0z"/>
                      </svg>
                      <span>Sub: {r.sub_email}</span>
                    </div>
                  )}
                </div>
              </button>
            );
          })}
        </div>
      )}

      {/* Success toast */}
      {actSuccess && (
        <div className="fixed bottom-6 right-6 bg-green-600 text-white px-4 py-2 rounded-lg shadow-lg">
          {actSuccess}
        </div>
      )}

      {/* Modal */}
      {selected && (
        <div
          className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4"
          onClick={() => { if (!acting) setSelected(null); }}
        >
          <div
            className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full overflow-hidden"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b">
              <div className="flex items-center justify-between">
                <h3 className="text-2xl font-bold text-gray-800">
                  {selected.class_name || 'Class'}
                </h3>
                <button
                  onClick={() => { if (!acting) setSelected(null); }}
                  className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200"
                >
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <p className="text-gray-600 mt-1">{selected.class_id || '—'}</p>
            </div>

            <div className="p-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
              <Info label="Original Teacher" value={getOriginalTeacherEmail(selected) || '—'} />
              <Info label="Substitute" value={selected.sub_email || '—'} />
              <Info label="School" value={selected.school_code || '—'} />
              <Info label="District" value={selected.district_code || '—'} />
              <Info label="Period" value={selected.period != null ? String(selected.period) : '—'} />
            </div>

            {actError && (
              <div className="px-6 pb-2 text-sm text-red-600" role="alert">
                {actError}
              </div>
            )}

            <div className="px-6 pb-6">
              <div className="bg-red-50 border border-red-200 rounded-xl p-4">
                <p className="text-sm text-red-700 mb-3">
                  Type <b>REMOVE</b> to confirm removing the substitute and restoring the original teacher’s access.
                </p>
                <input
                  value={confirmText}
                  onChange={(e) => setConfirmText(e.target.value)}
                  className="w-full rounded-lg border px-3 py-2"
                  placeholder="REMOVE"
                  disabled={acting}
                />
                <div className="mt-4 flex items-center justify-end gap-3">
                  <button
                    className="px-4 py-2 rounded-lg border hover:bg-gray-50"
                    onClick={() => setSelected(null)}
                    disabled={acting}
                  >
                    Back
                  </button>
                  <button
                    onClick={handleUnrestrict}
                    disabled={!canSubmit || acting}
                    className={`px-4 py-2 rounded-lg text-white shadow ${canSubmit && !acting
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-300 cursor-not-allowed'}`}
                  >
                    {acting ? 'Working…' : 'Remove substitute & unrestrict'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="bg-gray-50 rounded-lg p-4">
      <p className="text-sm text-gray-600 mb-1">{label}</p>
      <p className="font-semibold text-gray-800 break-words">{value || '—'}</p>
    </div>
  );
}
