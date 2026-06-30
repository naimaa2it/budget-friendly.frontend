"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input
        type="checkbox"
        className="sr-only peer"
        checked={checked}
        onChange={onChange}
      />
      <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-gray-900 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

const PAGE_OPTIONS = [
  { key: "homepage", label: "Homepage", desc: "Main landing page (/)" },
  {
    key: "productPage",
    label: "Product Pages",
    desc: "Individual product detail pages",
  },
  {
    key: "categoryPage",
    label: "Category Pages",
    desc: "Product listing & category pages",
  },
  {
    key: "blogPage",
    label: "Blog / Tag Pages",
    desc: "Blog posts and tag collection pages",
  },
];

export default function GoogleAdsenseForm() {
  const router = useRouter();
  const [cfg, setCfg] = useState({
    publisherId: "",
    adSlotId: "",
    autoAds: false,
    active: false,
    installed: true,
    pageSettings: {
      homepage: true,
      productPage: true,
      categoryPage: true,
      blogPage: true,
    },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.settings?.googleAdsense) {
          setCfg((prev) => ({
            ...prev,
            ...b.settings.googleAdsense,
            installed: true,
            pageSettings: {
              homepage: true,
              productPage: true,
              categoryPage: true,
              blogPage: true,
              ...(b.settings.googleAdsense.pageSettings || {}),
            },
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setCfg((s) => ({ ...s, [key]: val }));
  const setPage = (key, val) =>
    setCfg((s) => ({ ...s, pageSettings: { ...s.pageSettings, [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ googleAdsense: cfg }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/addons")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <svg
              className="h-4 w-4"
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Google AdSense</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-xl text-sm font-semibold text-white transition disabled:opacity-50 ${
            saved ? "bg-green-600" : "bg-gray-900 hover:bg-gray-700"
          }`}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        {/* Icon + title */}
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 border border-green-100">
            <svg
              className="h-6 w-6"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <circle cx="12" cy="12" r="10" fill="#4285F4" opacity="0.15" />
              <path
                d="M6 12a6 6 0 1112 0"
                stroke="#4285F4"
                strokeWidth="2"
                strokeLinecap="round"
              />
              <path
                d="M12 6v12M6 12h12"
                stroke="#34A853"
                strokeWidth="1.5"
                strokeLinecap="round"
                opacity="0.7"
              />
              <circle cx="12" cy="12" r="2.5" fill="#FBBC05" />
            </svg>
          </div>
          <div>
            <h2 className="font-semibold text-gray-900">
              AdSense Configuration
            </h2>
            <p className="text-xs text-gray-400">
              Monetize your store with Google ads
            </p>
          </div>
        </div>

        {/* Publisher ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Publisher ID
          </label>
          <input
            type="text"
            value={cfg.publisherId}
            onChange={(e) => set("publisherId", e.target.value)}
            placeholder="ca-pub-1234567890123456"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Format:{" "}
            <code className="bg-gray-100 px-1 rounded">
              ca-pub-XXXXXXXXXXXXXXXX
            </code>{" "}
            — Google AdSense dashboard থেকে পাবেন।
          </p>
        </div>

        {/* Ad Slot ID */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Ad Slot ID
            <span className="text-gray-400 font-normal ml-1">
              (in-page ad unit)
            </span>
          </label>
          <input
            type="text"
            value={cfg.adSlotId}
            onChange={(e) => set("adSlotId", e.target.value)}
            placeholder="1234567890"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 font-mono"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            AdSense → Ads → By ad unit → Display ads থেকে{" "}
            <code className="bg-gray-100 px-1 rounded">data-ad-slot</code>{" "}
            নম্বরটি কপি করুন।
          </p>
        </div>

        {/* Auto Ads toggle */}
        <div className="flex items-center justify-between py-1">
          <div>
            <p className="text-sm font-medium text-gray-800">Auto Ads</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Google নিজেই best জায়গায় ads রাখবে — Ad Slot ID ছাড়াও কাজ করে
            </p>
          </div>
          <Toggle
            checked={cfg.autoAds}
            onChange={(e) => set("autoAds", e.target.checked)}
          />
        </div>

        {/* Page Settings */}
        <div className="border-t border-gray-100 pt-4">
          <p className="text-sm font-semibold text-gray-800 mb-3">
            Page Visibility
          </p>
          <p className="text-xs text-gray-400 mb-3">
            কোন কোন page-এ in-page ads দেখাবে সেটি নিয়ন্ত্রণ করুন।
          </p>
          <div className="space-y-3">
            {PAGE_OPTIONS.map(({ key, label, desc }) => (
              <div key={key} className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-800">{label}</p>
                  <p className="text-xs text-gray-400">{desc}</p>
                </div>
                <Toggle
                  checked={cfg.pageSettings[key] !== false}
                  onChange={(e) => setPage(key, e.target.checked)}
                />
              </div>
            ))}
          </div>
        </div>

        {/* How to guide */}
        <div className="bg-blue-50 border border-blue-200 rounded-lg px-4 py-3 text-blue-900 text-xs">
          <p className="font-semibold mb-1.5">Publisher ID কীভাবে পাবেন:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              <strong>adsense.google.com</strong>-এ sign in করুন
            </li>
            <li>Account → Settings → Account information</li>
            <li>
              <strong>Publisher ID</strong> কপি করুন —{" "}
              <code className="bg-blue-100 px-1 rounded">
                ca-pub-XXXXXXXXXXXXXXXX
              </code>
            </li>
            <li>এখানে paste করে Save করুন</li>
          </ol>
        </div>

        {/* Active toggle */}
        <div className="flex items-center justify-between pt-1 border-t border-gray-100">
          <span className="text-sm text-blue-600 font-medium">
            Active Status
          </span>
          <Toggle
            checked={cfg.active}
            onChange={(e) => set("active", e.target.checked)}
          />
        </div>
      </div>

      {/* Script preview */}
      {cfg.publisherId && (
        <div className="mt-4 bg-gray-50 border border-gray-200 rounded-xl px-4 py-3">
          <p className="text-xs font-medium text-gray-600 mb-1.5">
            Script preview (injected in &lt;head&gt;):
          </p>
          <code className="text-xs text-gray-500 break-all whitespace-pre-wrap">
            {`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${cfg.publisherId}" crossorigin="anonymous"></script>`}
            {cfg.autoAds &&
              `\n<script>(adsbygoogle = window.adsbygoogle || []).push({});</script>`}
          </code>
        </div>
      )}
    </div>
  );
}
