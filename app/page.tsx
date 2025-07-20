import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

// Dashboard Button Props
interface ButtonProps {
  icon: string;
  label: string;
  href: string;
}

// Reusable Dashboard Button Component
const DashboardButton: React.FC<ButtonProps> = ({ icon, label, href }) => (
  <Link href={href}>
    <a
      className={
        `
        flex items-center justify-center space-x-3
        w-full py-4 px-6
        bg-blue-900 text-white
        rounded-full font-semibold
        shadow-lg transition-transform transform
        hover:scale-105
        focus:outline-none focus:ring-2 focus:ring-blue-700
      `
      }
    >
      <span className="text-2xl">{icon}</span>
      <span className="text-lg">{label}</span>
    </a>
  </Link>
);

// Main Admin Dashboard Page
export default function Home(): JSX.Element {
  return (
    <>
      {/* Import Montserrat font */}
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@400;600;800&display=swap"
          rel="stylesheet"
        />
      </Head>
      <main
        className="
          flex items-center justify-center
          min-h-screen
          bg-blue-100
          p-8 lg:p-12
        "
        style={{ fontFamily: 'Montserrat, sans-serif' }}
      >
        <div
          className="
            w-full max-w-2xl
            bg-white
            rounded-3xl
            shadow-2xl
            p-8 md:p-12 lg:p-16
          "
        >
          {/* Header */}
          <header className="text-center mb-8">
            <div className="text-6xl mb-3">📋</div>
            <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800">
              Admin Dashboard
            </h1>
            <p className="text-gray-600 text-base md:text-lg mt-2">
              Manage teachers, students, classes & attendance
            </p>
          </header>

          {/* Buttons Grid */}
          <section
            className="
              grid grid-cols-1 md:grid-cols-2 gap-6
              lg:grid-cols-3 xl:grid-cols-3
            "
          >
            <DashboardButton
              href="/classes"
              icon="📚"
              label="Search Classes"
            />
            <DashboardButton
              href="/students"
              icon="🎓"
              label="Search Students"
            />
            <DashboardButton
              href="/teachers"
              icon="👩‍🏫"
              label="Search Teachers"
            />
            <DashboardButton
              href="/sub-assignments"
              icon="🔄"
              label="Manage Sub Assignments"
            />
            <DashboardButton
              href="/attendance"
              icon="📥"
              label="Download Attendance"
            />
          </section>

          {/* Sign Out */}
          <section className="mt-10">
            <button
              className="
                w-full py-4 px-6
                bg-blue-800 text-white
                rounded-full font-semibold
                shadow-lg transition-transform transform
                hover:scale-105 hover:bg-blue-700
                focus:outline-none focus:ring-2 focus:ring-blue-600
              "
              style={{ fontFamily: 'Montserrat, sans-serif' }}
            >
              🚪 Sign Out
            </button>
          </section>
        </div>
      </main>
    </>
  );
}
