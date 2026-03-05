"use client";

import React, { useEffect } from 'react';
import { useRouter } from 'next/navigation';
import Sidebar from '@/components/dashboard/Sidebar';
import { useUser } from '@/components/context/UserContext';

export default function DashboardLayout({ children }) {
  const { user, refreshUser } = useUser();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const goBack = () => {
    if (typeof window !== 'undefined' && window.history.length > 1) router.back();
    else router.push('/dashabord');
  };

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
      <div className="max-w-7xl mx-auto md:grid md:grid-cols-[auto_1fr] gap-6">
        <Sidebar mobileOpen={mobileSidebarOpen} onClose={() => setMobileSidebarOpen(false)} />
        <main className="p-6">
          <div className="mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* hamburger for mobile */}
              <button className="md:hidden p-2" onClick={() => setMobileSidebarOpen(true)} aria-label="Open menu">
                <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                </svg>
              </button>
              <button type="button" onClick={goBack} className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm">
                <span className="text-sm">←</span>
                <span>Back</span>
              </button>
            </div>
            <div>{/* breadcrumb / page-title slot (keeps layout stable) */}</div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
