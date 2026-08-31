"use client";

import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const INPUT =
  "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300";

// Chatbot availability — index 0 = Sunday (matches the backend schema order).
const CHATBOT_DAYS = [
  "রবিবার (Sun)",
  "সোমবার (Mon)",
  "মঙ্গলবার (Tue)",
  "বুধবার (Wed)",
  "বৃহস্পতিবার (Thu)",
  "শুক্রবার (Fri)",
  "শনিবার (Sat)",
];
const DEFAULT_CHATBOT_DAY = { mode: "range", start: "17:00", end: "09:00" };

// Standalone settings screen for the floating chat launcher — the round
// Messenger-style button, its Facebook / WhatsApp links, AND the in-site "Chat
// with us" availability schedule (all support-chat timing in one place). Lives
// under Dashboard → Support next to the Live Chat Inbox. Persists to the same
// Setting document (chatWidget.* + chatbotSchedule) the public widget reads at
// runtime via /top-banner.
export default function ChatWidgetSettings() {
  const [widget, setWidget] = useState({
    enabled: true,
    facebookMessengerUrl: "",
    whatsappNumber: "",
  });
  const [schedule, setSchedule] = useState({
    enabled: true,
    days: Array.from({ length: 7 }, () => ({ ...DEFAULT_CHATBOT_DAY })),
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    let alive = true;
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (!alive) return;
        const cw = b.settings?.chatWidget || {};
        setWidget({
          enabled: cw.enabled !== false,
          facebookMessengerUrl: cw.facebookMessengerUrl || "",
          whatsappNumber: cw.whatsappNumber || "",
        });
        const sched = b.settings?.chatbotSchedule || {};
        setSchedule({
          enabled: sched.enabled !== false,
          days: Array.from(
            { length: 7 },
            (_, i) => sched.days?.[i] || { ...DEFAULT_CHATBOT_DAY },
          ),
        });
      })
      .catch(() => {})
      .finally(() => alive && setLoading(false));
    return () => {
      alive = false;
    };
  }, []);

  const setW = (key, val) => setWidget((w) => ({ ...w, [key]: val }));
  const setScheduleEnabled = (val) => setSchedule((s) => ({ ...s, enabled: val }));
  const setDay = (idx, patch) =>
    setSchedule((s) => ({
      ...s,
      days: s.days.map((d, i) => (i === idx ? { ...d, ...patch } : d)),
    }));

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ chatWidget: widget, chatbotSchedule: schedule }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 2500);
    } catch (err) {
      alert(err.message || "Failed");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="max-w-2xl mx-auto bg-white p-8 rounded-xl border border-gray-200 text-center text-sm text-gray-400">
        Loading…
      </div>
    );

  return (
    <div className="max-w-2xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Chat Widget</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            ভাসমান চ্যাট বাটন, লিংক ও দেখানোর সময়সূচি — সব এক জায়গায়
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className={`px-5 py-2 rounded-lg text-sm font-semibold text-white transition disabled:opacity-50 ${
            saved ? "bg-green-600" : "bg-gray-900 hover:bg-gray-700"
          }`}
        >
          {saving ? "Saving…" : saved ? "Saved ✓" : "Save"}
        </button>
      </div>

      {/* ── Floating Launcher (links) ─────────────────────────────── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-sm">Floating Launcher</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-purple-50 text-purple-600">
            Site-wide
          </span>
        </div>
        <p className="px-5 pt-3 text-xs text-gray-400">
          সাইটের নিচে-ডানে ভাসমান চ্যাট বাটন। এখান থেকে Facebook Messenger ও
          WhatsApp লিংক দিন — যেটা খালি রাখবেন সেটা বাটনে দেখাবে না। পরিবর্তন Save
          করলে সাথে সাথে সাইটে কার্যকর হবে।
        </p>
        <div className="p-5">
          {/* Master toggle */}
          <label className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100 cursor-pointer">
            <input
              type="checkbox"
              checked={widget.enabled !== false}
              onChange={(e) => setW("enabled", e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
            />
            <span className="text-sm font-medium text-gray-700">
              চ্যাট উইজেট চালু রাখুন
            </span>
            <span className="text-xs text-gray-400">
              (বন্ধ করলে ভাসমান বাটনটি কোথাও দেখাবে না)
            </span>
          </label>

          <div
            className={`grid grid-cols-1 sm:grid-cols-2 gap-4 transition ${
              widget.enabled !== false ? "" : "opacity-40 pointer-events-none"
            }`}
          >
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                Facebook Messenger লিংক
              </label>
              <input
                value={widget.facebookMessengerUrl}
                onChange={(e) => setW("facebookMessengerUrl", e.target.value)}
                className={INPUT}
                placeholder="https://m.me/yourpage"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                খালি রাখলে Messenger বাটন দেখাবে না।
              </p>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                WhatsApp নম্বর
              </label>
              <input
                value={widget.whatsappNumber}
                onChange={(e) => setW("whatsappNumber", e.target.value.replace(/[^\d]/g, ""))}
                className={INPUT}
                placeholder="8801XXXXXXXXX"
                inputMode="numeric"
              />
              <p className="mt-1 text-[11px] text-gray-400">
                শুধু ডিজিট, কান্ট্রি কোডসহ (যেমন 8801712345678)। খালি রাখলে WhatsApp
                বাটন দেখাবে না।
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* ── Chatbot Availability (in-site "Chat with us" timing) ──── */}
      <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
        <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
          <h2 className="font-semibold text-gray-800 text-sm">Chatbot Availability</h2>
          <span className="text-[10px] px-2 py-0.5 rounded-full font-medium bg-blue-50 text-blue-600">
            Support Chat
          </span>
        </div>
        <p className="px-5 pt-3 text-xs text-gray-400">
          “Chat with us” অপশনটি কখন দেখাবে তা এখান থেকে নিয়ন্ত্রণ করুন। সময় বাংলাদেশ
          সময় (Asia/Dhaka) অনুযায়ী। Facebook ও WhatsApp সবসময় দেখাবে; এই সময়সূচি
          শুধু ইন-সাইট চ্যাটে প্রযোজ্য।
        </p>
        <div className="p-5">
          {/* Master toggle */}
          <label className="flex items-center gap-3 pb-4 mb-4 border-b border-gray-100 cursor-pointer">
            <input
              type="checkbox"
              checked={schedule.enabled}
              onChange={(e) => setScheduleEnabled(e.target.checked)}
              className="h-4 w-4 rounded border-gray-300 text-indigo-600 focus:ring-indigo-200"
            />
            <span className="text-sm font-medium text-gray-700">
              চ্যাটবট চালু রাখুন
            </span>
            <span className="text-xs text-gray-400">
              (বন্ধ করলে নিচের সময়সূচি নির্বিশেষে ইন-সাইট চ্যাট দেখাবে না)
            </span>
          </label>

          <div
            className={`space-y-2 transition ${
              schedule.enabled ? "" : "opacity-40 pointer-events-none"
            }`}
          >
            {CHATBOT_DAYS.map((label, idx) => {
              const day = schedule.days[idx];
              return (
                <div
                  key={idx}
                  className="grid grid-cols-1 sm:grid-cols-[140px_130px_1fr] items-center gap-2 sm:gap-3 py-1.5"
                >
                  <span className="text-sm text-gray-600">{label}</span>
                  <select
                    value={day.mode}
                    onChange={(e) => setDay(idx, { mode: e.target.value })}
                    className={INPUT}
                  >
                    <option value="off">বন্ধ (Off)</option>
                    <option value="allday">সারাদিন (All day)</option>
                    <option value="range">নির্দিষ্ট সময় (Range)</option>
                  </select>
                  {day.mode === "range" ? (
                    <div className="flex items-center gap-2">
                      <input
                        type="time"
                        value={day.start || "17:00"}
                        onChange={(e) => setDay(idx, { start: e.target.value })}
                        className={INPUT}
                      />
                      <span className="text-xs text-gray-400">থেকে</span>
                      <input
                        type="time"
                        value={day.end || "09:00"}
                        onChange={(e) => setDay(idx, { end: e.target.value })}
                        className={INPUT}
                      />
                    </div>
                  ) : (
                    <span className="text-xs text-gray-400">
                      {day.mode === "allday" ? "২৪ ঘণ্টা দেখাবে" : "এই দিনে দেখাবে না"}
                    </span>
                  )}
                </div>
              );
            })}
            <p className="pt-2 text-[11px] text-gray-400">
              শেষ সময় শুরুর সময়ের আগে দিলে সময়সীমা মধ্যরাত পার হয়ে যাবে (যেমন 17:00 →
              09:00 মানে বিকেল ৫টা থেকে পরদিন সকাল ৯টা)।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
