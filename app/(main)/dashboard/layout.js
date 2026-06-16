"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useUser } from "@/components/context/UserContext";
import { useGlobalBarcodeScan } from "@/hooks/useGlobalBarcodeScan";

export default function DashboardLayout({ children }) {
  const { user, loading, refreshUser } = useUser();
  const router = useRouter();
  const [mobileSidebarOpen, setMobileSidebarOpen] = React.useState(false);
  const [collapsed, setCollapsed] = React.useState(false);

  const scanEnabled = !!user && ["admin", "moderator"].includes(user.role);
  useGlobalBarcodeScan(scanEnabled);

  const goBack = () => {
    if (typeof window !== "undefined" && window.history.length > 1)
      router.back();
    else router.push("/dashboard");
  };

  // Refresh user data if it hasn't been loaded yet
  useEffect(() => {
    if (!user && !loading) refreshUser();
  }, [user, loading, refreshUser]);

  // ── Still fetching session ────────────────────────────────────────────────
  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="flex flex-col items-center gap-4">
          <svg
            className="animate-spin w-10 h-10 text-gray-400"
            viewBox="0 0 24 24"
            fill="none"
          >
            <circle
              className="opacity-25"
              cx="12"
              cy="12"
              r="10"
              stroke="currentColor"
              strokeWidth="4"
            />
            <path
              className="opacity-75"
              fill="currentColor"
              d="M4 12a8 8 0 018-8v8H4z"
            />
          </svg>
          <p className="text-sm text-gray-400">Please wait…</p>
        </div>
      </div>
    );
  }

  // ── Not logged in ─────────────────────────────────────────────────────────
  if (!user) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-lg font-semibold text-gray-800 mb-2">
          Session expired
        </h2>
        <p className="text-sm text-gray-500 mb-4">
          Please log in to access the dashboard.
        </p>
        <button
          onClick={() => router.push("/")}
          className="px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition"
        >
          Go to Homepage
        </button>
      </div>
    );
  }

  // ── Wrong role ────────────────────────────────────────────────────────────
  if (!["admin", "moderator"].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">
          You must be an admin or moderator to view this area.
        </p>
      </div>
    );
  }

  // ── Dashboard ─────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50">
      <div
        className={`w-full md:grid gap-6 transition-all duration-300 ${
          collapsed
            ? "md:grid-cols-[76px_minmax(0,1fr)]"
            : "md:grid-cols-[clamp(16rem,18vw,19rem)_minmax(0,1fr)]"
        }`}
      >
        <Suspense fallback={null}>
          <div className="print:hidden">
            <Sidebar
              collapsed={collapsed}
              setCollapsed={setCollapsed}
              mobileOpen={mobileSidebarOpen}
              onClose={() => setMobileSidebarOpen(false)}
            />
          </div>
        </Suspense>
        <main className="w-full min-w-0 p-2 md:p-4 lg:p-6 xl:p-8">
          <div className="print:hidden mb-6 flex items-center justify-between">
            <div className="flex items-center gap-2">
              {/* hamburger for mobile */}
              <button
                className="md:hidden p-2"
                onClick={() => setMobileSidebarOpen(true)}
                aria-label="Open menu"
              >
                <svg
                  xmlns="http://www.w3.org/2000/svg"
                  className="h-6 w-6"
                  fill="none"
                  viewBox="0 0 24 24"
                  stroke="currentColor"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M4 6h16M4 12h16M4 18h16"
                  />
                </svg>
              </button>
              <button
                type="button"
                onClick={goBack}
                className="inline-flex items-center gap-2 px-3 py-1 border rounded text-sm"
              >
                <span className="text-sm">←</span>
                <span>Back</span>
              </button>
            </div>
            <div className="flex items-center gap-2">
              <NotificationBell />
            </div>
          </div>
          {children}
        </main>
      </div>
    </div>
  );
}
