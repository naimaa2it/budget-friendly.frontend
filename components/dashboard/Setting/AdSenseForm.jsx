"use client";

import React, { useEffect, useState } from "react";
import MediaPicker from "@/components/dashboard/MediaPicker";

export default function AdSenseForm() {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setSettings(b.settings || {}))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      alert("Settings saved!");
    } catch (err) {
      alert(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  // helper: update a single key inside topBannerConfig
  const setCfg = (key, val) =>
    setSettings((s) => ({
      ...s,
      topBannerConfig: { ...s.topBannerConfig, [key]: val },
    }));

  if (loading || !settings)
    return <div className="text-center py-10 text-gray-500">Loading…</div>;

  const cfg = settings.topBannerConfig || {};

  return (
    <div className="space-y-6">
      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SECTION 1 — CLICKABLE IMAGE BANNER                             */}
      {/* ─────────────────────────────────────────────────────────────── */}

      {/* ─────────────────────────────────────────────────────────────── */}
      {/* SECTION 2 — GOOGLE ADSENSE AUTO ADS                           */}
      {/* ─────────────────────────────────────────────────────────────── */}
      <div className="border rounded-xl p-5 bg-white shadow-sm">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="font-semibold text-gray-900 text-base">
              Google AdSense — Auto Ads
            </h3>
            <p className="text-xs text-gray-500 mt-0.5">
              Google automatically finds the best spots on your site to show
              ads. You earn money when visitors click them.
            </p>
          </div>
          <label className="flex items-center gap-2 cursor-pointer select-none shrink-0 ml-4">
            <span className="text-xs text-gray-600">
              {settings.adsenseEnabled ? "On" : "Off"}
            </span>
            <div className="relative">
              <input
                type="checkbox"
                className="sr-only peer"
                checked={settings.adsenseEnabled || false}
                onChange={(e) =>
                  setSettings((s) => ({
                    ...s,
                    adsenseEnabled: e.target.checked,
                  }))
                }
              />
              <div className="w-10 h-5 bg-gray-300 peer-checked:bg-green-500 rounded-full transition-colors duration-200" />
              <div className="absolute top-0.5 left-0.5 w-4 h-4 bg-white rounded-full shadow transition-transform duration-200 peer-checked:translate-x-5" />
            </div>
          </label>
        </div>

        {/* beginner guide */}
        <div className="bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-4 text-amber-900">
          <p className="font-semibold text-sm mb-2">
            📋 Step 1 — Get your Publisher ID (one-time):
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>
              Go to <strong>adsense.google.com</strong> and sign in (or create a
              free account)
            </li>
            <li>
              Google will review your website — approval usually takes 1–3 days
            </li>
            <li>
              Once approved, go to{" "}
              <strong>Account → Account information</strong>
            </li>
            <li>
              Copy your <strong>Publisher ID</strong> — it looks like{" "}
              <code className="bg-amber-100 px-1 rounded font-mono">
                ca-pub-1234567890123456
              </code>
            </li>
          </ol>
          <p className="font-semibold text-sm mt-3 mb-1">
            📋 Step 2 — Get an Ad Slot ID (for in-page ads):
          </p>
          <ol className="list-decimal pl-5 space-y-1 text-xs">
            <li>
              In AdSense, go to <strong>Ads → By ad unit → Display ads</strong>
            </li>
            <li>
              Click <strong>Create new ad unit</strong>, choose{" "}
              <strong>Responsive</strong>, name it (e.g. &quot;In-Content&quot;)
            </li>
            <li>
              Copy the <strong>data-ad-slot</strong> number — it looks like{" "}
              <code className="bg-amber-100 px-1 rounded font-mono">
                1234567890
              </code>
            </li>
            <li>Paste it in the Ad Slot ID field below</li>
          </ol>
          <p className="text-xs text-amber-700 mt-2">
            Ads will appear on the <strong>homepage</strong>,{" "}
            <strong>product pages</strong>, and <strong>category pages</strong>{" "}
            once both IDs are saved.
          </p>
        </div>

        {/* publisher ID input */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Your Publisher ID
          </label>
          <input
            type="text"
            placeholder="ca-pub-1234567890123456"
            value={settings.adsensePublisherId || ""}
            onChange={(e) =>
              setSettings((s) => ({
                ...s,
                adsensePublisherId: e.target.value.trim(),
              }))
            }
            className="w-full border px-3 py-2 rounded text-sm font-mono focus:ring-2 focus:ring-green-300 focus:outline-none"
          />
        </div>

        {/* ad slot ID input */}
        <div className="mb-3">
          <label className="block text-xs font-medium text-gray-700 mb-1">
            Ad Slot ID{" "}
            <span className="text-gray-400 font-normal">
              (in-page ad unit — homepage, product &amp; category pages)
            </span>
          </label>
          <input
            type="text"
            placeholder="1234567890"
            value={settings.adsenseSlot || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, adsenseSlot: e.target.value.trim() }))
            }
            className="w-full border px-3 py-2 rounded text-sm font-mono focus:ring-2 focus:ring-green-300 focus:outline-none"
          />
          {settings.adsensePublisherId &&
            settings.adsenseSlot &&
            settings.adsenseEnabled && (
              <p className="text-xs text-green-600 mt-1.5">
                ✅ Ads will appear on homepage, product pages and category pages
                after saving.
              </p>
            )}
          {settings.adsensePublisherId && !settings.adsenseSlot && (
            <p className="text-xs text-orange-500 mt-1.5">
              ⚠️ Add an Ad Slot ID to show ads in specific page sections.
            </p>
          )}
        </div>

        {/* generated script preview */}
        {settings.adsensePublisherId && (
          <div className="text-xs">
            <p className="text-gray-500 mb-1">
              Auto Ads script (added to every page automatically):
            </p>
            <pre className="bg-gray-50 border rounded px-3 py-2 overflow-x-auto text-gray-600 whitespace-pre-wrap break-all">
              {`<script async src="https://pagead2.googlesyndication.com/pagead/js/adsbygoogle.js?client=${settings.adsensePublisherId}" crossorigin="anonymous"></script>`}
            </pre>
          </div>
        )}
      </div>

      {/* save / reset */}
      <div className="flex gap-3">
        <button
          onClick={handleSave}
          disabled={saving}
          className="px-5 py-2 bg-indigo-600 text-white rounded-lg font-medium hover:bg-indigo-700 disabled:opacity-50 transition-colors"
        >
          {saving ? "Saving…" : "Save Changes"}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-5 py-2 border rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
        >
          Reset
        </button>
      </div>

      {/* Media Picker modal */}
      {showPicker && (
        <MediaPicker
          open={showPicker}
          onSelect={(asset) => {
            setCfg("imageUrl", asset.url);
            setShowPicker(false);
          }}
          onClose={() => setShowPicker(false)}
        />
      )}
    </div>
  );
}
