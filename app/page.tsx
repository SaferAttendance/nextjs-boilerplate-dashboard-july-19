import Link from 'next/link'

export default function Home() {
  return (
    <main className="flex items-center justify-center min-h-screen bg-gradient-to-tr from-gray-100 to-gray-200 p-8">
      {/* Card container */}
      <div className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-8">
        
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-5xl mb-2">📋</div>
          <h1 className="text-3xl font-extrabold text-gray-800">Admin Dashboard</h1>
          <p className="text-gray-500 mt-1">Manage teachers, students, classes & attendance</p>
        </div>
        
        {/* Buttons */}
        <div className="space-y-4">
          {[
            { href: '/classes',   icon: '📚', label: 'Search Classes' },
            { href: '/students',  icon: '🎓', label: 'Search Students' },
            { href: '/teachers',  icon: '👩‍🏫', label: 'Search Teachers' },
            { href: '/sub-assignments', icon: '🔄', label: 'Manage Subs' },
            { href: '/attendance', icon: '📥', label: 'Download Attendance' },
          ].map(({ href, icon, label }) => (
            <Link key={href} href={href}>
              <button className="
                flex items-center justify-center space-x-2
                w-full py-3 px-4
                bg-gradient-to-r from-blue-500 to-indigo-500
                text-white rounded-2xl font-semibold shadow-md
                transition-transform transform hover:scale-105 hover:from-blue-600 hover:to-indigo-600
              ">
                <span>{icon}</span>
                <span>{label}</span>
              </button>
            </Link>
          ))}
        </div>
        
        {/* Sign out */}
        <button className="
          mt-8 w-full py-3
          bg-red-500 text-white rounded-2xl font-semibold shadow-md
          transition-transform transform hover:scale-105 hover:bg-red-600
        ">
          🚪 Sign Out
        </button>
      </div>
    </main>
  )
}
