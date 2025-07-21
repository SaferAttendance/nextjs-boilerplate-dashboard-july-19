"use client";

import { useEffect, useState } from "react";
import Head from "next/head";
import { useRouter } from "next/navigation";

interface Teacher {
  id: number;
  name: string;
  email: string;
  phone: string;
  subjects: string[];
  room: string;
  avatar: string;
}

export default function TeachersPage() {
  const router = useRouter();
  const [allTeachers, setAllTeachers] = useState<Teacher[]>([]);
  const [filteredTeachers, setFilteredTeachers] = useState<Teacher[]>([]);
  const [nameQuery, setNameQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // Fetch teachers from Xano API
  useEffect(() => {
    const fetchTeachers = async () => {
      try {
        setLoading(true);
        setError("");
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_XANO_BASE}/teachers`
        );
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: Teacher[] = await res.json();
        setAllTeachers(data);
        setFilteredTeachers(data);
      } catch (err: any) {
        console.error("Fetch error:", err);
        setError("Failed to load teachers. Please try again.");
      } finally {
        setLoading(false);
      }
    };
    fetchTeachers();
  }, []);

  // Filter teachers by name/subject
  useEffect(() => {
    const filtered = allTeachers.filter((t) => {
      const matchesName = t.name
        .toLowerCase()
        .includes(nameQuery.toLowerCase());
      const matchesSubject = subjectFilter
        ? t.subjects.includes(subjectFilter)
        : true;
      return matchesName && matchesSubject;
    });
    setFilteredTeachers(filtered);
  }, [nameQuery, subjectFilter, allTeachers]);

  return (
    <>
      <Head>
        <title>School Attendance – Search Teachers</title>
      </Head>

      {/* Demo Badge */}
      <div className="demo-badge fixed top-4 right-4 bg-yellow-400 text-gray-800 px-3 py-1 rounded-full text-xs font-semibold shadow">
        🔧 DEMO – Replace Xano API to activate
      </div>

      {/* Header */}
      <header className="bg-white shadow-lg">
        <div className="max-w-7xl mx-auto px-4 py-6 flex justify-between items-center">
          <button
            onClick={() => router.push("/dashboard")}
            className="p-2 rounded-lg text-[#1976D2] hover:bg-gray-100 transition"
          >
            <svg
              className="w-6 h-6"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M15 19l-7-7 7-7"
              />
            </svg>
          </button>
          <div className="flex items-center">
            <div className="flex justify-center items-center w-12 h-12 bg-[#1976D2] rounded-full mr-4">
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
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1976D2]">
                Search Teachers
              </h1>
              <p className="text-sm text-[#1976D2]/70">
                Find teacher information and schedules
              </p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#1976D2]">
              admin@school.edu
            </p>
            <p className="text-xs text-[#1976D2]/60">
              {new Date().toLocaleDateString("en-US", {
                weekday: "long",
                year: "numeric",
                month: "long",
                day: "numeric",
              })}
            </p>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="bg-white rounded-xl p-6 shadow-lg mb-8 grid grid-cols-1 md:grid-cols-3 gap-4">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1976D2]">
              Teacher Name
            </label>
            <input
              type="text"
              placeholder="Search by name..."
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg bg-[#1976D2]/10 border-[#1976D2]/30 text-[#1976D2] focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1976D2]">
              Subject
            </label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg bg-[#1976D2]/10 border-[#1976D2]/30 text-[#1976D2] focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            >
              <option value="">All Subjects</option>
              <option>Mathematics</option>
              <option>English</option>
              <option>Science</option>
              <option>History</option>
              <option>Art</option>
              <option>Physical Education</option>
              <option>Music</option>
              <option>Computer Science</option>
            </select>
          </div>
        </div>

        {/* Loading */}
        {loading && (
          <div className="text-center py-12">
            <div className="loading-spinner mx-auto mb-4"></div>
            <p className="text-[#1976D2]">Loading teachers…</p>
          </div>
        )}

        {/* Error */}
        {error && (
          <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded-lg mb-6">
            <p>{error}</p>
          </div>
        )}

        {/* Results */}
        {!loading && filteredTeachers.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filteredTeachers.map((t, idx) => (
              <div
                key={t.id}
                className="teacher-card-animation card-hover bg-white rounded-xl p-6 shadow-lg cursor-pointer"
                style={{ animationDelay: `${idx * 0.1}s` }}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full flex justify-center items-center text-white font-semibold mr-4 bg-[#1976D2]">
                    {t.avatar}
                  </div>
                  <div>
                    <h3 className="font-semibold text-lg text-[#1976D2]">
                      {t.name}
                    </h3>
                    <p className="text-sm text-[#1976D2]/70">{t.email}</p>
                  </div>
                </div>
                <p className="text-sm text-[#1976D2]/60 mb-2">{t.phone}</p>
                <p className="text-sm text-[#1976D2]/60">{t.room}</p>
                <div className="flex flex-wrap gap-1 mt-2">
                  {t.subjects.map((subj) => (
                    <span
                      key={subj}
                      className="inline-block bg-[#1976D2]/10 text-[#1976D2] px-2 py-1 rounded-full text-xs"
                    >
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No Results */}
        {!loading && !error && filteredTeachers.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-[#1976D2]">
              No Teachers Found
            </h3>
            <p className="text-[#1976D2]/70">
              Try adjusting your search criteria.
            </p>
          </div>
        )}
      </main>

      {/* Global Styles */}
      <style jsx global>{`
        .card-hover {
          transition: all 0.3s ease;
        }
        .card-hover:hover {
          transform: translateY(-3px);
          box-shadow: 0 15px 35px rgba(25, 118, 210, 0.15);
        }
        .teacher-card-animation {
          animation: fadeInUp 0.6s ease-out;
        }
        @keyframes fadeInUp {
          from {
            opacity: 0;
            transform: translateY(20px);
          }
          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
        .loading-spinner {
          border: 3px solid rgba(25, 118, 210, 0.3);
          border-radius: 50%;
          border-top: 3px solid #1976d2;
          width: 24px;
          height: 24px;
          animation: spin 1s linear infinite;
        }
        @keyframes spin {
          0% {
            transform: rotate(0deg);
          }
          100% {
            transform: rotate(360deg);
          }
        }
      `}</style>
    </>
  );
}
