"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";
import { formatOrderId } from "@/lib/orderId";
import CourierScorePanel from "@/components/dashboard/Customer/CourierScorePanel";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  approved: "bg-emerald-100 text-emerald-700",
  picked: "bg-orange-100 text-orange-700",
  rejected: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-600",
};

const RISK_STYLE = {
  low: "bg-emerald-50 text-emerald-700 border-emerald-200",
  medium: "bg-amber-50 text-amber-700 border-amber-200",
  high: "bg-red-50 text-red-700 border-red-200",
};

function fmt(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function StatCard({ label, value, color = "text-gray-800", sub }) {
  return (
    <div className="bg-white rounded-xl border p-4 shadow-sm">
      <p className="text-xs text-gray-500 uppercase tracking-wide">{label}</p>
      <p className={`text-2xl font-bold mt-1 ${color}`}>{value}</p>
      {sub ? <p className="text-xs text-gray-400 mt-1">{sub}</p> : null}
    </div>
  );
}

function formatCourierName(key) {
  if (!key || key === "unassigned") return "Unassigned";
  return key.charAt(0).toUpperCase() + key.slice(1).replace(/_/g, " ");
}

function RiskCard({ risk, percentages, title, subtitle }) {
  if (!risk) return null;
  return (
    <div
      className={`rounded-2xl border p-5 ${RISK_STYLE[risk.level] || RISK_STYLE.low}`}
    >
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <p className="text-xs uppercase tracking-wide font-semibold opacity-80">
            {title}
          </p>
          <p className="text-4xl font-bold mt-1">{risk.score ?? 0}/100</p>
          <p className="text-sm font-medium mt-1">{risk.label}</p>
          {subtitle ? (
            <p className="text-xs opacity-70 mt-2 max-w-md">{subtitle}</p>
          ) : null}
        </div>
        {percentages ? (
          <div className="min-w-[12rem]">
            <p className="text-xs uppercase tracking-wide font-semibold opacity-80 mb-2">
              Delivery success
            </p>
            <div className="h-2 rounded-full bg-white/70 overflow-hidden">
              <div
                className="h-full bg-current rounded-full transition-all"
                style={{ width: `${percentages.deliverySuccessRate || 0}%` }}
              />
            </div>
            <p className="text-sm font-semibold mt-1">
              {percentages.deliverySuccessRate || 0}%
            </p>
          </div>
        ) : null}
      </div>
      <ul className="mt-4 space-y-1">
        {(risk.factors || []).map((factor, i) => (
          <li key={i} className="text-sm opacity-90">
            • {factor}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function CustomerProfile({ userId }) {
  const [data, setData] = useState(null);
  const [lifetime, setLifetime] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lifetimeLoading, setLifetimeLoading] = useState(false);
  const [error, setError] = useState("");

  const fetchLifetime = useCallback(async (phone, refresh = false) => {
    if (!phone) return;
    setLifetimeLoading(true);
    try {
      const params = refresh ? "?refresh=1" : "";
      const r = await fetch(
        `${API}/api/admin/phones/${encodeURIComponent(phone)}/lifetime-stats${params}`,
        { credentials: "include" },
      );
      const body = await r.json();
      if (r.ok) setLifetime(body);
      else
        setLifetime({ error: body.error || "Failed to load lifetime stats" });
    } catch {
      setLifetime({ error: "Failed to load lifetime stats" });
    } finally {
      setLifetimeLoading(false);
    }
  }, []);

  useEffect(() => {
    if (!userId) return;
    setLoading(true);
    fetch(`${API}/api/admin/users/${userId}/profile?lifetime=0`, {
      credentials: "include",
    })
      .then((r) => r.json().then((body) => ({ ok: r.ok, body })))
      .then(({ ok, body }) => {
        if (ok) {
          setData(body);
          if (body.user?.mobile) fetchLifetime(body.user.mobile);
        } else setError(body.error || "Failed to load profile");
      })
      .catch(() => setError("Failed to load profile"))
      .finally(() => setLoading(false));
  }, [userId, fetchLifetime]);

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">Loading profile…</div>
    );
  }
  if (error) {
    return <div className="text-center py-16 text-red-500">{error}</div>;
  }
  if (!data) return null;

  const { user, PickobBD, stats, percentages, courierBreakdown, risk, orders } =
    data;
  const site = PickobBD || {
    stats,
    percentages,
    courierBreakdown,
    risk,
  };
  const courierRows = Object.entries(site.courierBreakdown || {}).sort(
    (a, b) => b[1].total - a[1].total,
  );
  return (
    <div className="max-w-6xl mx-auto space-y-6">
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/customers"
            className="text-sm text-gray-500 hover:text-rose-600"
          >
            ← Back to customers
          </Link>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">
            {user.name || "Customer Profile"}
          </h1>
          <p className="text-sm text-gray-500">{user.email || "No email"}</p>
          {user.mobile && (
            <p className="text-sm font-medium text-gray-700 mt-1">
              Mobile: <span className="font-mono">{user.mobile}</span>
            </p>
          )}
          {(user.tags || []).length > 0 && (
            <div className="flex flex-wrap gap-1 mt-2">
              {user.tags.map((tag) => (
                <span
                  key={tag._id}
                  className="rounded-full px-2 py-0.5 text-xs font-semibold text-white"
                  style={{ backgroundColor: tag.color || "#3B82F6" }}
                >
                  {tag.name}
                </span>
              ))}
            </div>
          )}
        </div>
        <Link
          href={`/dashboard/customers/${userId}`}
          className="px-4 py-2 text-sm font-medium border border-gray-200 rounded-lg hover:bg-gray-50"
        >
          Edit customer
        </Link>
      </div>

      <CourierScorePanel
        lifetime={lifetime}
        phone={user.mobile}
        loading={lifetimeLoading}
        onRefresh={() => user.mobile && fetchLifetime(user.mobile, true)}
      />

      {lifetime?.summary?.risk ? (
        <RiskCard
          title="Lifetime risk score"
          subtitle="Courier panels থেকে aggregated risk"
          risk={lifetime.summary.risk}
          percentages={{
            deliverySuccessRate: lifetime.summary?.deliverySuccessRate,
          }}
        />
      ) : null}

      <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
        <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-2">
          <div>
            <h2 className="text-base font-semibold text-gray-800">
              Pickob Order History
            </h2>
            {user.mobile && (
              <p className="text-xs text-gray-500 mt-0.5">
                Phone{" "}
                <span className="font-mono font-semibold text-gray-700">
                  {user.mobile}
                </span>{" "}
                দিয়ে বা এই account থেকে করা সব orders
              </p>
            )}
          </div>
          <span className="text-xs font-semibold text-gray-500 bg-gray-100 px-2 py-1 rounded-full">
            {orders.length} order{orders.length !== 1 ? "s" : ""}
          </span>
        </div>
        {orders.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">
            No orders found.
          </p>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm text-left">
              <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                <tr>
                  <th className="px-4 py-3">Order</th>
                  <th className="px-4 py-3">Date</th>
                  <th className="px-4 py-3">Billing Name</th>
                  <th className="px-4 py-3">Phone</th>
                  <th className="px-4 py-3">Total</th>
                  <th className="px-4 py-3">Courier</th>
                  <th className="px-4 py-3">Status</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {orders.map((order) => {
                  const billPhone = order.billingDetails?.phone || "—";
                  const billName = order.billingDetails?.name || "—";
                  const phoneMismatch =
                    user.mobile &&
                    billPhone !== "—" &&
                    !billPhone
                      .replace(/\D/g, "")
                      .endsWith(user.mobile.replace(/\D/g, "").slice(-10));
                  return (
                    <tr key={order._id} className="hover:bg-rose-50/30">
                      <td className="px-4 py-3">
                        <Link
                          href={`/dashboard/orders/${order._id}`}
                          className="font-mono text-xs text-rose-600 hover:underline"
                        >
                          {formatOrderId(order._id)}
                        </Link>
                      </td>
                      <td className="px-4 py-3 text-gray-500 text-xs whitespace-nowrap">
                        {fmt(order.createdAt)}
                      </td>
                      <td className="px-4 py-3 text-gray-700">{billName}</td>
                      <td className="px-4 py-3">
                        <span
                          className={`font-mono text-xs ${phoneMismatch ? "text-amber-600 font-semibold" : "text-gray-600"}`}
                          title={
                            phoneMismatch
                              ? "Profile mobile-এর সাথে মিলছে না"
                              : undefined
                          }
                        >
                          {billPhone}
                          {phoneMismatch && " ⚠"}
                        </span>
                      </td>
                      <td className="px-4 py-3 font-medium">
                        ৳{order.total?.toLocaleString()}
                      </td>
                      <td className="px-4 py-3 text-gray-600 capitalize">
                        {order.shipment?.courier || "—"}
                      </td>
                      <td className="px-4 py-3">
                        <span
                          className={`text-xs font-semibold px-2 py-0.5 rounded-full capitalize ${STATUS_STYLE[order.status] || "bg-gray-100 text-gray-600"}`}
                        >
                          {order.status}
                        </span>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </div>

      <section className="space-y-4 pt-2 border-t border-gray-100">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            Pickob orders only
          </h2>
          <p className="text-sm text-gray-500">
            শুধু এই সাইটে করা অর্ডারের history ও risk score।
          </p>
        </div>

        <RiskCard
          title="Pickob risk score"
          risk={site.risk}
          percentages={site.percentages}
        />

        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-4">
          <StatCard label="Total Orders" value={site.stats.totalOrders} />
          <StatCard
            label="Delivered"
            value={site.stats.delivered}
            color="text-green-600"
          />
          <StatCard
            label="Cancelled"
            value={site.stats.cancelled}
            color="text-gray-600"
          />
          <StatCard
            label="Returned / Failed"
            value={site.stats.returned}
            color="text-orange-600"
          />
          <StatCard
            label="Rejected"
            value={site.stats.rejected}
            color="text-red-600"
          />
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
          <StatCard
            label="Delivery Success Rate"
            value={`${site.percentages.deliverySuccessRate || 0}%`}
            color="text-green-600"
          />
          <StatCard
            label="Cancellation Rate"
            value={`${site.percentages.cancellationRate || 0}%`}
            color="text-gray-600"
          />
          <StatCard
            label="Return Rate"
            value={`${site.percentages.returnRate || 0}%`}
            color="text-orange-600"
          />
          <StatCard
            label="Rejection Rate"
            value={`${site.percentages.rejectionRate || 0}%`}
            color="text-red-600"
          />
        </div>

        <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
          <div className="px-5 py-4 border-b">
            <h3 className="text-base font-semibold text-gray-800">
              Courier-wise (Pickob)
            </h3>
          </div>
          {courierRows.length === 0 ? (
            <p className="text-center py-10 text-gray-400 text-sm">
              No courier data yet.
            </p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm text-left">
                <thead className="text-xs text-gray-500 uppercase bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3">Courier</th>
                    <th className="px-4 py-3">Total</th>
                    <th className="px-4 py-3">Accepted</th>
                    <th className="px-4 py-3">Delivered</th>
                    <th className="px-4 py-3">Cancelled</th>
                    <th className="px-4 py-3">Returned</th>
                    <th className="px-4 py-3">Rejected</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {courierRows.map(([courier, row]) => (
                    <tr key={courier} className="hover:bg-gray-50/50">
                      <td className="px-4 py-3 font-medium capitalize">
                        {formatCourierName(courier)}
                      </td>
                      <td className="px-4 py-3 font-semibold">{row.total}</td>
                      <td className="px-4 py-3 text-blue-700">
                        {row.accepted}
                      </td>
                      <td className="px-4 py-3 text-green-700">
                        {row.delivered}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {row.cancelled}
                      </td>
                      <td className="px-4 py-3 text-orange-600">
                        {row.returned}
                      </td>
                      <td className="px-4 py-3 text-red-600">{row.rejected}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </section>
    </div>
  );
}
