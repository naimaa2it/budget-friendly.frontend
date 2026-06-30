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

export default function GoogleAnalytics4Form() {
  const router = useRouter();
  const [cfg, setCfg] = useState({
    measurementId: "",
    active: false,
    installed: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.settings?.googleAnalytics4) {
          setCfg((prev) => ({
            ...prev,
            ...b.settings.googleAnalytics4,
            installed: true,
          }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setCfg((s) => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ googleAnalytics4: cfg }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      alert("Saved!");
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
          <h1 className="text-xl font-bold text-gray-900">
            Edit Google Analytics 4
          </h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-gray-900 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-green-50 border border-green-100">
            <svg
              className="h-5 w-5"
              viewBox="0 0 24 24"
              fill="none"
              aria-hidden="true"
            >
              <rect x="3" y="12" width="4" height="9" fill="#F4B400" rx="1" />
              <rect x="10" y="6" width="4" height="15" fill="#0F9D58" rx="1" />
              <rect x="17" y="2" width="4" height="19" fill="#4285F4" rx="1" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">GA4 Configuration</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Measurement ID
          </label>
          <input
            type="text"
            value={cfg.measurementId}
            onChange={(e) => set("measurementId", e.target.value)}
            placeholder="e.g. G-XXXXXXXXXX"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
          <p className="mt-1.5 text-xs text-gray-400">
            Find in Google Analytics → Admin → Data Streams → your stream →
            Measurement ID.
          </p>
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-900 text-xs">
          <p className="font-semibold mb-1">
            How to get your GA4 Measurement ID:
          </p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>
              Go to <strong>analytics.google.com</strong> and sign in
            </li>
            <li>Click Admin (gear icon) → Data Streams</li>
            <li>Select your web stream</li>
            <li>
              Copy the <strong>Measurement ID</strong> — format:{" "}
              <code className="bg-amber-100 px-1 rounded">G-XXXXXXXXXX</code>
            </li>
          </ol>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-blue-600 font-medium">
            Active Status
          </span>
          <Toggle
            checked={cfg.active}
            onChange={(e) => set("active", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}
