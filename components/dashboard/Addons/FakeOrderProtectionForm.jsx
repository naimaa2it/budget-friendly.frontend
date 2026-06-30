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

const DEFAULT = {
  phoneOrder: {
    enabled: true,
    limitDuration: 5,
    limitDurationUnit: "minutes",
    blocklist: "",
  },
  ipOrder: {
    enabled: true,
    limitDuration: 5,
    limitDurationUnit: "minutes",
    blocklist: "",
  },
  deviceOrder: {
    enabled: true,
    limitDuration: 5,
    limitDurationUnit: "minutes",
  },
  active: false,
  installed: true,
};

export default function FakeOrderProtectionForm() {
  const router = useRouter();
  const [cfg, setCfg] = useState(DEFAULT);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.settings?.fakeOrderProtection) {
          setCfg({
            ...DEFAULT,
            ...b.settings.fakeOrderProtection,
            installed: true,
          });
        }
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const setSection = (section, key, val) =>
    setCfg((s) => ({ ...s, [section]: { ...s[section], [key]: val } }));

  const handleSave = async () => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ fakeOrderProtection: cfg }),
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
            Fake Order Protection
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

      <div className="space-y-4">
        {/* Phone Order */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Phone Order</h2>
            <Toggle
              checked={cfg.phoneOrder.enabled}
              onChange={(e) =>
                setSection("phoneOrder", "enabled", e.target.checked)
              }
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1.5">
                Limit Duration
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={cfg.phoneOrder.limitDuration}
                  onChange={(e) =>
                    setSection(
                      "phoneOrder",
                      "limitDuration",
                      Number(e.target.value),
                    )
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
                <select
                  value={cfg.phoneOrder.limitDurationUnit || "minutes"}
                  onChange={(e) =>
                    setSection(
                      "phoneOrder",
                      "limitDurationUnit",
                      e.target.value,
                    )
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                >
                  <option value="minutes">মিনিট</option>
                  <option value="hours">ঘণ্টা</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                এই সময়ের মধ্যে একই নম্বর থেকে দ্বিতীয় অর্ডার block হবে।
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1.5">
                Phone Number Blocklist (কমা দিয়ে আলাদা করুন)
              </label>
              <textarea
                value={cfg.phoneOrder.blocklist}
                onChange={(e) =>
                  setSection("phoneOrder", "blocklist", e.target.value)
                }
                rows={3}
                placeholder="01711111111, 01722222222"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 resize-y"
              />
            </div>
          </div>
        </div>

        {/* IP Order */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">IP Order</h2>
            <Toggle
              checked={cfg.ipOrder.enabled}
              onChange={(e) =>
                setSection("ipOrder", "enabled", e.target.checked)
              }
            />
          </div>
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1.5">
                Limit Duration
              </label>
              <div className="flex gap-2">
                <input
                  type="number"
                  min="1"
                  max="9999"
                  value={cfg.ipOrder.limitDuration}
                  onChange={(e) =>
                    setSection(
                      "ipOrder",
                      "limitDuration",
                      Number(e.target.value),
                    )
                  }
                  className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
                />
                <select
                  value={cfg.ipOrder.limitDurationUnit || "minutes"}
                  onChange={(e) =>
                    setSection("ipOrder", "limitDurationUnit", e.target.value)
                  }
                  className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
                >
                  <option value="minutes">মিনিট</option>
                  <option value="hours">ঘণ্টা</option>
                </select>
              </div>
              <p className="text-xs text-gray-400 mt-1">
                একই IP থেকে এই সময়ের মধ্যে দ্বিতীয় অর্ডার block হবে।
              </p>
            </div>
            <div>
              <label className="block text-sm font-medium text-amber-600 mb-1.5">
                IP Address Blocklist (কমা দিয়ে আলাদা করুন)
              </label>
              <textarea
                value={cfg.ipOrder.blocklist}
                onChange={(e) =>
                  setSection("ipOrder", "blocklist", e.target.value)
                }
                rows={3}
                placeholder="192.168.0.1, 192.168.0.2"
                className="w-full rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 resize-y"
              />
            </div>
          </div>
        </div>

        {/* Device Order */}
        <div className="bg-white rounded-2xl border border-gray-200 p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-gray-900">Device Order</h2>
            <Toggle
              checked={cfg.deviceOrder.enabled}
              onChange={(e) =>
                setSection("deviceOrder", "enabled", e.target.checked)
              }
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-amber-600 mb-1.5">
              Limit Duration
            </label>
            <div className="flex gap-2">
              <input
                type="number"
                min="1"
                max="9999"
                value={cfg.deviceOrder.limitDuration}
                onChange={(e) =>
                  setSection(
                    "deviceOrder",
                    "limitDuration",
                    Number(e.target.value),
                  )
                }
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100"
              />
              <select
                value={cfg.deviceOrder.limitDurationUnit || "minutes"}
                onChange={(e) =>
                  setSection("deviceOrder", "limitDurationUnit", e.target.value)
                }
                className="rounded-lg border border-gray-300 px-3 py-2.5 text-sm focus:border-gray-400 focus:outline-none focus:ring-2 focus:ring-gray-100 bg-white"
              >
                <option value="minutes">মিনিট</option>
                <option value="hours">ঘণ্টা</option>
              </select>
            </div>
            <p className="text-xs text-gray-400 mt-1">
              একই ডিভাইস থেকে এই সময়ের মধ্যে দ্বিতীয় অর্ডার block হবে।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
