import React, { useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';
import { motion } from 'framer-motion';

/**
 * xAI‑grade Admin Dashboard
 * --------------------------------------------------
 * • Desktop‑first 100% width layout
 * • Dark‑mode toggle (Musk‑approved)
 * • Framer‑motion hover & entrance animations
 * • Glassmorphism + vibrant space‑grade gradients
 * • Tailwind v3 (JIT)
 * • Montserrat font stack
 */

// Dashboard Action Card
interface ActionCardProps {
  icon: string;
  title: string;
  desc: string;
  href: string;
  delay: number;
}

const ActionCard: React.FC<ActionCardProps> = ({ icon, title, desc, href, delay }) => (
  <Link href={href}>
    <motion.a
      initial={{ y: 40, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      transition={{ delay, type: 'spring', stiffness: 120 }}
      whileHover={{ scale: 1.05 }}
      className="
        flex flex-col justify-between h-full
        bg-white/70 dark:bg-white/10 backdrop-blur-xl
        border border-white/30 dark:border-white/20
        rounded-2xl p-6 shadow-xl
        transition-colors duration-300
      "
    >
      <div className="flex items-center space-x-4 mb-4">
        <span className="text-4xl">{icon}</span>
        <h3 className="text-xl font-bold">{title}</h3>
      </div>
      <p className="text-gray-600 dark:text-gray-400 flex-1">{desc}</p>
      <div className="mt-6 text-blue-600 dark:text-blue-400 font-semibold">Go →</div>
    </motion.a>
  </Link>
);

export default function Home() {
  const [dark, setDark] = useState(false);

  return (
    <div className={dark ? 'dark' : ''}>
      <Head>
        <link rel="preconnect" href="https://fonts.googleapis.com" />
        <link rel="preconnect" href="https://fonts.gstatic.com" crossOrigin="" />
        <link href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;500;800&display=swap" rel="stylesheet" />
        <title>xAI Admin Dashboard</title>
      </Head>

      {/* Background gradient */}
      <div className="
        min-h-screen w-full
        bg-gradient-to-tr from-slate-100 via-slate-50 to-white
        dark:from-gray-900 dark:via-gray-800 dark:to-gray-900
        text-gray-900 dark:text-gray-100
        font-[Montserrat]
        transition-colors duration-500
      ">
        {/* Top bar */}
        <header className="
          w-full sticky top-0 z-30
          bg-white/60 dark:bg-gray-900/50 backdrop-blur-lg
          border-b border-white/30 dark:border-white/10
        ">
          <div className="max-w-screen-2xl mx-auto flex items-center justify-between py-4 px-8">
            <div className="flex items-center space-x-3">
              <span className="text-3xl">🚀</span>
              <h1 className="text-2xl font-extrabold tracking-tight">xAI Admin</h1>
            </div>
            <div className="flex items-center space-x-4">
              <button
                onClick={() => setDark(!dark)}
                aria-label="Toggle dark mode"
                className="p-2 rounded-lg bg-white/40 dark:bg-gray-700/40 hover:bg-white/70 dark:hover:bg-gray-700 transition"
              >
                {dark ? '🌞' : '🌙'}
              </button>
              <Link href="/logout">
                <a className="px-4 py-2 rounded-lg bg-red-600 text-white font-semibold hover:bg-red-500 transition">Sign Out</a>
              </Link>
            </div>
          </div>
        </header>

        {/* Hero */}
        <section className="max-w-screen-2xl mx-auto px-8 pt-24 pb-12">
          <motion.h2
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.8 }}
            className="text-5xl md:text-6xl font-extrabold text-center mb-6"
          >
            Admin Dashboard
          </motion.h2>
          <p className="text-center text-lg md:text-xl text-gray-600 dark:text-gray-400 max-w-3xl mx-auto">
            Real‑time control over classes, students, teachers & attendance. Designed for mission‑critical speed and clarity.
          </p>
        </section>

        {/* Action grid */}
        <section className="max-w-screen-2xl mx-auto px-8 pb-24">
          <div className="grid gap-8 sm:grid-cols-2 lg:grid-cols-3">
            <ActionCard
              icon="📚"
              title="Search Classes"
              href="/classes"
              desc="Inspect class rosters, schedules & assign substitutes on demand."
              delay={0.1}
            />
            <ActionCard
              icon="🎓"
              title="Search Students"
              href="/students"
              desc="Instant access to student profiles, IDs & attendance."
              delay={0.2}
            />
            <ActionCard
              icon="👩‍🏫"
              title="Search Teachers"
              href="/teachers"
              desc="Review teacher loads, email details & daily attendance."
              delay={0.3}
            />
            <ActionCard
              icon="🔄"
              title="Manage Subs"
              href="/sub-assignments"
              desc="Approve, revoke or audit substitute assignments in seconds."
              delay={0.4}
            />
            <ActionCard
              icon="📥"
              title="Download Attendance"
              href="/attendance"
              desc="Export real‑time attendance CSV reports across classes."
              delay={0.5}
            />
          </div>
        </section>

        {/* Footer */}
        <footer className="w-full py-6 text-center text-sm text-gray-500 dark:text-gray-600">
          © {new Date().getFullYear()} xAI • Built for extreme usability & speed
        </footer>
      </div>
    </div>
  );
}
