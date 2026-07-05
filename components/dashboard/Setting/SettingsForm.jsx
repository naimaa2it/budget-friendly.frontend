"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

function Section({
  title,
  badge,
  badgeColor = "bg-gray-100 text-gray-500",
  desc,
  children,
}) {
  return (
    <div className="bg-white rounded-xl border border-gray-200 overflow-hidden">
      <div className="px-5 py-3.5 border-b border-gray-100 flex items-center gap-2">
        <h2 className="font-semibold text-gray-800 text-sm">{title}</h2>
        {badge && (
          <span
            className={`text-[10px] px-2 py-0.5 rounded-full font-medium ${badgeColor}`}
          >
            {badge}
          </span>
        )}
      </div>
      {desc && <p className="px-5 pt-3 pb-0 text-xs text-gray-400">{desc}</p>}
      <div className="p-5">{children}</div>
    </div>
  );
}

function Field({ label, children }) {
  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 mb-1">
        {label}
      </label>
      {children}
    </div>
  );
}

const INPUT =
  "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300";

export default function SettingsForm() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoStatus, setLogoStatus] = useState("");
  const [migrating, setMigrating] = useState(false);
  const [migrateResult, setMigrateResult] = useState(null);
  const [migrateFrom, setMigrateFrom] = useState("SmartBuyBD");
  const [migrateTo, setMigrateTo] = useState("Pickob");

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    setLoading(true);
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => setSettings(b.settings || null))
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [API]);

  const handleSave = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
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

  const saveLogo = async (logoValue) => {
    setLogoStatus("saving");
    try {
      const r = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ websiteLogo: logoValue }),
      });
      if (!r.ok) {
        const body = await r.json().catch(() => ({}));
        throw new Error(body.error || `Server error (${r.status})`);
      }
      setLogoStatus("saved");
      setTimeout(() => setLogoStatus(""), 2500);
    } catch (err) {
      setLogoStatus(err.message || "error");
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const b = await uploadAdminImage(file, "Pickob/settings");
      const asset = b.asset || {};
      setSettings((s) => ({ ...s, websiteLogo: asset }));
      await saveLogo(asset);
    } catch (err) {
      alert(err.message || "Logo upload failed");
    } finally {
      setLogoUploading(false);
    }
  };

  const handleDeleteLogo = async () => {
    const publicId = settings?.websiteLogo?.public_id;
    if (publicId) {
      try {
        await fetch(`${API}/api/admin/media`, {
          method: "DELETE",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ public_ids: [publicId] }),
        });
      } catch {
        // non-blocking
      }
    }
    setSettings((s) => ({ ...s, websiteLogo: {} }));
    await saveLogo({});
  };

  const setFooter = (key, val) =>
    setSettings((s) => ({ ...s, footerInfo: { ...s.footerInfo, [key]: val } }));

  const setContact = (key, val) =>
    setSettings((s) => ({
      ...s,
      contactInfo: { ...s.contactInfo, [key]: val },
    }));

  const setSocial = (platform, field, val) =>
    setSettings((s) => ({
      ...s,
      socialLinks: {
        ...(s.socialLinks || {}),
        [platform]: { ...(s.socialLinks?.[platform] || {}), [field]: val },
      },
    }));

  const setFooterLinks = (listKey, updater) =>
    setSettings((s) => ({
      ...s,
      footerLinks: {
        ...(s.footerLinks || {}),
        [listKey]:
          typeof updater === "function"
            ? updater(s?.footerLinks?.[listKey] || [])
            : updater,
      },
    }));

  if (loading || !settings)
    return (
      <div className="max-w-3xl mx-auto bg-white p-8 rounded-xl border border-gray-200 text-center text-sm text-gray-400">
        Loading settings…
      </div>
    );

  return (
    <div className="max-w-6xl mx-auto space-y-4">
      {/* Page header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-gray-900">Settings</h1>
          <p className="text-xs text-gray-400 mt-0.5">
            Store ও footer settings manage করুন
          </p>
        </div>
        <div className="flex items-center gap-2">
          <button
            onClick={() => window.location.reload()}
            className="px-4 py-2 border border-gray-200 rounded-lg text-sm text-gray-600 hover:bg-gray-50"
          >
            Reset
          </button>
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
      </div>

      {/* ── Store Info ──────────────────────────────────────────── */}
      <Section
        title="Store Info"
        badge="General"
        badgeColor="bg-gray-100 text-gray-500"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="Store name">
            <input
              value={settings.storeName || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, storeName: e.target.value }))
              }
              className={INPUT}
              placeholder="My Store"
            />
          </Field>
          <Field label="Contact email">
            <input
              value={settings.storeEmail || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, storeEmail: e.target.value }))
              }
              className={INPUT}
              placeholder="info@example.com"
            />
          </Field>
          <Field label="Cloudinary folder">
            <input
              value={settings.cloudinaryFolder || ""}
              onChange={(e) =>
                setSettings((s) => ({ ...s, cloudinaryFolder: e.target.value }))
              }
              className={INPUT}
              placeholder="Pickob/products"
            />
          </Field>
        </div>

        {/* Logo */}
        <div className="mt-4 pt-4 border-t border-gray-100">
          <p className="text-xs font-medium text-gray-600 mb-2">Website Logo</p>
          <div className="flex items-center gap-4 flex-wrap">
            <div className="w-28 h-14 bg-gray-50 border border-gray-200 rounded-lg flex items-center justify-center overflow-hidden shrink-0">
              {settings.websiteLogo?.url ? (
                <img
                  src={settings.websiteLogo.url}
                  alt="Logo"
                  className="max-w-full max-h-full object-contain"
                />
              ) : (
                <span className="text-xs text-gray-300">No logo</span>
              )}
            </div>
            <div className="flex flex-wrap gap-2">
              <label className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs cursor-pointer bg-white hover:bg-gray-50">
                {logoUploading ? "Uploading…" : "Upload"}
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  disabled={logoUploading}
                  onChange={(e) => {
                    const file = e.target.files?.[0];
                    if (file) handleLogoUpload(file);
                    e.target.value = "";
                  }}
                />
              </label>
              <button
                type="button"
                onClick={() => setShowLogoPicker(true)}
                className="px-3 py-1.5 border border-gray-200 rounded-lg text-xs bg-white hover:bg-gray-50"
              >
                From Media
              </button>
              <button
                type="button"
                onClick={handleDeleteLogo}
                className="px-3 py-1.5 border border-red-200 rounded-lg text-xs text-red-600 bg-white hover:bg-red-50"
              >
                Delete
              </button>
            </div>
          </div>
          <p className="mt-2 text-[11px] text-gray-400">
            {logoStatus === "saving" && (
              <span className="text-blue-500">Saving…</span>
            )}
            {logoStatus === "saved" && (
              <span className="text-green-600">Saved!</span>
            )}
            {logoStatus &&
              logoStatus !== "saving" &&
              logoStatus !== "saved" && (
                <span className="text-red-500">Error: {logoStatus}</span>
              )}
            {!logoStatus && "Changes apply to the website immediately."}
          </p>
        </div>
      </Section>

      {/* ── Footer Contact Info ─────────────────────────────────── */}
      <Section
        title="Footer — Contact Info"
        badge="Footer"
        badgeColor="bg-gray-100 text-gray-500"
        desc="Website-এর footer section-এ এই তথ্য দেখাবে।"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ফোন নম্বর">
            <input
              value={settings.footerInfo?.phone || ""}
              onChange={(e) => setFooter("phone", e.target.value)}
              className={INPUT}
              placeholder="+880 1700-000000"
            />
          </Field>
          <Field label="ইমেইল">
            <input
              value={settings.footerInfo?.email || ""}
              onChange={(e) => setFooter("email", e.target.value)}
              className={INPUT}
              placeholder="info@example.com"
            />
          </Field>
          <Field label="ঠিকানা">
            <input
              value={settings.footerInfo?.address || ""}
              onChange={(e) => setFooter("address", e.target.value)}
              className={`${INPUT} sm:col-span-2`}
              placeholder="Mirpur, Dhaka-1216, Bangladesh"
            />
          </Field>
        </div>
      </Section>

      {/* ── Contact Page Info ───────────────────────────────────── */}
      <Section
        title="Contact Page — Contact Info"
        badge="/contact"
        badgeColor="bg-blue-50 text-blue-500"
        desc="Website-এর Contact Us পেজে এই তথ্য দেখাবে।"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <Field label="ফোন নম্বর">
            <input
              value={settings.contactInfo?.phone || ""}
              onChange={(e) => setContact("phone", e.target.value)}
              className={INPUT}
              placeholder="+880 1700-000000"
            />
          </Field>
          <Field label="ইমেইল">
            <input
              value={settings.contactInfo?.email || ""}
              onChange={(e) => setContact("email", e.target.value)}
              className={INPUT}
              placeholder="support@example.com"
            />
          </Field>
          <Field label="ঠিকানা">
            <input
              value={settings.contactInfo?.address || ""}
              onChange={(e) => setContact("address", e.target.value)}
              className={`${INPUT} sm:col-span-2`}
              placeholder="Mirpur, Dhaka-1216, Bangladesh"
            />
          </Field>
        </div>
      </Section>

      {/* ── Social Media Links ──────────────────────────────────── */}
      <Section
        title="Social Media Links"
        badge="Footer"
        badgeColor="bg-purple-50 text-purple-500"
        desc="Toggle ON করলে এবং link দিলে footer-এ দেখাবে।"
      >
        <div className="space-y-2">
          {[
            {
              key: "facebook",
              label: "Facebook",
              color: "#1877F2",
              placeholder: "https://facebook.com/yourpage",
            },
            {
              key: "instagram",
              label: "Instagram",
              color: "#E1306C",
              placeholder: "https://instagram.com/yourprofile",
            },
            {
              key: "twitter",
              label: "Twitter / X",
              color: "#000000",
              placeholder: "https://twitter.com/yourhandle",
            },
            {
              key: "tiktok",
              label: "TikTok",
              color: "#010101",
              placeholder: "https://tiktok.com/@yourprofile",
            },
            {
              key: "youtube",
              label: "YouTube",
              color: "#FF0000",
              placeholder: "https://youtube.com/@yourchannel",
            },
          ].map(({ key, label, color, placeholder }) => {
            const link = settings.socialLinks?.[key] || {};
            return (
              <div
                key={key}
                className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-gray-700 w-20 shrink-0">
                  {label}
                </span>
                <input
                  type="url"
                  value={link.url || ""}
                  onChange={(e) => setSocial(key, "url", e.target.value)}
                  className="flex-1 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 bg-white"
                  placeholder={placeholder}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0 text-gray-600">
                  <input
                    type="checkbox"
                    checked={link.enabled !== false}
                    onChange={(e) =>
                      setSocial(key, "enabled", e.target.checked)
                    }
                    className="w-3.5 h-3.5 accent-indigo-600"
                  />
                  Show
                </label>
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Footer Navigation Links ─────────────────────────────── */}
      <Section
        title="Footer Navigation Links"
        badge="Quick Links & Customer Service"
        badgeColor="bg-orange-50 text-orange-500"
        desc="Footer-এর Quick Links ও Customer Service section কাস্টমাইজ করুন।"
      >
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { key: "quickLinks", title: "Quick Links" },
            { key: "customerService", title: "Customer Service" },
          ].map(({ key, title }) => {
            const links = settings?.footerLinks?.[key] || [];
            const setLinks = (updater) => setFooterLinks(key, updater);

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    {title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLinks((prev) => [...prev, { label: "", href: "" }])
                    }
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100"
                  >
                    <svg
                      width="10"
                      height="10"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2.5"
                      strokeLinecap="round"
                    >
                      <line x1="12" y1="5" x2="12" y2="19" />
                      <line x1="5" y1="12" x2="19" y2="12" />
                    </svg>
                    Add
                  </button>
                </div>

                {links.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-3 text-center border border-dashed border-gray-200 rounded-lg">
                    কোনো link নেই
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {links.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          value={item.label}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, label: e.target.value } : l,
                              ),
                            )
                          }
                          placeholder="Label"
                          className="w-24 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          value={item.href}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, href: e.target.value } : l,
                              ),
                            )
                          }
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (
                              val &&
                              !val.startsWith("/") &&
                              !val.startsWith("http://") &&
                              !val.startsWith("https://")
                            ) {
                              setLinks((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { ...l, href: `/${val}` } : l,
                                ),
                              );
                            }
                          }}
                          placeholder="/path"
                          className="flex-1 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLinks((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50"
                          title="Remove"
                        >
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 24 24"
                            fill="none"
                            stroke="currentColor"
                            strokeWidth="2"
                            strokeLinecap="round"
                            strokeLinejoin="round"
                          >
                            <polyline points="3 6 5 6 21 6" />
                            <path d="M19 6l-1 14a2 2 0 0 1-2 2H8a2 2 0 0 1-2-2L5 6" />
                            <path d="M10 11v6M14 11v6" />
                            <path d="M9 6V4h6v2" />
                          </svg>
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </Section>

      {/* ── Cloudinary Migration ────────────────────────────────── */}
      <div className="border border-amber-200 bg-amber-50 rounded-xl p-5">
        <h3 className="font-semibold text-amber-800 text-sm mb-1">
          Cloudinary Folder Migration
        </h3>
        <p className="text-xs text-amber-700 mb-4">
          পুরনো Cloudinary folder-এর সব image নতুন folder-এ move করবে এবং
          database-এর সব URL update করবে।
        </p>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">
              From (পুরনো folder)
            </label>
            <input
              value={migrateFrom}
              onChange={(e) => setMigrateFrom(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="SmartBuyBD"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">
              To (নতুন folder)
            </label>
            <input
              value={migrateTo}
              onChange={(e) => setMigrateTo(e.target.value)}
              className="border border-amber-300 rounded-lg px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-300"
              placeholder="Pickob"
            />
          </div>
          <button
            disabled={
              migrating ||
              !migrateFrom ||
              !migrateTo ||
              migrateFrom === migrateTo
            }
            onClick={async () => {
              if (
                !window.confirm(
                  `Cloudinary-তে "${migrateFrom}" → "${migrateTo}" migrate করবে?\nDB-র সব image URL update হবে। Continue?`,
                )
              )
                return;
              setMigrating(true);
              setMigrateResult(null);
              try {
                const r = await fetch(
                  `${API}/api/admin/migrate-cloudinary-folder`,
                  {
                    method: "POST",
                    headers: { "Content-Type": "application/json" },
                    credentials: "include",
                    body: JSON.stringify({ from: migrateFrom, to: migrateTo }),
                  },
                );
                const b = await r.json();
                setMigrateResult(b);
              } catch (e) {
                setMigrateResult({ error: e.message });
              } finally {
                setMigrating(false);
              }
            }}
            className="px-4 py-2 bg-amber-600 text-white text-sm rounded-lg hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {migrating ? "Migrating…" : "Start Migration"}
          </button>
        </div>

        {migrateResult && (
          <div
            className={`rounded-lg p-3 text-xs font-mono ${migrateResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
          >
            {migrateResult.ok ? (
              <>
                <div className="font-bold text-green-700 mb-2">
                  Migration সফল!
                </div>
                <div>
                  Cloudinary renamed:{" "}
                  <b>{migrateResult.log?.cloudinary?.renamed}</b> | skipped:{" "}
                  {migrateResult.log?.cloudinary?.skipped}
                </div>
                {migrateResult.log?.cloudinary?.errors?.length > 0 && (
                  <div className="text-red-600 mt-1">
                    Errors: {migrateResult.log.cloudinary.errors.join(", ")}
                  </div>
                )}
                <div className="mt-2">DB updated:</div>
                {Object.entries(migrateResult.log?.db || {}).map(([k, v]) => (
                  <div key={k}>
                    &nbsp;&nbsp;{k}: <b>{v}</b> records
                  </div>
                ))}
              </>
            ) : (
              <div>Error: {migrateResult.error}</div>
            )}
          </div>
        )}
      </div>

      <MediaPicker
        open={showLogoPicker}
        onSelect={async (asset) => {
          const logo = asset || {};
          setSettings((s) => ({ ...s, websiteLogo: logo }));
          setShowLogoPicker(false);
          await saveLogo(logo);
        }}
        onClose={() => setShowLogoPicker(false)}
      />
    </div>
  );
}
