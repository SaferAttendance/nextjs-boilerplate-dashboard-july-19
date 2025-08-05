'use client';

import React, { useState, useEffect } from 'react';

/* ------------------------------------------------------------------ */
/*  Helper: quick toast                                                */
/* ------------------------------------------------------------------ */
function Toast({ text, type = 'success' }: { text: string; type?: 'success' | 'error' }) {
  const [show, setShow] = useState(true);
  useEffect(() => {
    const id = setTimeout(() => setShow(false), 5000);
    return () => clearTimeout(id);
  }, []);
  if (!show) return null;

  const colors =
    type === 'success'
      ? 'bg-safety-green text-white'
      : 'bg-safety-red text-white';

  const icon =
    type === 'success' ? (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
      </svg>
    ) : (
      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
      </svg>
    );

  return (
    <div className={`fixed top-4 right-4 z-50 flex items-center gap-3 rounded-xl px-4 py-3 shadow-lg ${colors}`}>
      {icon}
      <span className="text-sm font-medium">{text}</span>
      <button onClick={() => setShow(false)}>
        <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
        </svg>
      </button>
    </div>
  );
}

/* ------------------------------------------------------------------ */
/*  Main component                                                     */
/* ------------------------------------------------------------------ */
export default function CsvDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [toast, setToast] = useState<{ text: string; type: 'success' | 'error' } | null>(null);
  const [showDetails, setShowDetails] = useState(false);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/xano/csv', { method: 'GET', cache: 'no-store' });

      if (!res.ok) {
        const msg = await res.text();
        throw new Error(msg || `Download failed (${res.status})`);
      }

      const blob = await res.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement('a');
      a.href = url;
      a.download = 'attendance.csv';
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);

      setToast({ text: 'CSV downloaded successfully!', type: 'success' });
    } catch (e: any) {
      setError(e?.message || 'Download failed');
      setToast({ text: 'Download failed, please try again.', type: 'error' });
    } finally {
      setLoading(false);
    }
  }

  /* ------------------------------ UI ------------------------------ */

  return (
    <>
      {toast && <Toast text={toast.text} type={toast.type} />}

      {/* Header inside the page content (your outer page/header stays untouched) */}
      <header className="mb-10 flex items-center gap-4">
        <div className="w-12 h-12 rounded-xl bg-brand-blue/10 flex items-center justify-center">
          <svg className="w-6 h-6 text-brand-blue" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
          </svg>
        </div>
        <div>
          <h1 className="text-3xl font-bold text-neutral-900">Export Attendance Data</h1>
          <p className="text-neutral-600">Download comprehensive attendance records in CSV format</p>
        </div>
      </header>

      {/* Info card --------------------------------------------------- */}
      <section className="mb-12 rounded-2xl border border-neutral-200 bg-white shadow-sm overflow-hidden">
        <div className="bg-gradient-to-r from-brand-blue/5 to-brand-blue/10 px-6 py-5 border-b border-neutral-200 flex items-start justify-between">
          <div>
            <h2 className="text-xl font-semibold text-neutral-900 mb-1">What's included in your export?</h2>
            <p className="text-neutral-600">Complete attendance data with all student &amp; class information</p>
          </div>
          <div className="flex items-center gap-2 text-sm text-neutral-500 bg-white px-3 py-1.5 rounded-full border border-neutral-200">
            <div className="w-2 h-2 bg-safety-green rounded-full animate-ping"></div>
            Live data
          </div>
        </div>

        <div className="p-6">
          {/* Quick overview ---------------------------------------- */}
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-8">
            {[
              ['1 247', 'Total records'],
              ['15', 'Data columns'],
              ['CSV', 'File format'],
            ].map(([num, label]) => (
              <div key={label} className="rounded-xl bg-neutral-50 p-4 text-center">
                <div className="mb-1 text-2xl font-bold text-neutral-900">{num}</div>
                <div className="text-sm text-neutral-600">{label}</div>
              </div>
            ))}
          </div>

          {/* Data organization steps ------------------------------- */}
          <div className="mb-8 space-y-3">
            <h3 className="text-lg font-semibold text-neutral-900 mb-3">How your data is organised</h3>
            {[
              ['1', 'Sorted by Student ID', 'Students appear in ascending order'],
              ['2', 'Grouped by Student', 'Each student’s classes are grouped together'],
              ['3', 'Ordered by Period', 'Classes listed by period (1, 2, 3…)'],
            ].map(([index, title, desc]) => (
              <div key={index} className="flex items-start gap-3 rounded-xl bg-neutral-50 p-4">
                <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-brand-blue/10">
                  <span className="font-mono text-sm font-semibold text-brand-blue">{index}</span>
                </div>
                <div>
                  <div className="font-medium text-neutral-900">{title}</div>
                  <div className="text-sm text-neutral-600">{desc}</div>
                </div>
              </div>
            ))}
          </div>

          {/* Column reference -------------------------------------- */}
          <div className="mb-8">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="text-lg font-semibold text-neutral-900">Column reference</h3>
              <button
                onClick={() => setShowDetails(!showDetails)}
                className="flex items-center gap-1 text-sm font-medium text-brand-blue hover:text-brand-dark"
              >
                {showDetails ? 'Show summary' : 'Show details'}
                <svg
                  className={`w-4 h-4 transition-transform ${showDetails ? 'rotate-180' : ''}`}
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                </svg>
              </button>
            </div>

            {/* Summary view */}
            {!showDetails && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                {[
                  ['Student Info', 'ID, Name'],
                  ['Class Details', 'Name, Period, ID'],
                  ['Attendance', 'Status, Timestamp'],
                  ['Teacher Info', 'Name, Email'],
                  ['Location', 'School, District'],
                  ['Contacts', 'Admin, Parent'],
                ].map(([title, sub]) => (
                  <div key={title} className="rounded-lg bg-neutral-50 p-3 text-center">
                    <div className="font-mono text-sm font-medium text-brand-blue">{title}</div>
                    <div className="mt-1 text-xs text-neutral-600">{sub}</div>
                  </div>
                ))}
              </div>
            )}

            {/* Detailed view */}
            {showDetails && (
              <div className="rounded-xl bg-neutral-50 p-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-neutral-200">
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">Column</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">Description</th>
                      <th className="px-4 py-3 text-left font-semibold text-neutral-900">Example</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-neutral-100">
                    {[
                      ['id', 'Internal record ID', '12847'],
                      ['created_at', 'Creation timestamp', '1705334400000'],
                      ['student_id', 'Unique student identifier', '22227'],
                      ['student_name', 'Full student name', 'Kira Quidort'],
                      ['attendance_status', 'Present / Absent / Pending', 'Present'],
                      ['class_name', 'Name of the class', 'Art'],
                      ['period', 'Class period number', '1'],
                    ].map(([col, desc, ex]) => (
                      <tr key={col} className="hover:bg-white transition-colors">
                        <td className="px-4 py-3 font-mono font-medium text-brand-blue">{col}</td>
                        <td className="px-4 py-3 text-neutral-700">{desc}</td>
                        <td className="px-4 py-3 font-mono text-xs text-neutral-500">{ex}</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>

          {/* Pro-tip banner ---------------------------------------- */}
          <div className="mb-8 rounded-xl border border-safety-green/20 bg-safety-green/10 p-4">
            <div className="flex items-start gap-3">
              <div className="mt-0.5 flex h-6 w-6 flex-shrink-0 items-center justify-center rounded-lg bg-safety-green/20">
                <svg className="w-4 h-4 text-safety-green" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
                </svg>
              </div>
              <p className="text-sm text-neutral-700">
                This CSV contains no embedded formulas—you can freely filter, sort, or pivot the data in Excel, Google
                Sheets, or any other spreadsheet application.
              </p>
            </div>
          </div>

          {/* Download button --------------------------------------- */}
          <div className="flex flex-col items-center gap-2 sm:flex-row sm:justify-between">
            <div className="text-center sm:text-left">
              <p className="text-sm text-neutral-600">Ready to download?</p>
              <p className="text-xs text-neutral-500">File will be saved as &quot;attendance.csv&quot;</p>
            </div>

            <button
              onClick={handleDownload}
              disabled={loading}
              className="inline-flex items-center rounded-xl bg-brand-blue px-6 py-3 font-medium text-white shadow-sm transition-all duration-200 hover:bg-brand-dark disabled:cursor-not-allowed disabled:opacity-60"
            >
              {loading ? (
                <svg className="mr-2 h-5 w-5 animate-spin" fill="none" viewBox="0 0 24 24">
                  <circle
                    className="opacity-25"
                    cx="12"
                    cy="12"
                    r="10"
                    stroke="currentColor"
                    strokeWidth="4"
                  ></circle>
                  <path
                    className="opacity-75"
                    fill="currentColor"
                    d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                  ></path>
                </svg>
              ) : (
                <svg className="mr-2 h-5 w-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              )}
              {loading ? 'Generating…' : 'Download CSV'}
            </button>
          </div>

          {error && (
            <p className="mt-4 text-center text-sm text-red-600" role="alert">
              {error}
            </p>
          )}
        </div>
      </section>
    </>
  );
}
