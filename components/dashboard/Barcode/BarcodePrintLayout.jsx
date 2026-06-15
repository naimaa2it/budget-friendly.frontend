"use client";

import React, { useCallback, useEffect, useMemo, useState } from "react";
import Link from "next/link";
import JsBarcode from "jsbarcode";
import { FaPrint, FaRedo, FaThLarge, FaThList } from "react-icons/fa";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function BarcodeSvg({ code, height = 46 }) {
  const ref = React.useRef(null);

  useEffect(() => {
    if (!ref.current) return;
    ref.current.innerHTML = "";
    if (!code) return;
    try {
      JsBarcode(ref.current, String(code), {
        format: "CODE128",
        width: 1.2,
        height,
        displayValue: false,
        margin: 0,
        lineColor: "#111827",
        background: "#ffffff",
      });
    } catch {
      ref.current.innerHTML = "";
    }
  }, [code, height]);

  return <svg ref={ref} className="w-full overflow-hidden" />;
}

export default function BarcodePrintLayout() {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [perPage, setPerPage] = useState(12);
  const [onlyActive, setOnlyActive] = useState(true);

  const loadItems = useCallback(async () => {
    setLoading(true);
    setError("");
    try {
      const url = new URL(`${API}/api/admin/barcodes`);
      url.searchParams.set("limit", "500");
      const resp = await fetch(url.toString(), { credentials: "include" });
      const data = await resp.json();
      if (!resp.ok) throw new Error(data.error || "Failed to load barcodes");
      const nextItems = Array.isArray(data.items) ? data.items : [];
      setItems(
        onlyActive
          ? nextItems.filter((item) => item.isActive !== false)
          : nextItems,
      );
    } catch (err) {
      setError(err.message || "Failed to load barcodes");
    } finally {
      setLoading(false);
    }
  }, [onlyActive]);

  useEffect(() => {
    loadItems();
  }, [loadItems]);

  const pages = useMemo(() => {
    const chunkSize = perPage;
    const list = [];
    for (let i = 0; i < items.length; i += chunkSize) {
      list.push(items.slice(i, i + chunkSize));
    }
    return list;
  }, [items, perPage]);

  return (
    <div className="min-h-screen bg-gray-100 print:bg-white">
      <style jsx global>{`
        @page {
          size: A4;
          margin: 8mm;
        }
        @media print {
          aside,
          main > div.mb-6 {
            display: none !important;
          }
          main {
            padding: 0 !important;
          }
          .print-content {
            margin-top: 0 !important;
            padding-top: 0 !important;
          }
          .no-print {
            display: none !important;
          }
          .print-sheet {
            box-shadow: none !important;
            border: 0 !important;
            margin: 0 !important;
            break-after: page;
            page-break-after: always;
          }
        }
      `}</style>

      <div className="no-print sticky top-0 z-20 border-b border-gray-200 bg-white/95 backdrop-blur">
        <div className="mx-auto flex max-w-7xl flex-wrap items-center justify-between gap-3  py-4">
          <div>
            <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
              Print Labels
            </p>
            <h1 className="mt-1 text-xl font-bold text-gray-900">
              Barcode print sheets
            </h1>
          </div>
          <div className="flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setPerPage(6)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                perPage === 6
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaThList /> 6 / page
            </button>
            <button
              type="button"
              onClick={() => setPerPage(12)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                perPage === 12
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaThLarge /> 12 / page
            </button>
            <button
              type="button"
              onClick={() => setPerPage(18)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                perPage === 18
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaThLarge /> 18 / page
            </button>
            <button
              type="button"
              onClick={() => setPerPage(21)}
              className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2 text-sm font-semibold ${
                perPage === 21
                  ? "border-indigo-600 bg-indigo-600 text-white"
                  : "border-gray-300 bg-white text-gray-700 hover:bg-gray-50"
              }`}
            >
              <FaThLarge /> 21 / page
            </button>

            <label className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700">
              <input
                type="checkbox"
                checked={onlyActive}
                onChange={(e) => setOnlyActive(e.target.checked)}
                className="h-4 w-4"
              />
              Active only
            </label>
            <button
              type="button"
              onClick={() => window.print()}
              className="inline-flex items-center gap-2 rounded-xl bg-black px-4 py-2 text-sm font-semibold text-white hover:bg-gray-800"
            >
              <FaPrint /> Print
            </button>
            <button
              type="button"
              onClick={loadItems}
              className="inline-flex items-center gap-2 rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              <FaRedo /> Refresh
            </button>
            <Link
              href="/dashboard/barcodes"
              className="rounded-xl border border-gray-300 bg-white px-4 py-2 text-sm font-semibold text-gray-700 hover:bg-gray-50"
            >
              Back
            </Link>
          </div>
        </div>
      </div>

      <div className="print-content mx-auto max-w-7xl px-4 py-6">
        {error && (
          <p className="mb-4 rounded-xl border border-rose-200 bg-rose-50 px-4 py-3 text-sm text-rose-700 no-print">
            {error}
          </p>
        )}

        {loading ? (
          <p className="py-16 text-center text-gray-500">
            Loading print sheets...
          </p>
        ) : pages.length === 0 ? (
          <p className="py-16 text-center text-gray-500">
            No barcodes available to print.
          </p>
        ) : (
          <div className="space-y-6">
            {pages.map((pageItems, pageIndex) => (
              <section
                key={pageIndex}
                className="print-sheet rounded-2xl border border-gray-300 bg-white p-3 shadow-sm"
              >
                <div
                  className={`grid gap-2 ${
                    perPage === 6 ? "grid-cols-2" : "grid-cols-3"
                  }`}
                >
                  {pageItems.map((item) => (
                    <article
                      key={item._id}
                      className="flex min-h-[70px] flex-col rounded-lg border border-gray-200 p-2 mt-4"
                    >
                      <div className="min-h-[44px]">
                        <BarcodeSvg
                          code={item.code}
                          height={perPage === 6 ? 56 : 40}
                        />
                      </div>
                      <div className=" flex flex-1 flex-col items-center justify-end gap-1">
                        <p className="w-full text-center text-[11px] font-semibold text-gray-900">
                          {item.code}
                        </p>
                      </div>
                    </article>
                  ))}
                </div>
              </section>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
