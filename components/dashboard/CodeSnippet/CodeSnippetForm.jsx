"use client";

import React, { useEffect, useState } from "react";

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

const SLOTS = [
  {
    key: "headerCode",
    label: "Header Code",
    badge: "<head>",
    badgeColor: "bg-violet-100 text-violet-700",
    hint: "<head> ট্যাগের ভেতরে inject হবে — meta tag, script, stylesheet সব দেওয়া যাবে",
    placeholder: `<!-- উদাহরণ -->
<meta name="google-site-verification" content="XXXX" />
<script async src="https://www.googletagmanager.com/gtag/js?id=G-XXXXXXXX"></script>
<script>
  window.dataLayer = window.dataLayer || [];
  function gtag(){dataLayer.push(arguments);}
  gtag('js', new Date());
  gtag('config', 'G-XXXXXXXX');
</script>`,
  },
  {
    key: "bodyCode",
    label: "Body Code",
    badge: "<body> শুরু",
    badgeColor: "bg-blue-100 text-blue-700",
    hint: "<body> ট্যাগ খোলার ঠিক পরে inject হবে — noscript ট্যাগ দেওয়ার জন্য আদর্শ",
    placeholder: `<!-- উদাহরণ: GTM noscript -->
<noscript><iframe src="https://www.googletagmanager.com/ns.html?id=GTM-XXXXXXX"
height="0" width="0" style="display:none;visibility:hidden"></iframe></noscript>`,
  },
  {
    key: "footerCode",
    label: "Footer Code",
    badge: "</body> আগে",
    badgeColor: "bg-green-100 text-green-700",
    hint: "</body> বন্ধ হওয়ার ঠিক আগে inject হবে — async tracking script দেওয়ার জন্য আদর্শ",
    placeholder: `<!-- উদাহরণ: Facebook Pixel, TikTok Pixel -->
<script>
  !function(f,b,e,v,n,t,s){...}(window, document,'script',
  'https://connect.facebook.net/en_US/fbevents.js');
  fbq('init', 'YOUR_PIXEL_ID');
  fbq('track', 'PageView');
</script>`,
  },
];

export default function CodeSnippetForm() {
  const [cfg, setCfg] = useState({
    headerCode: "",
    bodyCode: "",
    footerCode: "",
    active: true,
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.settings?.customCode) {
          setCfg((prev) => ({ ...prev, ...b.settings.customCode }));
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const set = (key, val) => setCfg((s) => ({ ...s, [key]: val }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ customCode: cfg }),
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
        <div>
          <h1 className="text-xl font-bold text-gray-900">Code Snippet</h1>
          <p className="text-sm text-gray-500 mt-0.5">
            Header, Body ও Footer-এ custom code inject করুন
          </p>
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

      <div className="bg-white rounded-2xl border border-gray-200 divide-y divide-gray-100">
        {SLOTS.map(({ key, label, badge, badgeColor, hint, placeholder }) => (
          <div key={key} className="px-6 py-5 space-y-2">
            <div className="flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800">{label}</span>
              <span
                className={`text-[10px] font-mono font-semibold px-1.5 py-0.5 rounded ${badgeColor}`}
              >
                {badge}
              </span>
            </div>
            <p className="text-xs text-gray-400">{hint}</p>
            <textarea
              value={cfg[key]}
              onChange={(e) => set(key, e.target.value)}
              rows={7}
              placeholder={placeholder}
              spellCheck={false}
              className="w-full rounded-lg border border-gray-200 bg-gray-50 px-3 py-2.5 text-xs font-mono text-gray-700 focus:border-gray-400 focus:bg-white focus:outline-none focus:ring-2 focus:ring-gray-100 resize-y transition"
            />
          </div>
        ))}

        {/* Active toggle */}
        <div className="flex items-center justify-between px-6 py-4">
          <div>
            <p className="text-sm font-semibold text-gray-800">Active</p>
            <p className="text-xs text-gray-400 mt-0.5">
              Disable করলে কোনো code site-এ inject হবে না
            </p>
          </div>
          <Toggle
            checked={cfg.active}
            onChange={(e) => set("active", e.target.checked)}
          />
        </div>
      </div>
    </div>
  );
}
