/* app/page.tsx */
"use client";               // ← 1. this MUST be line 1

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
    className="bg-white/80 backdrop-blur-xl border border-white/40 dark:bg-gray-900/50 dark:border-white/10
               rounded-2xl p-8 flex flex-col"
  >
    <h3 className="text-xl font-semibold mb-2 tracking-tight text-gray-900 dark:text-white">
      {title}
    </h3>
    <p className="text-gray-600 dark:text-gray-400 flex-1 mb-6">{desc}</p>
    <Link
      href={href}
      className="inline-flex justify-center items-center h-11 px-6 rounded-lg
                 bg-primary-500 text-white font-medium hover:bg-primary-600 transition-colors"
    >
      Open
    </Link>
  </motion.div>
);

/*********************
 * Main Page Component
 *********************/
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

      {/* page body … */}
    </>
  );
}
