"use client";

import { useState, useEffect, useCallback } from "react";
import Link from "next/link";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Sector,
} from "recharts";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

// ─── Formatters ───────────────────────────────────────────────────────────────

function fmt(n) {
  if (n == null) return "—";
  return `৳${Number(n).toLocaleString("en-BD", { minimumFractionDigits: 0, maximumFractionDigits: 0 })}`;
}

function fmtPct(n) {
  if (n == null) return "—";
  return `${n >= 0 ? "+" : ""}${Number(n).toFixed(1)}%`;
}

function fmtShort(n) {
  if (n == null) return "—";
  const v = Number(n);
  if (Math.abs(v) >= 1_000_000) return `৳${(v / 1_000_000).toFixed(1)}M`;
  if (Math.abs(v) >= 1_000) return `৳${(v / 1_000).toFixed(0)}K`;
  return `৳${v.toLocaleString()}`;
}

function fmtAxis(v) {
  if (v >= 1_000_000) return `${(v / 1_000_000).toFixed(1)}M`;
  if (v >= 1_000) return `${(v / 1_000).toFixed(0)}K`;
  return v;
}

// ─── Margin bar ───────────────────────────────────────────────────────────────
function MarginBar({ pct }) {
  if (pct == null)
    return <span className="text-xs text-gray-300">No data</span>;
  const clamped = Math.max(-20, Math.min(100, pct));
  const isNeg = pct < 0;
  const color = isNeg
    ? "bg-red-400"
    : pct < 15
      ? "bg-amber-400"
      : pct < 30
        ? "bg-blue-400"
        : "bg-green-500";
  return (
    <div className="flex items-center gap-2 min-w-[6rem]">
      <div className="flex-1 h-1.5 bg-gray-100 rounded-full overflow-hidden">
        <div
          className={`h-full rounded-full ${color}`}
          style={{ width: `${Math.abs(clamped)}%` }}
        />
      </div>
      <span
        className={`text-xs font-semibold w-11 text-right tabular-nums ${isNeg ? "text-red-600" : pct < 15 ? "text-amber-600" : pct < 30 ? "text-blue-600" : "text-green-600"}`}
      >
        {fmtPct(pct)}
      </span>
    </div>
  );
}

// ─── Status badge ─────────────────────────────────────────────────────────────
const STATUS_CFG = {
  no_data: { label: "No Cost Set", cls: "bg-gray-100 text-gray-500" },
  loss: { label: "Loss", cls: "bg-red-100 text-red-700" },
  breakeven: { label: "Break-even", cls: "bg-gray-100 text-gray-600" },
  low: { label: "Low (<15%)", cls: "bg-amber-100 text-amber-700" },
  medium: { label: "Good (15–30%)", cls: "bg-blue-100 text-blue-700" },
  high: { label: "High (>30%)", cls: "bg-green-100 text-green-700" },
};

function StatusBadge({ status }) {
  const cfg = STATUS_CFG[status] || STATUS_CFG.no_data;
  return (
    <span
      className={`inline-block text-xs font-semibold px-2 py-0.5 rounded-full ${cfg.cls}`}
    >
      {cfg.label}
    </span>
  );
}

// ─── KPI card ─────────────────────────────────────────────────────────────────
function KpiCard({
  label,
  value,
  sub,
  valueColor = "text-gray-900",
  icon,
  trend,
}) {
  const trendColor =
    trend > 0 ? "text-green-600" : trend < 0 ? "text-red-600" : "text-gray-400";
  return (
    <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-4 flex flex-col gap-1">
      <div className="flex items-center justify-between">
        <p className="text-xs font-medium text-gray-500 uppercase tracking-wide">
          {label}
        </p>
        {icon && <span className="text-base">{icon}</span>}
      </div>
      <p
        className={`text-xl font-bold tabular-nums leading-tight ${valueColor}`}
      >
        {value}
      </p>
      {sub != null && (
        <p
          className={`text-xs ${trend != null ? trendColor : "text-gray-400"} font-medium`}
        >
          {sub}
        </p>
      )}
    </div>
  );
}

// ─── Filter summary card ──────────────────────────────────────────────────────
function FilterCard({ label, value, color, onClick, active }) {
  return (
    <button
      onClick={onClick}
      className={`rounded-xl border p-3 text-left w-full transition shadow-sm hover:shadow-md ${active ? "ring-2 ring-rose-400 border-rose-200 bg-rose-50" : "bg-white border-gray-100"}`}
    >
      <p className="text-xs text-gray-500 mb-0.5">{label}</p>
      <p className={`text-xl font-bold ${color}`}>{value ?? "—"}</p>
    </button>
  );
}

// ─── Variant rows ─────────────────────────────────────────────────────────────
function VariantMarginRows({ variants }) {
  return (
    <div className="mt-2 ml-8 border-l-2 border-dashed border-gray-200 pl-4 space-y-1.5">
      {variants.map((v, i) => (
        <div
          key={i}
          className="flex items-center gap-3 text-xs text-gray-600 flex-wrap"
        >
          <span className="font-medium min-w-[7rem] shrink-0 truncate">
            {v.name}
          </span>
          {v.sku && (
            <span className="text-gray-400 font-mono shrink-0">{v.sku}</span>
          )}
          <div className="flex items-center gap-4 flex-wrap">
            <span className="shrink-0">
              Buy:{" "}
              <strong className="text-gray-800">{fmt(v.bp || null)}</strong>
            </span>
            <span className="shrink-0">
              Sell:{" "}
              <strong className="text-gray-800">{fmt(v.sp || null)}</strong>
            </span>
            {v.hasData ? (
              <>
                <span
                  className={`shrink-0 font-semibold ${v.profit >= 0 ? "text-green-700" : "text-red-600"}`}
                >
                  Profit: {fmt(v.profit)}
                </span>
                <MarginBar pct={v.marginPct} />
              </>
            ) : (
              <span className="text-gray-400 italic">Buying price not set</span>
            )}
          </div>
        </div>
      ))}
    </div>
  );
}

// ─── Bar chart tooltip ────────────────────────────────────────────────────────
function BarTooltip({ active, payload, label }) {
  if (!active || !payload?.length) return null;
  return (
    <div className="bg-white border border-gray-200 rounded-xl shadow-lg px-4 py-3 text-xs">
      <p className="font-semibold text-gray-700 mb-2">{label}</p>
      {payload.map((p) => (
        <div
          key={p.dataKey}
          className="flex items-center justify-between gap-6"
        >
          <span style={{ color: p.color }} className="font-medium">
            {p.name}
          </span>
          <span className="font-bold tabular-nums text-gray-800">
            ৳{Number(p.value).toLocaleString()}
          </span>
        </div>
      ))}
    </div>
  );
}

// ─── Profit bar chart ─────────────────────────────────────────────────────────
function ProfitBarChart({ data }) {
  if (!data?.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center gap-2 text-gray-300">
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z"
          />
        </svg>
        <p className="text-sm">No order data yet</p>
      </div>
    );
  }
  return (
    <ResponsiveContainer width="100%" height={220}>
      <BarChart
        data={data}
        margin={{ top: 5, right: 5, left: 0, bottom: 5 }}
        barCategoryGap="25%"
      >
        <CartesianGrid
          strokeDasharray="3 3"
          stroke="#f3f4f6"
          vertical={false}
        />
        <XAxis
          dataKey="label"
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
        />
        <YAxis
          tickFormatter={fmtAxis}
          tick={{ fontSize: 10, fill: "#9ca3af" }}
          axisLine={false}
          tickLine={false}
          width={40}
        />
        <Tooltip content={<BarTooltip />} cursor={{ fill: "#f9fafb" }} />
        <Legend wrapperStyle={{ fontSize: 11, paddingTop: 8 }} />
        <Bar
          dataKey="revenue"
          name="Revenue"
          fill="#818cf8"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="cogs"
          name="Est. COGS"
          fill="#fb923c"
          radius={[3, 3, 0, 0]}
        />
        <Bar
          dataKey="profit"
          name="Net Profit"
          fill="#4ade80"
          radius={[3, 3, 0, 0]}
        />
      </BarChart>
    </ResponsiveContainer>
  );
}

// ─── Margin distribution pie chart ───────────────────────────────────────────
const PIE_DATA_CFG = [
  { key: "no_data", label: "No Cost Set", color: "#d1d5db" },
  { key: "loss", label: "Loss", color: "#f87171" },
  { key: "low", label: "Low (<15%)", color: "#fbbf24" },
  { key: "medium", label: "Good (15–30%)", color: "#60a5fa" },
  { key: "high", label: "High (>30%)", color: "#4ade80" },
];

function renderCustomLabel({ cx, cy, midAngle, outerRadius, percent }) {
  if (percent < 0.06) return null;
  const RADIAN = Math.PI / 180;
  const r = outerRadius + 18;
  const x = cx + r * Math.cos(-midAngle * RADIAN);
  const y = cy + r * Math.sin(-midAngle * RADIAN);
  return (
    <text
      x={x}
      y={y}
      fill="#6b7280"
      textAnchor={x > cx ? "start" : "end"}
      dominantBaseline="central"
      fontSize={10}
    >
      {`${(percent * 100).toFixed(0)}%`}
    </text>
  );
}

function MarginPieChart({ summary }) {
  const data = PIE_DATA_CFG.map((c) => ({
    ...c,
    value: summary[c.key] || 0,
  })).filter((d) => d.value > 0);
  const [activeIndex, setActiveIndex] = useState(null);

  if (!data.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center gap-2 text-gray-300">
        <svg
          className="w-10 h-10"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
        >
          <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={1.5}
            d="M11 3.055A9.001 9.001 0 1020.945 13H11V3.055z"
          />
        </svg>
        <p className="text-sm">No product data</p>
      </div>
    );
  }

  const total = data.reduce((s, d) => s + d.value, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={data}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            dataKey="value"
            labelLine={false}
            label={renderCustomLabel}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {data.map((entry, i) => (
              <Cell
                key={i}
                fill={entry.color}
                opacity={activeIndex == null || activeIndex === i ? 1 : 0.5}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `${value} products (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1">
        {data.map((d) => (
          <div
            key={d.key}
            className="flex items-center gap-1 text-xs text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ background: d.color }}
            />
            <span>{d.label}</span>
            <span className="font-semibold text-gray-800">{d.value}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Profit pie chart (period contribution) ───────────────────────────────────
const PERIOD_COLORS = [
  "#818cf8",
  "#a78bfa",
  "#c084fc",
  "#e879f9",
  "#f472b6",
  "#fb7185",
  "#fb923c",
  "#fbbf24",
  "#a3e635",
  "#34d399",
  "#22d3ee",
  "#60a5fa",
];

function PeriodPieChart({ data }) {
  const positiveData = data.filter((d) => d.profit > 0);
  const [activeIndex, setActiveIndex] = useState(null);

  if (!positiveData.length) {
    return (
      <div className="h-56 flex flex-col items-center justify-center gap-2 text-gray-300">
        <p className="text-sm">No positive profit periods</p>
      </div>
    );
  }

  const total = positiveData.reduce((s, d) => s + d.profit, 0);

  return (
    <div className="flex flex-col items-center">
      <ResponsiveContainer width="100%" height={200}>
        <PieChart>
          <Pie
            data={positiveData}
            cx="50%"
            cy="50%"
            innerRadius={52}
            outerRadius={78}
            paddingAngle={2}
            dataKey="profit"
            nameKey="label"
            labelLine={false}
            label={renderCustomLabel}
            onMouseEnter={(_, idx) => setActiveIndex(idx)}
            onMouseLeave={() => setActiveIndex(null)}
          >
            {positiveData.map((entry, i) => (
              <Cell
                key={i}
                fill={PERIOD_COLORS[i % PERIOD_COLORS.length]}
                opacity={activeIndex == null || activeIndex === i ? 1 : 0.5}
                stroke="white"
                strokeWidth={2}
              />
            ))}
          </Pie>
          <Tooltip
            formatter={(value, name) => [
              `৳${Number(value).toLocaleString()} (${((value / total) * 100).toFixed(1)}%)`,
              name,
            ]}
          />
        </PieChart>
      </ResponsiveContainer>
      <div className="flex flex-wrap justify-center gap-x-3 gap-y-1 mt-1 max-h-16 overflow-hidden">
        {positiveData.slice(0, 8).map((d, i) => (
          <div
            key={i}
            className="flex items-center gap-1 text-xs text-gray-600"
          >
            <span
              className="w-2.5 h-2.5 rounded-full inline-block shrink-0"
              style={{ background: PERIOD_COLORS[i % PERIOD_COLORS.length] }}
            />
            <span>{d.label}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

// ─── Main component ───────────────────────────────────────────────────────────
export default function ProfitMarginManager() {
  // Table state
  const [items, setItems] = useState([]);
  const [summary, setSummary] = useState({});
  const [loading, setLoading] = useState(false);
  const [query, setQuery] = useState("");
  const [filter, setFilter] = useState("all");
  const [sort, setSort] = useState("margin_asc");
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expanded, setExpanded] = useState({});
  const [forbidden, setForbidden] = useState(false);

  // Analytics state
  const [analytics, setAnalytics] = useState(null);
  const [analyticsLoading, setAnalyticsLoading] = useState(true);
  const [chartTab, setChartTab] = useState("monthly");

  // Fetch product table data
  const fetchData = useCallback(async () => {
    setLoading(true);
    try {
      const params = new URLSearchParams({ filter, sort, page, limit: 30 });
      if (query) params.set("q", query);
      const r = await fetch(`${API}/api/admin/profit-margin?${params}`, {
        credentials: "include",
      });
      const d = await r.json();
      if (r.status === 403) {
        setForbidden(true);
      } else if (r.ok) {
        setForbidden(false);
        setItems(d.items || []);
        setSummary(d.summary || {});
        setTotalPages(d.pages || 1);
        setTotal(d.total || 0);
      }
    } catch {
    } finally {
      setLoading(false);
    }
  }, [query, filter, sort, page]);

  // Fetch analytics (charts)
  const fetchAnalytics = useCallback(async () => {
    setAnalyticsLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/profit-margin/analytics`, {
        credentials: "include",
      });
      const d = await r.json();
      if (r.ok) setAnalytics(d);
    } catch {
    } finally {
      setAnalyticsLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchData();
  }, [fetchData]);
  useEffect(() => {
    fetchAnalytics();
  }, [fetchAnalytics]);

  const toggle = (id) => setExpanded((p) => ({ ...p, [id]: !p[id] }));

  const chartData = analytics
    ? chartTab === "monthly"
      ? analytics.monthly
      : analytics.yearly
    : [];

  const FILTERS = [
    {
      key: "all",
      label: "All Products",
      count: summary.total,
      color: "text-gray-800",
    },
    {
      key: "no_buying_price",
      label: "No Cost Price",
      count: summary.no_data,
      color: "text-gray-500",
    },
    { key: "loss", label: "Loss", count: summary.loss, color: "text-red-600" },
    {
      key: "low",
      label: "Low Margin",
      count: summary.low,
      color: "text-amber-600",
    },
    {
      key: "healthy",
      label: "Healthy",
      count: (summary.medium || 0) + (summary.high || 0),
      color: "text-green-600",
    },
  ];

  const netMarginColor =
    summary.netMarginPct == null
      ? "text-gray-400"
      : summary.netMarginPct < 0
        ? "text-red-600"
        : summary.netMarginPct < 15
          ? "text-amber-600"
          : "text-green-600";

  if (forbidden) {
    return (
      <div className="rounded-2xl border border-amber-200 bg-amber-50 p-8 text-center">
        <p className="text-lg font-semibold text-amber-800">
          Access restricted
        </p>
        <p className="mt-1 text-sm text-amber-700">
          You do not have permission to view profit margin data. Please contact
          an administrator.
        </p>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      {/* ── Financial KPI cards ── */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
        <KpiCard
          label="Total Revenue"
          value={fmtShort(summary.totalSoldRevenue)}
          sub={
            summary.totalSoldRevenue
              ? fmt(summary.totalSoldRevenue)
              : "From sold orders"
          }
          valueColor="text-indigo-600"
          icon="💰"
        />
        <KpiCard
          label="Est. COGS"
          value={fmtShort(summary.totalSoldCOGS)}
          sub={
            summary.totalSoldCOGS
              ? fmt(summary.totalSoldCOGS)
              : "Cost of goods sold"
          }
          valueColor="text-orange-500"
          icon="📦"
        />
        <KpiCard
          label="Net Profit"
          value={fmtShort(summary.totalSoldProfit)}
          sub={
            summary.totalSoldProfit
              ? fmt(summary.totalSoldProfit)
              : "Revenue − COGS"
          }
          valueColor={
            summary.totalSoldProfit > 0
              ? "text-green-600"
              : summary.totalSoldProfit < 0
                ? "text-red-600"
                : "text-gray-400"
          }
          icon="📈"
        />
        <KpiCard
          label="Net Margin"
          value={fmtPct(summary.netMarginPct)}
          sub={
            summary.avgMarginPct != null
              ? `Catalog avg: ${fmtPct(summary.avgMarginPct)}`
              : "Profit ÷ Revenue"
          }
          valueColor={netMarginColor}
          icon="🎯"
        />
      </div>

      {/* ── Charts section ── */}
      <div className="grid lg:grid-cols-5 gap-4">
        {/* Bar chart (3/5 width) */}
        <div className="lg:col-span-3 bg-white rounded-xl border border-gray-100 shadow-sm p-5">
          <div className="flex items-center justify-between mb-4">
            <div>
              <p className="text-sm font-semibold text-gray-800">
                Revenue · COGS · Profit
              </p>
              <p className="text-xs text-gray-400 mt-0.5">
                From fulfilled orders (est. COGS uses current buying prices)
              </p>
            </div>
            <div className="flex rounded-lg border border-gray-200 overflow-hidden text-xs font-medium">
              {["monthly", "yearly"].map((t) => (
                <button
                  key={t}
                  onClick={() => setChartTab(t)}
                  className={`px-3 py-1.5 transition ${chartTab === t ? "bg-indigo-500 text-white" : "text-gray-600 hover:bg-gray-50"}`}
                >
                  {t === "monthly" ? "Monthly" : "Yearly"}
                </button>
              ))}
            </div>
          </div>
          {analyticsLoading ? (
            <div className="h-56 flex items-center justify-center text-gray-300 text-sm">
              Loading chart…
            </div>
          ) : (
            <ProfitBarChart data={chartData} />
          )}
        </div>

        {/* Right column: two pie charts stacked */}
        <div className="lg:col-span-2 flex flex-col gap-4">
          {/* Margin health distribution */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">
              Margin Health
            </p>
            <p className="text-xs text-gray-400 mb-3">
              Product count by margin status
            </p>
            {loading ? (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
                Loading…
              </div>
            ) : (
              <MarginPieChart summary={summary} />
            )}
          </div>

          {/* Period profit contribution */}
          <div className="bg-white rounded-xl border border-gray-100 shadow-sm p-5 flex-1">
            <p className="text-sm font-semibold text-gray-800 mb-0.5">
              Profit Contribution
            </p>
            <p className="text-xs text-gray-400 mb-3">
              {chartTab === "monthly"
                ? "Monthly share of total profit"
                : "Yearly share of total profit"}
            </p>
            {analyticsLoading ? (
              <div className="h-40 flex items-center justify-center text-gray-300 text-sm">
                Loading…
              </div>
            ) : (
              <PeriodPieChart data={chartData} />
            )}
          </div>
        </div>
      </div>

      {/* ── Analytics totals strip ── */}
      {analytics && !analyticsLoading && (
        <div className="bg-linear-to-r from-indigo-50 to-purple-50 border border-indigo-100 rounded-xl px-5 py-3 flex flex-wrap gap-6 items-center text-sm">
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              Period Revenue
            </span>
            <p className="font-bold text-indigo-700 tabular-nums">
              {fmt(analytics.totals?.revenue)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              Period COGS
            </span>
            <p className="font-bold text-orange-600 tabular-nums">
              {fmt(analytics.totals?.cogs)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              Period Profit
            </span>
            <p
              className={`font-bold tabular-nums ${(analytics.totals?.profit || 0) >= 0 ? "text-green-600" : "text-red-600"}`}
            >
              {fmt(analytics.totals?.profit)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              Avg Net Margin
            </span>
            <p
              className={`font-bold tabular-nums ${(analytics.totals?.marginPct || 0) >= 15 ? "text-green-600" : "text-amber-600"}`}
            >
              {fmtPct(analytics.totals?.marginPct)}
            </p>
          </div>
          <div>
            <span className="text-gray-500 text-xs uppercase tracking-wide">
              Units Sold
            </span>
            <p className="font-bold text-gray-700 tabular-nums">
              {(analytics.totals?.units || 0).toLocaleString()}
            </p>
          </div>
          <div className="ml-auto text-xs text-gray-400 hidden sm:block">
            {chartTab === "monthly" ? "Last 24 months" : "All years"} · Excludes
            cancelled / returned
          </div>
        </div>
      )}

      {/* ── Filter summary strip ── */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3">
        {FILTERS.map((f) => (
          <FilterCard
            key={f.key}
            label={f.label}
            value={f.count ?? "—"}
            color={f.color}
            active={filter === f.key}
            onClick={() => {
              setFilter(f.key);
              setPage(1);
            }}
          />
        ))}
      </div>

      {/* ── Product table ── */}
      <div className="bg-white rounded-xl border border-gray-100 shadow-sm">
        {/* Toolbar */}
        <div className="px-5 py-4 border-b flex flex-col sm:flex-row gap-3 items-start sm:items-center">
          <input
            value={query}
            onChange={(e) => {
              setQuery(e.target.value);
              setPage(1);
            }}
            placeholder="Search product name or SKU…"
            className="border rounded-lg px-3 py-1.5 text-sm w-full sm:w-72 focus:outline-none focus:ring-2 focus:ring-indigo-300"
          />
          <select
            value={sort}
            onChange={(e) => {
              setSort(e.target.value);
              setPage(1);
            }}
            className="border rounded-lg px-3 py-1.5 text-sm focus:outline-none focus:ring-2 focus:ring-indigo-300"
          >
            <option value="margin_asc">Margin: Low → High</option>
            <option value="margin_desc">Margin: High → Low</option>
            <option value="profit_desc">Profit: High → Low</option>
            <option value="name_asc">Name: A → Z</option>
          </select>
          <span className="text-xs text-gray-400 sm:ml-auto shrink-0">
            {total} product{total !== 1 ? "s" : ""}
          </span>
        </div>

        {/* Column headers */}
        <div className="hidden lg:grid grid-cols-[2fr_0.9fr_0.9fr_0.9fr_1.4fr_0.7fr_1.1fr_0.9fr_auto] gap-3 px-5 py-2 border-b bg-gray-50 text-xs font-semibold text-gray-500 uppercase tracking-wide">
          <span>Product</span>
          <span>Cost Price</span>
          <span>Sell Price</span>
          <span>Profit/Unit</span>
          <span>Gross Margin</span>
          <span>Sold</span>
          <span>Total Profit</span>
          <span>Status</span>
          <span />
        </div>

        {loading ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            Loading…
          </div>
        ) : items.length === 0 ? (
          <div className="py-20 text-center text-gray-400 text-sm">
            No products found.
          </div>
        ) : (
          <div className="divide-y divide-gray-100">
            {items.map((product) => {
              const m = product.aggregateMargin || {};
              const thumb = product.images?.[0]?.url;
              const isExpanded = expanded[product._id];
              const hasSoldData = product.unitsSold > 0;

              return (
                <div
                  key={product._id}
                  className="px-5 py-3 hover:bg-gray-50/60 transition"
                >
                  {/* Main row */}
                  <div className="grid grid-cols-[auto_1fr] lg:grid-cols-[2fr_0.9fr_0.9fr_0.9fr_1.4fr_0.7fr_1.1fr_0.9fr_auto] gap-3 items-center">
                    {/* Product name */}
                    <div className="flex items-center gap-3 col-span-2 lg:col-span-1 min-w-0">
                      {product.hasVariants ? (
                        <button
                          onClick={() => toggle(product._id)}
                          className="shrink-0 w-5 h-5 rounded flex items-center justify-center text-gray-400 hover:text-gray-600"
                        >
                          <svg
                            className={`w-3 h-3 transition-transform ${isExpanded ? "rotate-90" : ""}`}
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                            strokeWidth={2.5}
                          >
                            <path d="M9 5l7 7-7 7" />
                          </svg>
                        </button>
                      ) : (
                        <div className="w-5 shrink-0" />
                      )}
                      <div className="w-9 h-9 rounded-lg bg-gray-100 overflow-hidden shrink-0">
                        {thumb ? (
                          <img
                            src={thumb}
                            alt=""
                            className="w-full h-full object-cover"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center text-gray-300 text-base">
                            📦
                          </div>
                        )}
                      </div>
                      <div className="min-w-0">
                        <Link
                          href={`/dashboard/products/${product._id}`}
                          className="text-sm font-medium text-gray-800 hover:text-indigo-600 truncate block"
                        >
                          {product.title}
                        </Link>
                        <div className="flex items-center gap-2 mt-0.5">
                          {product.sku && (
                            <span className="text-xs text-gray-400 font-mono">
                              {product.sku}
                            </span>
                          )}
                          {product.hasVariants && (
                            <span className="text-xs text-gray-400">
                              {product.variants?.length} variants
                            </span>
                          )}
                        </div>
                      </div>
                    </div>

                    {/* Cost price */}
                    <div className="hidden lg:block text-sm text-gray-700">
                      {product.hasVariants ? (
                        <span className="text-xs text-gray-400 italic">
                          see variants
                        </span>
                      ) : (
                        <span
                          className={
                            !product.buyingPrice
                              ? "text-gray-300 italic text-xs"
                              : "font-medium"
                          }
                        >
                          {product.buyingPrice
                            ? fmt(product.buyingPrice)
                            : "Not set"}
                        </span>
                      )}
                    </div>

                    {/* Selling price */}
                    <div className="hidden lg:block text-sm font-medium text-gray-800">
                      {product.hasVariants ? (
                        <span className="text-xs text-gray-400 italic">
                          see variants
                        </span>
                      ) : (
                        fmt(product.price)
                      )}
                    </div>

                    {/* Profit per unit */}
                    <div className="hidden lg:block text-sm font-semibold">
                      {product.hasVariants ? (
                        <span className="text-xs text-gray-400 italic">
                          avg below
                        </span>
                      ) : m.hasData ? (
                        <span
                          className={
                            m.profit >= 0 ? "text-green-700" : "text-red-600"
                          }
                        >
                          {fmt(m.profit)}
                        </span>
                      ) : (
                        <span className="text-gray-300 italic text-xs">—</span>
                      )}
                    </div>

                    {/* Gross margin bar */}
                    <div className="hidden lg:block">
                      {product.hasVariants && m.hasData ? (
                        <div>
                          <MarginBar pct={m.marginPct} />
                          <p className="text-[10px] text-gray-400 mt-0.5">
                            avg of {product.variants?.length} variants
                          </p>
                        </div>
                      ) : (
                        <MarginBar pct={m.hasData ? m.marginPct : null} />
                      )}
                    </div>

                    {/* Units sold */}
                    <div className="hidden lg:block">
                      {hasSoldData ? (
                        <span className="text-sm font-semibold text-gray-700 tabular-nums">
                          {product.unitsSold.toLocaleString()}
                        </span>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>

                    {/* Total profit from sales */}
                    <div className="hidden lg:block">
                      {hasSoldData ? (
                        <div>
                          <p
                            className={`text-sm font-bold tabular-nums ${product.soldProfit >= 0 ? "text-green-700" : "text-red-600"}`}
                          >
                            {fmt(product.soldProfit)}
                          </p>
                          <p className="text-[10px] text-gray-400 tabular-nums">
                            Rev: {fmtShort(product.soldRevenue)}
                          </p>
                        </div>
                      ) : (
                        <span className="text-xs text-gray-300">—</span>
                      )}
                    </div>

                    {/* Status badge */}
                    <div className="hidden lg:block">
                      <StatusBadge status={product.profitStatus} />
                    </div>

                    {/* Edit link */}
                    <Link
                      href={`/dashboard/products/${product._id}`}
                      className="hidden lg:block text-xs text-gray-400 hover:text-indigo-500 px-2 py-1 rounded border border-transparent hover:border-indigo-200 shrink-0"
                    >
                      Edit
                    </Link>

                    {/* Mobile compact row */}
                    <div className="lg:hidden col-span-2 flex items-center justify-between gap-3 flex-wrap mt-1">
                      <MarginBar pct={m.hasData ? m.marginPct : null} />
                      <StatusBadge status={product.profitStatus} />
                      {hasSoldData && (
                        <span
                          className={`text-xs font-semibold tabular-nums ${product.soldProfit >= 0 ? "text-green-700" : "text-red-600"}`}
                        >
                          Sales profit: {fmt(product.soldProfit)}
                        </span>
                      )}
                    </div>
                  </div>

                  {/* Sold stats sub-row (shown when sold data exists) */}
                  {hasSoldData && (
                    <div className="mt-1.5 ml-14 hidden lg:flex items-center gap-5 text-xs text-gray-400 flex-wrap">
                      <span>
                        Sold{" "}
                        <strong className="text-gray-600">
                          {product.unitsSold} units
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Revenue{" "}
                        <strong className="text-indigo-600">
                          {fmt(product.soldRevenue)}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Est. COGS{" "}
                        <strong className="text-orange-500">
                          {fmt(product.soldCOGS)}
                        </strong>
                      </span>
                      <span>·</span>
                      <span>
                        Net{" "}
                        <strong
                          className={
                            product.soldProfit >= 0
                              ? "text-green-600"
                              : "text-red-600"
                          }
                        >
                          {fmt(product.soldProfit)}
                        </strong>
                      </span>
                    </div>
                  )}

                  {/* Variant breakdown */}
                  {product.hasVariants && isExpanded && (
                    <VariantMarginRows variants={product.variantMargins} />
                  )}
                </div>
              );
            })}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="flex items-center justify-center gap-2 px-5 py-4 border-t">
            <button
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
            >
              ← Prev
            </button>
            <span className="text-sm text-gray-600">
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-3 py-1.5 text-sm rounded-lg border hover:bg-gray-50 disabled:opacity-40"
            >
              Next →
            </button>
          </div>
        )}
      </div>

      {/* ── Formula legend ── */}
      <div className="bg-white rounded-xl border border-gray-100 px-5 py-4 shadow-sm">
        <p className="text-xs font-semibold text-gray-500 uppercase tracking-wide mb-3">
          Calculation Reference
        </p>
        <div className="grid sm:grid-cols-2 gap-4 text-xs text-gray-600">
          <div className="space-y-1.5">
            <p>
              <span className="font-semibold text-gray-700">Profit / Unit</span>{" "}
              = Selling Price − Cost Price
            </p>
            <p>
              <span className="font-semibold text-gray-700">
                Gross Margin %
              </span>{" "}
              = (Profit ÷ Selling Price) × 100
            </p>
            <p>
              <span className="font-semibold text-gray-700">Total Profit</span>{" "}
              = (Sell Price × Units Sold) − (Cost × Units Sold)
            </p>
            <p className="text-gray-400 italic">
              * COGS estimated using current buying price, not historical order
              price.
            </p>
          </div>
          <div className="space-y-1.5">
            <div className="flex gap-2 flex-wrap">
              {Object.entries(STATUS_CFG).map(([k, v]) => (
                <span
                  key={k}
                  className={`px-2 py-0.5 rounded-full text-xs font-medium ${v.cls}`}
                >
                  {v.label}
                </span>
              ))}
            </div>
            <p className="text-gray-400 mt-1">
              Cost price set না থাকলে margin calculate করা যাবে না। পণ্যের Edit
              পেজে buying price যোগ করুন।
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
