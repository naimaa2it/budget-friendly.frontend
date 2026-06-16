"use client";

import React, { useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const TIER_STYLE = {
  silver: {
    badge: "bg-gradient-to-br from-slate-300 to-slate-500 text-white",
    card: "from-slate-50 to-slate-100 border-slate-200",
    text: "text-slate-700",
    bar: "bg-slate-400",
    icon: "🥈",
  },
  gold: {
    badge: "bg-gradient-to-br from-amber-300 to-amber-500 text-white",
    card: "from-amber-50 to-amber-100 border-amber-200",
    text: "text-amber-700",
    bar: "bg-amber-400",
    icon: "🥇",
  },
  platinum: {
    badge: "bg-gradient-to-br from-indigo-400 to-purple-600 text-white",
    card: "from-indigo-50 to-purple-100 border-indigo-200",
    text: "text-indigo-700",
    bar: "bg-indigo-500",
    icon: "💎",
  },
};

export default function UserLoyaltySection() {
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch(`${API}/api/user/loyalty`, { credentials: "include" })
      .then((r) => (r.ok ? r.json() : null))
      .then((d) => setData(d))
      .catch(() => setData(null))
      .finally(() => setLoading(false));
  }, []);

  if (loading) {
    return (
      <div className="bg-white rounded-lg shadow p-10 text-center text-gray-400">
        Loading loyalty tier…
      </div>
    );
  }

  if (!data || !data.ok) {
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl font-semibold mb-2">Loyalty Tier</h2>
        <p className="text-gray-600">Please log in to view your loyalty tier.</p>
      </div>
    );
  }

  const { tier, nextTier, amountToNextTier, tierProgressPct, lifetimeSpend, deliveredOrders, allTiers } = data;
  const style = TIER_STYLE[tier.key] || TIER_STYLE.silver;

  return (
    <div className="space-y-4">
      <div className="bg-white rounded-lg shadow p-6">
        <h2 className="text-xl md:text-2xl font-semibold mb-1">Loyalty Tier</h2>
        <p className="text-sm text-gray-500 mb-6">
          Your tier is based on lifetime spend across delivered orders.
        </p>

        <div className={`rounded-2xl border bg-gradient-to-br ${style.card} p-5 flex items-center gap-4`}>
          <div className={`w-16 h-16 rounded-full ${style.badge} flex items-center justify-center text-3xl shrink-0 shadow`}>
            {style.icon}
          </div>
          <div className="flex-1 min-w-0">
            <p className={`text-2xl font-bold ${style.text}`}>{tier.label} Member</p>
            <p className="text-sm text-gray-600 mt-0.5">
              Lifetime spend: <span className="font-semibold">৳{lifetimeSpend.toLocaleString()}</span>
              {" · "}
              {deliveredOrders} delivered order{deliveredOrders !== 1 ? "s" : ""}
            </p>
          </div>
        </div>

        {/* Progress to next tier */}
        {nextTier ? (
          <div className="mt-5">
            <div className="flex justify-between text-xs text-gray-500 mb-1.5">
              <span>{tier.label}</span>
              <span>{nextTier.label}</span>
            </div>
            <div className="h-2.5 rounded-full bg-gray-100 overflow-hidden">
              <div
                className={`h-full rounded-full ${style.bar} transition-all`}
                style={{ width: `${tierProgressPct}%` }}
              />
            </div>
            <p className="text-sm text-gray-600 mt-2">
              Spend{" "}
              <span className="font-semibold text-gray-800">৳{amountToNextTier.toLocaleString()}</span>{" "}
              more to reach <span className={`font-semibold ${TIER_STYLE[nextTier.key]?.text}`}>{nextTier.label}</span>.
            </p>
          </div>
        ) : (
          <p className="text-sm text-gray-600 mt-5 font-medium">
            🎉 You&apos;ve reached our highest tier — thank you for being a loyal customer!
          </p>
        )}
      </div>

      {/* Tier ladder */}
      <div className="bg-white rounded-lg shadow p-6">
        <h3 className="font-semibold text-gray-800 mb-4">Tier Benefits</h3>
        <div className="grid sm:grid-cols-3 gap-4">
          {allTiers.map((t) => {
            const tStyle = TIER_STYLE[t.key] || TIER_STYLE.silver;
            const isCurrent = t.key === tier.key;
            const fullTier = [tier, nextTier].find((x) => x && x.key === t.key) || t;
            return (
              <div
                key={t.key}
                className={`rounded-xl border p-4 ${isCurrent ? `bg-gradient-to-br ${tStyle.card}` : "border-gray-100"}`}
              >
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">{tStyle.icon}</span>
                  <p className={`font-bold ${isCurrent ? tStyle.text : "text-gray-700"}`}>{t.label}</p>
                  {isCurrent && (
                    <span className="text-[10px] px-1.5 py-0.5 rounded-full bg-white/70 font-semibold text-gray-600 ml-auto">
                      Current
                    </span>
                  )}
                </div>
                <p className="text-xs text-gray-500 mb-2">
                  {t.minSpend === 0 ? "Starting tier" : `৳${t.minSpend.toLocaleString()}+ lifetime spend`}
                </p>
                {tier.key === t.key && (
                  <ul className="space-y-1">
                    {tier.perks.map((p, i) => (
                      <li key={i} className="text-xs text-gray-600 flex items-start gap-1.5">
                        <span className="text-green-600 mt-0.5">✓</span>
                        <span>{p}</span>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
            );
          })}
        </div>
        <p className="text-xs text-gray-400 mt-4">
          Want more perks?{" "}
          <Link href="/" className="text-rose-600 hover:underline">
            Keep shopping
          </Link>{" "}
          to level up your tier.
        </p>
      </div>
    </div>
  );
}
