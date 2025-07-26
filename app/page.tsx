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
      {/* Left: Brand / gradient (hidden on small screens) */}
      <section className="relative hidden lg:flex items-center justify-center overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-blue-400 via-blue-500 to-blue-800" />
        {/* soft blobs */}
        <div className="absolute -top-24 -left-20 h-96 w-96 rounded-full bg-white/20 blur-3xl" />
        <div className="absolute -bottom-24 -right-20 h-[28rem] w-[28rem] rounded-full bg-white/10 blur-3xl" />

        <div className="relative z-10 w-full max-w-xl px-16 text-white">
          <div className="mb-8 inline-flex h-20 w-20 items-center justify-center rounded-3xl bg-white/10 ring-1 ring-white/20 backdrop-blur-xl">
            {/* shield/check icon */}
            <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="currentColor" className="text-white">
              <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
          </div>

          <h2 className="text-5xl font-bold tracking-tight mb-4 drop-shadow-lg">Safer Attendance</h2>
          <p className="text-lg text-white/90 leading-relaxed mb-8">
            Ensuring safety one class at a time while promoting attendance through innovative technology.
          </p>

          <div className="flex items-center gap-6 text-white/85">
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-green-300 animate-pulse" />
              <span className="text-sm">Secure Login</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2 w-2 rounded-full bg-blue-300 animate-pulse" />
              <span className="text-sm">Real‑time Data</span>
            </div>
          </div>
        </div>
      </section>

      {/* Right: Auth card */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md">
          {/* Mobile brand header */}
          <div className="lg:hidden text-center mb-8">
            <div className="mx-auto mb-4 inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gradient-to-r from-blue-400 to-blue-600 text-white shadow-lg">
              <svg width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h2 className="text-2xl font-bold text-gray-900">Safer Attendance</h2>
          </div>

          <div className="rounded-3xl bg-white p-8 shadow-2xl ring-1 ring-black/5">
            <header className="mb-8 text-center">
              <h1 className="text-3xl font-bold text-gray-900 mb-2">Welcome Back</h1>
              <p className="text-gray-600">Sign in to your admin dashboard</p>
            </header>

            {error && (
              <div role="alert" className="mb-6 rounded-xl border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">
                {error}
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-11 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    placeholder="admin@example.com"
                    aria-invalid={!!error}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="absolute left-3 top-3.5 text-gray-400"
                  >
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
                    className="w-full rounded-xl border border-gray-300 bg-white px-4 py-3 pl-11 pr-11 text-gray-900 placeholder-gray-500 outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/20 disabled:opacity-50"
                    placeholder="Enter your password"
                    aria-invalid={!!error}
                  />
                  <svg
                    width="18"
                    height="18"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                    className="absolute left-3 top-3.5 text-gray-400"
                  >
                    <path
                      fillRule="evenodd"
                      d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                      clipRule="evenodd"
                    />
                  </svg>
                  <button
                    type="button"
                    onClick={() => setShowPassword((s) => !s)}
                    disabled={isLoading}
                    aria-label={showPassword ? 'Hide password' : 'Show password'}
                    className="absolute right-3 top-3.5 inline-flex h-6 w-6 items-center justify-center text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500/30"
                  >
                    {showPassword ? (
                      // eye-off
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18" />
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M10.58 10.58A2 2 0 0112 10c3.87 0 7.16 2.69 8 6-.31 1.25-1 2.39-1.96 3.3M6.62 6.62C4.77 7.77 3.34 9.67 3 12c.84 3.31 4.13 6 8 6 1.02 0 2-.18 2.9-.51" />
                      </svg>
                    ) : (
                      // eye
                      <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                        <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
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
                    className="h-4 w-4 rounded border-gray-300 text-blue-600 focus:ring-blue-500/30"
                  />
                  Remember me
                </label>
                <button
                  type="button"
                  disabled={isLoading}
                  className="text-sm font-medium text-blue-700 hover:text-blue-800 disabled:opacity-50"
                >
                  Forgot password?
                </button>
              </div>

              {/* Submit */}
              <button
                type="submit"
                disabled={isLoading || !formData.email || !formData.password}
                className="w-full rounded-xl bg-gradient-to-r from-blue-600 to-blue-700 px-4 py-3 font-semibold text-white shadow-lg hover:brightness-110 focus:outline-none focus:ring-2 focus:ring-blue-500/30 disabled:cursor-not-allowed disabled:opacity-50"
              >
                {isLoading ? (
                  <span className="inline-flex items-center gap-2">
                    <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                    Signing you in…
                  </span>
                ) : (
                  <span className="inline-flex items-center gap-2">
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                    </svg>
                    Sign In
                  </span>
                )}
              </button>
            </form>

            <footer className="mt-8 border-t pt-6 text-center text-sm text-gray-500">
              Need help?{' '}
              <button className="font-medium text-blue-700 hover:text-blue-800">Contact Support</button>
            </footer>
          </div>

          <div className="mt-6 text-center">
            <div className="inline-flex items-center gap-2 text-sm text-gray-500">
              <svg width="16" height="16" viewBox="0 0 20 20" fill="currentColor" className="text-gray-400">
                <path
                  fillRule="evenodd"
                  d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z"
                  clipRule="evenodd"
                />
              </svg>
              Secured with enterprise‑grade encryption
            </div>
          </div>
        </div>
      </section>
    </main>
  );
}
