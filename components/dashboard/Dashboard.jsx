"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
  Legend,
} from "recharts";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-600",
};

function money(value) {
  return `৳${Number(value || 0).toLocaleString("en-BD")}`;
}

function shortId(id) {
  return String(id || "")
    .slice(-8)
    .toUpperCase();
}

function dateTime(value) {
  if (!value) return "—";
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

export default function Dashboard() {
  const { user, loading: authLoading, refreshUser } = useUser();
  const router = useRouter();
  const [dashboard, setDashboard] = useState(null);
  const [loadingData, setLoadingData] = useState(true);
  const [error, setError] = useState("");
  const [updatingOrderId, setUpdatingOrderId] = useState("");

  const fetchOverview = useCallback(async () => {
    setLoadingData(true);
    setError("");
    try {
      const response = await fetch(`${API}/api/admin/dashboard-overview`, {
        credentials: "include",
      });
      const body = await response.json();
      if (!response.ok) {
        setError(body?.error || "Failed to load dashboard overview");
        setDashboard(null);
        return;
      }
      setDashboard(body);
    } catch {
      setError("Failed to load dashboard overview");
      setDashboard(null);
    } finally {
      setLoadingData(false);
    }
  }, []);

  useEffect(() => {
    if (user && ["admin", "moderator"].includes(user.role)) {
      fetchOverview();
    }
  }, [user, fetchOverview]);

  const hourlyPeak = useMemo(() => {
    const rows = dashboard?.hourlyRevenue || [];
    return rows.reduce(
      (max, row) => Math.max(max, Number(row.revenue || 0)),
      0,
    );
  }, [dashboard]);

  const handleStatusUpdate = async (orderId, status) => {
    setUpdatingOrderId(orderId);
    try {
      const response = await fetch(
        `${API}/api/admin/orders/${orderId}/status`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ status }),
        },
      );
      if (!response.ok) {
        return;
      }
      await fetchOverview();
    } finally {
      setUpdatingOrderId("");
    }
  };

  if (authLoading)
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center text-gray-500">
        Checking authentication…
      </div>
    );

  if (!user || !["admin", "moderator"].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">
          You must be an admin or moderator to view this page.
        </p>
        <div className="mt-4 flex justify-center gap-3">
          <Link
            href="/adminlogin"
            className="px-4 py-2 bg-indigo-600 text-white rounded"
          >
            Go to admin login
          </Link>
          <Link href="/" className="px-4 py-2 border rounded text-sm">
            Return to site
          </Link>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await fetch(`${API}/api/auth/logout`, {
        method: "POST",
        credentials: "include",
      });
    } catch (err) {
      // ignore
    }
    await refreshUser();
    router.push("/");
  };

  const overview = dashboard?.overview || {};
  const reports = dashboard?.reports || {};
  const orderFlow = dashboard?.orderFlow || {};
  const recentOrders = dashboard?.recentOrders || [];
  const topSellingProducts = dashboard?.topSellingProducts || [];
  const hourlyRevenue = dashboard?.hourlyRevenue || [];
  const monthlyRevenue = dashboard?.monthlyRevenue || [];
  const paymentBreakdown = dashboard?.paymentBreakdown || [];
  const customerStats = dashboard?.customerStats || {};
  const stock = dashboard?.stock || {};
  const actionCenter = dashboard?.actionCenter || {};

  const statCards = [
    {
      label: "Total Orders",
      value: (overview.totalOrders ?? 0).toLocaleString("en-BD"),
      accent: "text-gray-900",
    },
    {
      label: "Total Sales",
      value: money(overview.totalSales),
      accent: "text-indigo-700",
    },
    {
      label: "Estimated Profit",
      value: money(overview.totalProfit),
      accent: "text-green-700",
    },
    {
      label: "Pending Orders",
      value: (overview.pendingOrders ?? 0).toLocaleString("en-BD"),
      accent: "text-yellow-700",
    },
  ];

  const reportCards = [
    { label: "Today", key: "today" },
    { label: "Yesterday", key: "yesterday" },
    { label: "Last 7 Days", key: "last7Days" },
    { label: "Last 30 Days", key: "last30Days" },
  ];

  const flowPieData = [
    {
      name: "Pending",
      value: Number(orderFlow.pending || 0),
      tone: "text-yellow-500",
    },
    {
      name: "Confirmed",
      value: Number(orderFlow.confirmed || 0),
      tone: "text-blue-500",
    },
    {
      name: "Processing",
      value: Number(orderFlow.processing || 0),
      tone: "text-indigo-500",
    },
    {
      name: "Courier",
      value: Number(orderFlow.sentToCourier || 0),
      tone: "text-purple-500",
    },
    {
      name: "Delivered",
      value: Number(orderFlow.delivered || 0),
      tone: "text-green-500",
    },
    {
      name: "Cancelled",
      value: Number(orderFlow.cancelled || 0),
      tone: "text-gray-500",
    },
    {
      name: "Failed",
      value: Number(orderFlow.failed || 0),
      tone: "text-red-500",
    },
  ].filter((item) => item.value > 0);

  const reportChartData = reportCards.map((card) => {
    const row = reports[card.key] || {};
    return {
      label: card.label,
      sales: Number(row.sales || 0),
      profit: Number(row.profit || 0),
      orders: Number(row.orders || 0),
    };
  });

  const topProductsChartData = topSellingProducts.slice(0, 6).map((item) => ({
    name: String(item.title || "Untitled").slice(0, 18),
    units: Number(item.unitsSold || 0),
    revenue: Number(item.revenue || 0),
  }));

  return (
    <div className="max-w-7xl mx-auto space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-start justify-between gap-4">
        <div>
          <h1 className="text-2xl font-semibold">Business Dashboard</h1>
          <p className="mt-2 text-sm text-gray-600">
            Welcome back, <strong>{user.name || user.email}</strong>. Monitor
            orders, revenue, stock, and team actions from one place.
          </p>
          {dashboard?.generatedAt ? (
            <p className="mt-1 text-xs text-gray-400">
              Last updated: {dateTime(dashboard.generatedAt)}
            </p>
          ) : null}
        </div>
        <div className="flex flex-wrap items-center gap-2 shrink-0">
          <button
            onClick={fetchOverview}
            className="px-3 py-2 border rounded text-sm"
          >
            Refresh
          </button>
          <button
            onClick={handleLogout}
            className="px-3 py-2 bg-red-50 border border-red-200 text-red-700 rounded"
          >
            Sign out
          </button>
          <Link href="/" className="px-3 py-2 border rounded text-sm">
            View site
          </Link>
        </div>
      </div>

      {user.isLocked && (
        <div className="mt-4 p-3 rounded-lg bg-yellow-50 border border-yellow-200 text-yellow-800 text-sm">
          Your account is currently locked. Contact a super-admin to unlock or
          try again later.
        </div>
      )}

      {!user.isActive && (
        <div className="mt-4 p-3 rounded-lg bg-red-50 border border-red-200 text-red-800 text-sm">
          Your admin account has been disabled. Contact the super-admin to
          reactivate your account.
        </div>
      )}

      {loadingData ? (
        <div className="bg-white rounded-xl p-8 border text-center text-gray-500">
          Loading dashboard overview…
        </div>
      ) : error ? (
        <div className="bg-red-50 border border-red-200 rounded-xl p-6 text-red-700 text-sm">
          {error}
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
            {statCards.map((card) => (
              <div key={card.label} className="bg-white rounded-xl border p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500">
                  {card.label}
                </p>
                <p className={`text-2xl font-bold mt-1 ${card.accent}`}>
                  {card.value}
                </p>
              </div>
            ))}
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between items-center gap-4 mb-4">
              <h2 className="text-base font-semibold">Order Reports</h2>
              <Link
                href="/dashboard/orders"
                className="text-sm px-3 py-1.5 border rounded"
              >
                Open Orders
              </Link>
            </div>
            <div className="h-64 mb-4 rounded-lg border bg-gray-50 p-3">
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={reportChartData} barSize={28}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="label" tick={{ fontSize: 11 }} />
                  <YAxis tick={{ fontSize: 11 }} />
                  <Tooltip formatter={(value) => money(value)} />
                  <Bar
                    dataKey="sales"
                    name="Sales"
                    fill="currentColor"
                    className="text-indigo-500"
                    radius={[6, 6, 0, 0]}
                  />
                  <Bar
                    dataKey="profit"
                    name="Profit"
                    fill="currentColor"
                    className="text-green-500"
                    radius={[6, 6, 0, 0]}
                  />
                </BarChart>
              </ResponsiveContainer>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-4 gap-4">
              {reportCards.map((card) => {
                const row = reports[card.key] || {};
                return (
                  <div
                    key={card.key}
                    className="rounded-lg border p-4 bg-gray-50"
                  >
                    <p className="text-sm font-medium text-gray-700">
                      {card.label}
                    </p>
                    <div className="mt-2 space-y-1 text-sm text-gray-600">
                      <p>
                        Orders:{" "}
                        <span className="font-semibold text-gray-900">
                          {(row.orders ?? 0).toLocaleString("en-BD")}
                        </span>
                      </p>
                      <p>
                        Sales:{" "}
                        <span className="font-semibold text-gray-900">
                          {money(row.sales)}
                        </span>
                      </p>
                      <p>
                        Profit:{" "}
                        <span className="font-semibold text-gray-900">
                          {money(row.profit)}
                        </span>
                      </p>
                      <p>
                        Pending:{" "}
                        <span className="font-semibold text-yellow-700">
                          {(row.pending ?? 0).toLocaleString("en-BD")}
                        </span>
                      </p>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <h2 className="text-base font-semibold mb-4">Order Flow Status</h2>
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-5">
              <div className="h-72 rounded-lg border bg-gray-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={flowPieData}
                      dataKey="value"
                      nameKey="name"
                      innerRadius={60}
                      outerRadius={96}
                      paddingAngle={2}
                    >
                      {flowPieData.map((entry, idx) => (
                        <Cell
                          key={`${entry.name}-${idx}`}
                          fill="currentColor"
                          className={entry.tone}
                        />
                      ))}
                    </Pie>
                    <Tooltip
                      formatter={(value) =>
                        Number(value).toLocaleString("en-BD")
                      }
                    />
                  </PieChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2 text-sm">
                <div className="rounded border p-3 bg-gray-50 flex justify-between">
                  <span className="text-gray-600">Created</span>
                  <span className="font-semibold text-gray-900">
                    {orderFlow.created ?? 0}
                  </span>
                </div>
                <div className="rounded border p-3 bg-yellow-50 flex justify-between">
                  <span className="text-yellow-700">Pending</span>
                  <span className="font-semibold text-yellow-800">
                    {orderFlow.pending ?? 0}
                  </span>
                </div>
                <div className="rounded border p-3 bg-blue-50 flex justify-between">
                  <span className="text-blue-700">Confirmed</span>
                  <span className="font-semibold text-blue-800">
                    {orderFlow.confirmed ?? 0}
                  </span>
                </div>
                <div className="rounded border p-3 bg-indigo-50 flex justify-between">
                  <span className="text-indigo-700">Processing</span>
                  <span className="font-semibold text-indigo-800">
                    {orderFlow.processing ?? 0}
                  </span>
                </div>
                <div className="rounded border p-3 bg-purple-50 flex justify-between">
                  <span className="text-purple-700">Sent to Courier</span>
                  <span className="font-semibold text-purple-800">
                    {orderFlow.sentToCourier ?? 0}
                  </span>
                </div>
                <div className="rounded border p-3 bg-green-50 flex justify-between">
                  <span className="text-green-700">Delivered</span>
                  <span className="font-semibold text-green-800">
                    {orderFlow.delivered ?? 0}
                  </span>
                </div>
                <div className="rounded border p-3 bg-red-50 flex justify-between">
                  <span className="text-red-700">Cancelled + Failed</span>
                  <span className="font-semibold text-red-800">
                    {Number(orderFlow.cancelled || 0) +
                      Number(orderFlow.failed || 0)}
                  </span>
                </div>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="xl:col-span-2 bg-white rounded-xl border p-5">
              <div className="flex justify-between items-center gap-4 mb-4">
                <h2 className="text-base font-semibold">Recent Orders</h2>
                <Link
                  href="/dashboard/orders"
                  className="text-sm px-3 py-1.5 border rounded"
                >
                  Manage all
                </Link>
              </div>
              <div className="overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="text-left text-xs uppercase text-gray-500 border-b">
                      <th className="py-2 pr-3">Order</th>
                      <th className="py-2 pr-3">Customer</th>
                      <th className="py-2 pr-3">Amount</th>
                      <th className="py-2 pr-3">Created</th>
                      <th className="py-2 pr-3">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {recentOrders.map((order) => (
                      <tr key={order._id} className="border-b last:border-0">
                        <td className="py-2 pr-3">
                          <div className="font-mono text-xs text-gray-700">
                            #{shortId(order._id)}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.items?.length || 0} items
                          </div>
                        </td>
                        <td className="py-2 pr-3">
                          <div className="font-medium text-gray-800">
                            {order.billingDetails?.name || "—"}
                          </div>
                          <div className="text-xs text-gray-400">
                            {order.billingDetails?.phone || "—"}
                          </div>
                        </td>
                        <td className="py-2 pr-3 font-semibold text-gray-900">
                          {money(order.total)}
                        </td>
                        <td className="py-2 pr-3 text-xs text-gray-500">
                          {dateTime(order.createdAt)}
                        </td>
                        <td className="py-2 pr-3">
                          <select
                            value={order.status}
                            disabled={updatingOrderId === order._id}
                            onChange={(event) =>
                              handleStatusUpdate(order._id, event.target.value)
                            }
                            className={`text-xs font-medium px-2 py-1 rounded-full border-0 focus:ring-2 focus:ring-indigo-200 ${STATUS_STYLE[order.status] || ""}`}
                          >
                            <option value="pending">Pending</option>
                            <option value="confirmed">Confirmed</option>
                            <option value="processing">Processing</option>
                            <option value="shipped">Sent to Courier</option>
                            <option value="delivered">Delivered</option>
                            <option value="failed">Failed</option>
                            <option value="cancelled">Cancelled</option>
                          </select>
                        </td>
                      </tr>
                    ))}
                    {!recentOrders.length && (
                      <tr>
                        <td className="py-4 text-sm text-gray-500" colSpan={5}>
                          No recent orders found.
                        </td>
                      </tr>
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-base font-semibold">Action Center</h2>
              <p className="mt-1 text-sm text-gray-500">
                Use these counts so operations continue clearly even if owner is
                away.
              </p>
              <div className="mt-4 space-y-2">
                <div className="flex justify-between rounded border p-3 bg-yellow-50 text-sm">
                  <span>Pending orders</span>
                  <span className="font-semibold">
                    {actionCenter.pendingOrders ?? 0}
                  </span>
                </div>
                <div className="flex justify-between rounded border p-3 bg-indigo-50 text-sm">
                  <span>Processing orders</span>
                  <span className="font-semibold">
                    {actionCenter.processingOrders ?? 0}
                  </span>
                </div>
                <div className="flex justify-between rounded border p-3 bg-red-50 text-sm">
                  <span>Unpaid online orders</span>
                  <span className="font-semibold">
                    {actionCenter.unpaidOnlineOrders ?? 0}
                  </span>
                </div>
                <div className="flex justify-between rounded border p-3 bg-orange-50 text-sm">
                  <span>Low stock products</span>
                  <span className="font-semibold">
                    {actionCenter.lowStockCount ?? 0}
                  </span>
                </div>
              </div>
              <div className="mt-4 grid grid-cols-2 gap-2">
                <Link
                  href="/dashboard/orders"
                  className="px-3 py-2 text-sm rounded border text-center"
                >
                  Orders
                </Link>
                <Link
                  href="/dashboard/products"
                  className="px-3 py-2 text-sm rounded border text-center"
                >
                  Products
                </Link>
                <Link
                  href="/dashboard/customers"
                  className="px-3 py-2 text-sm rounded border text-center"
                >
                  Customers
                </Link>
                <Link
                  href="/dashboard/settings"
                  className="px-3 py-2 text-sm rounded border text-center"
                >
                  Settings
                </Link>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 xl:grid-cols-3 gap-6">
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-base font-semibold mb-4">
                Top Selling Products (30 Days)
              </h2>
              <div className="h-56 mb-4 rounded-lg border bg-gray-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={topProductsChartData}
                    layout="vertical"
                    margin={{ left: 10, right: 12, top: 6, bottom: 6 }}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis type="number" tick={{ fontSize: 11 }} />
                    <YAxis
                      type="category"
                      dataKey="name"
                      width={90}
                      tick={{ fontSize: 11 }}
                    />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue" ? money(value) : value
                      }
                    />
                    <Bar
                      dataKey="units"
                      fill="currentColor"
                      className="text-orange-500"
                      radius={[0, 6, 6, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
              <div className="space-y-2">
                {topSellingProducts.map((item, index) => (
                  <div
                    key={`${item._id || item.title}-${index}`}
                    className="flex items-center justify-between rounded border p-3 text-sm"
                  >
                    <div className="min-w-0">
                      <p className="font-medium text-gray-800 truncate">
                        {item.title || "Untitled product"}
                      </p>
                      <p className="text-xs text-gray-400">
                        {(item.unitsSold || 0).toLocaleString("en-BD")} units
                      </p>
                    </div>
                    <p className="font-semibold text-gray-900">
                      {money(item.revenue)}
                    </p>
                  </div>
                ))}
                {!topSellingProducts.length && (
                  <p className="text-sm text-gray-500">No sales data yet.</p>
                )}
              </div>
            </div>

            <div className="xl:col-span-2 bg-white rounded-xl border p-5">
              <h2 className="text-base font-semibold mb-4">
                Hourly Revenue (Today)
              </h2>
              <div className="h-88 rounded-lg border bg-gray-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart
                    data={hourlyRevenue.map((row) => ({
                      slot: `${String(row.hour).padStart(2, "0")}:00`,
                      revenue: Number(row.revenue || 0),
                      orders: Number(row.orders || 0),
                    }))}
                  >
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis
                      dataKey="slot"
                      interval={1}
                      tick={{ fontSize: 10 }}
                      angle={-30}
                      textAnchor="end"
                      height={60}
                    />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, key) =>
                        key === "revenue"
                          ? money(value)
                          : Number(value).toLocaleString("en-BD")
                      }
                    />
                    <Bar
                      dataKey="revenue"
                      fill="currentColor"
                      className="text-indigo-500"
                      radius={[5, 5, 0, 0]}
                    />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Monthly Revenue Trend */}
          {monthlyRevenue.length > 0 && (
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-base font-semibold mb-4">
                Monthly Revenue Trend (12 Months)
              </h2>
              <div className="h-72 rounded-lg border bg-gray-50 p-3">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={monthlyRevenue}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      formatter={(value, name) =>
                        name === "revenue"
                          ? money(value)
                          : Number(value).toLocaleString("en-BD")
                      }
                    />
                    <Legend />
                    <Line
                      type="monotone"
                      dataKey="revenue"
                      name="Revenue"
                      stroke="#6366f1"
                      strokeWidth={2.5}
                      dot={{ r: 4 }}
                      activeDot={{ r: 6 }}
                    />
                    <Line
                      type="monotone"
                      dataKey="orders"
                      name="Orders"
                      stroke="#f97316"
                      strokeWidth={2}
                      dot={{ r: 3 }}
                    />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          {/* Customer Stats + Payment Breakdown */}
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
            {/* Customer Stats */}
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-base font-semibold mb-4">
                Customer Insights (Last 30 Days)
              </h2>
              <div className="grid grid-cols-2 gap-4 mb-4">
                <div className="rounded-lg border p-4 bg-blue-50">
                  <p className="text-xs text-blue-700 uppercase tracking-wide">
                    New Customers
                  </p>
                  <p className="text-2xl font-bold text-blue-800 mt-1">
                    {customerStats.newLast30Days ?? 0}
                  </p>
                  <p className="text-xs text-blue-500 mt-0.5">
                    Registered last 30 days
                  </p>
                </div>
                <div className="rounded-lg border p-4 bg-purple-50">
                  <p className="text-xs text-purple-700 uppercase tracking-wide">
                    Returning
                  </p>
                  <p className="text-2xl font-bold text-purple-800 mt-1">
                    {customerStats.returningCustomers ?? 0}
                  </p>
                  <p className="text-xs text-purple-500 mt-0.5">
                    Placed 2+ orders
                  </p>
                </div>
              </div>
              <div className="space-y-2">
                <div className="flex justify-between rounded border p-3 bg-gray-50 text-sm">
                  <span className="text-gray-600">Total Orders Delivered</span>
                  <span className="font-semibold">
                    {orderFlow.delivered ?? 0}
                  </span>
                </div>
                <div className="flex justify-between rounded border p-3 bg-gray-50 text-sm">
                  <span className="text-gray-600">Cancellation Rate</span>
                  <span className="font-semibold text-red-600">
                    {orderFlow.created > 0
                      ? `${((((orderFlow.cancelled || 0) + (orderFlow.failed || 0)) / orderFlow.created) * 100).toFixed(1)}%`
                      : "0%"}
                  </span>
                </div>
              </div>
            </div>

            {/* Payment Method Breakdown */}
            <div className="bg-white rounded-xl border p-5">
              <h2 className="text-base font-semibold mb-4">
                Payment Methods (Last 30 Days)
              </h2>
              {paymentBreakdown.length > 0 ? (
                <>
                  <div className="h-48 rounded-lg border bg-gray-50 p-3 mb-4">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie
                          data={paymentBreakdown}
                          dataKey="revenue"
                          nameKey="method"
                          innerRadius={40}
                          outerRadius={70}
                          paddingAngle={2}
                        >
                          {paymentBreakdown.map((_, idx) => {
                            const colors = [
                              "#6366f1",
                              "#22c55e",
                              "#f97316",
                              "#ec4899",
                              "#14b8a6",
                              "#f59e0b",
                            ];
                            return (
                              <Cell
                                key={idx}
                                fill={colors[idx % colors.length]}
                              />
                            );
                          })}
                        </Pie>
                        <Tooltip formatter={(v) => money(v)} />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                  <div className="space-y-2">
                    {paymentBreakdown.map((p, idx) => {
                      const colors = [
                        "bg-indigo-500",
                        "bg-green-500",
                        "bg-orange-500",
                        "bg-pink-500",
                        "bg-teal-500",
                        "bg-amber-500",
                      ];
                      const labels = {
                        cod: "Cash on Delivery",
                        online: "Online (SSLCommerz)",
                        bkash: "bKash",
                        nagad: "Nagad",
                        rocket: "Rocket",
                      };
                      return (
                        <div
                          key={p.method}
                          className="flex items-center justify-between text-sm rounded border p-2.5"
                        >
                          <div className="flex items-center gap-2">
                            <span
                              className={`w-2.5 h-2.5 rounded-full ${colors[idx % colors.length]}`}
                            />
                            <span className="text-gray-700 capitalize">
                              {labels[p.method] || p.method}
                            </span>
                          </div>
                          <div className="text-right">
                            <span className="font-semibold text-gray-900">
                              {money(p.revenue)}
                            </span>
                            <span className="text-xs text-gray-400 ml-2">
                              ({p.count} orders)
                            </span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </>
              ) : (
                <p className="text-sm text-gray-500">
                  No payment data for last 30 days.
                </p>
              )}
            </div>
          </div>

          <div className="bg-white rounded-xl border p-5">
            <div className="flex justify-between items-center gap-4 mb-4">
              <h2 className="text-base font-semibold">Stock Update</h2>
              <Link
                href="/dashboard/products"
                className="text-sm px-3 py-1.5 border rounded"
              >
                Manage inventory
              </Link>
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
              <div className="rounded-lg border p-4 bg-red-50">
                <p className="text-xs text-red-700 uppercase tracking-wide">
                  Out of Stock
                </p>
                <p className="text-2xl font-bold text-red-800 mt-1">
                  {stock.outOfStockCount ?? 0}
                </p>
              </div>
              <div className="rounded-lg border p-4 bg-orange-50">
                <p className="text-xs text-orange-700 uppercase tracking-wide">
                  Low Stock (≤ {stock.threshold ?? 5})
                </p>
                <p className="text-2xl font-bold text-orange-800 mt-1">
                  {stock.lowStockCount ?? 0}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
              <div>
                <h3 className="text-sm font-semibold text-red-700 mb-2">
                  Need Refill Now
                </h3>
                <div className="space-y-2">
                  {(stock.outOfStock || []).map((item) => (
                    <div
                      key={item._id}
                      className="rounded border p-3 flex items-center justify-between text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          Updated: {dateTime(item.updatedAt)}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/products/${item._id}`}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
                  {!(stock.outOfStock || []).length && (
                    <p className="text-sm text-gray-500">
                      No out of stock products.
                    </p>
                  )}
                </div>
              </div>

              <div>
                <h3 className="text-sm font-semibold text-orange-700 mb-2">
                  Low Stock Products
                </h3>
                <div className="space-y-2">
                  {(stock.lowStock || []).map((item) => (
                    <div
                      key={item._id}
                      className="rounded border p-3 flex items-center justify-between text-sm"
                    >
                      <div className="min-w-0">
                        <p className="font-medium text-gray-800 truncate">
                          {item.title}
                        </p>
                        <p className="text-xs text-gray-400">
                          In stock: {item.totalInventory}
                        </p>
                      </div>
                      <Link
                        href={`/dashboard/products/${item._id}`}
                        className="px-2 py-1 border rounded text-xs"
                      >
                        Edit
                      </Link>
                    </div>
                  ))}
                  {!(stock.lowStock || []).length && (
                    <p className="text-sm text-gray-500">
                      No low stock products.
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>
        </>
      )}
    </div>
  );
}
