"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";
import MediaPicker from "@/components/dashboard/MediaPicker";

export default function SettingsForm() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [logoUploading, setLogoUploading] = useState(false);
  const [showLogoPicker, setShowLogoPicker] = useState(false);
  const [logoStatus, setLogoStatus] = useState("");

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
      if (!r.ok) throw new Error("Save failed");
      setLogoStatus("saved");
      setTimeout(() => setLogoStatus(""), 2500);
    } catch {
      setLogoStatus("error");
    }
  };

  const handleLogoUpload = async (file) => {
    if (!file) return;
    setLogoUploading(true);
    try {
      const fd = new FormData();
      fd.append("file", file);
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
          <label className="block text-sm font-medium">Contact phone</label>
          <input
            value={settings.storePhone || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, storePhone: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded"
            placeholder="+880 1700-000000"
          />
        </div>

        <div className="sm:col-span-2">
          <label className="block text-sm font-medium">Store address</label>
          <input
            value={settings.storeAddress || ""}
            onChange={(e) =>
              setSettings((s) => ({ ...s, storeAddress: e.target.value }))
            }
            className="w-full border px-3 py-2 rounded"
            placeholder="123 Main St, Dhaka, Bangladesh"
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
              {logoStatus === "error" && (
                <span className="text-red-600">Failed to save logo.</span>
              )}
              {!logoStatus &&
                "Upload/change/delete logo here. Changes apply to the website immediately."}
            </p>
          </div>
        </div>
      </div>

      <div className="mt-6 flex gap-3">
        {user?.role === "admin" ? (
          <button
            onClick={handleSave}
            className="px-4 py-2 bg-indigo-600 text-white rounded"
            disabled={saving}
          >
            {saving ? "Saving…" : "Save settings"}
          </button>
        ) : (
          <button
            className="px-4 py-2 border rounded bg-gray-50 text-gray-500"
            disabled
          >
            Read-only
          </button>
        )}
        <button
          onClick={() => window.location.reload()}
          className="px-4 py-2 border rounded"
        >
          Reset
        </button>
      </div>

      <div className="mt-6 text-xs text-gray-500">
        Only admins can update store settings. Payment provider secrets should
        be stored in environment variables for production.
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
