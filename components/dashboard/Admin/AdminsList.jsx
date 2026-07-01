"use client";

import React, { useCallback, useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";

// Groups to display in the permission grid — mirrors backend PERMISSION_GROUPS structure.
// `legacy` is the old broad section key that also grants access to this group.
const GROUPS = [
  { key: "dashboard", label: "Dashboard",  legacy: null },
  { key: "orders",    label: "Orders",     legacy: "orders" },
  { key: "products",  label: "Products",   legacy: "catalog" },
  { key: "customers", label: "Customers",  legacy: "customers" },
  { key: "content",   label: "Content",    legacy: "content" },
  { key: "addons",    label: "Addons",     legacy: "addons" },
  { key: "reports",   label: "Reports",    legacy: null },
  { key: "system",    label: "System",     legacy: null },
];

function groupGranted(permissions, group) {
  if (group.legacy && permissions.includes(group.legacy)) return true;
  return permissions.some((p) => p.startsWith(group.key + "."));
}

function PermissionGrid({ admin }) {
  if (admin.role === "admin") {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-green-100 px-2.5 py-0.5 text-xs font-medium text-green-700">
        Full access
      </span>
    );
  }

  const perms = Array.isArray(admin.permissions) ? admin.permissions : [];

  if (perms.length === 0) {
    return (
      <span className="inline-flex items-center gap-1 rounded-full bg-red-100 px-2.5 py-0.5 text-xs font-medium text-red-600">
        No access
      </span>
    );
  }

  return (
    <div className="flex flex-wrap gap-1">
      {GROUPS.map((g) => {
        const granted = groupGranted(perms, g);
        return (
          <span
            key={g.key}
            title={granted ? `${g.label}: granted` : `${g.label}: not granted`}
            className={`inline-flex items-center gap-0.5 rounded-full px-2 py-0.5 text-xs font-medium transition-colors ${
              granted
                ? "bg-green-100 text-green-700"
                : "bg-gray-100 text-gray-400 line-through"
            }`}
          >
            {granted ? (
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
              </svg>
            ) : (
              <svg className="h-3 w-3 shrink-0" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M4.293 4.293a1 1 0 011.414 0L10 8.586l4.293-4.293a1 1 0 111.414 1.414L11.414 10l4.293 4.293a1 1 0 01-1.414 1.414L10 11.414l-4.293 4.293a1 1 0 01-1.414-1.414L8.586 10 4.293 5.707a1 1 0 010-1.414z" clipRule="evenodd" />
              </svg>
            )}
            {g.label}
          </span>
        );
      })}
    </div>
  );
}

export default function AdminsList() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  const fetchAdmins = useCallback(async () => {
    setLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/admins`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (resp.ok) setItems(body.items || []);
      else throw new Error(body.error || "Failed to load");
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  }, [API]);

  useEffect(() => {
    fetchAdmins();
  }, [fetchAdmins]);

  const parseJsonOrText = async (resp) => {
    const text = await resp.text();
    if (!text) return null;
    try {
      return JSON.parse(text);
    } catch {
      return { error: text };
    }
  };

  const handleDeactivate = async (id) => {
    if (!confirm("Deactivate this account?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/admins/${id}/deactivate`, {
        method: "PUT",
        credentials: "include",
      });
      const body = await parseJsonOrText(resp);
      if (!resp.ok)
        throw new Error(body?.error || `Request failed (${resp.status})`);
      fetchAdmins();
    } catch (err) {
      alert(err.message || "Failed to deactivate");
    }
  };

  const handleDelete = async (id) => {
    if (
      !confirm(
        "Are you sure you want to permanently delete this account? This action cannot be undone.",
      )
    )
      return;
    try {
      const resp = await fetch(`${API}/api/admin/admins/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await parseJsonOrText(resp);
      if (!resp.ok)
        throw new Error(body?.error || `Delete failed (${resp.status})`);
      alert("Account deleted successfully");
      fetchAdmins();
    } catch (err) {
      alert(err.message || "Failed to delete");
    }
  };

  return (
    <div className="max-w-6xl mx-auto bg-white p-4 sm:p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Authorized accounts</h2>
        <a
          href="/dashboard/authorized/new"
          className="px-3 py-2 bg-green-600 text-white rounded text-sm text-center shrink-0"
        >
          Create admin/moderator
        </a>
      </div>

      {loading ? (
        <div className="text-center py-8 text-gray-500">Loading…</div>
      ) : (
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm">
            <thead className="text-gray-600 border-b">
              <tr>
                <th className="py-2 pr-4 whitespace-nowrap">Name</th>
                <th className="py-2 pr-4 whitespace-nowrap">Email</th>
                <th className="py-2 pr-4 whitespace-nowrap">Role</th>
                <th className="py-2 pr-4">Permissions</th>
                <th className="py-2 pr-4 whitespace-nowrap">Status</th>
                <th className="py-2 whitespace-nowrap">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id} className="border-t align-top">
                  <td className="py-3 pr-4 whitespace-nowrap font-medium">{a.name}</td>
                  <td className="py-3 pr-4 text-gray-500 whitespace-nowrap">{a.email}</td>
                  <td className="py-3 pr-4">
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-semibold ${
                        a.role === "admin"
                          ? "bg-purple-100 text-purple-700"
                          : "bg-blue-100 text-blue-700"
                      }`}
                    >
                      {a.role}
                    </span>
                  </td>
                  <td className="py-3 pr-4 max-w-xs">
                    <PermissionGrid admin={a} />
                  </td>
                  <td className="py-3 pr-4 whitespace-nowrap">
                    {a.isActive ? (
                      <span className="text-green-600 font-medium">Active</span>
                    ) : (
                      <span className="text-red-500 font-medium">Disabled</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex flex-wrap gap-1.5">
                      <a
                        className="px-2 py-1 border rounded text-xs"
                        href={`/dashboard/authorized/${a._id}/profile`}
                      >
                        Profile
                      </a>
                      <a
                        className="px-2 py-1 border rounded text-xs"
                        href={`/dashboard/authorized/${a._id}`}
                      >
                        Edit
                      </a>
                      {a.isActive && (
                        <button
                          className="px-2 py-1 border rounded text-xs text-red-600"
                          onClick={() => handleDeactivate(a._id)}
                        >
                          Deactivate
                        </button>
                      )}
                      {user?.role === "admin" && (
                        <button
                          className="px-2 py-1 border rounded text-xs text-red-600"
                          onClick={() => handleDelete(a._id)}
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {items.length === 0 && (
                <tr>
                  <td colSpan={6} className="text-center py-8 text-gray-500">
                    No admin accounts found
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
