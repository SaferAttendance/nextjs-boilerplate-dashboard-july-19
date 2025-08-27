'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

type AuthProfile = {
  token: string;
  role: 'SUB' | string;
  first_name: string;
  last_name: string;
  email: string;
};

const API_BASE = process.env.NEXT_PUBLIC_XANO_BASE as string;
const ENDPOINTS = {
  registerSub: '/auth/register_sub', // should add user to universal-allowed on Xano
  login: '/auth/login',
};

async function api<T>(path: string, init?: RequestInit): Promise<T> {
  const res = await fetch(`${API_BASE}${path}`, {
    ...init,
    headers: { 'Content-Type': 'application/json', ...(init?.headers || {}) },
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data?.message || 'Request failed');
  return data as T;
}

export default function SubAuthPage() {
  const router = useRouter();
  const [busy, setBusy] = useState(false);
  const [msg, setMsg] = useState<{ kind: 'ok' | 'err'; text: string } | null>(null);

  async function onLogin(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    try {
      const p = await api<AuthProfile>(ENDPOINTS.login, {
        method: 'POST',
        body: JSON.stringify({
          email: fd.get('email'),
          password: fd.get('password'),
        }),
      });
      if (p.role !== 'SUB') throw new Error('This portal is for substitute teachers only.');
      localStorage.setItem('authToken', p.token);
      localStorage.setItem('userProfile', JSON.stringify(p));
      router.push('/sub/districts'); // next step: choose districts / request access
    } catch (err: any) {
      setMsg({ kind: 'err', text: err.message || 'Login failed' });
    } finally {
      setBusy(false);
    }
  }

  async function onRegister(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setMsg(null);
    setBusy(true);
    const fd = new FormData(e.currentTarget);
    const pwd = String(fd.get('password') || '');
    if (pwd.length < 8) {
      setBusy(false);
      return setMsg({ kind: 'err', text: 'Password must be at least 8 characters.' });
    }
    try {
      const p = await api<AuthProfile>(ENDPOINTS.registerSub, {
        method: 'POST',
        body: JSON.stringify({
          first_name: fd.get('first_name'),
          last_name: fd.get('last_name'),
          email: fd.get('email'),
          password: pwd,
          phone: fd.get('phone'),
          role: 'SUB', // backend should place into universal allowed users
        }),
      });
      localStorage.setItem('authToken', p.token);
      localStorage.setItem('userProfile', JSON.stringify(p));
      router.push('/sub/districts');
    } catch (err: any) {
      setMsg({ kind: 'err', text: err.message || 'Registration failed' });
    } finally {
      setBusy(false);
    }
  }

  return (
    <main className="min-h-screen bg-gradient-to-br from-indigo-400 to-purple-600">
      <header className="py-6">
        <div className="mx-auto max-w-6xl px-4 flex items-center gap-3">
          <div className="w-10 h-10 bg-white rounded-xl grid place-items-center shadow-lg">
            <svg className="w-6 h-6 text-blue-600" viewBox="0 0 24 24" fill="none" stroke="currentColor">
              <path d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"/>
            </svg>
          </div>
          <div>
            <h1 className="text-xl font-bold text-white">Safer Attendance</h1>
            <p className="text-blue-100 text-sm">Substitute Teacher Portal</p>
          </div>
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-4 pb-16">
        {msg && (
          <div className={`mb-6 rounded-lg px-4 py-3 text-white ${msg.kind === 'ok' ? 'bg-emerald-600' : 'bg-rose-600'}`}>
            {msg.text}
          </div>
        )}

        <section className="grid grid-cols-1 lg:grid-cols-2 gap-8">
          {/* Sign In */}
          <div className="rounded-2xl bg-white/95 backdrop-blur border p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Sign In</h3>
            <p className="text-gray-600 mb-6">Already have an account?</p>
            <form onSubmit={onLogin} className="space-y-4">
              <input name="email" type="email" required placeholder="your.email@example.com"
                     className="w-full rounded-lg border px-4 py-3" />
              <input name="password" type="password" required placeholder="••••••••"
                     className="w-full rounded-lg border px-4 py-3" />
              <button disabled={busy}
                      className="w-full rounded-lg bg-blue-600 text-white py-3 disabled:opacity-60">
                {busy ? 'Signing in…' : 'Sign In'}
              </button>
            </form>
          </div>

          {/* Create Account */}
          <div className="rounded-2xl bg-white/95 backdrop-blur border p-8 shadow-xl">
            <h3 className="text-2xl font-bold mb-2 text-gray-900">Create Account</h3>
            <p className="text-gray-600 mb-6">New to our platform?</p>
            <form onSubmit={onRegister} className="space-y-4">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                <input name="first_name" required placeholder="First name" className="w-full rounded-lg border px-4 py-3" />
                <input name="last_name" required placeholder="Last name" className="w-full rounded-lg border px-4 py-3" />
              </div>
              <input name="email" type="email" required placeholder="your.email@example.com"
                     className="w-full rounded-lg border px-4 py-3" />
              <input name="password" type="password" minLength={8} required placeholder="Password (min 8)"
                     className="w-full rounded-lg border px-4 py-3" />
              <input name="phone" type="tel" required placeholder="(555) 123-4567"
                     className="w-full rounded-lg border px-4 py-3" />
              <button disabled={busy}
                      className="w-full rounded-lg bg-emerald-500 text-white py-3 disabled:opacity-60">
                {busy ? 'Creating account…' : 'Create Account'}
              </button>
            </form>
          </div>
        </section>

        <p className="mt-8 text-center text-sm text-blue-100">
          By creating an account you agree to be added to the district’s universal allowed users for substitute access.
        </p>
      </div>
    </main>
  );
}
