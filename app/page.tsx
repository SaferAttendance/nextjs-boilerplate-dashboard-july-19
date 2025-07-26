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
    <main className="min-h-screen grid grid-cols-1 lg:grid-cols-2">
      {/* Left: Illustration / brand (hidden on small screens) */}
      <section className="relative hidden lg:block">
        <div className="absolute inset-0 bg-gradient-to-br from-[color:var(--brand-light)] via-white to-white" />
        <div className="relative h-full flex items-center justify-center p-16">
          <div className="max-w-md">
            <div className="mb-8 inline-flex h-14 w-14 items-center justify-center rounded-2xl bg-[color:var(--brand-blue)] text-white shadow-lg">
              {/* simple check icon */}
              <svg className="h-7 w-7" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
            </div>
            <h2 className="text-3xl font-bold tracking-tight mb-3">Safer Attendance</h2>
            <p className="text-gray-600 leading-relaxed">
              Ensuring safety one class at a time while promoting attendance.
            </p>
          </div>
        </div>
      </section>

      {/* Right: Auth card */}
      <section className="flex items-center justify-center p-6 sm:p-10">
        <div className="w-full max-w-md card p-8">
          <header className="mb-8 text-center">
            <h1 className="text-2xl font-bold">Sign in to Dashboard</h1>
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
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                disabled={isLoading}
                value={formData.email}
                onChange={handleInputChange}
                className="input"
                placeholder="admin@school.edu"
                aria-invalid={!!error}
              />
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
                  className="input pr-12"
                  placeholder="Enter your password"
                  aria-invalid={!!error}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  disabled={isLoading}
                  className="absolute inset-y-0 right-3 my-auto inline-flex h-9 w-9 items-center justify-center rounded-md text-gray-500 hover:text-gray-700 focus:outline-none focus:ring-2 focus:ring-[color:var(--brand-blue)]"
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    /* eye-off */
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                      <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M3 3l18 18M9.88 9.88A3 3 0 0112 9c3.87 0 7.16 2.69 8 6-.31 1.25-1 2.39-1.96 3.3M6.62 6.62C4.77 7.77 3.34 9.67 3 12c.84 3.31 4.13 6 8 6 1.02 0 2-.18 2.9-.51" />
                    </svg>
                  ) : (
                    /* eye */
                    <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
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
                  className="h-4 w-4 rounded border-gray-300 text-[color:var(--brand-blue)] focus:ring-[color:var(--brand-blue)]"
                />
                Remember me
              </label>

              <button
                type="button"
                disabled={isLoading}
                className="text-sm font-medium text-[color:var(--brand-dark)] hover:text-[color:var(--brand-blue)] disabled:opacity-50"
              >
                Forgot password?
              </button>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isLoading || !formData.email || !formData.password}
              className="btn-primary w-full"
            >
              {isLoading ? (
                <span className="inline-flex items-center gap-2">
                  <span className="h-5 w-5 animate-spin rounded-full border-2 border-white border-t-transparent" />
                  Signing you in…
                </span>
              ) : (
                <span className="inline-flex items-center gap-2">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor">
                    <path strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" d="M11 16l-4-4m0 0l4-4m-4 4h14" />
                  </svg>
                  Sign in to Dashboard
                </span>
              )}
            </button>
          </form>

          <footer className="mt-8 border-t pt-6 text-center text-sm text-gray-500">
            Need help? Contact{' '}
            <button className="font-medium text-[color:var(--brand-dark)] hover:text-[color:var(--brand-blue)]">
              IT Support
            </button>
          </footer>
        </div>
      </section>
    </main>
  );
}
