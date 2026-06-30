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

export default function FacebookPixelForm() {
  const router = useRouter();
  const [cfg, setCfg] = useState({
    pixelId: "",
    accessToken: "",
    testEventCode: "",
    browserSideTracking: true,
    serverSideTracking: false,
    active: false,
    installed: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.settings?.facebookPixel) {
          setCfg((prev) => ({
            ...prev,
            ...b.settings.facebookPixel,
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
        body: JSON.stringify({ facebookPixel: cfg }),
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
          <h1 className="text-xl font-bold text-gray-900">Edit Meta Pixel</h1>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 rounded-xl bg-gray-900 text-sm font-semibold text-white hover:bg-gray-700 disabled:opacity-50 transition"
        >
          {saving ? "Saving…" : "Save"}
        </button>
      </div>

      {/* Config card */}
      <div className="bg-white rounded-2xl border border-gray-200 p-6 space-y-5">
        <div className="flex items-center gap-3 mb-2">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-50 border border-blue-100">
            <svg className="h-5 w-5" viewBox="0 0 24 24" fill="#1877F2">
              <path d="M18 2h-3a5 5 0 00-5 5v3H7v4h3v8h4v-8h3l1-4h-4V7a1 1 0 011-1h3z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">Pixel Configuration</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Dataset ID (Pixel ID)
          </label>
          <input
            type="text"
            value={cfg.pixelId}
            onChange={(e) => set("pixelId", e.target.value)}
            placeholder="e.g. 1234567890123456"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Access Token
          </label>
          <textarea
            value={cfg.accessToken}
            onChange={(e) => set("accessToken", e.target.value)}
            rows={4}
            placeholder="Paste your Meta access token here"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">
            Test Event Code
          </label>
          <input
            type="text"
            value={cfg.testEventCode}
            onChange={(e) => set("testEventCode", e.target.value)}
            placeholder="e.g. TEST12345"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-blue-600 font-medium">
            Browser Side Tracking
          </span>
          <Toggle
            checked={cfg.browserSideTracking}
            onChange={(e) => set("browserSideTracking", e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between">
          <span className="text-sm text-blue-600 font-medium">
            Server Side Tracking
          </span>
          <Toggle
            checked={cfg.serverSideTracking}
            onChange={(e) => set("serverSideTracking", e.target.checked)}
          />
        </div>

        <div className="flex items-center justify-between">
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
