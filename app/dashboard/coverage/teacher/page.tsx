import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import TeacherCoverageClient from './TeacherCoverageClient';

export const runtime = 'nodejs';

// Use the EXISTING working endpoint that already returns employee_id
const XANO_USER_API = 'https://xgeu-jqgf-nnju.n7e.xano.io/api:gwgLYEsU';

// Helper function to fetch user data (including employee_id) from Xano based on email
async function fetchUserData(email: string): Promise<{
  employee_id?: string;
  full_name?: string;
  role?: string;
  school_code?: string;
  district_code?: string;
} | null> {
  try {
    const response = await fetch(
      `${XANO_USER_API}/Verify_User_Email_and_Role_From_Allowed_Users?email=${encodeURIComponent(email)}`,
      { cache: 'no-store' }
    );
    const data = await response.json();
    // This endpoint returns an array, get the first user
    if (Array.isArray(data) && data.length > 0 && data[0]?.employee_id) {
      return {
        employee_id: data[0].employee_id,
        full_name: data[0].full_name,
        role: data[0].role,
        school_code: data[0].school_code,
        district_code: data[0].district_code,
      };
    }
    return null;
  } catch (error) {
    console.error('Failed to fetch user data from Xano:', error);
    return null;
  }
}

export default async function TeacherCoveragePage() {
  const jar = await cookies();
  
  // Auth check
  const rawToken = jar.get('token')?.value ?? jar.get('sa_session')?.value;
  if (!rawToken) redirect('/admin/login');
  
  // Verify token
  let email: string | undefined;
  try {
    const { getAdminAuth } = await import('@/lib/firebaseAdmin');
    const decoded = await getAdminAuth().verifyIdToken(rawToken);
    email = decoded.email ?? jar.get('email')?.value ?? undefined;
    if (!email) redirect('/admin/login');
  } catch {
    redirect('/admin/login');
  }
  
  // Get user profile from cookies (these may be incomplete or missing)
  const profileRole = jar.get('role')?.value;
  const profileFullName = jar.get('full_name')?.value || jar.get('fullname')?.value;
  const profileDistrictCode = jar.get('district_code')?.value;
  const profileSchoolCode = jar.get('school_code')?.value;
  const profileEmail = jar.get('email')?.value;
  const profileDepartment = jar.get('department')?.value;
  
  // Try to get employee_id from cookies first
  let employeeId = jar.get('employee_id')?.value || jar.get('employeeId')?.value;
  
  // Initialize variables for user data
  let fullName = profileFullName || 'Teacher';
  let schoolCode = profileSchoolCode || 'blueberry';
  let districtCode = profileDistrictCode || '0001';
  let department = profileDepartment || 'General';
  
  // If no employee_id in cookies, fetch from Xano based on email
  // This also gets the most up-to-date user data from the database
  if (!employeeId) {
    const userEmail = profileEmail || email;
    if (userEmail) {
      const userData = await fetchUserData(userEmail);
      if (userData) {
        employeeId = userData.employee_id;
        // Also update other fields from database if available
        if (userData.full_name) fullName = userData.full_name;
        if (userData.school_code) schoolCode = userData.school_code;
        if (userData.district_code) districtCode = userData.district_code;
        console.log(`Fetched user data from Xano for ${userEmail}: employee_id=${employeeId}`);
      }
    }
  }
  
  // Fallback to generated ID only if all else fails
  if (!employeeId) {
    employeeId = `TEACH-${Math.random().toString(36).substr(2, 6).toUpperCase()}`;
    console.warn(`Generated fallback employee_id: ${employeeId} - User may not have schedule data`);
  }
  
  // Ensure teacher role (allow admin for testing)
  const normalizedRole = (profileRole || '').toLowerCase();
  if (normalizedRole !== 'teacher' && normalizedRole !== 'admin') {
    redirect('/dashboard/coverage');
  }
  
  // Pass essential data to client component
  const teacherData = {
    email: profileEmail || email,
    fullName: fullName,
    employeeId: employeeId,
    schoolCode: schoolCode,
    districtCode: districtCode,
    department: department,
  };
  
  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="border-b border-gray-200 bg-white shadow-sm">
        <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6 lg:px-8">
          <div className="flex items-center gap-3">
            <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-gradient-to-r from-purple-400 to-purple-600 text-white">
              <svg width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M10 16l2 2 4-4" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
            <div>
              <h1 className="text-lg font-semibold text-gray-900">My Schedule & Coverage</h1>
              <p className="text-xs text-gray-500">Teacher Dashboard</p>
            </div>
          </div>
          <div className="flex items-center gap-4">
            <a 
              href="/dashboard" 
              className="text-sm text-gray-600 hover:text-gray-900 transition-colors"
            >
              ← Back to Dashboard
            </a>
            <div className="hidden sm:flex items-center space-x-2">
              <span className="h-2 w-2 animate-pulse rounded-full bg-green-400" />
              <span className="text-sm text-gray-600">
                {fullName} | {department}
              </span>
            </div>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <div className="mx-auto max-w-7xl px-4 py-8 sm:px-6 lg:px-8">
        <TeacherCoverageClient teacherData={teacherData} />
      </div>
    </main>
  );
}
