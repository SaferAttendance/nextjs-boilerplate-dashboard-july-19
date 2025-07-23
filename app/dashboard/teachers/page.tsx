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
  const [filtered, setFiltered] = useState<Teacher[]>([]);
  const [nameQuery, setNameQuery] = useState("");
  const [subjectFilter, setSubjectFilter] = useState("");
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  // fetch once on mount
  useEffect(() => {
    async function fetchTeachers() {
      try {
        setLoading(true);
        if (!res.ok) throw new Error(`API error: ${res.status}`);
        const data: Teacher[] = await res.json();
        setAllTeachers(data);
        setFiltered(data);
      } catch (e: any) {
        console.error(e);
        setError("Failed to load teachers. Please try again.");
      } finally {
        setLoading(false);
      }
    }
    fetchTeachers();
  }, []);

  // re-filter whenever inputs or data change
  useEffect(() => {
    setFiltered(
      allTeachers.filter((t) => {
        const matchesName = t.name.toLowerCase().includes(nameQuery.toLowerCase());
        const matchesSubject = subjectFilter ? t.subjects.includes(subjectFilter) : true;
        return matchesName && matchesSubject;
      })
    );
  }, [nameQuery, subjectFilter, allTeachers]);

  return (
    <>
      <Head>
        <title>School Attendance – Search Teachers</title>
      </Head>

      {/* Demo badge */}
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
            ← Back
          </button>
          <div className="flex items-center">
            <div className="w-12 h-12 bg-[#1976D2] rounded-full flex items-center justify-center mr-4">
              <svg className="w-6 h-6 text-[#B3E5FC]" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth={2}
                  d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"
                />
              </svg>
            </div>
            <div>
              <h1 className="text-2xl font-bold text-[#1976D2]">Search Teachers</h1>
              <p className="text-sm text-[#1976D2]/70">Find teacher information and schedules</p>
            </div>
          </div>
          <div className="text-right">
            <p className="text-sm font-medium text-[#1976D2]">admin@school.edu</p>
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

      {/* Main */}
      <main className="max-w-7xl mx-auto px-4 py-8">
        {/* Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 bg-white rounded-xl p-6 shadow-lg mb-8">
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1976D2]">Teacher Name</label>
            <input
              type="text"
              placeholder="Search by name…"
              value={nameQuery}
              onChange={(e) => setNameQuery(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg bg-[#1976D2]/10 border-[#1976D2]/30 focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-2 text-[#1976D2]">Subject</label>
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value)}
              className="w-full px-4 py-3 border rounded-lg bg-[#1976D2]/10 border-[#1976D2]/30 focus:outline-none focus:ring-2 focus:ring-[#1976D2]"
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

        {/* Loading state */}
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
        {!loading && !error && filtered.length > 0 && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {filtered.map((t, i) => (
              <div
                key={t.id}
                className="card-hover bg-white rounded-xl p-6 shadow-lg cursor-pointer"
                style={{ animationDelay: `${i * 0.1}s` }}
                onClick={() => alert(`Demo: Show details for ${t.name}`)}
              >
                <div className="flex items-center mb-4">
                  <div className="w-12 h-12 rounded-full bg-[#1976D2] text-white flex items-center justify-center font-semibold mr-4">
                    {t.avatar}
                  </div>
                  <div>
                    <h3 className="text-lg font-semibold text-[#1976D2]">{t.name}</h3>
                    <p className="text-sm text-[#1976D2]/70">{t.email}</p>
                  </div>
                </div>
                <p className="text-sm text-[#1976D2]/60 mb-1">{t.phone}</p>
                <p className="text-sm text-[#1976D2]/60 mb-2">{t.room}</p>
                <div className="flex flex-wrap gap-1">
                  {t.subjects.map((subj) => (
                    <span key={subj} className="px-2 py-1 bg-[#1976D2]/10 text-[#1976D2] rounded-full text-xs">
                      {subj}
                    </span>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* No results */}
        {!loading && !error && filtered.length === 0 && (
          <div className="text-center py-12">
            <h3 className="text-lg font-medium text-[#1976D2]">No Teachers Found</h3>
            <p className="text-[#1976D2]/70">Adjust your search to try again.</p>
          </div>
        )}
      </main>
    </>
  );
}
