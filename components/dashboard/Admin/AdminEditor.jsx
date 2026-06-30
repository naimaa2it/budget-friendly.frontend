"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";

// Mirrors backend lib/permissions.js — kept in sync manually since the
// backend module is ESM-only and not importable from the Next.js frontend.
const PERMISSION_KEYS = ["catalog", "orders", "customers", "content", "addons"];
const PERMISSION_LABELS = {
  catalog:
    "Catalog (Products, Variants, Discounts, Barcodes, Rewards, Waitlist…)",
  orders: "Orders (incl. Returns, Abandoned Carts, Wishlist)",
  customers: "Customers & Customer Tags",
  content: "Marketing & Content (Banners, Popups, Blog, Media…)",
  addons: "Addons (Pixels, Analytics…)",
};

export default function AdminEditor({ adminId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [admin, setAdmin] = useState({
    name: "",
    email: "",
    role: "moderator",
    isActive: true,
    permissions: [],
  });
  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);
  const [password, setPassword] = useState("");

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    if (!adminId || adminId === "new") return;
    setLoading(true);
    fetch(`${API}/api/admin/admins/${adminId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.admin) setAdmin({ permissions: [], ...b.admin });
      })
      .catch((err) => console.error(err))
      .finally(() => setLoading(false));
  }, [adminId, API]);

  const handleSave = async () => {
    if (!admin.name || !admin.email)
      return alert("Name and email are required");
    setSaving(true);
    try {
      const method = adminId && adminId !== "new" ? "PUT" : "POST";
      const url =
        method === "POST"
          ? `${API}/api/admin/admins`
          : `${API}/api/admin/admins/${adminId}`;
      const body =
        method === "POST"
          ? { ...admin, password }
          : {
              name: admin.name,
              email: admin.email,
              role: admin.role,
              isActive: admin.isActive,
              permissions: admin.permissions,
              newPassword: password || undefined,
            };
      const resp = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(body),
      });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Save failed");
      router.push("/dashboard/authorized");
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">
          {adminId === "new" ? "Create admin / moderator" : "Edit account"}
        </h2>
        <div>
          <button
            onClick={() => router.push("/dashboard/authorized")}
            className="px-3 py-2 border rounded text-sm shrink-0"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              value={admin.name || ""}
              onChange={(e) =>
                setAdmin((a) => ({ ...a, name: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              value={admin.email || ""}
              onChange={(e) =>
                setAdmin((a) => ({ ...a, email: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={admin.role}
                onChange={(e) =>
                  setAdmin((a) => ({ ...a, role: e.target.value }))
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="admin">Admin</option>
                <option value="moderator">Moderator</option>
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium">Status</label>
              <select
                value={admin.isActive ? "active" : "disabled"}
                onChange={(e) =>
                  setAdmin((a) => ({
                    ...a,
                    isActive: e.target.value === "active",
                  }))
                }
                className="w-full border px-3 py-2 rounded"
              >
                <option value="active">Active</option>
                <option value="disabled">Disabled</option>
              </select>
            </div>
          </div>

          {admin.role === "moderator" && (
            <div>
              <label className="block text-sm font-medium">
                Section access
              </label>
              <p className="text-xs text-gray-500 mb-2">
                Leave all unchecked to give this moderator full access. Check
                one or more to restrict them to only those sections.
              </p>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                {PERMISSION_KEYS.map((key) => (
                  <label
                    key={key}
                    className="flex items-start gap-2 text-sm border rounded px-3 py-2"
                  >
                    <input
                      type="checkbox"
                      className="mt-0.5"
                      checked={(admin.permissions || []).includes(key)}
                      onChange={(e) =>
                        setAdmin((a) => {
                          const current = a.permissions || [];
                          const permissions = e.target.checked
                            ? [...current, key]
                            : current.filter((k) => k !== key);
                          return { ...a, permissions };
                        })
                      }
                    />
                    <span>{PERMISSION_LABELS[key]}</span>
                  </label>
                ))}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium">
              Set new password (leave blank to keep current)
            </label>
            <input
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-indigo-600 text-white rounded"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => router.push("/dashboard/authorized")}
              className="px-3 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
