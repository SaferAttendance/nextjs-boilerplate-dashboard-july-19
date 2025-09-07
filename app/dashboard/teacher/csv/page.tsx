// app/dashboard/teacher/csv/page.tsx
import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeacherCsvDownload from './TeacherCsvDownload';

export const runtime = 'nodejs'; // firebase-admin needs Node

export default async function TeacherCsvPage() {
  const jar = await cookies();
  
  // Auth check for teacher/sub
  const token = jar.get('token')?.value;
  if (!token) redirect('/');
  
  // Check if user is a teacher or sub
  const role = jar.get('role')?.value ?? jar.get('user_role')?.value ?? '';
  if (role !== 'teacher' && role !== 'sub') {
    redirect('/dashboard'); // Redirect non-teachers to main dashboard
  }
  
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    await getAdminAuth().verifyIdToken(token);
  } catch {
    redirect('/');
  }
  
  const fullName =
    jar.get('full_name')?.value ??
    jar.get('fullname')?.value ??
    'Teacher';
  
  const teacherEmail = 
    jar.get('teacher_email')?.value ??
    jar.get('email')?.value ??
    '';

  return (
    <div className="min-h-screen bg-gradient-to-br from-neutral-50 via-white to-neutral-50">
      {/* Background blobs */}
      <div className="fixed inset-0 overflow-hidden pointer-events-none">
        <div className="absolute -top-40 -right-40 w-80 h-80 bg-brand-blue/5 rounded-full blur-3xl" />
        <div className="absolute top-1/2 -left-40 w-96 h-96 bg-safety-green/5 rounded-full blur-3xl" />
        <div className="absolute bottom-0 right-1/3 w-80 h-80 bg-brand-dark/5 rounded-full blur-3xl" />
        <div className="absolute top-1/4 right-1/4 w-64 h-64 bg-safety-yellow/5 rounded-full blur-3xl" />
      </div>
      
      {/* Header */}
      <div className="relative">
        <div className="bg-white/80 backdrop-blur-sm border-b border-neutral-200 shadow-sm">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="flex h-20 items-center justify-between">
              <Link 
                href="/dashboard" 
                className="group flex items-center gap-3 rounded-xl px-4 py-2 transition-all hover:bg-neutral-50"
              >
                <svg 
                  className="h-5 w-5 text-neutral-400 transition-transform group-hover:-translate-x-0.5" 
                  fill="none" 
                  stroke="currentColor" 
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
                </svg>
                <div>
                  <div className="text-lg font-semibold text-neutral-900">CSV Export</div>
                  <div className="text-xs text-neutral-500">Download your class attendance data</div>
                </div>
              </Link>
              
              <div className="flex items-center gap-4">
                <div className="text-right">
                  <div className="text-sm font-medium text-neutral-900">Welcome, {fullName}</div>
                  <div className="text-xs text-neutral-500">{teacherEmail}</div>
                </div>
                <div className="flex h-10 w-10 items-center justify-center rounded-full bg-gradient-to-br from-brand-blue to-brand-dark text-white font-semibold shadow-sm">
                  {fullName.charAt(0).toUpperCase()}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
      
      {/* Content */}
      <div className="relative mx-auto max-w-5xl px-4 py-12 sm:px-6 lg:px-8">
        <TeacherCsvDownload />
      </div>
    </div>
  );
}
