import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

interface ButtonProps {
  icon: React.ReactNode;
  label: string;
  href: string;
}

const DashboardButton: React.FC<ButtonProps> = ({ icon, label, href }) => (
  <Link href={href}>
    <a className="
      flex items-center justify-center space-x-3
      w-full py-4
      bg-gradient-to-r from-blue-700 to-blue-500
      text-white font-semibold
      rounded-lg shadow-lg
      hover:from-blue-600 hover:to-blue-400 hover:shadow-xl
      transition-all duration-300
    ">
      <span className="text-2xl">{icon}</span>
      <span className="text-lg">{label}</span>
    </a>
  </Link>
);

export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen w-full bg-blue-50 font-montserrat flex flex-col">
        {/* Header */}
        <header className="w-full py-8 px-10 bg-white shadow-md">
          <h1 className="text-4xl font-extrabold text-blue-900">Admin Dashboard</h1>
          <p className="text-blue-600 mt-2 max-w-2xl">
            Use the options below to manage classes, students, teachers, substitutes,
            and download attendance data.
          </p>
        </header>

        {/* Main Content */}
        <main className="flex-1 w-full px-10 py-12 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8">
          <DashboardButton href="/classes" icon={"📚"} label="Search Classes" />
          <DashboardButton href="/students" icon={"🎓"} label="Search Students" />
          <DashboardButton href="/teachers" icon={"👩‍🏫"} label="Search Teachers" />
          <DashboardButton href="/sub-assignments" icon={"🔄"} label="Manage Subs" />
          <DashboardButton href="/attendance" icon={"📥"} label="Download Attendance" />
          <Link href="/logout">
            <a className="
              w-full py-4
              bg-red-600 text-white font-semibold
              rounded-lg shadow-lg
              hover:bg-red-500 hover:shadow-xl
              transition-all duration-300
              flex items-center justify-center
            ">
              <span className="text-2xl">🚪</span>
              <span className="text-lg">Sign Out</span>
            </a>
          </Link>
        </main>

        {/* Footer */}
        <footer className="w-full py-4 bg-white text-center text-sm text-blue-500">
          © {new Date().getFullYear()} Your Company Name. All rights reserved.
        </footer>
      </div>
    </>
  );
}
