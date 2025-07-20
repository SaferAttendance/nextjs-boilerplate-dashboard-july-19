/* app/page.tsx */
"use client";

import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";

/* ─────────────────────────────── */
/* Shared Card component           */
/* ─────────────────────────────── */
interface CardProps {
  title: string;
  desc: string;
  href: string;
  color: string;
}
const Card: React.FC<CardProps> = ({ title, desc, href, color }) => (
  <div
    className={`
      bg-white/80 backdrop-blur-xl border border-white/40
      dark:bg-gray-900/60 dark:border-white/10
      rounded-2xl p-8 flex flex-col shadow transition
      hover:-translate-y-1 hover:shadow-2xl
    `}
  >
    <h3 className="text-xl font-semibold mb-2 tracking-tight text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 flex-1 mb-6">{desc}</p>

    <Link
      href={href}
      className={`inline-flex justify-center items-center h-11 px-6 rounded-lg font-medium text-white ${color} hover:brightness-110 transition-colors`}
    >
      Open
    </Link>
  </div>
);

/* ─────────────────────────────── */
/* Main Dashboard component        */
/* ─────────────────────────────── */
export default function Dashboard() {
  const [date, setDate] = useState<string>("");

  useEffect(() => {
    const update = () => {
      const now = new Date();
      setDate(
        now.toLocaleDateString("en-US", {
          weekday: "long",
          year: "numeric",
          month: "long",
          day: "numeric",
        })
      );
    };
    update();
    const id = setInterval(update, 60_000);
    return () => clearInterval(id);
  }, []);

  const alertStub = (msg: string) => () => alert(msg);
  const signOut = () => alert("Signing out…");

  return (
    <>
      <Head>
        <title>School Admin Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1" />
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-[Inter]">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                  <span className="text-white font-bold text-sm">SA</span>
                </div>
                <h1 className="ml-4 text-xl font-semibold text-gray-900">
                  School&nbsp;Admin
                </h1>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{date}</span>
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-10">
          {/* Welcome */}
          <section className="mb-10">
            <h2 className="text-3xl font-extrabold text-gray-900 mb-2 tracking-tight">
              Welcome to Admin Dashboard
            </h2>
            <p className="text-gray-600">
              Manage your school's classes, teachers, students, and attendance efficiently.
            </p>
          </section>

          {/* Grid */}
          <section className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card
              title="Search Classes"
              desc="Find and manage class schedules, rooms, and course details."
              href="/classes"
              color="bg-indigo-600"
            />
            <Card
              title="Search Teachers"
              desc="Access teacher profiles, contact info, and assignments."
              href="/teachers"
              color="bg-green-600"
            />
            <Card
              title="Search Students"
              desc="Look up student records, enrollment, and academic info."
              href="/students"
              color="bg-purple-600"
            />
            <Card
              title="Substitute Assignments"
              desc="Manage substitute teacher coverage schedules."
              href="/sub-assignments"
              color="bg-orange-600"
            />
            <Card
              title="Today's Attendance"
              desc="Download today's attendance CSV for reporting."
              href="#"
              color="bg-teal-600"
            />

            {/* Quick Stats */}
            <div className="bg-white/80 backdrop-blur-xl border border-white/40 dark:bg-gray-900/60 dark:border-white/10 rounded-2xl p-8 shadow">
              <h3 className="text-xl font-semibold mb-4 tracking-tight text-gray-900 dark:text-white">
                Quick Stats
              </h3>
              <ul className="space-y-2 text-gray-700 dark:text-gray-300">
                <li className="flex justify-between">
                  <span>Total Students:</span>
                  <span className="font-semibold">1,247</span>
                </li>
                <li className="flex justify-between">
                  <span>Active Teachers:</span>
                  <span className="font-semibold">89</span>
                </li>
                <li className="flex justify-between">
                  <span>Classes Today:</span>
                  <span className="font-semibold">156</span>
                </li>
                <li className="flex justify-between">
                  <span>Attendance Rate:</span>
                  <span className="font-semibold text-green-600">94.2%</span>
                </li>
              </ul>
            </div>
          </section>
        </main>
      </div>
    </>
  );
}
