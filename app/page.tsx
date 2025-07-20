import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-200">
      <div className="bg-white shadow-2xl rounded-3xl p-10 md:p-16 w-full max-w-lg">
        <h1 className="text-4xl md:text-5xl font-extrabold text-gray-800 mb-6 text-center">
          📋 Admin Dashboard
        </h1>
        <p className="text-gray-500 mb-10 text-center text-lg">
          Manage teachers, students, classes & attendance
        </p>

        <div className="space-y-4">
          <Link href="/classes">
            <button className="w-full bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold hover:bg-blue-700 transition-colors">
              Search Classes
            </button>
          </Link>
          <Link href="/students">
            <button className="w-full bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold hover:bg-blue-700 transition-colors">
              Search Students
            </button>
          </Link>
          <Link href="/teachers">
            <button className="w-full bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold hover:bg-blue-700 transition-colors">
              Search Teachers
            </button>
          </Link>
          <Link href="/sub-assignments">
            <button className="w-full bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold hover:bg-blue-700 transition-colors">
              Manage Sub Assignments
            </button>
          </Link>
          <Link href="/attendance">
            <button className="w-full bg-blue-600 text-white rounded-xl py-4 text-lg font-semibold hover:bg-blue-700 transition-colors">
              Download Attendance
            </button>
          </Link>
        </div>

        <button className="mt-8 w-full bg-red-500 text-white rounded-xl py-4 text-lg font-semibold hover:bg-red-600 transition-colors">
          Sign Out
        </button>
      </div>
    </main>
  )
}
