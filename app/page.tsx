import React, { useEffect, useState } from "react";
import Head from "next/head";
import Link from "next/link";
import { motion } from "framer-motion";

/*************************
 * Shared Card Component *
 *************************/
interface CardProps {
  title: string;
  desc: string;
  href: string;
  delay?: number;
}
const Card: React.FC<CardProps> = ({ title, desc, href, delay = 0 }) => (
  <motion.div
    initial={{ opacity: 0, y: 24 }}
    animate={{ opacity: 1, y: 0 }}
    transition={{ delay, type: "spring", stiffness: 120 }}
    whileHover={{ y: -4, boxShadow: "0 12px 28px rgba(0,0,0,.12)" }}
    className="bg-white/80 backdrop-blur-xl border border-white/40 dark:bg-gray-900/50 dark:border-white/10 rounded-2xl p-8 flex flex-col"
  >
    <h3 className="text-xl font-semibold mb-2 tracking-tight text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 flex-1 mb-6">{desc}</p>
    <Link
      href={href}
      className="inline-flex justify-center items-center h-11 px-6 rounded-lg bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
    >
      Open
    </Link>
  </motion.div>
);

/*********************
 * Main Page Component
 *********************/
"use client";
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

  const signOut = () => alert("Signing out…");

  return (
    <>
      <Head>
        <title>School Admin Dashboard</title>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;600;700;900&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen w-full bg-gradient-to-br from-slate-50 to-slate-200 dark:from-gray-900 dark:to-gray-800 text-gray-900 dark:text-gray-100 font-[Inter]">
        {/* Top Nav */}
        <header className="sticky top-0 z-30 w-full backdrop-blur-md bg-white/70 dark:bg-gray-900/60 border-b border-white/40 dark:border-white/10">
          <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-3">
              <div className="w-8 h-8 bg-primary-500 rounded-md text-white flex items-center justify-center font-bold text-sm">
                SA
              </div>
              <span className="text-xl font-extrabold tracking-tight">School Admin</span>
            </div>
            <div className="flex items-center space-x-6 text-sm">
              <span className="text-gray-600 dark:text-gray-400 hidden sm:inline">{date}</span>
              <button
                onClick={signOut}
                className="px-4 py-2 rounded-md bg-red-600 text-white font-medium hover:bg-red-500 transition"
              >
                Sign Out
              </button>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-7xl mx-auto px-6 pt-24 pb-12 text-center">
          <motion.h2
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.6 }}
            className="text-5xl font-black mb-4 tracking-tight"
          >
            Admin Dashboard
          </motion.h2>
          <p className="max-w-2xl mx-auto text-lg text-gray-600 dark:text-gray-300">
            Control classes, teachers, students & attendance—instantly.
          </p>
        </section>

        {/* Action Grid */}
        <section className="max-w-7xl mx-auto px-6 pb-24">
          <div className="grid gap-10 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4">
            <Card title="Search Classes" desc="Manage schedules & rooms." href="/classes" delay={0.1} />
            <Card title="Search Teachers" desc="Profiles & assignments." href="/teachers" delay={0.2} />
            <Card title="Search Students" desc="Records & enrollment." href="/students" delay={0.3} />
            <Card title="Substitute Assignments" desc="Approve or revoke subs." href="/subs" delay={0.4} />
            <Card title="Download Attendance" desc="Daily CSV export." href="/attendance" delay={0.5} />
          </div>
        </section>

        {/* Footer */}
        <footer className="py-6 text-center text-sm text-gray-500 dark:text-gray-600 border-t border-white/40 dark:border-white/10">
          © {new Date().getFullYear()} School Admin • Modern UI
        </footer>
      </div>
    </>
  );
}
