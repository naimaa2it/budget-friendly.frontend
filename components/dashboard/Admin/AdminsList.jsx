"use client";

import React, { useEffect, useState } from "react";
import { useUser } from "@/components/context/UserContext";

const PERMISSION_LABELS = {
  catalog: "Catalog",
  orders: "Orders",
  customers: "Customers",
  content: "Content",
  addons: "Addons",
};

function permissionSummary(a) {
  if (a.role === "admin") return "Full access";
  if (!Array.isArray(a.permissions) || a.permissions.length === 0)
    return "Full access";
  return a.permissions.map((key) => PERMISSION_LABELS[key] || key).join(", ");
}

export default function AdminsList() {
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  const fetchAdmins = async () => {
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
  };

  useEffect(
    () => {
      const load = () => {
        fetchAdmins();
      };
      load();
    },
    [
      /* fetchAdmins intentionally stable */
    ],
  );

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
    <div className="max-w-4xl mx-auto bg-white p-4 sm:p-6 rounded shadow">
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
            <thead className="text-gray-600">
              <tr>
                <th className="py-2">Name</th>
                <th className="py-2">Email</th>
                <th className="py-2">Role</th>
                <th className="py-2">Access</th>
                <th className="py-2">Status</th>
                <th className="py-2">Actions</th>
              </tr>
            </thead>
            <tbody>
              {items.map((a) => (
                <tr key={a._id} className="border-t">
                  <td className="py-3">{a.name}</td>
                  <td className="py-3">{a.email}</td>
                  <td className="py-3">{a.role}</td>
                  <td className="py-3 text-gray-600">{permissionSummary(a)}</td>
                  <td className="py-3">
                    {a.isActive ? (
                      <span className="text-green-600">Active</span>
                    ) : (
                      <span className="text-red-600">Disabled</span>
                    )}
                  </td>
                  <td className="py-3">
                    <div className="flex gap-2">
                      <a
                        className="px-2 py-1 border rounded text-sm"
                        href={`/dashboard/authorized/${a._id}/profile`}
                      >
                        Profile
                      </a>
                      <a
                        className="px-2 py-1 border rounded text-sm"
                        href={`/dashboard/authorized/${a._id}`}
                      >
                        Edit
                      </a>
                      {a.isActive && (
                        <button
                          className="px-2 py-1 border rounded text-sm text-red-600"
                          onClick={() => handleDeactivate(a._id)}
                        >
                          Deactivate
                        </button>
                      )}
                      {user?.role === "admin" && (
                        <button
                          className="px-2 py-1 border rounded text-sm text-red-600"
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
