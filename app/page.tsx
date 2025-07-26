'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { signInWithEmailAndPassword } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

export default function LoginPage() {
  const [formData, setFormData] = useState({ email: '', password: '' });
  const [showPassword, setShowPassword] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [error, setError] = useState('');
  const router = useRouter();

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      // Firebase Auth
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      // Firebase ID token
      const idToken = await userCredential.user.getIdToken();

      // Persist session via API route
      const sessionResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, rememberMe })
      });

      if (!sessionResponse.ok) {
        throw new Error('Failed to create session');
      }

      router.push('/dashboard');
    } catch (error: any) {
      // Map Firebase error codes to friendly messages
      switch (error?.code) {
        case 'auth/user-not-found':
          setError('No account found with this email address.');
          break;
        case 'auth/wrong-password':
          setError('Incorrect password.');
          break;
        case 'auth/invalid-email':
          setError('Invalid email address.');
          break;
        case 'auth/too-many-requests':
          setError('Too many failed attempts. Please try again later.');
          break;
        default:
          setError('Login failed. Please try again.');
      }
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gradient-to-br from-brand-blue via-brand-light to-white">
      {/* Left / Hero (hidden on mobile) */}
      <section
        aria-hidden="true"
        className="relative hidden lg:flex items-center justify-center p-12"
      >
        <div className="absolute inset-0">
          {/* Soft decorative glows */}
          <div className="absolute -top-10 -left-10 w-72 h-72 rounded-full bg-brand-dark/30 blur-3xl" />
          <div className="absolute -bottom-10 -right-10 w-80 h-80 rounded-full bg-brand-blue/30 blur-3xl" />
        </div>

        <div className="relative z-10 max-w-xl">
          <div className="inline-flex items-center justify-center w-16 h-16 rounded-2xl bg-white/70 shadow-xl ring-1 ring-white/60 backdrop-blur">
            <svg className="w-8 h-8 text-brand-blue" viewBox="0 0 24 24" fill="none">
              <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4M21 12a9 9 0 11-18 0 9 9 0 0118 0" />
            </svg>
          </div>

          <h1 className="mt-6 text-4xl font-bold text-gray-900">
            Safer Attendance
          </h1>
          <p className="mt-3 text-lg leading-7 text-gray-700">
            Ensuring safety one class at a time while promoting attendance. Sign in to manage students, teachers, and substitutes from a single, streamlined dashboard.
          </p>

          <ul className="mt-6 space-y-3 text-gray-700">
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-blue" />
              <span className="leading-6">Quick, secure access using your admin credentials.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-dark" />
              <span className="leading-6">Real-time role-based access controls.</span>
            </li>
            <li className="flex items-start gap-3">
              <span className="mt-1 inline-block h-2 w-2 rounded-full bg-brand-blue" />
              <span className="leading-6">Optimized for desktop, works great on tablet & mobile.</span>
            </li>
          </ul>
        </div>
      </section>

      {/* Right / Auth Card */}
      <section className="relative flex items-center justify-center p-6 sm:p-10">
        {/* Subtle background accents */}
        <div className="pointer-events-none absolute inset-0 opacity-10">
          <div className="absolute top-10 left-10 h-24 w-24 rounded-full bg-brand-dark blur-2xl" />
          <div className="absolute bottom-10 right-10 h-28 w-28 rounded-full bg-brand-blue blur-2xl" />
        </div>

        <div className="relative z-10 w-full max-w-md">
          <div className="rounded-2xl bg-white/90 backdrop-blur-md shadow-2xl ring-1 ring-black/5">
            <div className="px-6 py-7 sm:px-8 sm:py-9">
              <div className="mb-7 text-center">
                <h2 className="text-2xl font-semibold text-gray-900">Admin Sign In</h2>
                <p className="mt-1 text-sm text-gray-600">
                  Use your school email and password to continue.
                </p>
              </div>

              {/* Error */}
              {error && (
                <div
                  role="alert"
                  aria-live="polite"
                  className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
                >
                  {error}
                </div>
              )}

              <form onSubmit={handleSubmit} className="space-y-5" aria-busy={isLoading}>
                {/* Email */}
                <div className="space-y-2">
                  <label htmlFor="email" className="block text-sm font-medium text-gray-800">
                    Email address
                  </label>
                  <div className="relative">
                    <input
                      id="email"
                      name="email"
                      type="email"
                      inputMode="email"
                      autoComplete="username"
                      autoFocus
                      value={formData.email}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="admin@school.edu"
                      className="peer w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 text-gray-900 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                    />
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206A8.96 8.96 0 0112 21" />
                    </svg>
                  </div>
                </div>

                {/* Password */}
                <div className="space-y-2">
                  <label htmlFor="password" className="block text-sm font-medium text-gray-800">
                    Password
                  </label>
                  <div className="relative">
                    <input
                      id="password"
                      name="password"
                      type={showPassword ? 'text' : 'password'}
                      autoComplete="current-password"
                      value={formData.password}
                      onChange={handleInputChange}
                      disabled={isLoading}
                      placeholder="Enter your password"
                      className="peer w-full rounded-xl border border-gray-200 bg-gray-50 px-4 py-3 pl-12 pr-12 text-gray-900 outline-none transition focus:border-transparent focus:bg-white focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                    />
                    <svg
                      className="pointer-events-none absolute left-4 top-1/2 h-5 w-5 -translate-y-1/2 text-gray-400"
                      viewBox="0 0 24 24"
                      fill="none"
                      aria-hidden="true"
                    >
                      <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M12 15v2M6 21h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 10-8 0v4h8z" />
                    </svg>

                    <button
                      type="button"
                      onClick={() => setShowPassword(v => !v)}
                      aria-label={showPassword ? 'Hide password' : 'Show password'}
                      aria-pressed={showPassword}
                      disabled={isLoading}
                      className="absolute right-3 top-1/2 -translate-y-1/2 rounded-md p-2 text-gray-400 transition hover:text-gray-600 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                    >
                      {showPassword ? (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M10.584 10.587A3 3 0 0113.415 13.42M6.5 6.5C4.248 7.978 2.64 10.09 2 12c1.8 5 7 8 10 8 1.45 0 3.43-.57 5.5-1.9M14.12 9.88C13.555 9.315 12.8 9 12 9a3 3 0 00-3 3c0 .8.316 1.555.88 2.121" />
                        </svg>
                      ) : (
                        <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                          <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5s8.268 2.943 9.542 7C20.268 16.057 16.477 19 12 19S3.732 16.057 2.458 12z" />
                          <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="2" />
                        </svg>
                      )}
                    </button>
                  </div>
                </div>

                {/* Options */}
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <label className="inline-flex items-center">
                    <input
                      type="checkbox"
                      checked={rememberMe}
                      onChange={e => setRememberMe(e.target.checked)}
                      disabled={isLoading}
                      className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                    />
                    <span className="ml-2 text-sm text-gray-700">Remember me</span>
                  </label>

                  <button
                    type="button"
                    disabled={isLoading}
                    className="text-sm font-medium text-gray-800 underline-offset-4 hover:underline disabled:opacity-50"
                  >
                    Forgot password?
                    <span className="sr-only"> (opens password recovery)</span>
                  </button>
                </div>

                {/* Submit */}
                <button
                  type="submit"
                  disabled={isLoading || !formData.email || !formData.password}
                  className="relative inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-blue to-brand-dark px-4 py-3 font-semibold text-white shadow-lg transition hover:from-brand-dark hover:to-brand-blue hover:shadow-xl focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:cursor-not-allowed disabled:opacity-60"
                >
                  {isLoading ? (
                    <span className="flex items-center">
                      <span className="mr-2 inline-block h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                      Signing you in…
                    </span>
                  ) : (
                    <span className="flex items-center">
                      <svg className="mr-2 h-5 w-5" viewBox="0 0 24 24" fill="none" aria-hidden="true">
                        <path stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                      </svg>
                      Sign in to Dashboard
                    </span>
                  )}
                </button>
              </form>

              {/* Footer */}
              <div className="mt-8 border-t border-gray-200 pt-6 text-center">
                <p className="text-sm text-gray-600">
                  Need help? Contact{' '}
                  <button className="font-medium text-gray-800 underline-offset-4 hover:underline">
                    IT Support
                  </button>
                </p>
              </div>
            </div>
          </div>

          {/* Small print */}
          <p className="mt-6 text-center text-xs text-gray-500">
            By signing in you agree to the Acceptable Use Policy.
          </p>
        </div>
      </section>
    </main>
  );
}
