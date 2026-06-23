"use client";

import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TABS = [
  { key: "shipping", label: "শিপিং", type: "qa", color: "orange" },
  { key: "return",   label: "রিটার্ন", type: "qa", color: "blue" },
  { key: "faq",      label: "FAQ",     type: "qa", color: "green" },
  { key: "privacy",  label: "প্রাইভেসি", type: "section", color: "purple" },
  { key: "terms",    label: "শর্তাবলী", type: "section", color: "gray" },
];

const EMPTY_QA = { question: "", answer: "" };
const EMPTY_SECTION = { heading: "", content: "" };

function QAEditor({ items, onChange }) {
  const add = () => onChange([...items, { ...EMPTY_QA }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) => {
    const next = items.map((it, idx) =>
      idx === i ? { ...it, [field]: value } : it,
    );
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
          <span className="absolute top-3 left-3 text-xs text-gray-400 font-mono">#{i + 1}</span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs"
            title="মুছুন"
          >
            ✕ মুছুন
          </button>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">প্রশ্ন (Question)</label>
              <input
                value={item.question}
                onChange={(e) => update(i, "question", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="প্রশ্ন লিখুন…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">উত্তর (Answer)</label>
              <textarea
                value={item.answer}
                onChange={(e) => update(i, "answer", e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-y"
                placeholder="উত্তর লিখুন… (নতুন লাইনের জন্য Enter চাপুন)"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl py-3 text-sm transition"
      >
        + নতুন প্রশ্ন যোগ করুন
      </button>
    </div>
  );
}

function SectionEditor({ items, onChange }) {
  const add = () => onChange([...items, { ...EMPTY_SECTION }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) => {
    const next = items.map((it, idx) =>
      idx === i ? { ...it, [field]: value } : it,
    );
    onChange(next);
  };

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div key={i} className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative">
          <span className="absolute top-3 left-3 text-xs text-gray-400 font-mono">#{i + 1}</span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs"
            title="মুছুন"
          >
            ✕ মুছুন
          </button>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">শিরোনাম (Heading)</label>
              <input
                value={item.heading}
                onChange={(e) => update(i, "heading", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="বিভাগের শিরোনাম লিখুন…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">বিষয়বস্তু (Content)</label>
              <textarea
                value={item.content}
                onChange={(e) => update(i, "content", e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-y"
                placeholder="বিষয়বস্তু লিখুন… (নতুন লাইনের জন্য Enter চাপুন)"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl py-3 text-sm transition"
      >
        + নতুন বিভাগ যোগ করুন
      </button>
    </div>
  );
}

export default function PolicyPagesEditor() {
  const [activeTab, setActiveTab] = useState("shipping");
  const [policyContent, setPolicyContent] = useState({
    shipping: [],
    return: [],
    faq: [],
    privacy: [],
    terms: [],
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const pc = b.settings?.policyContent || {};
        setPolicyContent({
          shipping: pc.shipping || [],
          return:   pc.return   || [],
          faq:      pc.faq      || [],
          privacy:  pc.privacy  || [],
          terms:    pc.terms    || [],
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const handleChange = (key, value) => {
    setPolicyContent((prev) => ({ ...prev, [key]: value }));
  };

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ policyContent }),
      });
      if (!resp.ok) {
        const body = await resp.json();
        throw new Error(body.error || "Save failed");
      }
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (err) {
      alert(err.message || "সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  if (loading)
    return (
      <div className="text-center py-16 text-gray-400 text-sm">লোড হচ্ছে…</div>
    );

  const activeTabConfig = TABS.find((t) => t.key === activeTab);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">Policy Pages Editor</h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Dashboard থেকে সাইটের সব পলিসি পেজের কনটেন্ট এডিট করুন
            </p>
          </div>
          <div className="flex items-center gap-3">
            {saved && (
              <span className="text-xs text-green-600 bg-green-50 px-3 py-1 rounded-full">
                সেভ হয়েছে!
              </span>
            )}
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
            >
              {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.label}
              <span className="ml-1.5 text-xs text-gray-400">
                ({(policyContent[tab.key] || []).length})
              </span>
            </button>
          ))}
        </div>

        {/* Editor body */}
        <div className="p-6">
          <div className="flex items-center gap-2 mb-4">
            <span className="text-sm font-medium text-gray-700">
              {activeTabConfig?.label} পেজের কনটেন্ট
            </span>
            <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
              /{activeTab === "faq" ? "faq" : activeTab === "shipping" ? "shipping" : activeTab === "return" ? "returns" : activeTab}
            </span>
            <span className="text-xs text-gray-400">
              — ফাঁকা রাখলে সাইটের default কনটেন্ট দেখাবে
            </span>
          </div>

          {activeTabConfig?.type === "qa" ? (
            <QAEditor
              items={policyContent[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          ) : (
            <SectionEditor
              items={policyContent[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          )}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-end gap-3">
          <button
            onClick={() => handleChange(activeTab, [])}
            className="text-xs text-gray-400 hover:text-red-500 transition"
          >
            এই পেজ রিসেট করুন (ফাঁকা করুন)
          </button>
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
