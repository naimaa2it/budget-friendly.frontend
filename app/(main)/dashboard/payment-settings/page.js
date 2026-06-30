"use client";

import { useState, useEffect } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const PROVIDERS = [
  {
    key: "bkash",
    label: "bKash",
    color: "#E2136E",
    bg: "bg-[#fce8f3]",
    border: "border-[#E2136E]",
    fields: [
      {
        key: "merchantNumber",
        label: "Merchant Number",
        placeholder: "01XXXXXXXXX",
        type: "text",
      },
      {
        key: "appKey",
        label: "App Key",
        placeholder: "bKash App Key",
        type: "text",
      },
      {
        key: "appSecret",
        label: "App Secret",
        placeholder: "bKash App Secret",
        type: "password",
      },
      {
        key: "username",
        label: "Username",
        placeholder: "bKash Username",
        type: "text",
      },
      {
        key: "password",
        label: "Password",
        placeholder: "bKash Password",
        type: "password",
      },
    ],
  },
  {
    key: "nagad",
    label: "Nagad",
    color: "#F16821",
    bg: "bg-[#fef0e7]",
    border: "border-[#F16821]",
    fields: [
      {
        key: "merchantNumber",
        label: "Merchant Number",
        placeholder: "01XXXXXXXXX",
        type: "text",
      },
      {
        key: "merchantId",
        label: "Merchant ID",
        placeholder: "Nagad Merchant ID",
        type: "text",
      },
      {
        key: "merchantKey",
        label: "Merchant Key",
        placeholder: "Nagad Merchant Key",
        type: "password",
      },
    ],
  },
  {
    key: "rocket",
    label: "Rocket",
    color: "#8B2FC9",
    bg: "bg-[#f3e8fd]",
    border: "border-[#8B2FC9]",
    fields: [
      {
        key: "merchantNumber",
        label: "Merchant Number",
        placeholder: "01XXXXXXXXX",
        type: "text",
      },
      {
        key: "apiKey",
        label: "API Key",
        placeholder: "Rocket API Key",
        type: "password",
      },
    ],
  },
];

function ProviderCard({ provider, data, onChange, onSave, saving, saved }) {
  const [show, setShow] = useState({});

  const toggle = (fieldKey) =>
    setShow((s) => ({ ...s, [fieldKey]: !s[fieldKey] }));

  return (
    <div
      className={`rounded-2xl border-2 ${provider.border} bg-white shadow-sm overflow-hidden`}
    >
      {/* Header */}
      <div
        className="flex items-center justify-between px-5 py-4"
        style={{ backgroundColor: provider.color + "18" }}
      >
        <div className="flex items-center gap-3">
          <div
            className="w-10 h-10 rounded-full flex items-center justify-center text-white font-bold text-sm"
            style={{ backgroundColor: provider.color }}
          >
            {provider.label[0]}
          </div>
          <div>
            <h3 className="font-semibold text-gray-800">{provider.label}</h3>
            <p className="text-xs text-gray-500">Merchant Configuration</p>
          </div>
        </div>
        <label className="flex items-center gap-2 cursor-pointer">
          <span className="text-sm text-gray-600">
            {data.enabled ? "Active" : "Inactive"}
          </span>
          <div
            onClick={() => onChange(provider.key, "enabled", !data.enabled)}
            className={`relative w-11 h-6 rounded-full transition-colors ${data.enabled ? "bg-green-500" : "bg-gray-300"}`}
          >
            <div
              className={`absolute top-0.5 left-0.5 w-5 h-5 bg-white rounded-full shadow transition-transform ${data.enabled ? "translate-x-5" : ""}`}
            />
          </div>
        </label>
      </div>

      {/* Fields */}
      <div className="px-5 py-4 space-y-3">
        {provider.fields.map((f) => (
          <div key={f.key}>
            <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
              {f.label}
            </label>
            <div className="relative">
              <input
                type={
                  f.type === "password" && !show[f.key] ? "password" : "text"
                }
                value={data[f.key] || ""}
                onChange={(e) => onChange(provider.key, f.key, e.target.value)}
                placeholder={f.placeholder}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-offset-0 pr-10"
                style={{ "--tw-ring-color": provider.color }}
              />
              {f.type === "password" && (
                <button
                  type="button"
                  onClick={() => toggle(f.key)}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-xs"
                >
                  {show[f.key] ? "Hide" : "Show"}
                </button>
              )}
            </div>
          </div>
        ))}

        {/* Mode */}
        <div>
          <label className="block text-xs font-semibold text-gray-600 mb-1 uppercase tracking-wide">
            Mode
          </label>
          <div className="flex gap-2">
            {["sandbox", "live"].map((m) => (
              <button
                key={m}
                type="button"
                onClick={() => onChange(provider.key, "mode", m)}
                className={`px-4 py-1.5 rounded-full text-xs font-semibold border transition ${
                  data.mode === m
                    ? "text-white border-transparent"
                    : "text-gray-600 border-gray-200 bg-white"
                }`}
                style={
                  data.mode === m
                    ? {
                        backgroundColor: provider.color,
                        borderColor: provider.color,
                      }
                    : {}
                }
              >
                {m === "sandbox" ? "🧪 Sandbox" : "🚀 Live"}
              </button>
            ))}
          </div>
        </div>

        {/* Save */}
        <button
          type="button"
          onClick={() => onSave(provider.key)}
          disabled={saving}
          className="w-full py-2.5 rounded-lg text-sm font-semibold text-white transition disabled:opacity-60 mt-2"
          style={{ backgroundColor: provider.color }}
        >
          {saving
            ? "Saving…"
            : saved
              ? "✓ Saved"
              : `Save ${provider.label} Settings`}
        </button>
      </div>
    </div>
  );
}

export default function PaymentSettingsPage() {
  const [settings, setSettings] = useState({
    bkash: {
      enabled: false,
      merchantNumber: "",
      appKey: "",
      appSecret: "",
      username: "",
      password: "",
      mode: "sandbox",
    },
    nagad: {
      enabled: false,
      merchantNumber: "",
      merchantId: "",
      merchantKey: "",
      mode: "sandbox",
    },
    rocket: { enabled: false, merchantNumber: "", apiKey: "", mode: "sandbox" },
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState({});
  const [saved, setSaved] = useState({});

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        const mb = d.settings?.mobileBanking;
        if (mb) {
          setSettings((prev) => ({
            bkash: { ...prev.bkash, ...(mb.bkash || {}) },
            nagad: { ...prev.nagad, ...(mb.nagad || {}) },
            rocket: { ...prev.rocket, ...(mb.rocket || {}) },
          }));
        }
      })
      .catch(() => {})
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (provider, field, value) => {
    setSettings((prev) => ({
      ...prev,
      [provider]: { ...prev[provider], [field]: value },
    }));
    setSaved((s) => ({ ...s, [provider]: false }));
  };

  const handleSave = async (provider) => {
    setSaving((s) => ({ ...s, [provider]: true }));
    try {
      const res = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          [`mobileBanking.${provider}`]: settings[provider],
        }),
      });
      if (!res.ok) throw new Error("Save failed");
      setSaved((s) => ({ ...s, [provider]: true }));
      setTimeout(() => setSaved((s) => ({ ...s, [provider]: false })), 3000);
    } catch {
      alert("Save failed. Please try again.");
    } finally {
      setSaving((s) => ({ ...s, [provider]: false }));
    }
  };

  if (loading) {
    return (
      <div className="py-12 text-center text-gray-500">
        Loading payment settings…
      </div>
    );
  }

  return (
    <div className="max-w-2xl mx-auto py-4">
      <div className="mb-6">
        <h1 className="text-xl font-bold text-gray-900">
          Mobile Banking Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Configure bKash, Nagad, and Rocket merchant credentials. The Merchant
          Number is shown to customers on the payment page.
        </p>
      </div>

      <div className="space-y-6">
        {PROVIDERS.map((p) => (
          <ProviderCard
            key={p.key}
            provider={p}
            data={settings[p.key]}
            onChange={handleChange}
            onSave={handleSave}
            saving={!!saving[p.key]}
            saved={!!saved[p.key]}
          />
        ))}
      </div>

      <div className="mt-6 p-4 bg-blue-50 rounded-xl text-sm text-blue-700 border border-blue-200">
        <strong>Note:</strong> Merchant Number দিলেই payment page কাজ করবে
        (manual verification)। API credentials পরে দিলে automated payment flow
        চালু হবে।
      </div>
    </div>
  );
}
