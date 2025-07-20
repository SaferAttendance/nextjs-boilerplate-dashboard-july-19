import React, { useEffect, useState } from 'react';
import Link from 'next/link';
import Head from 'next/head';

export default function Dashboard() {
  const [currentDate, setCurrentDate] = useState<string>('');

  useEffect(() => {
    const updateDate = () => {
      const now = new Date();
      const options: Intl.DateTimeFormatOptions = {
        weekday: 'long',
        year: 'numeric',
        month: 'long',
        day: 'numeric',
      };
      setCurrentDate(now.toLocaleDateString('en-US', options));
    };

    updateDate();
    const interval = setInterval(updateDate, 60_000); // Update every minute
    return () => clearInterval(interval);
  }, []);

  /* Placeholder click handlers */
  const searchClasses = () => alert('Navigate to Class Search');
  const searchTeachers = () => alert('Navigate to Teacher Search');
  const searchStudents = () => alert('Navigate to Student Search');
  const manageSubstitutes = () => alert('Navigate to Substitute Management');
  const downloadAttendance = () => alert('Download Attendance CSV');
  const signOut = () => alert('Signing out...');

  return (
    <>
      <Head>
        <title>School Admin Dashboard</title>
        <meta name="viewport" content="width=device-width, initial-scale=1.0" />
        <link
          rel="preconnect"
          href="https://fonts.googleapis.com"
        />
        <link
          rel="preconnect"
          href="https://fonts.gstatic.com"
          crossOrigin=""
        />
        <link
          href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="bg-gradient-to-br from-blue-50 to-indigo-100 min-h-screen font-[Inter]">
        {/* Header */}
        <header className="bg-white shadow-sm border-b border-gray-200">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center h-16">
              <div className="flex items-center">
                <div className="flex-shrink-0">
                  <div className="w-8 h-8 bg-indigo-600 rounded-lg flex items-center justify-center">
                    <span className="text-white font-bold text-sm">SA</span>
                  </div>
                </div>
                <h1 className="ml-4 text-xl font-semibold text-gray-900">School Admin</h1>
              </div>

              <div className="flex items-center space-x-4">
                <span className="text-sm text-gray-500">{currentDate}</span>
                <button
                  onClick={signOut}
                  className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm font-medium transition-colors duration-200"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          {/* Welcome */}
          <section className="mb-8">
            <h2 className="text-3xl font-bold text-gray-900 mb-2">Welcome to Admin Dashboard</h2>
            <p className="text-gray-600">
              Manage your school's classes, teachers, students, and attendance efficiently.
            </p>
          </section>

          {/* Grid */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {/* Card Component */}
            <DashboardCard
              color="blue"
              title="Search Classes"
              description="Find and manage class schedules, room assignments, and course details."
              onClick={searchClasses}
            />
            <DashboardCard
              color="green"
              title="Search Teachers"
              description="Access teacher profiles, contact information, and assignment details."
              onClick={searchTeachers}
            />
            <DashboardCard
              color="purple"
              title="Search Students"
              description="Look up student records, enrollment status, and academic information."
              onClick={searchStudents}
            />
            <DashboardCard
              color="orange"
              title="Substitute Assignments"
              description="Manage substitute teacher assignments and coverage schedules."
              onClick={manageSubstitutes}
            />
            <DashboardCard
              color="teal"
              title="Today's Attendance"
              description="Download today's attendance records as a CSV file for reporting."
              onClick={downloadAttendance}
            />
            {/* Quick Stats */}
            <StatsCard />
          </section>
        </main>
      </div>
    </>
  );
}

/* Helper card components */
interface DashProps {
  title: string;
  description: string;
  onClick: () => void;
  color: 'blue' | 'green' | 'purple' | 'orange' | 'teal';
}

const DashboardCard: React.FC<DashProps> = ({ title, description, onClick, color }) => {
  const palette: Record<string, string> = {
    blue: 'bg-blue-600 hover:bg-blue-700',
    green: 'bg-green-600 hover:bg-green-700',
    purple: 'bg-purple-600 hover:bg-purple-700',
    orange: 'bg-orange-600 hover:bg-orange-700',
    teal: 'bg-teal-600 hover:bg-teal-700',
  };

  return (
    <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100 flex flex-col">
      <h3 className="text-lg font-semibold text-gray-900 mb-2">{title}</h3>
      <p className="text-gray-600 mb-4 flex-1">{description}</p>
      <button
        onClick={onClick}
        className={`w-full text-white py-2 px-4 rounded-lg font-medium transition-colors duration-200 ${palette[color]}`}
      >
        {title}
      </button>
    </div>
  );
};

const StatsCard: React.FC = () => (
  <div className="bg-white rounded-xl shadow-md hover:shadow-lg transition-shadow duration-300 p-6 border border-gray-100">
    <h3 className="text-lg font-semibold text-gray-900 mb-4">Quick Stats</h3>
    <ul className="space-y-2 text-gray-600">
      <li className="flex justify-between"><span>Total Students:</span><span className="font-semibold text-gray-900">1,247</span></li>
      <li className="flex justify-between"><span>Active Teachers:</span><span className="font-semibold text-gray-900">89</span></li>
      <li className="flex justify-between"><span>Classes Today:</span><span className="font-semibold text-gray-900">156</span></li>
      <li className="flex justify-between"><span>Attendance Rate:</span><span className="font-semibold text-green-600">94.2%</span></li>
    </ul>
  </div>
);
