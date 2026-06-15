"use client";

import React from "react";
import Link from "next/link";

const COURIER_DISPLAY = [
  { key: "pathao", name: "Pathao", color: "bg-red-500" },
  { key: "steadfast", name: "SteadFast Courier", color: "bg-orange-500" },
  { key: "redx", name: "REDX", color: "bg-rose-600" },
];

function SuccessGauge({ percent = 0 }) {
  const p = Math.min(100, Math.max(0, Number(percent) || 0));
  const r = 52;
  const c = 2 * Math.PI * r;
  const offset = c - (p / 100) * c;
  return (
    <div className="flex flex-col items-center justify-center">
      <svg
        width="140"
        height="90"
        viewBox="0 0 140 90"
        className="overflow-visible"
      >
        <path
          d="M 18 78 A 52 52 0 0 1 122 78"
          fill="none"
          stroke="#e5e7eb"
          strokeWidth="12"
          strokeLinecap="round"
        />
        <path
          d="M 18 78 A 52 52 0 0 1 122 78"
          fill="none"
          stroke="#3b82f6"
          strokeWidth="12"
          strokeLinecap="round"
          strokeDasharray={c}
          strokeDashoffset={offset}
          style={{ transition: "stroke-dashoffset 0.5s ease" }}
        />
      </svg>
      <p className="text-2xl font-bold text-blue-600 -mt-2">{p.toFixed(2)}%</p>
      <p className="text-xs text-gray-500 font-medium">Success Ratio</p>
    </div>
  );
}

function SummaryCard({ icon, label, value, tint }) {
  return (
    <div className={`rounded-xl border p-4 flex items-center gap-3 ${tint}`}>
      <div className="text-2xl">{icon}</div>
      <div>
        <p className="text-xs text-gray-500">{label}</p>
        <p className="text-2xl font-bold text-gray-900">{value}</p>
      </div>
    </div>
  );
}

export default function CourierScorePanel({
  lifetime,
  phone,
  loading,
  onRefresh,
}) {
  if (!phone) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-5 text-sm text-amber-800">
        Customer's mobile number নেই — courier score check's জন্য 01XXXXXXXXX
        লাগবে।
      </div>
    );
  }

  if (loading && !lifetime) {
    return (
      <div className="rounded-2xl border bg-white p-10 text-center text-gray-400 text-sm">
        Courier panels theke lifetime history load হচ্ছে…
      </div>
    );
  }

  if (lifetime?.error) {
    return (
      <div className="rounded-2xl border border-red-200 bg-red-50 p-5 text-sm text-red-700">
        {lifetime.error}
      </div>
    );
  }

  if (!lifetime) return null;

  const summary = lifetime.summary || {};
  const couriers = lifetime.couriers || {};

  return (
    <div className="rounded-2xl border bg-white shadow-sm overflow-hidden">
      <div className="px-5 py-4 border-b flex flex-wrap items-center justify-between gap-3 bg-gray-50/80">
        <div>
          <h2 className="text-lg font-bold text-gray-900">
            View Courier Score
          </h2>
          <p className="text-xs text-gray-500 mt-0.5">
            Mobile <span className="font-mono font-semibold">{phone}</span> — সব
            দোকান/platform মিলিয়ে lifetime parcel history
          </p>
        </div>
        <button
          type="button"
          onClick={onRefresh}
          disabled={loading}
          className="px-3 py-1.5 text-sm border rounded-lg hover:bg-white disabled:opacity-50"
        >
          {loading ? "Refreshing…" : "Refresh"}
        </button>
      </div>

      {!lifetime.anyConfigured ? (
        <div className="m-5 rounded-xl border border-blue-200 bg-blue-50 p-4 text-sm text-blue-800">
          Courier connect করা নেই।{" "}
          <Link
            href="/dashboard/shipment-tracking/settings"
            className="font-semibold underline"
          >
            Shipment Settings
          </Link>{" "}
          এ credentials save করে API enabled ON করুন, তারপর Refresh চাপুন।
        </div>
      ) : null}

      <div className="p-5 grid lg:grid-cols-[1fr_auto] gap-6">
        <div className="grid sm:grid-cols-3 gap-3">
          <SummaryCard
            icon="📦"
            label="Total Parcels"
            value={summary.totalParcels ?? 0}
            tint="bg-violet-50 border-violet-100"
          />
          <SummaryCard
            icon="🚚"
            label="Successful Parcels"
            value={summary.totalDelivered ?? 0}
            tint="bg-emerald-50 border-emerald-100"
          />
          <SummaryCard
            icon="✕"
            label="Cancelled Parcels"
            value={summary.totalCancelled ?? 0}
            tint="bg-red-50 border-red-100"
          />
        </div>
        <SuccessGauge percent={summary.deliverySuccessRate ?? 0} />
      </div>

      <div className="px-5 pb-5 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="text-xs text-gray-500 uppercase border-b bg-gray-50">
              <th className="text-left py-3 px-3 font-semibold">
                Courier Name
              </th>
              <th className="text-center py-3 px-2">Total Parcels</th>
              <th className="text-center py-3 px-2">Successful Parcels</th>
              <th className="text-center py-3 px-2">Cancelled Parcels</th>
              <th className="text-left py-3 px-4 min-w-[10rem]">
                Success Ratio (%)
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-100">
            {COURIER_DISPLAY.map(({ key, name }) => {
              const row = couriers[key] || {};
              const configured = row.configured;
              const total = row.total ?? 0;
              const delivered = row.delivered ?? 0;
              const cancelled = row.cancelled ?? 0;
              const rate = row.successRate ?? 0;
              const barColor =
                rate >= 70
                  ? "bg-emerald-500"
                  : rate >= 40
                    ? "bg-amber-500"
                    : "bg-gray-300";

              const RATING_STYLE = {
                new_customer:    "bg-gray-100 text-gray-600",
                good_customer:   "bg-emerald-100 text-emerald-700",
                regular_customer:"bg-blue-100 text-blue-700",
                bad_customer:    "bg-red-100 text-red-700",
                blocked:         "bg-red-200 text-red-800",
              };
              const RATING_LABEL = {
                new_customer:    "New customer",
                good_customer:   "Good customer",
                regular_customer:"Regular customer",
                bad_customer:    "Bad customer",
                blocked:         "Blocked",
              };

              return (
                <tr key={key} className="hover:bg-gray-50/50">
                  <td className="py-3 px-3 font-medium text-gray-800">
                    {name}
                  </td>
                  <td className="py-3 px-2 text-center font-semibold">
                    {configured && !row.ratingBased ? total : "—"}
                  </td>
                  <td className="py-3 px-2 text-center text-emerald-700">
                    {configured && !row.ratingBased ? delivered : "—"}
                  </td>
                  <td className="py-3 px-2 text-center text-gray-600">
                    {configured && !row.ratingBased ? cancelled : "—"}
                  </td>
                  <td className="py-3 px-4">
                    {!configured ? (
                      <span className="text-xs text-gray-400">Not connected</span>
                    ) : row.error ? (
                      <span className="text-xs text-red-600">
                        Error
                        <span className="block text-[10px] text-red-400 font-normal max-w-50 leading-tight mt-0.5">
                          {row.error}
                        </span>
                      </span>
                    ) : row.ratingBased ? (
                      <div className="flex flex-col gap-1">
                        <span className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full w-fit ${RATING_STYLE[row.rating] ?? "bg-gray-100 text-gray-600"}`}>
                          {RATING_LABEL[row.rating] ?? row.rating}
                        </span>
                        {row.addressCount > 0 && (
                          <span className="text-[10px] text-gray-400">
                            {row.addressCount} address{row.addressCount !== 1 ? "es" : ""} on record
                          </span>
                        )}
                      </div>
                    ) : (
                      <div className="flex items-center gap-2">
                        <div className="flex-1 h-2 rounded-full bg-gray-100 overflow-hidden">
                          <div
                            className={`h-full rounded-full ${barColor}`}
                            style={{ width: `${rate}%` }}
                          />
                        </div>
                        <span className="text-xs font-bold text-gray-700 w-10 text-right">
                          {rate}%
                        </span>
                      </div>
                    )}
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
        <p className="text-[11px] text-gray-400 mt-3">
          {lifetime.fetchedAt
            ? `Updated ${new Date(lifetime.fetchedAt).toLocaleString()}`
            : ""}
          {lifetime.cached ? " (cached)" : ""}
        </p>
      </div>
    </div>
  );
}
