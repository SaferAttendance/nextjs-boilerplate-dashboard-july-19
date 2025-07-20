/* app/page.tsx */
"use client";

import { useEffect, useState } from "react";
import Head from "next/head";

/* ─────────────────────────────── */
/* Helpers                                                              */
/* ─────────────────────────────── */
function nowPretty() {
  return new Date().toLocaleDateString("en-US", {
    weekday: "long",
    year: "numeric",
    month: "long",
    day: "numeric",
  });
}

const noop = (msg: string) => () => alert(msg);

/* ─────────────────────────────── */
/* Main page                                                            */
/* ─────────────────────────────── */
export default function AdminDashboard() {
  const [today, setToday] = useState(nowPretty());

  /* update date every minute */
  useEffect(() => {
    const id = setInterval(() => setToday(nowPretty()), 60_000);
    return () => clearInterval(id);
  }, []);

  /* modal state (simple) */
  const [modal, setModal] = useState<{ title: string; msg: string } | null>(
    null
  );
  const show = (title: string, msg: string) => setModal({ title, msg });

  return (
    <>
      <Head>
        <title>EduAdmin Dashboard</title>

        {/* Inter font */}
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
        {/* Font-Awesome (icons) */}
        <link
          href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0/css/all.min.css"
          rel="stylesheet"
        />
      </Head>

      {/* Body gradient */}
      <div className="bg-gradient-to-br from-indigo-50 via-white to-purple-50 min-h-screen font-inter">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-100">
          <div className="max-w-7xl mx-auto px-6 py-4 flex items-center justify-between">
            {/* brand */}
            <div className="flex items-center space-x-3">
              <div className="w-10 h-10 bg-gradient-to-r from-indigo-600 to-purple-600 rounded-lg flex items-center justify-center">
                <i className="fas fa-graduation-cap text-white text-lg" />
              </div>
              <div>
                <h1 className="text-xl font-semibold text-gray-900">EduAdmin</h1>
                <p className="text-sm text-gray-500">School Management System</p>
              </div>
            </div>

            {/* user + date */}
            <div className="flex items-center space-x-4">
              <div className="text-right">
                <p className="text-sm font-medium text-gray-900">
                  Welcome back, Admin
                </p>
                <p className="text-xs text-gray-500">{today}</p>
              </div>
              <div className="w-10 h-10 bg-gradient-to-r from-purple-500 to-pink-500 rounded-full flex items-center justify-center">
                <i className="fas fa-user text-white" />
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-6 py-8">
          {/* hero */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">
              Dashboard Overview
            </h2>
            <p className="text-gray-600">
              Manage your school operations efficiently with quick access to key
              functions
            </p>
          </section>

          {/* quick stats */}
          <section className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
            {[
              {
                label: "Total Students",
                value: "1,247",
                icon: "fa-user-graduate",
                color: "blue",
              },
              {
                label: "Active Teachers",
                value: "89",
                icon: "fa-chalkboard-teacher",
                color: "green",
              },
              {
                label: "Total Classes",
                value: "42",
                icon: "fa-door-open",
                color: "purple",
              },
              {
                label: "Today's Attendance",
                value: "94.2%",
                icon: "fa-chart-line",
                color: "orange",
              },
            ].map(({ label, value, icon, color }) => (
              <div
                key={label}
                className="bg-white rounded-xl shadow-sm border border-gray-100 p-6 hover:shadow-md transition-shadow"
              >
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-gray-600">{label}</p>
                    <p className="text-2xl font-bold text-gray-900">{value}</p>
                  </div>
                  <div
                    className={`w-12 h-12 bg-${color}-100 rounded-lg flex items-center justify-center`}
                  >
                    <i className={`fas ${icon} text-${color}-600 text-xl`} />
                  </div>
                </div>
              </div>
            ))}
          </section>

          {/* quick actions */}
          <section className="bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Quick Actions
            </h3>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[
                {
                  title: "Search Teachers",
                  desc:
                    "Find and manage teacher profiles, schedules, and assignments",
                  colorFrom: "blue-500",
                  colorTo: "blue-600",
                  fn: () =>
                    show("Search Teachers", "Opening teacher search interface…"),
                  icon: "fa-search",
                },
                {
                  title: "Search Classes",
                  desc:
                    "Browse class schedules, room assignments, and capacity",
                  colorFrom: "green-500",
                  colorTo: "green-600",
                  fn: () =>
                    show("Search Classes", "Loading class management system…"),
                  icon: "fa-door-open",
                },
                {
                  title: "Search Students",
                  desc:
                    "Access student records, enrollment, and academic progress",
                  colorFrom: "purple-500",
                  colorTo: "purple-600",
                  fn: () =>
                    show("Search Students", "Accessing student database…"),
                  icon: "fa-user-graduate",
                },
                {
                  title: "Manage Substitute Assignments",
                  desc:
                    "Assign substitute teachers and manage coverage schedules",
                  colorFrom: "orange-500",
                  colorTo: "orange-600",
                  fn: () =>
                    show(
                      "Manage Substitutes",
                      "Opening substitute assignment panel…"
                    ),
                  icon: "fa-user-friends",
                },
                {
                  title: "Download Today's Attendance",
                  desc:
                    "Export daily attendance reports in CSV or PDF format",
                  colorFrom: "indigo-500",
                  colorTo: "indigo-600",
                  fn: () =>
                    show(
                      "Download Attendance",
                      "Generating today’s attendance report…"
                    ),
                  icon: "fa-download",
                },
                {
                  title: "View Reports",
                  desc:
                    "Access comprehensive analytics and performance reports",
                  colorFrom: "pink-500",
                  colorTo: "pink-600",
                  fn: () => show("View Reports", "Loading analytics dashboard…"),
                  icon: "fa-chart-bar",
                },
              ].map(
                ({
                  title,
                  desc,
                  colorFrom,
                  colorTo,
                  fn,
                  icon,
                }: {
                  title: string;
                  desc: string;
                  colorFrom: string;
                  colorTo: string;
                  fn: () => void;
                  icon: string;
                }) => (
                  <button
                    key={title}
                    onClick={fn}
                    className={`group bg-gradient-to-r from-${colorFrom} to-${colorTo}
                               hover:from-${colorTo} hover:to-${colorTo.replace(
                      "500",
                      "700"
                    )}
                               text-white rounded-xl p-6 text-left transition-all duration-200
                               transform hover:scale-105 hover:shadow-lg`}
                  >
                    <div className="flex items-center justify-between mb-4">
                      <div className="w-12 h-12 bg-white bg-opacity-20 rounded-lg flex items-center justify-center">
                        <i className={`fas ${icon} text-white text-xl`} />
                      </div>
                      <i className="fas fa-arrow-right text-white opacity-0 group-hover:opacity-100 transition-opacity" />
                    </div>
                    <h4 className="text-lg font-semibold mb-2">{title}</h4>
                    <p className="text-sm opacity-90">{desc}</p>
                  </button>
                )
              )}
            </div>
          </section>

          {/* recent activity */}
          <section className="mt-8 bg-white rounded-2xl shadow-sm border border-gray-100 p-8">
            <h3 className="text-xl font-semibold text-gray-900 mb-6">
              Recent Activity
            </h3>
            {[
              {
                icon: "fa-user-plus",
                color: "blue",
                text: "New student enrolled: Sarah Johnson",
                time: "2 hours ago",
              },
              {
                icon: "fa-calendar-check",
                color: "green",
                text: "Substitute assigned for Math Class 3B",
                time: "4 hours ago",
              },
              {
                icon: "fa-file-download",
                color: "purple",
                text: "Monthly attendance report generated",
                time: "1 day ago",
              },
            ].map(({ icon, color, text, time }) => (
              <div
                key={text}
                className="flex items-center space-x-4 p-4 bg-gray-50 rounded-lg mb-4 last:mb-0"
              >
                <div
                  className={`w-10 h-10 bg-${color}-100 rounded-full flex items-center justify-center`}
                >
                  <i className={`fas ${icon} text-${color}-600`} />
                </div>
                <div className="flex-1">
                  <p className="text-sm font-medium text-gray-900">{text}</p>
                  <p className="text-xs text-gray-500">{time}</p>
                </div>
              </div>
            ))}
          </section>
        </main>

        {/* simple modal */}
        {modal && (
          <div
            className="fixed inset-0 bg-black/50 flex items-center justify-center z-50"
            onClick={() => setModal(null)}
          >
            <div
              className="bg-white rounded-2xl p-8 max-w-md mx-4 transition"
              onClick={(e) => e.stopPropagation()}
            >
              <div className="text-center">
                <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mx-auto mb-4">
                  <i className="fas fa-check text-green-600 text-2xl" />
                </div>
                <h3 className="text-xl font-semibold text-gray-900 mb-2">
                  {modal.title}
                </h3>
                <p className="text-gray-600 mb-6">{modal.msg}</p>
                <button
                  onClick={() => setModal(null)}
                  className="bg-gradient-to-r from-indigo-500 to-indigo-600 hover:from-indigo-600 hover:to-indigo-700 text-white px-6 py-3 rounded-lg font-medium"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
}
