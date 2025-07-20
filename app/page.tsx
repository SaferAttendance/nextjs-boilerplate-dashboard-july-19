import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex flex-col items-center justify-center min-h-screen bg-blue-100 p-6">
      <h1 className="text-3xl font-bold mb-8">📋 Admin Dashboard</h1>

      <div className="space-y-4 w-full max-w-sm">
        <Link href="/classes">
          <button className="w-full bg-blue-500 text-white rounded-lg py-3 hover:bg-blue-600">
            Search Classes
          </button>
        </Link>

        <Link href="/students">
          <button className="w-full bg-blue-500 text-white rounded-lg py-3 hover:bg-blue-600">
            Search Students
          </button>
        </Link>

        <Link href="/teachers">
          <button className="w-full bg-blue-500 text-white rounded-lg py-3 hover:bg-blue-600">
            Search Teachers
          </button>
        </Link>

        <Link href="/sub-assignments">
          <button className="w-full bg-blue-500 text-white rounded-lg py-3 hover:bg-blue-600">
            Unrestricted Teacher Access
          </button>
        </Link>

        <Link href="/attendance">
          <button className="w-full bg-blue-500 text-white rounded-lg py-3 hover:bg-blue-600">
            Download Today’s Attendance
          </button>
        </Link>

        <button className="w-full bg-red-500 text-white rounded-lg py-3 hover:bg-red-600">
          Sign Out
        </button>
      </div>
    </main>
  )
}
