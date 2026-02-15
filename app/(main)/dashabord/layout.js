"use client";

import React, { useEffect } from 'react';
import Sidebar from '@/components/dashbaord/Sidebar';
import { useUser } from '@/components/context/UserContext';

export default function DashboardLayout({ children }) {
  const { user, refreshUser } = useUser();

  useEffect(() => { if (!user) refreshUser(); }, [user, refreshUser]);

  if (!user) return <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">Loading user…</div>;
  if (!['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">You must be an admin or moderator to view this area.</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-7xl mx-auto grid grid-cols-[auto_1fr] gap-6">
        <Sidebar />
        <main className="p-6">{children}</main>
      </div>
    </div>
  );
}
