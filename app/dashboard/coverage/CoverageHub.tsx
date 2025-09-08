// app/dashboard/coverage/CoverageHub.tsx
'use client';

import React from 'react';

type Role = 'admin' | 'teacher' | 'parent' | 'sub';

export default function CoverageHub({ role, fullName }: { role: Role; fullName: string }) {
  if (role === 'admin') return <AdminCoverageView />;
  if (role === 'teacher') return <TeacherCoverageView fullName={fullName} />;
  if (role === 'sub') return <SubCoverageView />;
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <p className="text-gray-700">Coverage Hub is not available for this role.</p>
    </div>
  );
}

/** ---------- ADMIN VIEW ---------- */
function AdminCoverageView() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Admin Coverage Manager</h3>
      <p className="text-gray-600 mb-4">
        Urgent board, department rotation, daily schedule, history & payroll exports.
      </p>

      {/* TODO: Mount your full admin prototype here
          - Urgent openings board (<=2h)
          - Department rotation grid & fairness
          - Create/mark-absent/batch-assign modals
          - Coverage history & payroll tracker
      */}
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        Placeholder — paste your Admin prototype here.
      </div>
    </div>
  );
}

/** ---------- TEACHER VIEW ---------- */
function TeacherCoverageView({ fullName }: { fullName: string }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Hi {fullName.split(' ')[0]},</h3>
      <p className="text-gray-600 mb-4">
        Request time off, upload lesson plans, and respond to coverage alerts.
      </p>

      {/* TODO: Mount your Teacher prototype:
          - Urgent coverage alert panel
          - Time-off request form (multi-day)
          - My requests & coverage log
          - Earnings tracker
      */}
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        Placeholder — paste your Teacher prototype here.
      </div>
    </div>
  );
}

/** ---------- SUB VIEW ---------- */
function SubCoverageView() {
  return (
    <div className="rounded-xl border border-gray-200 bg-white p-6">
      <h3 className="text-xl font-semibold text-gray-900 mb-2">Available Coverage Jobs</h3>
      <p className="text-gray-600 mb-4">
        Browse and accept jobs; track earnings and assignments.
      </p>

      {/* TODO: Mount your Sub prototype:
          - Urgent jobs panel
          - Jobs grid with filters (today/week/all)
          - Earnings tracker & calendar
      */}
      <div className="rounded-lg border border-dashed border-gray-300 p-6 text-sm text-gray-500">
        Placeholder — paste your Sub prototype here.
      </div>
    </div>
  );
}
