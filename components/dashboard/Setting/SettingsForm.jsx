"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";
import MediaPicker from "@/components/dashboard/MediaPicker";

export default function SettingsForm() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
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
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(settings),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      alert("Settings saved");
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
      console.error("saveLogo failed:", err);
      setLogoStatus(err.message || "error");
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("folder", "Pickob/settings");
      const r = await fetch(`${API}/api/admin/upload`, {
        method: "POST",
        credentials: "include",
        body: fd,
      });
      const b = await r.json();
      if (!r.ok) throw new Error(b.error || "Upload failed");
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

  if (loading || !settings)
    return (
      <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow text-center">
        Loading settings…
      </div>
    );

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <h2 className="text-lg font-semibold mb-4">Store settings</h2>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-sm font-medium">Store name</label>
          <input
            value={settings.storeName || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, storeName: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>
        <div>
          <label className="block text-sm font-medium">Contact email</label>
          <input
            value={settings.storeEmail || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, storeEmail: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded"
            placeholder="info@example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Cloudinary folder</label>
          <input
            value={settings.cloudinaryFolder || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, cloudinaryFolder: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded"
          />
        </div>

        <div>
          <label className="block text-sm font-medium">Website logo</label>
          <div className="mt-2 border rounded p-3 bg-gray-50">
            <div className="flex items-center gap-3">
              <div className="w-28 h-14 bg-white border rounded flex items-center justify-center overflow-hidden">
                {settings.websiteLogo?.url ? (
                  <img
                    src={settings.websiteLogo.url}
                    alt="Website logo"
                    className="max-w-full max-h-full object-contain"
                  />
                ) : (
                  <span className="text-xs text-gray-400">No logo</span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                <label className="px-3 py-1.5 border rounded text-sm cursor-pointer bg-white hover:bg-gray-100">
                  {logoUploading ? "Uploading…" : "Upload Logo"}
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
                  className="px-3 py-1.5 border rounded text-sm bg-white hover:bg-gray-100"
                >
                  Select from Media
                </button>
                <button
                  type="button"
                  onClick={handleDeleteLogo}
                  className="px-3 py-1.5 border rounded text-sm text-red-600 border-red-200 bg-white hover:bg-red-50"
                >
                  Delete Logo
                </button>
              </div>
            </div>
            <p className="mt-2 text-xs text-gray-500">
              {logoStatus === "saving" && (
                <span className="text-blue-600">Saving…</span>
              )}
              {logoStatus === "saved" && (
                <span className="text-green-600">Logo saved!</span>
              )}
              {logoStatus &&
                logoStatus !== "saving" &&
                logoStatus !== "saved" && (
                  <span className="text-red-600">
                    Failed to save logo: {logoStatus}
                  </span>
                )}
              {!logoStatus &&
                "Upload/change/delete logo here. Changes apply to the website immediately."}
            </p>
          </div>
        </div>
      </div>

      {/* Footer contact info */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold">
            Footer — Phone, Email & Address
          </h2>
          <span className="text-xs bg-gray-100 text-gray-500 px-2 py-0.5 rounded">
            Website footer এ দেখাবে
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Website-এর একদম নিচে footer section এ এই তথ্য দেখাবে।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">
              ফোন নম্বর (Footer)
            </label>
            <input
              value={settings.footerInfo?.phone || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  footerInfo: { ...s.footerInfo, phone: e.target.value },
                }))
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="+880 1700-000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">ইমেইল (Footer)</label>
            <input
              value={settings.footerInfo?.email || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  footerInfo: { ...s.footerInfo, email: e.target.value },
                }))
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="info@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">ঠিকানা (Footer)</label>
            <input
              value={settings.footerInfo?.address || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  footerInfo: { ...s.footerInfo, address: e.target.value },
                }))
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="Mirpur, Dhaka-1216, Bangladesh"
            />
          </div>
        </div>
      </div>

      {/* Contact page info */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold">
            Contact Page — Phone, Email & Address
          </h2>
          <span className="text-xs bg-blue-50 text-blue-500 px-2 py-0.5 rounded">
            /contact page এ দেখাবে
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          Website-এর &quot;Contact Us&quot; পেজে এই তথ্য দেখাবে।
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium">
              ফোন নম্বর (Contact Page)
            </label>
            <input
              value={settings.contactInfo?.phone || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  contactInfo: { ...s.contactInfo, phone: e.target.value },
                }))
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="+880 1700-000000"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">
              ইমেইল (Contact Page)
            </label>
            <input
              value={settings.contactInfo?.email || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  contactInfo: { ...s.contactInfo, email: e.target.value },
                }))
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="support@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-sm font-medium">
              ঠিকানা (Contact Page)
            </label>
            <input
              value={settings.contactInfo?.address || ""}
              onChange={(e) =>
                setSettings((s) => ({
                  ...s,
                  contactInfo: { ...s.contactInfo, address: e.target.value },
                }))
              }
              className="w-full border px-3 py-2 rounded"
              placeholder="Mirpur, Dhaka-1216, Bangladesh"
            />
          </div>
        </div>
      </div>

      {/* Social Media Links */}
      <div className="mt-8 border-t pt-6">
        <div className="flex items-center gap-2 mb-1">
          <h2 className="text-lg font-semibold">Social Media Links</h2>
          <span className="text-xs bg-purple-50 text-purple-500 px-2 py-0.5 rounded">
            Footer এ দেখাবে
          </span>
        </div>
        <p className="text-xs text-gray-400 mb-4">
          যে platform এ toggle ON করবেন এবং link দেবেন, সেটি footer এ দেখাবে।
        </p>
        <div className="space-y-3">
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
                className="flex items-center gap-3 p-3 border rounded-lg bg-gray-50"
              >
                <span
                  className="w-5 h-5 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-sm font-medium w-24 shrink-0">
                  {label}
                </span>
                <input
                  type="url"
                  value={link.url || ""}
                  onChange={(e) =>
                    setSettings((s) => ({
                      ...s,
                      socialLinks: {
                        ...(s.socialLinks || {}),
                        [key]: {
                          ...(s.socialLinks?.[key] || {}),
                          url: e.target.value,
                        },
                      },
                    }))
                  }
                  className="flex-1 border px-3 py-1.5 rounded text-sm"
                  placeholder={placeholder}
                />
                <label className="flex items-center gap-1.5 text-sm cursor-pointer shrink-0">
                  <input
                    type="checkbox"
                    checked={link.enabled !== false}
                    onChange={(e) =>
                      setSettings((s) => ({
                        ...s,
                        socialLinks: {
                          ...(s.socialLinks || {}),
                          [key]: {
                            ...(s.socialLinks?.[key] || {}),
                            enabled: e.target.checked,
                          },
                        },
                      }))
                    }
                    className="w-4 h-4 accent-indigo-600"
                  />
                  Show
                </label>
              </div>
            );
          })}
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        <button
          onClick={handleSave}
          className="px-4 py-2 bg-indigo-600 text-white rounded"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save settings"}
        </button>
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border rounded"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Payment provider secrets should be stored in environment variables for
        production.
      </div>

      {/* ── Cloudinary Folder Migration ─────────────────────────────────────── */}
      <div className="mt-8 border border-amber-200 bg-amber-50 rounded-lg p-5">
        <h3 className="font-semibold text-amber-800 mb-1">
          Cloudinary Folder Migration
        </h3>
        <p className="text-xs text-amber-700 mb-4">
          পুরনো Cloudinary folder-এর সব image নতুন folder-এ move করবে এবং
          database-এর সব URL update করবে। একবার run করলেই হবে।
        </p>
        <div className="flex flex-wrap gap-3 items-end mb-4">
          <div>
            <label className="block text-xs font-medium text-amber-800 mb-1">
              From (পুরনো folder)
            </label>
            <input
              value={migrateFrom}
              onChange={(e) => setMigrateFrom(e.target.value)}
              className="border border-amber-300 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
              className="border border-amber-300 rounded px-3 py-1.5 text-sm w-36 focus:outline-none focus:ring-2 focus:ring-amber-400"
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
            className="px-4 py-2 bg-amber-600 text-white text-sm rounded hover:bg-amber-700 disabled:opacity-50 disabled:cursor-not-allowed transition"
          >
            {migrating ? "Migrating… (এটু সময় নেবে)" : "Start Migration"}
          </button>
        </div>

        {migrateResult && (
          <div
            className={`rounded p-3 text-xs font-mono ${migrateResult.ok ? "bg-green-50 border border-green-200 text-green-800" : "bg-red-50 border border-red-200 text-red-800"}`}
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
