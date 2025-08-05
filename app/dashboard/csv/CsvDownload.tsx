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
