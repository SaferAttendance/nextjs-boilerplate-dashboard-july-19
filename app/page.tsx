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
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (error) setError('');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError('');

    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        formData.email,
        formData.password
      );

      const idToken = await userCredential.user.getIdToken();

      const sessionResponse = await fetch('/api/session', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ idToken, rememberMe }),
      });

      if (!sessionResponse.ok) throw new Error('Failed to create session');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Login error:', err);
      if (err?.code === 'auth/user-not-found') setError('No account found with this email.');
      else if (err?.code === 'auth/wrong-password') setError('Incorrect password.');
      else if (err?.code === 'auth/invalid-email') setError('Invalid email address.');
      else if (err?.code === 'auth/too-many-requests')
        setError('Too many attempts. Please try again later.');
      else setError('Login failed. Please try again.');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2 bg-gray-50">
      {/* Left: Brand / Illustration */}
      <section className="relative hidden lg:flex items-center justify-center overflow-hidden">
        {/* Gradient background */}
        <div className="absolute inset-0 bg-gradient-to-br from-brand-light via-brand-blue to-brand-dark" />

        {/* Soft glow decorations */}
        <div className="pointer-events-none absolute -top-24 -left-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        <div className="pointer-events-none absolute -bottom-24 -right-20 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl px-16 text-white">
          <div className="mb-8 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-white/15 ring-1 ring-white/30 shadow-lg backdrop-blur-sm">
            <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
            </svg>
          </div>
          <h2 className="text-4xl font-bold tracking-tight drop-shadow-sm">Safer Attendance</h2>
          <p className="mt-3 text-white/90 leading-relaxed">
            Ensuring safety one class at a time while promoting attendance.
          </p>
        </div>
      </section>

      {/* Right: Auth card */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md rounded-2xl bg-white p-8 shadow-xl ring-1 ring-black/5">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold text-gray-900">Sign in to Dashboard</h1>
            <p className="mt-2 text-sm text-gray-600">Admins only</p>
          </header>

          {error && (
            <div
              role="alert"
              className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
            >
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Email */}
            <div>
              <label htmlFor="email" className="mb-1 block text-sm font-medium text-gray-700">
                Email address
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
                  placeholder="admin@school.edu"
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 pl-11 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-brand-dark focus:ring-4 focus:ring-brand-blue/30 disabled:opacity-60"
                  aria-invalid={!!error}
                />
                <svg
                  className="pointer-events-none absolute left-3 top-1/2 -translate-y-1/2 h-5 w-5 text-gray-400"
                  viewBox="0 0 24 24"
                  fill="none"
                  stroke="currentColor"
                >
                  <path
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    d="M16 12a4 4 0 10-8 0 4 4 0 008 0zm0 0v1.5a2.5 2.5 0 005 0V12a9 9 0 10-9 9m4.5-1.206a8.959 8.959 0 01-4.5 1.207"
                  />
                </svg>
              </div>
            </div>

            {/* Password */}
            <div>
              <label htmlFor="password" className="mb-1 block text-sm font-medium text-gray-700">
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
                  className="block w-full rounded-xl border border-gray-200 bg-gray-50/80 px-4 py-3 pr-12 text-gray-900 placeholder-gray-400 shadow-sm outline-none transition focus:border-brand-dark focus:ring-4 focus:ring-brand-blue/30 disabled:opacity-60"
                  aria-invalid={!!error}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-2 my-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-brand-blue disabled:opacity-50"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c3.87 0 7.16 2.69 8 6-.31 1.25-1 2.39-1.96 3.3M6.62 6.62C4.77 7.77 3.34 9.67 3 12c.84 3.31 4.13 6 8 6 1.02 0 2-.18 2.9-.51"
                      />
                    </svg>
                  ) : (
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path
                        strokeWidth="2"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
                      />
                      <circle cx="12" cy="12" r="3" strokeWidth="2" />
                    </svg>
                  )}
                </button>
              </div>
            </div>

            {/* Remember / Forgot */}
            <div className="flex items-center justify-between">
              <label className="inline-flex items-center gap-2 text-sm text-gray-700">
                <input
                  type="checkbox"
                  checked={rememberMe}
                  onChange={(e) => setRememberMe(e.target.checked)}
                  disabled={isLoading}
                  className="h-4 w-4 rounded border-gray-300 text-brand-blue focus:ring-brand-blue"
                />
                Remember me
              </label>

              <button
                type="button"
                disabled={isLoading}
                className="text-sm font-medium text-brand-dark hover:text-brand-blue disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="inline-flex w-full items-center justify-center rounded-xl bg-gradient-to-r from-brand-dark to-brand-blue px-4 py-3 font-semibold text-white shadow-lg transition hover:shadow-xl focus:outline-none focus:ring-4 focus:ring-brand-blue/40 active:scale-[0.99] disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing you in…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      d="M11 16l-4-4m0 0l4-4m-4 4h14"
                    />
                  </svg>
                  Sign in to Dashboard
                </span>
              )}
            </button>
          </form>

          <footer className="mt-8 border-t pt-6 text-center text-sm text-gray-500">
            Need help? Contact{' '}
            <button className="font-medium text-brand-dark hover:text-brand-blue">IT Support</button>
          </footer>
        </div>
      </section>
    </main>
  );
}
