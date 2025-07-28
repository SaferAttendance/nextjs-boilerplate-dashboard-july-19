'use client';

import * as React from 'react';
import { useRouter } from 'next/navigation';
import { signOut } from 'firebase/auth';
import { auth } from '@/lib/firebaseClient';

type Props = { className?: string };

export default function LogoutButton({ className }: Props) {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);

  const handleLogout = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // Clear httpOnly session cookies on the server
      await fetch('/api/session', { method: 'DELETE' });
      // Also sign out the Firebase client (non-fatal if it fails)
      try { await signOut(auth); } catch {}
    } finally {
      router.replace('/admin/login');
      setLoading(false);
    }
  };

  return (
    <button
      type="button"
      onClick={handleLogout}
      disabled={loading}
      className={
        className ??
        'rounded-md bg-gray-900 px-3 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-60'
      }
      aria-label="Log out"
    >
      {loading ? 'Signing out…' : 'Log out'}
    </button>
  );
}
