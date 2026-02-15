"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useUser } from '@/components/context/UserContext';

export default function Dashboard() {
  const { user, refreshUser } = useUser();
  const router = useRouter();

  useEffect(() => {
    if (!user) refreshUser();
  }, []);

  // while user is loading, show placeholder
  if (!user) return (
    <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">Loading user…</div>
  );

  if (!['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">You must be an admin or moderator to view this page.</p>
        <div className="mt-4 flex justify-center gap-3">
          <a href="/adminlogin" className="px-4 py-2 bg-indigo-600 text-white rounded">Go to admin login</a>
          <a href="/" className="px-4 py-2 border rounded text-sm">Return to site</a>
        </div>
      </div>
    );
  }

  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const handleLogout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, { method: 'POST', credentials: 'include' });
    } catch (err) {
      // ignore
    }
    await refreshUser();
    router.push('/');
  };

  return (
    <div className="max-w-5xl mx-auto mt-12 p-6 bg-white rounded shadow">
      <div className="flex justify-between items-start gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Admin Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">Welcome back, <strong>{user.name || user.email}</strong> — you are signed in as <em>{user.role}</em>.</p>
        </div>
        <div className="flex items-center gap-2">
          <button onClick={handleLogout} className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded">Sign out</button>
          <a href="/" className="px-3 py-2 border rounded text-sm">View site</a>
        </div>
      </div>

      {user.isLocked && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          Your account is currently locked. Contact a super-admin to unlock or try again later.
        </div>
      )}

      {!user.isActive && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          Your admin account has been disabled. Contact the super-admin to reactivate your account.
        </div>
      )}

      <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="p-4 border rounded hover:shadow-sm">
          <h3 className="font-medium">Users</h3>
          <p className="text-sm text-gray-600 mt-2">Placeholder: list/manage users here.</p>
          <div className="mt-3">
            <button className="px-3 py-2 bg-indigo-600 text-white rounded text-sm">Manage users</button>
          </div>
        </div>
        <div className="p-4 border rounded hover:shadow-sm">
          <h3 className="font-medium">Site settings</h3>
          <p className="text-sm text-gray-600 mt-2">Placeholder: admin controls and analytics.</p>
          <div className="mt-3">
            <button className="px-3 py-2 border rounded text-sm">Open settings</button>
          </div>
        </div>
      </div>
    </div>
  );
}
