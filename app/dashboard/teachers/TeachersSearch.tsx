'use client';

import React, { useState } from 'react';

// --- Sample data (replace with API integration as needed) ---
const teachersData: Record<string, any> = {
  'sarah.johnson@school.edu': {
    name: 'Dr. Sarah Johnson',
    email: 'sarah.johnson@school.edu',
    department: 'Mathematics Department',
    experience: '8 years experience',
    employeeId: 'T-2019-045',
    classes: [
      {
        name: 'Algebra I',
        code: 'MATH-101',
        schedule: 'Mon, Wed, Fri 9:00 AM',
        room: 'Room 205',
        students: 28,
        attendance: 92,
      },
      {
        name: 'Geometry',
        code: 'MATH-201',
        schedule: 'Tue, Thu 10:30 AM',
        room: 'Room 205',
        students: 24,
        attendance: 88,
      },
      {
        name: 'Pre-Calculus',
        code: 'MATH-301',
        schedule: 'Mon, Wed, Fri 2:00 PM',
        room: 'Room 207',
        students: 22,
        attendance: 95,
      },
    ],
  },
  'mike.davis@school.edu': {
    name: 'Mr. Mike Davis',
    email: 'mike.davis@school.edu',
    department: 'English Department',
    experience: '12 years experience',
    employeeId: 'T-2015-023',
    classes: [
      {
        name: 'English Literature',
        code: 'ENG-202',
        schedule: 'Mon, Wed, Fri 11:00 AM',
        room: 'Room 118',
        students: 30,
        attendance: 90,
      },
      {
        name: 'Creative Writing',
        code: 'ENG-305',
        schedule: 'Tue, Thu 1:00 PM',
        room: 'Room 120',
        students: 18,
        attendance: 96,
      },
    ],
  },
  'lisa.chen@school.edu': {
    name: 'Dr. Lisa Chen',
    email: 'lisa.chen@school.edu',
    department: 'Science Department',
    experience: '6 years experience',
    employeeId: 'T-2021-067',
    classes: [
      {
        name: 'Biology I',
        code: 'BIO-101',
        schedule: 'Mon, Wed, Fri 8:00 AM',
        room: 'Lab 301',
        students: 26,
        attendance: 87,
      },
      {
        name: 'Chemistry',
        code: 'CHEM-201',
        schedule: 'Tue, Thu 9:30 AM',
        room: 'Lab 302',
        students: 20,
        attendance: 93,
      },
      {
        name: 'Advanced Biology',
        code: 'BIO-401',
        schedule: 'Mon, Wed 3:00 PM',
        room: 'Lab 301',
        students: 15,
        attendance: 98,
      },
    ],
  },
};

// --- Helper for gradient colors for class cards ---
const cardGradientColors = [
  'from-blue-400 to-blue-600',
  'from-green-400 to-green-600',
  'from-purple-400 to-purple-600',
  'from-orange-400 to-orange-600',
  'from-pink-400 to-pink-600',
];

export default function TeachersSearch() {
  // UI state
  const [query, setQuery] = useState('');
  const [loading, setLoading] = useState(false);
  const [teacher, setTeacher] = useState<any>(null);
  const [noResults, setNoResults] = useState(false);
  const [modalClass, setModalClass] = useState<any>(null);

  // Search logic (mocked, replace with API as needed)
  const handleSearch = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setNoResults(false);
    setTeacher(null);
    setModalClass(null);

    if (!query.trim()) {
      alert('Please enter a teacher name or email address');
      return;
    }
    setLoading(true);

    setTimeout(() => {
      setLoading(false);
      let found: any = null;
      for (const [key, t] of Object.entries(teachersData)) {
        if (
          key.toLowerCase().includes(query.trim().toLowerCase()) ||
          t.name.toLowerCase().includes(query.trim().toLowerCase())
        ) {
          found = t;
          break;
        }
      }
      if (found) {
        setTeacher(found);
        setNoResults(false);
      } else {
        setTeacher(null);
        setNoResults(true);
      }
    }, 700);
  };

  // UI event handlers
  const closeModal = () => setModalClass(null);

  // --- JSX ---
  return (
    <>
      {/* Search Section */}
      <div className="text-center mb-12">
        <h2 className="text-4xl font-bold text-gray-800 mb-4">Find a Teacher</h2>
        <p className="text-lg text-gray-600 max-w-2xl mx-auto mb-8">
          Search by teacher name or email address to view their class schedules and attendance information.
        </p>
        {/* Search Bar */}
        <div className="max-w-2xl mx-auto">
          <form onSubmit={handleSearch} className="relative" autoComplete="off">
            <div className="relative">
              <input
                type="text"
                placeholder="Enter teacher name or email address..."
                className="w-full px-6 py-4 bg-white/90 backdrop-blur-sm border border-white/20 rounded-2xl focus:outline-none focus:ring-2 focus:ring-brand-blue focus:border-transparent transition-all duration-200 pl-14 pr-16 text-lg shadow-lg"
                value={query}
                onChange={e => setQuery(e.target.value)}
                onFocus={e => {
                  if (!e.target.value) e.target.placeholder = 'Try: Sarah Johnson, mike.davis@school.edu, or Lisa Chen';
                }}
                onBlur={e => (e.target.placeholder = 'Enter teacher name or email address...')}
              />
              <svg className="absolute left-5 top-1/2 -translate-y-1/2 w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
              <button
                type="submit"
                className="absolute right-2 top-1/2 -translate-y-1/2 bg-gradient-to-r from-brand-blue to-brand-dark text-white px-6 py-2 rounded-xl hover:from-brand-dark hover:to-brand-blue transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
              >
                Search
              </button>
            </div>
          </form>
        </div>
      </div>
      {/* State: loading */}
      {loading && (
        <div className="text-center py-16" data-testid="loading-state">
          <div className="w-12 h-12 border-4 border-brand-blue border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-gray-600 font-medium">Searching for teacher...</p>
        </div>
      )}
      {/* State: No results */}
      {noResults && !loading && (
        <div className="text-center py-16" data-testid="no-results">
          <div className="w-24 h-24 bg-gray-100 rounded-full flex items-center justify-center mx-auto mb-6">
            <svg className="w-12 h-12 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"></path>
            </svg>
          </div>
          <h3 className="text-xl font-semibold text-gray-800 mb-2">No Teacher Found</h3>
          <p className="text-gray-600 max-w-md mx-auto">
            We couldn't find a teacher with that name or email address. Please check your spelling and try again.
          </p>
        </div>
      )}
      {/* State: Results */}
      {teacher && !loading && (
        <div className="fadein" data-testid="search-results">
          {/* Teacher Info Card */}
          <div className="bg-white/90 backdrop-blur-sm rounded-2xl shadow-lg border border-white/20 p-8 mb-8">
            <div className="flex items-center space-x-6">
              <div className="w-20 h-20 bg-gradient-to-r from-blue-400 to-blue-600 rounded-2xl flex items-center justify-center shadow-lg">
                <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z"></path>
                </svg>
              </div>
              <div className="flex-1">
                <h3 className="text-2xl font-bold text-gray-800 mb-2">{teacher.name}</h3>
                <p className="text-gray-600 mb-2">{teacher.email}</p>
                <div className="flex items-center space-x-4 text-sm text-gray-500">
                  <span>{teacher.department}</span>
                  <span>•</span>
                  <span>{teacher.experience}</span>
                  <span>•</span>
                  <span>{teacher.classes.length} classes</span>
                </div>
              </div>
              <div className="text-right">
                <div className="bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium mb-2">
                  Active
                </div>
                <p className="text-sm text-gray-600">Employee ID: <span>{teacher.employeeId}</span></p>
              </div>
            </div>
          </div>

          {/* Classes Section */}
          <div>
            <div className="flex items-center justify-between mb-6">
              <h3 className="text-2xl font-bold text-gray-800">Classes Taught</h3>
              <div className="bg-white/90 backdrop-blur-sm rounded-lg px-4 py-2 shadow-sm border border-white/20">
                <span className="text-sm text-gray-600">Total Classes: </span>
                <span className="font-semibold text-brand-dark">{teacher.classes.length}</span>
              </div>
            </div>
            {/* Class Cards */}
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {teacher.classes.map((classInfo: any, idx: number) => (
                <div
                  key={classInfo.code}
                  className="class-card bg-white/90 backdrop-blur-sm rounded-2xl p-6 shadow-lg border border-white/20 hover:shadow-2xl hover:scale-[1.02] transition-all duration-300 cursor-pointer opacity-100 transform translate-y-0"
                  style={{ transitionDelay: `${idx * 100}ms` }}
                  onClick={() => setModalClass(classInfo)}
                >
                  <div className="flex items-start justify-between mb-4">
                    <div className={`w-12 h-12 bg-gradient-to-r ${cardGradientColors[idx % cardGradientColors.length]} rounded-xl flex items-center justify-center shadow-lg`}>
                      <svg className="w-6 h-6 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.746 0 3.332.477 4.5 1.253v13C19.832 18.477 18.246 18 16.5 18c-1.746 0-3.332.477-4.5 1.253"></path>
                      </svg>
                    </div>
                    <div className="text-right">
                      <div className="bg-green-100 text-green-800 px-2 py-1 rounded-full text-xs font-medium">
                        {classInfo.attendance}% Attendance
                      </div>
                    </div>
                  </div>
                  <h4 className="text-xl font-bold text-gray-800 mb-2">{classInfo.name}</h4>
                  <p className="text-gray-600 mb-4">{classInfo.code}</p>
                  <div className="space-y-2 text-sm text-gray-600">
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"></path></svg>
                      <span>{classInfo.schedule}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z"></path><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z"></path></svg>
                      <span>{classInfo.room}</span>
                    </div>
                    <div className="flex items-center space-x-2">
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4.354a4 4 0 110 5.292M15 21H3v-1a6 6 0 0112 0v1zm0 0h6v-1a6 6 0 00-9-5.197m13.5-9a2.5 2.5 0 11-5 0 2.5 2.5 0 015 0z"></path></svg>
                      <span>{classInfo.students} students</span>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
      {/* Class Details Modal */}
      {modalClass && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center z-50 p-4" onClick={closeModal}>
          <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-bold text-gray-800">{modalClass.name}</h3>
                <button onClick={closeModal} className="p-2 hover:bg-gray-100 rounded-lg transition-colors duration-200">
                  <svg className="w-6 h-6 text-gray-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12"></path>
                  </svg>
                </button>
              </div>
              <div className="space-y-6">
                <div className="grid grid-cols-2 gap-4">
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Class Code</p>
                    <p className="font-semibold text-gray-800">{modalClass.code}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Schedule</p>
                    <p className="font-semibold text-gray-800">{modalClass.schedule}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Room</p>
                    <p className="font-semibold text-gray-800">{modalClass.room}</p>
                  </div>
                  <div className="bg-gray-50 rounded-lg p-4">
                    <p className="text-sm text-gray-600 mb-1">Enrolled Students</p>
                    <p className="font-semibold text-gray-800">{modalClass.students}</p>
                  </div>
                </div>
                <div className="bg-brand-light/20 rounded-lg p-4">
                  <p className="text-sm text-gray-600 mb-2">Current Attendance Rate</p>
                  <div className="flex items-center space-x-3">
                    <div className="flex-1 bg-gray-200 rounded-full h-3">
                      <div className="bg-gradient-to-r from-green-400 to-green-600 h-3 rounded-full transition-all duration-500" style={{ width: `${modalClass.attendance}%` }}></div>
                    </div>
                    <span className="font-semibold text-gray-800">{modalClass.attendance}%</span>
                  </div>
                </div>
                <div className="flex space-x-4">
                  <button
                    className="flex-1 bg-gradient-to-r from-brand-blue to-brand-dark text-white py-3 px-4 rounded-xl hover:from-brand-dark hover:to-brand-blue transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    onClick={() => alert('Opening attendance records...')}
                  >
                    View Attendance Records
                  </button>
                  <button
                    className="flex-1 bg-gradient-to-r from-green-400 to-green-600 text-white py-3 px-4 rounded-xl hover:from-green-500 hover:to-green-700 transition-all duration-200 font-medium shadow-lg hover:shadow-xl"
                    onClick={() => alert('Opening attendance taking interface...')}
                  >
                    Take Attendance
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
