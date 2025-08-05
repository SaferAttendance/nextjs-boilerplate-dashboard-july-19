'use client';

import React, { useState } from 'react';

/* ------------------------------------------------------------------ */
/*  Small helper component that shows the “What’s in this report?”    */
/*  explanation.  We keep it in-file so you can paste this whole file  */
/*  directly over the existing one.                                    */
/* ------------------------------------------------------------------ */
function CsvInfoPanel() {
  return (
    <section className="mb-12 rounded-xl border border-blue-100 bg-blue-50/60 p-6 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-blue-900">
        What’s in this report?
      </h2>

      <p className="mb-4">
        <strong>You’re about to download the daily attendance export.</strong>
      </p>

      <ul className="mb-6 list-disc space-y-1 pl-5 text-gray-800">
        <li>
          Students appear <strong>in ascending order of Student&nbsp;ID</strong> (smallest&nbsp;→ largest).
        </li>
        <li>
          Each student’s classes are <strong>grouped together</strong> and&nbsp;
          <strong>sorted&nbsp;by&nbsp;class&nbsp;period</strong> (1, 2, 3…).
        </li>
        <li>Every row contains the raw columns returned by&nbsp;Xano:</li>
      </ul>

      <div className="overflow-auto rounded-lg border border-gray-200">
        <table className="min-w-[640px] divide-y divide-gray-200 text-left text-xs">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-3 py-2 font-medium text-gray-600">Column</th>
              <th className="px-3 py-2 font-medium text-gray-600">Description</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100 bg-white">
            {[
              ['id', 'Internal record ID for this attendance entry'],
              ['created_at', 'Timestamp the record was created (Unix ms)'],
              ['student_id / student_name', 'Unique ID and name of the student'],
              ['class_name / class_id / period', 'Class details & scheduled period'],
              ['attendance_status', 'Present / Absent / Pending'],
              ['teacher_name / teacher_email', 'Instructor for the class'],
              ['school_code / district_code', 'Location identifiers (match admin scope)'],
              ['admin_email / parent_email', 'Admin who exported & parent on file'],
              [
                'teacher_expiration / current_sub_email / sub_claimed_class_expiration',
                'Fields used for substitute-teacher tracking',
              ],
            ].map(([col, desc]) => (
              <tr key={col as string}>
                <td className="whitespace-nowrap px-3 py-2 font-medium text-gray-800">
                  {col}
                </td>
                <td className="px-3 py-2 text-gray-600">{desc}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      <p className="mt-4 text-gray-700">
        Feel free to filter, sort, or pivot the file once you download it—it's a clean&nbsp;CSV export.
      </p>
    </section>
  );
}

/* ------------------------------------------------------------------ */
/*  Main download component                                            */
/* ------------------------------------------------------------------ */
export default function CsvDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

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
    } catch (e: any) {
      setError(e?.message || 'Download failed');
    } finally {
      setLoading(false);
    }
  }

  return (
    <>
      {/* Info / reference panel */}
      <CsvInfoPanel />

      {/* Download button + error */}
      <div className="text-center">
        <button
          onClick={handleDownload}
          disabled={loading}
          className="bg-gradient-to-r from-brand-blue to-brand-dark text-white px-8 py-4 rounded-xl shadow-lg hover:shadow-xl hover:from-brand-dark hover:to-brand-blue disabled:opacity-60 disabled:cursor-not-allowed transition-all duration-200 font-semibold"
        >
          {loading ? 'Generating CSV…' : 'Download Attendance CSV'}
        </button>

        {error && (
          <p className="mt-4 text-sm text-red-600" role="alert">
            {error}
          </p>
        )}
      </div>
    </>
  );
}
