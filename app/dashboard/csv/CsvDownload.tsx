'use client';

import React, { useState } from 'react';

export default function CsvDownload() {
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  async function handleDownload() {
    setLoading(true);
    setError(null);

    try {
      const res = await fetch('/api/xano/csv', {
        method: 'GET',
        cache: 'no-store',
      });

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
// CsvInfoAlert.tsx
//
// Drop this component anywhere in your CSV download page (e.g. just above
// the <DownloadButton />). It explains exactly what the admin will see in
// the export.

export default function CsvInfoAlert() {
  return (
    <section className="mb-8 rounded-xl border border-blue-100 bg-blue-50/60 p-6 text-sm leading-relaxed text-gray-800 shadow-sm">
      <h2 className="mb-3 text-lg font-semibold text-blue-900">
        What’s in this report?
      </h2>

      <p className="mb-4">
        <strong>You’re about to open an attendance export for the selected
        school.</strong>
      </p>

      <ul className="mb-6 list-disc space-y-1 pl-5">
        <li>
          Students appear <strong>in ascending order of&nbsp;Student&nbsp;ID</strong> (smallest → largest).
        </li>
        <li>
          Each student’s classes are <strong>grouped together</strong> and
          <strong>&nbsp;sorted&nbsp;by&nbsp;class&nbsp;period</strong> (Period&nbsp;1,&nbsp;Period&nbsp;2, …).
        </li>
        <li>
          Every row contains the full raw data returned by&nbsp;Xano:
        </li>
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
              ['class_name / class_id / period', 'Class details and scheduled period'],
              ['attendance_status', 'Present / Absent / Pending'],
              ['teacher_name / teacher_email', 'Instructor for the class'],
              ['school_code / district_code', 'Location identifiers (match your login)'],
              ['admin_email / parent_email', 'Admin who exported and parent on file'],
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

      <p className="mt-4">
        Feel free to filter, sort, or pivot the file once you download it—
        no formulas are embedded; it’s a clean&nbsp;CSV&nbsp;export.
      </p>
    </section>
  );
}

  return (
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
  );
}
