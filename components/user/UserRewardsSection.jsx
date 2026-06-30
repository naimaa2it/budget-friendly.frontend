"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";
import { formatOrderId } from "@/lib/orderId";
import { useLanguage } from "@/components/context/LanguageContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

function fmt(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export default function UserRewardsSection() {
  const { t } = useLanguage();
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState(null);

  useEffect(() => {
    fetch(`${API}/api/user/rewards`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-10 text-center text-gray-400">
        {t("rewards.loading")}
      </div>
    );
  }

  if (!data) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">{t("rewards.title")}</h2>
        <p className="text-gray-600">{t("rewards.login_prompt")}</p>
      </div>
    );
  }

  const { balance, balanceValueTk, pointsPerTk, totals, orders } = data;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-1">
          {t("rewards.title")}
        </h2>
        <p className="text-sm text-gray-500 mb-6">
          {t("rewards.desc_prefix")} {pointsPerTk} {t("rewards.points_rate")}
        </p>

        <div className="grid sm:grid-cols-3 gap-4">
          <div className="rounded-xl bg-rose-50 border border-rose-100 p-4">
            <p className="text-xs text-rose-600 uppercase font-semibold">
              {t("rewards.available")}
            </p>
            <p className="text-3xl font-bold text-rose-700 mt-1">{balance}</p>
            <p className="text-sm text-rose-600 mt-0.5">
              ≈ ৳{balanceValueTk} off
            </p>
          </div>
          <div className="rounded-xl bg-green-50 border border-green-100 p-4">
            <p className="text-xs text-green-700 uppercase font-semibold">
              {t("rewards.earned")}
            </p>
            <p className="text-3xl font-bold text-green-800 mt-1">
              {totals.earned}
            </p>
            <p className="text-sm text-green-700 mt-0.5">
              {t("rewards.earned_desc")}
            </p>
          </div>
          <div className="rounded-xl bg-amber-50 border border-amber-100 p-4">
            <p className="text-xs text-amber-700 uppercase font-semibold">
              {t("rewards.pending")}
            </p>
            <p className="text-3xl font-bold text-amber-800 mt-1">
              {totals.pending}
            </p>
            <p className="text-sm text-amber-700 mt-0.5">
              {t("rewards.pending_desc")}
            </p>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow overflow-hidden">
        <div className="px-6 py-4 border-b">
          <h3 className="font-semibold text-gray-800">
            {t("rewards.orders_title")}
          </h3>
          <p className="text-xs text-gray-500 mt-0.5">
            {t("rewards.orders_desc")}
          </p>
        </div>

        {orders.length === 0 ? (
          <p className="text-center py-10 text-gray-400 text-sm">
            {t("rewards.no_orders")}{" "}
            <Link href="/" className="text-rose-600 hover:underline">
              {t("rewards.start_shopping")}
            </Link>
          </p>
        ) : (
          <ul className="divide-y divide-gray-100">
            {orders.map((order) => (
              <li key={order._id}>
                <button
                  type="button"
                  onClick={() =>
                    setExpanded(expanded === order._id ? null : order._id)
                  }
                  className="w-full px-6 py-4 flex items-center justify-between text-left hover:bg-gray-50"
                >
                  <div>
                    <p className="font-mono text-sm font-semibold text-gray-800">
                      {formatOrderId(order._id)}
                    </p>
                    <p className="text-xs text-gray-500 mt-0.5">
                      {fmt(order.createdAt)} ·{" "}
                      <span className="capitalize">{order.status}</span>
                      {order.credited && (
                        <span className="text-green-600 ml-1">· credited</span>
                      )}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="text-lg font-bold text-rose-600">
                      +{order.orderPoints} pts
                    </p>
                    {order.rewardPointsRedeemed > 0 && (
                      <p className="text-xs text-gray-500">
                        {t("rewards.used_pts")} {order.rewardPointsRedeemed} pts
                      </p>
                    )}
                  </div>
                </button>
                {expanded === order._id && (
                  <div className="px-6 pb-4 bg-gray-50/80">
                    <ul className="space-y-2 text-sm">
                      {order.items.map((item, i) => (
                        <li
                          key={i}
                          className="flex justify-between text-gray-700 border-b border-gray-100 pb-2 last:border-0"
                        >
                          <span>
                            {item.title} × {item.quantity}
                            <span className="text-gray-400 text-xs block">
                              {item.rewardPoints} {t("rewards.pts_each")}
                            </span>
                          </span>
                          <span className="font-semibold text-rose-600">
                            {item.lineRewardPoints} pts
                          </span>
                        </li>
                      ))}
                    </ul>
                    <p className="text-sm font-semibold text-gray-800 mt-3 pt-2 border-t">
                      {t("rewards.order_total")} {order.orderPoints} pts
                    </p>
                  </div>
                )}
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
}
