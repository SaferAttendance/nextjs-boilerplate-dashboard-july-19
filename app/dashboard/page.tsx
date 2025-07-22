/* app/dashboard/page.tsx */
"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";
import { auth } from "@/lib/firebaseClient";
import { signOut } from "firebase/auth";

interface CardSpec {
  id: string;
  title: string;
  desc: string;
  cta: string;
  icon: React.ReactElement;
  onClick: () => void;
}

export default function AdminDashboard() {
  const router = useRouter();
  const [today, setToday] = useState("");
  const userEmail = auth.currentUser?.email ?? "admin@school.edu";

  useEffect(() => {
    const now = new Date();
    setToday(
      now.toLocaleDateString("en-US", {
        weekday: "long",
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    );
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      router.push("/"); // Redirect to login
    } catch (e) {
      alert("Sign-out failed");
    }
  };

  const alertCard = (msg: string) => () =>
    alert(`Demo: ${msg}. In a real app this navigates.`);

  const cards: CardSpec[] = [
    {
      id: "teachers",
      title: "Search Teachers",
      desc: "Find and view teacher information, schedules, and attendance records.",
      cta: "View Teachers",
      icon: (
        <svg
          className="w-6 h-6 text-[#1976D2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
          />
        </svg>
      ),
      onClick: () => router.push("/dashboard/teachers"),
    },
    {
      id: "students",
      title: "Search Students",
      desc: "Look up student profiles, attendance history, and class enrollments.",
      cta: "View Students",
      icon: (
        <svg
          className="w-6 h-6 text-[#1976D2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20a3 3 0 01-3-3v-2a3 3 0 013-3h3a3 3 0 013 3v2a3 3 0 01-3 3zm8-10a2 2 0 11-4 0 2 2 0 014 0z"
          />
        </svg>
      ),
      onClick: () => router.push("/students"),
    },
    {
      id: "classes",
      title: "Search Classes",
      desc: "Browse class schedules, room assignments, and attendance summaries.",
      cta: "View Classes",
      icon: (
        <svg
          className="w-6 h-6 text-[#1976D2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l9-5-9-5-9 5 9 5z"
          />
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 14l6.16-3.422A12.083 12.083 0 0118.824 17.9 11.952 11.952 0 0012 20.055a11.952 11.952 0 00-6.824-2.998 12.078 12.078 0 01.665-6.479L12 14z"
          />
        </svg>
      ),
      onClick: () => router.push("/classes"),
    },
    {
      id: "subs",
      title: "Substitute Assignments",
      desc: "Manage substitute teacher assignments and coverage schedules.",
      cta: "Manage Subs",
      icon: (
        <svg
          className="w-6 h-6 text-[#1976D2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z"
          />
        </svg>
      ),
      onClick: alertCard("Opening substitute management"),
    },
    {
      id: "csv",
      title: "Download CSV",
      desc: "Export today's attendance data as a CSV file for reporting.",
      cta: "Download Report",
      icon: (
        <svg
          className="w-6 h-6 text-[#1976D2]"
          fill="none"
          stroke="currentColor"
          viewBox="0 0 24 24"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
          />
        </svg>
      ),
      onClick: alertCard("Downloading CSV"),
    },
  ];

  return (
    <>
      <Head>
        <title>School Attendance – Dashboard</title>
        <link
          href="https://fonts.googleapis.com/css2?family=Montserrat:wght@300;400;500;600;700&display=swap"
          rel="stylesheet"
        />
      </Head>

      <div className="gradient-bg min-h-screen font-[Montserrat]">
        {/* Header */}
        <header className="bg-white shadow-lg">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex justify-between items-center py-6">
              <div className="flex items-center">
                <div className="w-12 h-12 rounded-full mr-4 flex items-center justify-center bg-[#1976D2]">
                  <svg
                    className="w-6 h-6 text-[#B3E5FC]"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"
                    />
                  </svg>
                </div>
                <div>
                  <h1 className="text-2xl font-bold text-[#1976D2]">
                    School Attendance
                  </h1>
                  <p className="text-sm text-[#1976D2]/70">Admin Dashboard</p>
                </div>
              </div>
              <div className="flex items-center space-x-4">
                <div className="text-right">
                  <p className="text-sm font-medium text-[#1976D2]">
                    {userEmail}
                  </p>
                  <p className="text-xs text-[#1976D2]/70">{today}</p>
                </div>
                <button
                  onClick={handleSignOut}
                  className="px-4 py-2 rounded-lg font-medium bg-[#1976D2] text-[#B3E5FC] hover:bg-[#1565C0] transition hover:scale-105"
                >
                  Sign Out
                </button>
              </div>
            </div>
          </div>
        </header>

        {/* Main */}
        <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
          <section className="dashboard-animation mb-8">
            <h2 className="text-3xl font-bold text-[#1976D2] mb-2">
              Welcome back, Admin!
            </h2>
            <p className="text-lg text-[#1976D2]/80">
              What would you like to do today?
            </p>
          </section>

          {/* Cards */}
          <section className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-5 gap-6">
            {cards.map((c, idx) => (
              <div
                key={c.id}
                style={{ animationDelay: `${idx * 0.1}s` }}
                className="card-hover dashboard-animation bg-white rounded-xl p-6 shadow-lg cursor-pointer"
                onClick={c.onClick}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 mr-4 rounded-lg flex items-center justify-center bg-[#1976D2]/10">
                    {c.icon}
                  </div>
                  <h3 className="text-xl font-semibold text-[#1976D2]">
                    {c.title}
                  </h3>
                </div>
                <p className="text-sm mb-4 text-[#1976D2]/70">{c.desc}</p>
                <div className="flex items-center text-sm font-medium text-[#1976D2]">
                  <span>{c.cta}</span>
                  <svg
                    className="w-4 h-4 ml-2"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M9 5l7 7-7 7"
                    />
                  </svg>
                </div>
              </div>
            ))}
          </section>

          {/* Stats */}
          <section className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-6">
            {[
              ["1,247", "Total Students"],
              ["89", "Total Teachers"],
              ["94.2%", "Today's Attendance"],
              ["3", "Active Substitutes"],
            ].map(([value, label]) => (
              <div
                key={label}
                className="bg-white rounded-lg p-6 shadow-lg text-center"
              >
                <div className="text-3xl font-bold text-[#1976D2] mb-2">
                  {value}
                </div>
                <div className="text-sm text-[#1976D2]/70">{label}</div>
              </div>
            ))}
          </section>
        </main>
      </div>

      <style jsx global>{`
        .gradient-bg {
          background: linear-gradient(135deg, #b3e5fc 0%, #81d4fa 100%);
        }
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-5px);
          box-shadow: 0 20px 40px rgba(25, 118, 210, 0.2);
        }
        .dashboard-animation {
          animation: fadeInUp 0.6s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(30px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .demo-badge {
          position: fixed;
          top: 20px;
          right: 20px;
          background: rgba(255, 193, 7, 0.9);
          color: #333;
          padding: 8px 16px;
          border-radius: 20px;
          font-size: 12px;
          font-weight: 600;
          z-index: 50;
        }
      `}</style>
    </>
  );
}
