"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { useSearchParams } from "next/navigation";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const STATUS_STYLE = {
  unassigned: "bg-gray-100 text-gray-600",
  assigned: "bg-blue-100 text-blue-700",
  called: "bg-indigo-100 text-indigo-700",
  accepted: "bg-green-100 text-green-700",
  rejected: "bg-red-100 text-red-700",
};

export default function FollowUpManager() {
  const searchParams = useSearchParams();
  const assignOrderId = searchParams.get("assignOrder");

  const [people, setPeople] = useState([]);
  const [assignOrder, setAssignOrder] = useState(null);
  const [assigning, setAssigning] = useState(false);

  const loadPeople = useCallback(async () => {
    const r = await fetch(`${API}/api/admin/admins`, {
      credentials: "include",
    });
    const data = r.ok ? await r.json() : { items: [] };
    setPeople((data.items || []).filter((p) => p.isActive));
  }, []);

  useEffect(() => {
    loadPeople();
  }, [loadPeople]);

  useEffect(() => {
    if (!assignOrderId) {
      setAssignOrder(null);
      return;
    }
    fetch(`${API}/api/admin/orders/${assignOrderId}`, {
      credentials: "include",
    })
      .then((r) => (r.ok ? r.json() : null))
      .then(setAssignOrder)
      .catch(() => setAssignOrder(null));
  }, [assignOrderId]);

  const assignToOrder = async (adminId) => {
    if (!assignOrderId) return;
    setAssigning(true);
    try {
      const r = await fetch(
        `${API}/api/admin/orders/${assignOrderId}/follow-up`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ adminId }),
        },
      );
      const data = await r.json();
      if (r.ok) {
        setAssignOrder(data);
        alert("Follow-up person assigned.");
      } else {
        alert(data.error || "Could not assign.");
      }
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">Follow Up</h1>
          <p className="text-sm text-gray-500 mt-1">
            Assign an authorized person to call and confirm orders.
          </p>
        </div>
        <Link
          href="/dashboard/orders"
          className="text-sm text-rose-600 hover:underline"
        >
          ← All Orders
        </Link>
      </div>

      {assignOrder && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl p-4">
          <p className="text-sm font-semibold text-amber-900">
            Assign follow-up for order {formatOrderId(assignOrder._id)}
          </p>
          <p className="text-sm text-amber-800 mt-1">
            {assignOrder.billingDetails?.name} ·{" "}
            {assignOrder.billingDetails?.phone}
          </p>
          {assignOrder.followUp?.name && (
            <p className="text-xs text-amber-700 mt-2">
              Current: {assignOrder.followUp.name} ({assignOrder.followUp.email}
              ) —{" "}
              <span
                className={`inline-block px-2 py-0.5 rounded-full text-[10px] font-medium ${STATUS_STYLE[assignOrder.followUpStatus] || ""}`}
              >
                {assignOrder.followUpStatus}
              </span>
            </p>
          )}
        </div>
      )}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-sm text-left">
            <thead className="bg-gray-50 text-gray-600 text-xs uppercase">
              <tr>
                <th className="px-4 py-3">Name</th>
                <th className="px-4 py-3">Email</th>
                <th className="px-4 py-3">Role</th>
                <th className="px-4 py-3">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {people.map((p) => (
                <tr key={p._id} className="hover:bg-gray-50/50">
                  <td className="px-4 py-3 font-medium text-gray-800">
                    {p.name}
                  </td>
                  <td className="px-4 py-3 text-gray-600">{p.email}</td>
                  <td className="px-4 py-3 capitalize text-gray-500">
                    {p.role}
                  </td>
                  <td className="px-4 py-3">
                    <div className="flex flex-wrap gap-2">
                      <Link
                        href={`/dashboard/authorized/${p._id}/profile`}
                        className="text-xs font-medium text-blue-600 hover:underline"
                      >
                        Profile
                      </Link>
                      {assignOrderId && (
                        <button
                          type="button"
                          disabled={assigning}
                          onClick={() => assignToOrder(p._id)}
                          className="text-xs font-medium px-3 py-1 rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                        >
                          Assign
                        </button>
                      )}
                    </div>
                  </td>
                </tr>
              ))}
              {!people.length && (
                <tr>
                  <td
                    colSpan={4}
                    className="px-4 py-10 text-center text-gray-400"
                  >
                    No active authorized persons.{" "}
                    <Link
                      href="/dashboard/authorized"
                      className="text-rose-600 hover:underline"
                    >
                      Add one
                    </Link>
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
