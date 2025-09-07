// app/admin/login/page.tsx
'use client';

import React, { useState, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

/** Shape returned by /api/verify (server proxy to Xano) */
type UserVerificationResponse = {
  email: string | null;
  full_name: string | null;
  role: 'admin' | 'teacher' | 'parent' | 'substitute' | 'sub' | null; // 👈 accept "sub"
  district_code: string | null;
  school_code: string | null;
  sub_assigned: string | null;
  Phone_ID: string | null;
};

/** Call our server route (keeps Xano URL/API key server-side) */
async function verifyUserViaApi(email: string): Promise<UserVerificationResponse> {
  const res = await fetch(`/api/verify?email=${encodeURIComponent(email)}`, {
    method: 'GET',
    cache: 'no-store',
  });
  if (!res.ok) {
    const msg = await res.text().catch(() => '');
    throw new Error(msg || `User verification failed (${res.status})`);
  }
  return (await res.json()) as UserVerificationResponse;
}

function setCookie(name: string, value: string, maxAgeSeconds: number) {
  try {
    document.cookie = `${name}=${encodeURIComponent(value)}; path=/; max-age=${maxAgeSeconds}; samesite=lax`;
  } catch {
    /* non-fatal */
  }
}

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = useCallback((e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  }, [error]);

  const handleSubmit = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    const email = formData.email.trim().toLowerCase();
    if (!/^\S+@\S+\.\S+$/.test(email)) {
      setIsLoading(false);
      setError('Please enter a valid email address.');
      return;
    }

    try {
      // 0) Verify user & get complete profile information
      let userProfile: UserVerificationResponse;
      try {
        userProfile = await verifyUserViaApi(email);
      } catch (e: any) {
        throw new Error(e?.message || 'Unable to verify your account right now. Please try again.');
      }

      if (!userProfile.email || !userProfile.role) {
        throw new Error('This account is not authorized for system access.');
      }

      // ✅ accept 'sub' and 'substitute'
      const validRoles = ['admin', 'teacher', 'parent', 'substitute', 'sub'] as const;
      if (!validRoles.includes(userProfile.role as any)) {
        throw new Error('Invalid user role. Please contact your administrator.');
      }

      // 1) Firebase sign in (after confirming valid user)
      const userCredential = await signInWithEmailAndPassword(auth, email, formData.password);

      // 2) Create httpOnly session cookie on server
      const idToken = await userCredential.user.getIdToken();
      const sessionRes = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, rememberMe }),
      });
      if (!sessionRes.ok) throw new Error('Failed to create a secure session.');

      // 3) Hydrate server-managed cookies (optional)
      try {
        await fetch('/api/session', { method: 'GET', cache: 'no-store' });
        await new Promise((r) => setTimeout(r, 50));
      } catch (e) {
        console.warn('Session hydrate failed (continuing):', e);
      }

      // 4) Store profile in sessionStorage AND set readable cookies for SSR dashboard
      try {
        const maxAge = rememberMe ? 60 * 60 * 24 * 30 : 60 * 60 * 24; // 30d vs 1d
        const fullName = userProfile.full_name ?? '';
        const district = userProfile.district_code ?? '';
        const school = userProfile.school_code ?? '';
        const subAssigned = userProfile.sub_assigned ?? '';
        const phoneId = userProfile.Phone_ID ?? '';
        const role = (userProfile.role || '') as 'admin' | 'teacher' | 'parent' | 'substitute' | 'sub';

        // client snapshot
        sessionStorage.setItem('sa_profile', JSON.stringify({
          email: userProfile.email,
          fullName,
          role,
          districtCode: district,
          schoolCode: school,
          subAssigned,
          phoneId,
        }));

        // cookies read by server components (dashboard)
        setCookie('role', role, maxAge); // may be 'sub' or 'substitute' — dashboard normalizes
        setCookie('full_name', fullName, maxAge);
        setCookie('fullname', fullName, maxAge);
        setCookie('email', userProfile.email ?? email, maxAge);
        setCookie('district_code', district, maxAge);
        setCookie('school_code', school, maxAge);
        setCookie('sub_assigned', String(subAssigned), maxAge);
        setCookie('phone_id', phoneId, maxAge);
      } catch {
        /* non-fatal */
      }

      // 5) Go to dashboard (force the correct preview immediately)
      const r = (userProfile.role || '').toLowerCase();
      const view = r === 'substitute' || r === 'sub' ? 'sub' : r; // 👈 ensure sub lands on ?view=sub
      router.replace(`/dashboard?view=${encodeURIComponent(view)}`);
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (err?.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err?.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err?.code === 'auth/too-many-requests') setError('Too many attempts. Please try again later.');
      else setError(err?.message || 'Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  }, [formData.email, formData.password, rememberMe, router]);

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-50">
      {/* LEFT — Brand panel */}
      <section className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light via-brand-blue to-brand-dark" />
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-white/20 blur-3xl animate-pulse" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl animate-pulse [animation-delay:1.5s]" />
        <div className="pointer-events-none absolute top-1/2 left-1/4 h-32 w-32 rounded-full bg-white/10 blur-2xl animate-pulse [animation-duration:2.5s]" />

        <div className="relative z-10 w-full max-w-xl px-16 text-white">
          <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl backdrop-blur-xl bg-white/10 ring-1 ring-white/30 shadow-xl">
            <svg className="h-10 w-10" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold tracking-tight drop-shadow-sm">Safer Attendance</h2>
          <p className="mt-3 text-white/90 leading-relaxed">
            Ensuring safety one class at a time while promoting attendance through innovative technology.
          </p>
          <div className="mt-8 flex items-center gap-6 text-white/80">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-400 animate-pulse" />
              <span className="text-sm">Secure Login</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-sm">Real-time Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* RIGHT — Login card */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-brand-light to-brand-blue text-white shadow-lg">
              <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Safer Attendance</h2>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your dashboard</p>
            </header>

            {error && (
              <div role="alert" aria-live="polite" className="mb-6 rounded-xl border border-red-200 bg-red-50 p-4">
                <div className="flex items-center text-red-700">
                  <svg className="mr-2 h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                    <path
                      fillRule="evenodd"
                      d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <span className="text-sm">{error}</span>
                </div>
              </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Email */}
              <div>
                <label htmlFor="email" className="mb-2 block text-sm font-medium text-gray-700">
                  Email Address
                </label>
                <div className="relative">
                  <input
                    id="email"
                    name="email"
                    type="email"
                    autoComplete="email"
                    required
                    disabled={isLoading}
                    value={formData.email}
                    onChange={handleInputChange}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-11 text-gray-900 placeholder-gray-500 shadow-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
                    aria-invalid={!!error}
                  />
                  <svg className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M2.003 5.884L10 9.882l7.997-3.998A2 2 0 0016 4H4a2 2 0 00-1.997 1.884z" />
                    <path d="M18 8.118l-8 4-8-4V14a2 2 0 002 2h12a2 2 0 002-2V8.118z" />
                  </svg>
                </div>
              </div>

              {/* Password */}
              <div>
                <label htmlFor="password" className="mb-2 block text-sm font-medium text-gray-700">
                  Password
                </label>
                <div className="relative">
                  <input
                    id="password"
                    name="password"
                    type={showPassword ? 'text' : 'password'}
                    autoComplete="current-password"
                    required
                    disabled={isLoading}
                    value={formData.password}
                    onChange={handleInputChange}
                    placeholder="Enter your password"
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-11 pr-12 text-gray-900 placeholder-gray-500 shadow-sm transition focus:border-brand-blue focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:opacity-60"
                    aria-invalid={!!error}
                  />
                  <svg className="pointer-events-none absolute left-3 top-3.5 h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                    <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
                  </svg>

                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isLoading}
                    className="absolute right-2 top-1/2 -translate-y-1/2 inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-400 hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                  >
                    {showPassword ? (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path
                        fillRule="evenodd"
                        d="M3.707 2.293a1 1 0 00-1.414 1.414l14 14a1 1 0 001.414-1.414l-1.473-1.473A10.014 10.014 0 0019.542 10C18.268 5.943 14.478 3 10 3a9.958 9.958 0 00-4.512 1.074l-1.78-1.781zm4.261 4.26l1.514 1.515a2.003 2.003 0 012.45 2.45l1.514 1.514a4 4 0 00-5.478-5.478z"
                        clipRule="evenodd" /><path d="M12.454 16.697L9.75 13.992a4 4 0 01-3.742-3.741L2.335 6.578A9.98 9.98 0 00.458 10c1.274 4.057 5.065 7 9.542 7 .847 0 1.669-.105 2.454-.303z" /></svg>
                    ) : (
                      <svg className="h-5 w-5" viewBox="0 0 20 20" fill="currentColor"><path d="M10 12a2 2 0 100-4 2 2 0 000 4z" /><path
                        fillRule="evenodd"
                        d="M.458 10C1.732 5.943 5.522 3 10 3s8.268 2.943 9.542 7c-1.274 4.057-5.064 7-9.542 7S1.732 14.057.458 10zM14 10a4 4 0 11-8 0 4 4 0 018 0z"
                        clipRule="evenodd" /></svg>
                    )}
                  </button>
                </div>
              </div>

              {/* Remember / Forgot */}
              <div className="flex items-center justify-between">
                <label className="flex items-center">
                  <input
                    type="checkbox"
                    checked={rememberMe}
                    onChange={(e) => setRememberMe(e.target.checked)}
                    disabled={isLoading}
                    className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue/20"
                  />
                  <span className="ml-2 text-sm text-gray-600">Remember me</span>
                </label>
                <button
                  type="button"
                  disabled={isLoading}
                  className="text-sm text-brand-blue hover:text-brand-dark transition-colors disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-4 py-3 font-medium text-white shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-blue/20 disabled:cursor-not-allowed disabled:opacity-60"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing In…
                  </span>
                ) : (
                  'Sign In'
                )}
              </button>
            </form>

            {/* Footer */}
            <div className="mt-8 text-center">
              <p className="text-sm text-gray-500">
                Need help?{' '}
                <button className="text-brand-blue hover:text-brand-dark transition-colors">
                  Contact Support
                </button>
              </p>
            </div>
          </div>

          {/* Security note */}
          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <svg className="h-4 w-4" viewBox="0 0 20 20" fill="currentColor">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              <span>Secured with enterprise-grade encryption</span>
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
