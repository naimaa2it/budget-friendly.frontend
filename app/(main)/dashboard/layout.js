"use client";

import React, { useEffect, Suspense } from "react";
import { useRouter } from "next/navigation";
import Sidebar from "@/components/dashboard/Sidebar";
import NotificationBell from "@/components/dashboard/NotificationBell";
import { useUser } from "@/components/context/UserContext";
import { hasPermission } from "@/lib/permissions";
import { useGlobalBarcodeScan } from "@/hooks/useGlobalBarcodeScan";

const API_URL =
  process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

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

  // NOTE: we intentionally do NOT auto-call refreshUser() here. The
  // UserProvider already loads the session once on mount, and re-fetching from
  // this layout created an infinite loop: refreshUser toggles `loading`, and an
  // effect that depends on `loading` re-fires every time it toggles, hammering
  // /api/auth/me. A genuinely logged-out user is handled by the redirect below.

  // Once the session check has finished with no logged-in user, send them to
  // the admin login page (not the storefront homepage).
  useEffect(() => {
    if (!loading && !user) router.replace("/auth/adminlogin");
  }, [loading, user, router]);

  // ── Still fetching session, or logged out and being redirected ────────────
  // While the session is loading *or* there is no user (e.g. right after a
  // sign-out, when the redirect effect above is sending us to the admin login
  // page) we show a single quiet spinner. Rendering the same placeholder in
  // both states means logging out slides straight to /auth/adminlogin with no
  // "Session expired" card flashing in between — no blink, no glitch.
  if (loading || !user) {
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

  // ── Moderator without dashboard access ─────────────────────────────────────
  // Admins always pass. A moderator can only enter the dashboard when an admin
  // has granted the "View dashboard" permission in dashboard/authorized/. Until
  // then the whole dashboard (every sub-page) stays locked.
  if (!hasPermission(user, "dashboard.view")) {
    const signOutAndLeave = async () => {
      try {
        await fetch(`${API_URL}/api/auth/logout`, {
          method: "POST",
          credentials: "include",
        });
      } catch {
        // ignore
      }
      await refreshUser();
      router.replace("/auth/adminlogin");
    };
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">
          Your account doesn&apos;t have dashboard access. Please contact an
          administrator to be granted access.
        </p>
        <button
          onClick={signOutAndLeave}
          className="mt-4 px-4 py-2 bg-gray-800 text-white rounded text-sm hover:bg-gray-700 transition"
        >
          Sign out
        </button>
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
