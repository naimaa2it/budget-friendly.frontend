"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";

const generateStrongPassword = () => {
  const upper = "ABCDEFGHIJKLMNOPQRSTUVWXYZ";
  const lower = "abcdefghijklmnopqrstuvwxyz";
  const nums  = "0123456789";
  const syms  = "!@#$%^&*()_+-=";
  const all   = upper + lower + nums + syms;
  const p = [
    upper[Math.random() * upper.length | 0],
    lower[Math.random() * lower.length | 0],
    nums [Math.random() * nums.length  | 0],
    syms [Math.random() * syms.length  | 0],
  ];
  for (let i = 4; i < 16; i++) p.push(all[Math.random() * all.length | 0]);
  for (let i = p.length - 1; i > 0; i--) {
    const j = Math.random() * (i + 1) | 0;
    [p[i], p[j]] = [p[j], p[i]];
  }
  return p.join("");
};

const getPasswordStrength = (pwd) => {
  if (!pwd) return null;
  const score = [
    pwd.length >= 8,
    pwd.length >= 12,
    /[A-Z]/.test(pwd),
    /[a-z]/.test(pwd),
    /[0-9]/.test(pwd),
    /[^A-Za-z0-9]/.test(pwd),
  ].filter(Boolean).length;
  if (score <= 2) return { score, label: "Weak",   bar: "bg-red-500",   text: "text-red-600"   };
  if (score <= 4) return { score, label: "Fair",   bar: "bg-yellow-400", text: "text-yellow-600" };
  return              { score, label: "Strong", bar: "bg-green-500",  text: "text-green-600" };
};

// Mirrors backend lib/permissions.js PERMISSION_GROUPS
const PERMISSION_GROUPS = [
  {
    groupKey: "dashboard",
    label: "Dashboard",
    permissions: [{ key: "dashboard.view", label: "View dashboard" }],
  },
  {
    groupKey: "orders",
    label: "Orders",
    permissions: [
      { key: "orders.view",      label: "View orders" },
      { key: "orders.manage",    label: "Create & edit orders" },
      { key: "orders.delete",    label: "Delete orders" },
      { key: "orders.returns",   label: "Returns & refunds" },
      { key: "orders.abandoned", label: "Abandoned carts & checkouts" },
      { key: "orders.wishlist",  label: "View wishlist" },
      { key: "orders.timeline",  label: "Order timeline" },
      { key: "orders.notes",     label: "Customer notes" },
      { key: "orders.pick",      label: "Order pick" },
      { key: "orders.courier",   label: "Send orders to courier" },
    ],
  },
  {
    groupKey: "products",
    label: "Products",
    permissions: [
      { key: "products.view",         label: "View products" },
      { key: "products.buying_price", label: "View buying price" },
      { key: "products.manage",       label: "Create & edit products" },
      { key: "products.delete",       label: "Delete products" },
      { key: "products.inventory",    label: "Manage inventory" },
      { key: "products.variants",     label: "Product variants" },
      { key: "products.categories",   label: "Categories" },
      { key: "products.discounts",    label: "Discounts & coupons" },
      { key: "products.tags",         label: "Tags & badges" },
      { key: "products.barcodes",     label: "Barcodes" },
      { key: "products.reviews",      label: "Reviews" },
      { key: "products.rewards",      label: "Rewards" },
      { key: "products.waitlist",     label: "Waitlist" },
      { key: "products.questions",    label: "Q & A" },
      { key: "products.preorders",    label: "Pre-orders" },
    ],
  },
  {
    groupKey: "customers",
    label: "Customers",
    permissions: [
      { key: "customers.view",   label: "View customers" },
      { key: "customers.manage", label: "Create & edit customers" },
      { key: "customers.delete", label: "Delete customers" },
      { key: "customers.tags",   label: "Customer tags" },
    ],
  },
  {
    groupKey: "content",
    label: "Online Store & Content",
    permissions: [
      { key: "content.banners",  label: "Banners & popups" },
      { key: "content.promo",    label: "Promo strip, occasions & panels" },
      { key: "content.featured", label: "Featured sections" },
      { key: "content.blog",     label: "Blog / content" },
      { key: "content.media",    label: "Media library" },
    ],
  },
  {
    groupKey: "addons",
    label: "Addons",
    permissions: [
      { key: "addons.manage",     label: "All addons overview" },
      { key: "addons.pixels",     label: "Pixels (Facebook, TikTok)" },
      { key: "addons.analytics",  label: "Analytics (GA4, GTM)" },
      { key: "addons.adsense",    label: "Google AdSense" },
      { key: "addons.protection", label: "Fake order protection" },
    ],
  },
  {
    groupKey: "reports",
    label: "Reports",
    permissions: [
      { key: "reports.profit",    label: "Profit margin" },
      { key: "reports.analytics", label: "Most searched & popular" },
    ],
  },
  {
    groupKey: "system",
    label: "System",
    permissions: [
      { key: "system.settings", label: "Website settings" },
      { key: "system.policies", label: "Policy pages" },
    ],
  },
];

const ALL_KEYS = PERMISSION_GROUPS.flatMap((g) => g.permissions.map((p) => p.key));

function GroupCheckbox({ allChecked, someChecked, onChange }) {
  const ref = useRef(null);
  useEffect(() => {
    if (ref.current) ref.current.indeterminate = someChecked && !allChecked;
  }, [someChecked, allChecked]);
  return (
    <input
      ref={ref}
      type="checkbox"
      checked={allChecked}
      onChange={onChange}
      className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
    />
  );
}

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
  const [showPassword, setShowPassword] = useState(false);

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

  const togglePermission = (key, checked) => {
    setAdmin((a) => {
      const current = a.permissions || [];
      const permissions = checked
        ? [...current, key]
        : current.filter((k) => k !== key);
      return { ...a, permissions };
    });
  };

  const toggleGroup = (groupKeys, checked) => {
    setAdmin((a) => {
      const current = a.permissions || [];
      const permissions = checked
        ? [...new Set([...current, ...groupKeys])]
        : current.filter((k) => !groupKeys.includes(k));
      return { ...a, permissions };
    });
  };

  const toggleAll = () => {
    const hasAll = ALL_KEYS.every((k) => (admin.permissions || []).includes(k));
    setAdmin((a) => ({ ...a, permissions: hasAll ? [] : ALL_KEYS }));
  };

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

  const checkedPermissions = admin.permissions || [];
  const allChecked = ALL_KEYS.every((k) => checkedPermissions.includes(k));

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">
          {adminId === "new" ? "Create admin / moderator" : "Edit account"}
        </h2>
        <button
          onClick={() => router.push("/dashboard/authorized")}
          className="px-3 py-2 border rounded text-sm shrink-0"
        >
          Back
        </button>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Full name</label>
            <input
              value={admin.name || ""}
              onChange={(e) => setAdmin((a) => ({ ...a, name: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div>
            <label className="block text-sm font-medium">Email</label>
            <input
              value={admin.email || ""}
              onChange={(e) => setAdmin((a) => ({ ...a, email: e.target.value }))}
              className="w-full border px-3 py-2 rounded"
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-sm font-medium">Role</label>
              <select
                value={admin.role}
                onChange={(e) => setAdmin((a) => ({ ...a, role: e.target.value }))}
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
                  setAdmin((a) => ({ ...a, isActive: e.target.value === "active" }))
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
              <div className="flex items-center justify-between mb-1">
                <label className="block text-sm font-medium">Permissions</label>
                <button
                  type="button"
                  onClick={toggleAll}
                  className="text-xs text-indigo-600 hover:underline"
                >
                  {allChecked ? "Deselect all" : "Select all"}
                </button>
              </div>
              <p className="text-xs text-gray-500 mb-3">
                Check the permissions you want to grant. Unchecked items will not be accessible.
              </p>

              <div className="border rounded-lg divide-y">
                {PERMISSION_GROUPS.map((group) => {
                  const groupKeys = group.permissions.map((p) => p.key);
                  const groupAllChecked = groupKeys.every((k) => checkedPermissions.includes(k));
                  const groupSomeChecked = groupKeys.some((k) => checkedPermissions.includes(k));

                  return (
                    <div key={group.groupKey} className="p-3">
                      <div className="flex items-center justify-between mb-2">
                        <span className="text-sm font-semibold text-gray-800">
                          {group.label}
                        </span>
                        <label className="flex items-center gap-1.5 text-xs text-gray-500 cursor-pointer select-none">
                          <GroupCheckbox
                            allChecked={groupAllChecked}
                            someChecked={groupSomeChecked}
                            onChange={(e) => toggleGroup(groupKeys, e.target.checked)}
                          />
                          Select all
                        </label>
                      </div>
                      <div className="grid grid-cols-1 sm:grid-cols-2 gap-1.5">
                        {group.permissions.map((perm) => (
                          <label
                            key={perm.key}
                            className="flex items-center gap-2 text-sm text-gray-600 cursor-pointer select-none"
                          >
                            <input
                              type="checkbox"
                              checked={checkedPermissions.includes(perm.key)}
                              onChange={(e) => togglePermission(perm.key, e.target.checked)}
                              className="h-4 w-4 rounded border-gray-300 text-indigo-600 accent-indigo-600"
                            />
                            {perm.label}
                          </label>
                        ))}
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          <div>
            <label className="block text-sm font-medium mb-1">
              {adminId === "new" ? "Password" : "New password (leave blank to keep current)"}
            </label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <input
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  placeholder={adminId !== "new" ? "Leave blank to keep current" : "Enter password"}
                  className="w-full border px-3 py-2 rounded pr-10"
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  className="absolute right-3 top-1/2 -translate-y-1/2 text-gray-400 hover:text-gray-600 text-sm select-none"
                  tabIndex={-1}
                  title={showPassword ? "Hide password" : "Show password"}
                >
                  {showPassword ? "🙈" : "👁"}
                </button>
              </div>
              <button
                type="button"
                onClick={() => {
                  const p = generateStrongPassword();
                  setPassword(p);
                  setShowPassword(true);
                }}
                className="px-3 py-2 border border-indigo-300 text-indigo-600 rounded text-sm hover:bg-indigo-50 whitespace-nowrap font-medium"
                title="Generate a strong random password"
              >
                ✦ Generate
              </button>
            </div>

            {/* Strength indicator */}
            {password && (() => {
              const strength = getPasswordStrength(password);
              const checks = [
                { label: "8+ chars",  ok: password.length >= 8 },
                { label: "Uppercase", ok: /[A-Z]/.test(password) },
                { label: "Lowercase", ok: /[a-z]/.test(password) },
                { label: "Number",    ok: /[0-9]/.test(password) },
                { label: "Symbol",    ok: /[^A-Za-z0-9]/.test(password) },
              ];
              return (
                <div className="mt-2 space-y-1.5">
                  <div className="h-1.5 bg-gray-200 rounded-full overflow-hidden">
                    <div
                      className={`h-full ${strength.bar} transition-all duration-300`}
                      style={{ width: `${(strength.score / 6) * 100}%` }}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                      {checks.map((c) => (
                        <span
                          key={c.label}
                          className={`text-xs ${c.ok ? "text-green-600" : "text-gray-400"}`}
                        >
                          {c.ok ? "✓" : "○"} {c.label}
                        </span>
                      ))}
                    </div>
                    <span className={`text-xs font-semibold ${strength.text} ml-2 shrink-0`}>
                      {strength.label}
                    </span>
                  </div>
                </div>
              );
            })()}
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
