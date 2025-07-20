import React from 'react';
import Link from 'next/link';

// Define button props interface
interface ButtonProps {
  icon: string;
  label: string;
  href: string;
}

// Reusable dashboard button component
const DashboardButton: React.FC<ButtonProps> = ({ icon, label, href }) => (
  <Link href={href}>
    <a className={
      `
        flex items-center justify-center space-x-2
        w-full py-3 px-4
        bg-gradient-to-r from-blue-500 to-indigo-500
        text-white rounded-2xl font-semibold
        shadow-md transition-transform transform
        hover:scale-105 hover:from-blue-600 hover:to-indigo-600
      `
    }>
      <span className="text-xl">{icon}</span>
      <span className="text-lg">{label}</span>
    </a>
  </Link>
);

// Main dashboard page
export default function Home(): JSX.Element {
  return (
    <main className="
      flex items-center justify-center
      min-h-screen
      bg-gradient-to-tr from-gray-100 to-gray-200
      p-4 sm:p-6 md:p-8 lg:p-10
    ">
      <div className="
        w-full max-w-lg
        bg-white
        rounded-3xl
        shadow-2xl
        p-6 sm:p-8 md:p-10 lg:p-12
      ">
        {/* Header Section */}
        <header className="text-center mb-8">
          <div className="text-6xl mb-2">📋</div>
          <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
            Admin Dashboard
          </h1>
          <p className="text-gray-500 mt-2 text-base md:text-lg">
            Manage teachers, students, classes & attendance
          </p>
        </header>

        {/* Buttons Section */}
        <section className="
          grid grid-cols-1 sm:grid-cols-2 gap-4
          md:grid-cols-1 lg:grid-cols-1
        ">
          <DashboardButton href="/classes" icon="📚" label="Search Classes" />
          <DashboardButton href="/students" icon="🎓" label="Search Students" />
          <DashboardButton href="/teachers" icon="👩‍🏫" label="Search Teachers" />
          <DashboardButton href="/sub-assignments" icon="🔄" label="Manage Sub Assignments" />
          <DashboardButton href="/attendance" icon="📥" label="Download Attendance" />
        </section>

        {/* Sign Out Button */}
        <section className="mt-8">
          <button className="
            w-full py-3 px-4
            bg-red-500 text-white rounded-2xl font-semibold
            shadow-md transition-transform transform
            hover:scale-105 hover:bg-red-600
          ">
            🚪 Sign Out
          </button>
        </section>
      </div>
    </main>
  );
}
