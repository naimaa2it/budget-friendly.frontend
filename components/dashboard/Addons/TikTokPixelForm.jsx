"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function Toggle({ checked, onChange }) {
  return (
    <label className="relative inline-flex cursor-pointer items-center">
      <input type="checkbox" className="sr-only peer" checked={checked} onChange={onChange} />
      <div className="h-6 w-11 rounded-full bg-gray-200 transition-colors peer-checked:bg-gray-900 after:absolute after:left-0.5 after:top-0.5 after:h-5 after:w-5 after:rounded-full after:bg-white after:shadow after:transition-transform peer-checked:after:translate-x-5" />
    </label>
  );
}

export default function TikTokPixelForm() {
  const router = useRouter();
  const [cfg, setCfg] = useState({
    pixelId: "",
    accessToken: "",
    testEventCode: "",
    active: false,
    installed: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.settings?.tiktokPixel) {
          setCfg((prev) => ({ ...prev, ...b.settings.tiktokPixel, installed: true }));
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
        body: JSON.stringify({ tiktokPixel: cfg }),
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

  if (loading) return <div className="py-16 text-center text-gray-400">Loading…</div>;

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
        <div className="flex items-center gap-3">
          <button
            onClick={() => router.push("/dashboard/addons")}
            className="flex items-center gap-1.5 text-sm text-gray-500 hover:text-gray-800 transition"
          >
            <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
              <path d="M15 18l-6-6 6-6" />
            </svg>
            Back
          </button>
          <h1 className="text-xl font-bold text-gray-900">Edit TikTok Pixel</h1>
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
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gray-50 border border-gray-200">
            <svg className="h-6 w-6" viewBox="0 0 24 24" fill="#010101">
              <path d="M19.59 6.69a4.83 4.83 0 01-3.77-4.25V2h-3.45v13.67a2.89 2.89 0 01-2.88 2.5 2.89 2.89 0 01-2.89-2.89 2.89 2.89 0 012.89-2.89c.28 0 .54.04.79.1V9.01a6.33 6.33 0 00-.79-.05 6.34 6.34 0 00-6.34 6.34 6.34 6.34 0 006.34 6.34 6.34 6.34 0 006.33-6.34V8.87a8.17 8.17 0 004.79 1.52V6.94a4.85 4.85 0 01-1.02-.25z" />
            </svg>
          </div>
          <h2 className="font-semibold text-gray-900">TikTok Pixel Configuration</h2>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Pixel ID</label>
          <input
            type="text"
            value={cfg.pixelId}
            onChange={(e) => set("pixelId", e.target.value)}
            placeholder="e.g. ABCDE1FGHIJ2KLMNO3"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Access Token</label>
          <textarea
            value={cfg.accessToken}
            onChange={(e) => set("accessToken", e.target.value)}
            rows={4}
            placeholder="Paste your TikTok Events API access token here"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 resize-y"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1.5">Test Event Code</label>
          <input
            type="text"
            value={cfg.testEventCode}
            onChange={(e) => set("testEventCode", e.target.value)}
            placeholder="e.g. TEST12345"
            className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
          />
        </div>

        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 text-amber-900 text-xs">
          <p className="font-semibold mb-1">How to get your TikTok Pixel ID:</p>
          <ol className="list-decimal pl-4 space-y-1">
            <li>Go to <strong>ads.tiktok.com</strong> and sign in</li>
            <li>Navigate to <strong>Assets → Events → Web Events</strong></li>
            <li>Create or select your pixel and copy the <strong>Pixel ID</strong></li>
            <li>For server-side events, generate an <strong>Access Token</strong> from the pixel settings</li>
          </ol>
        </div>

        <div className="flex items-center justify-between pt-1">
          <span className="text-sm text-blue-600 font-medium">Active Status</span>
          <Toggle checked={cfg.active} onChange={(e) => set("active", e.target.checked)} />
        </div>
      </div>
    </div>
  );
}
