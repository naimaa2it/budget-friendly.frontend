"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const ADDONS_META = [
  {
    key: "facebookPixel",
    name: "Facebook Pixel",
    description: "Track conversions, optimize ads and build audiences for your Facebook campaigns.",
    href: "/dashboard/addons/facebook-pixel",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#1877F2" aria-hidden="true">
        <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
      </svg>
    ),
    color: "bg-blue-50 border-blue-200",
  },
  {
    key: "googleTagManager",
    name: "Google Tag Manager",
    description: "Manage all your marketing tags without editing code using Google Tag Manager.",
    href: "/dashboard/addons/google-tag-manager",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#4285F4" strokeWidth="2" aria-hidden="true">
        <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
      </svg>
    ),
    color: "bg-indigo-50 border-indigo-200",
  },
  {
    key: "googleAnalytics4",
    name: "Google Analytics 4",
    description: "Get detailed insights into your store traffic and customer behavior with GA4.",
    href: "/dashboard/addons/google-analytics",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <rect x="3" y="12" width="4" height="9" fill="#F4B400" rx="1" />
        <rect x="10" y="6" width="4" height="15" fill="#0F9D58" rx="1" />
        <rect x="17" y="2" width="4" height="19" fill="#4285F4" rx="1" />
      </svg>
    ),
    color: "bg-green-50 border-green-200",
  },
  {
    key: "fakeOrderProtection",
    name: "Fake Order Protection",
    description: "Protect your store from fraudulent orders using phone, IP and device fingerprinting.",
    href: "/dashboard/addons/fake-order-protection",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" stroke="#F59E0B" strokeWidth="2" aria-hidden="true">
        <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z" />
        <path d="M9 12l2 2 4-4" />
      </svg>
    ),
    color: "bg-amber-50 border-amber-200",
  },
  {
    key: "tiktokPixel",
    name: "TikTok Pixel",
    description: "Track ad performance and optimize campaigns on TikTok with server-side events.",
    href: "/dashboard/addons/tiktok-pixel",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="#010101" aria-hidden="true">
        <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.52V6.94a4.85 4.85 0 01-1.02-.25z" />
      </svg>
    ),
    color: "bg-gray-50 border-gray-200",
  },
  {
    key: "googleAdsense",
    name: "Google AdSense",
    description: "Monetize your store by displaying Google ads. Auto Ads support included.",
    href: "/dashboard/addons/google-adsense",
    icon: (
      <svg className="h-8 w-8" viewBox="0 0 24 24" fill="none" aria-hidden="true">
        <circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.12" />
        <path d="M6 12a6 6 0 1112 0" stroke="#4285F4" strokeWidth="2" strokeLinecap="round" />
        <path d="M12 6v12M6 12h12" stroke="#34A853" strokeWidth="1.5" strokeLinecap="round" opacity="0.8" />
        <circle cx="12" cy="12" r="2.5" fill="#FBBC05" />
      </svg>
    ),
    color: "bg-blue-50 border-blue-200",
  },
];

export default function AddonsPage() {
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("all");
  const router = useRouter();

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setSettings(b.settings || {}))
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const isInstalled = (key) => settings?.[key]?.installed === true;

  const handleUninstall = async (key) => {
    if (!confirm("Uninstall this addon?")) return;
    const updated = { [key]: { ...settings[key], installed: false, active: false } };
    await fetch(`${API}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updated),
    });
    setSettings((s) => ({ ...s, [key]: { ...s[key], installed: false, active: false } }));
  };

  const handleInstall = async (key, href) => {
    const updated = { [key]: { ...settings?.[key], installed: true } };
    await fetch(`${API}/api/admin/settings`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      credentials: "include",
      body: JSON.stringify(updated),
    });
    setSettings((s) => ({ ...s, [key]: { ...s?.[key], installed: true } }));
    router.push(href);
  };

  const visibleAddons = ADDONS_META.filter((a) => {
    if (activeTab === "installed") return isInstalled(a.key);
    if (activeTab === "more") return !isInstalled(a.key);
    return true;
  });

  if (loading) {
    return <div className="flex items-center justify-center py-24 text-gray-400">Loading addons…</div>;
  }

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <h1 className="text-2xl font-bold text-gray-900">Addons</h1>
        <p className="text-sm text-gray-500 mt-1">Extend your store with powerful integrations</p>
      </div>

      {/* Tabs */}
      <div className="flex gap-6 border-b border-gray-200 mb-6">
        {[
          { key: "all", label: "All" },
          { key: "installed", label: "Installed" },
          { key: "more", label: "More Addons" },
        ].map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`pb-3 text-sm font-medium transition border-b-2 -mb-px ${
              activeTab === tab.key
                ? "border-gray-900 text-gray-900"
                : "border-transparent text-gray-500 hover:text-gray-700"
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Addon list */}
      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {visibleAddons.length === 0 && (
          <div className="py-16 text-center text-gray-400 text-sm">No addons found.</div>
        )}
        {visibleAddons.map((addon) => {
          const installed = isInstalled(addon.key);
          return (
            <div key={addon.key} className="flex items-center gap-4 px-6 py-4">
              <div className={`flex h-12 w-12 shrink-0 items-center justify-center rounded-xl border ${addon.color}`}>
                {addon.icon}
              </div>
              <div className="flex-1 min-w-0">
                <Link
                  href={addon.href}
                  className="font-semibold text-gray-900 hover:text-pink-600 transition text-sm"
                >
                  {addon.name}
                </Link>
                <p className="text-xs text-gray-500 mt-0.5 truncate">{addon.description}</p>
              </div>
              <div className="flex items-center gap-2 shrink-0">
                {installed && (
                  <Link
                    href={addon.href}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-gray-50 transition"
                  >
                    Configure
                  </Link>
                )}
                {installed ? (
                  <button
                    onClick={() => handleUninstall(addon.key)}
                    className="px-3 py-1.5 rounded-lg border border-gray-200 text-xs font-medium text-gray-700 hover:bg-red-50 hover:border-red-200 hover:text-red-600 transition"
                  >
                    Uninstall
                  </button>
                ) : (
                  <button
                    onClick={() => handleInstall(addon.key, addon.href)}
                    className="px-3 py-1.5 rounded-lg bg-gray-900 text-xs font-medium text-white hover:bg-gray-700 transition"
                  >
                    Install
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
