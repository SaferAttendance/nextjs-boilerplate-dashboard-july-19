import React from 'react';
import Link from 'next/link';
import Head from 'next/head';

// Montserrat font import and Tailwind full-width layout
export default function Home(): JSX.Element {
  return (
    <>
      <Head>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;600;800&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="min-h-screen w-full bg-gradient-to-r from-blue-100 to-blue-200 font-montserrat text-gray-800">
        {/* Top Navigation Bar */}
        <nav className="w-full bg-white/80 backdrop-blur-md shadow-md fixed top-0 left-0 z-10">
          <div className="max-w-screen-xl mx-auto px-6 py-4 flex justify-between items-center">
            <div className="flex items-center space-x-2">
              <span className="text-3xl">🤖</span>
              <h1 className="text-2xl font-extrabold">xAI Admin</h1>
            </div>
            <div>
              <Link href="/logout">
                <a className="px-4 py-2 bg-red-600 text-white rounded-lg hover:bg-red-500 transition">
                  Sign Out
                </a>
              </Link>
            </div>
          </div>
        </nav>

        {/* Main Content Container */}
        <main className="pt-24 pb-12 px-6 max-w-screen-xl mx-auto">
          {/* Hero Section */}
          <section className="text-center mb-12">
            <h2 className="text-4xl md:text-5xl font-bold">Admin Dashboard</h2>
            <p className="mt-4 text-lg text-gray-600 max-w-2xl mx-auto">
              Effortlessly manage classes, students, teachers, substitute assignments,
              and live attendance data—all in one intuitive interface.
            </p>
          </section>

          {/* Dashboard Grid */}
          <section className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8">
            <Card
              icon="📚"
              title="Search Classes"
              href="/classes"
              description="View class details and assign substitutes"
            />
            <Card
              icon="🎓"
              title="Search Students"
              href="/students"
              description="Lookup student profiles and attendance"
            />
            <Card
              icon="👩‍🏫"
              title="Search Teachers"
              href="/teachers"
              description="Review teacher assignments and schedules"
            />
            <Card
              icon="🔄"
              title="Manage Subs"
              href="/sub-assignments"
              description="Approve or revoke substitute assignments"
            />
            <Card
              icon="📥"
              title="Download Attendance"
              href="/attendance"
              description="Export real-time attendance reports"
            />
          </section>
        </main>

        {/* Footer */}
        <footer className="w-full py-6 bg-white/80 backdrop-blur-md text-center text-sm text-gray-500">
          © {new Date().getFullYear()} xAI • Designed for high-impact desktop use
        </footer>
      </div>
    </>
  );
}

// Dashboard Card component
interface CardProps {
  icon: string;
  title: string;
  description: string;
  href: string;
}

function Card({ icon, title, description, href }: CardProps) {
  return (
    <Link href={href}>
      <a className="
        flex flex-col justify-between
        bg-white shadow-lg rounded-xl
        p-6 hover:shadow-2xl transition-shadow duration-300
        h-full
      ">
        <div className="flex items-center space-x-4 mb-4">
          <span className="text-3xl">{icon}</span>
          <h3 className="text-xl font-semibold">{title}</h3>
        </div>
        <p className="text-gray-600 flex-1">{description}</p>
        <div className="mt-6">
          <span className="text-blue-600 font-bold underline">Go →</span>
        </div>
      </a>
    </Link>
  );
}
