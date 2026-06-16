"use client";

import React, { useEffect, useState, useRef } from "react";
import Link from "next/link";
import JsBarcode from "jsbarcode";
import QRCode from "qrcode";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

function fmtDate(date) {
  return new Date(date).toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
  });
}

function fmtDateTime(date) {
  return new Date(date).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function BarcodeSvg({ code }) {
  const ref = useRef(null);
  useEffect(() => {
    if (!ref.current || !code) return;
    ref.current.innerHTML = "";
    try {
      JsBarcode(ref.current, String(code), {
        format: "CODE128",
        width: 1.1,
        height: 30,
        displayValue: true,
        fontSize: 8,
        textMargin: 1,
        margin: 0,
        lineColor: "#111827",
        background: "#ffffff",
      });
    } catch {
      ref.current.innerHTML = "";
    }
  }, [code]);
  if (!code) return null;
  return (
    <svg
      ref={ref}
      style={{ width: "140px", height: "auto", display: "block" }}
    />
  );
}

function QRCodeImg({ value, size = 80 }) {
  const [dataUrl, setDataUrl] = useState(null);
  useEffect(() => {
    if (!value) return;
    QRCode.toDataURL(value, {
      width: size,
      margin: 1,
      color: { dark: "#111827", light: "#ffffff" },
      errorCorrectionLevel: "M",
    })
      .then(setDataUrl)
      .catch(() => {});
  }, [value, size]);
  if (!dataUrl) return null;
  // eslint-disable-next-line @next/next/no-img-element
  return (
    <img
      src={dataUrl}
      alt="QR"
      width={size}
      height={size}
      style={{ display: "block", imageRendering: "pixelated" }}
    />
  );
}

// orderApiUrl: defaults to admin endpoint; pass customer endpoint to reuse from user-facing pages
// backHref: override the "← Back" link for user-facing pages
export default function OrderPrintView({
  orderId,
  variant = "invoice",
  orderApiUrl,
  backHref,
}) {
  const [order, setOrder] = useState(null);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState(true);
  const [pdfLoading, setPdfLoading] = useState(false);
  const contentRef = useRef(null);

  const handleDownloadPdf = async () => {
    if (!contentRef.current) return;
    setPdfLoading(true);
    try {
      const html2pdf = (await import("html2pdf.js")).default;
      const orderNum = order._id
        ? String(order._id).slice(-8).toUpperCase()
        : "invoice";
      await html2pdf()
        .set({
          margin: 8,
          filename: `Invoice-${orderNum}.pdf`,
          image: { type: "jpeg", quality: 0.98 },
          html2canvas: { scale: 2, useCORS: true },
          jsPDF: { unit: "mm", format: "a4", orientation: "portrait" },
        })
        .from(contentRef.current)
        .save();
    } finally {
      setPdfLoading(false);
    }
  };

  const scanBase =
    typeof window !== "undefined"
      ? window.location.origin
      : process.env.NEXT_PUBLIC_SITE_URL || "";

  useEffect(() => {
    const orderUrl = orderApiUrl || `${API}/api/admin/orders/${orderId}`;
    const fetchSettings = () =>
      fetch(`${API}/api/admin/settings`, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => d.settings || null)
        .catch(() => null)
        .then(async (s) => {
          if (s?.storeName || s?.websiteLogo?.url) return s;
          // Fall back to public top-banner API (works for non-admin users too)
          try {
            const r = await fetch(`${API}/api/admin/top-banner`);
            const d = await r.json();
            return {
              storeName: d.storeName || "",
              websiteLogo: d.websiteLogo || {},
              storeEmail: "",
            };
          } catch {
            return s;
          }
        });

    Promise.all([
      fetch(orderUrl, { credentials: "include" })
        .then((r) => r.json())
        .then((d) => d.order ?? d),
      fetchSettings(),
    ])
      .then(([orderData, settingsData]) => {
        setOrder(orderData);
        setSettings(settingsData);
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId, orderApiUrl]);

  if (loading)
    return <div className="text-center py-16 text-gray-400">Loading…</div>;
  if (!order)
    return (
      <div className="text-center py-16 text-red-500">Order not found.</div>
    );

  const billing = order.billingDetails || {};
  const address = [billing.address, billing.area, billing.zone, billing.city]
    .filter(Boolean)
    .join(", ");
  const isSlip = variant === "slip";
  const storeName = settings?.storeName || "SmartBuy BD";
  const storeEmail = settings?.storeEmail || "";
  const logoUrl = settings?.websiteLogo?.url || "/mainLogo.png";

  const row = (label, value, opts = {}) => (
    <div
      style={{
        display: "flex",
        justifyContent: "space-between",
        alignItems: "center",
        padding: "5px 0",
        borderBottom: opts.last ? "none" : "1px solid #f0f0f0",
        ...opts.style,
      }}
    >
      <span style={{ color: "#4b5563", ...opts.labelStyle }}>{label}</span>
      <span
        style={{ fontWeight: opts.bold ? "700" : "500", ...opts.valueStyle }}
      >
        {value}
      </span>
    </div>
  );

  return (
    <div className="bg-gray-100 print:bg-white">
      {/* ── Print CSS ── */}
      <style>{`
        @page {
          size: ${isSlip ? "A5 portrait" : "A4 portrait"};
          margin: 8mm;
        }
        @media print {
          body, html { background: white !important; margin: 0 !important; padding: 0 !important; }
          .print-root { background: white !important; padding: 0 !important; margin: 0 !important; max-width: 100% !important; width: 100% !important; }
          .print-card { box-shadow: none !important; border: none !important; border-radius: 0 !important; padding: 0 !important; }
          .no-print { display: none !important; }
        }
        table { border-collapse: collapse; }
      `}</style>

      {/* ── Toolbar (hidden on print) ── */}
      <div className="no-print sticky top-0 z-10 border-b bg-white/95 backdrop-blur px-4 py-3 flex items-center justify-between flex-wrap gap-2">
        <Link
          href={backHref || `/dashboard/orders/${orderId}`}
          className="text-sm text-gray-500 hover:text-rose-600 shrink-0"
        >
          ← Back to order
        </Link>
        {!backHref && (
          <span className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
            💡 For clear Print →{" "}
            <strong>Print {isSlip ? "Slip" : "Invoice"} button</strong> →{" "}
            <strong>More settings</strong> → uncheck{" "}
            <strong>Headers and footers</strong>
          </span>
        )}
        <div className="flex items-center gap-2 shrink-0">
          {!backHref && (
            <button
              type="button"
              onClick={() => window.print()}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
            >
              Print {isSlip ? "slip" : "invoice"}
            </button>
          )}
          {backHref && (
            <button
              type="button"
              onClick={handleDownloadPdf}
              disabled={pdfLoading}
              className="px-4 py-2 text-sm font-semibold rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
            >
              {pdfLoading ? "Generating…" : "Download PDF"}
            </button>
          )}
        </div>
      </div>

      {/* ── Document wrapper ── */}
      <div
        ref={contentRef}
        className={`print-root mx-auto p-4 print:p-0 ${isSlip ? "max-w-sm" : "max-w-3xl"}`}
      >
        <div className="print-card bg-white rounded-xl border shadow-sm p-6 print:p-0">
          {/* ─── DELIVERY SLIP ─────────────────────────────────── */}
          {isSlip && (
            <div style={{ fontFamily: "Arial, sans-serif" }}>
              <div
                style={{
                  textAlign: "center",
                  borderBottom: "1px solid #e5e7eb",
                  paddingBottom: "8px",
                  marginBottom: "10px",
                }}
              >
                <p style={{ fontWeight: "700", fontSize: "15px", margin: 0 }}>
                  Delivery Slip
                </p>
                <p
                  style={{
                    fontSize: "11px",
                    color: "#6b7280",
                    margin: "2px 0 0",
                  }}
                >
                  Order {formatOrderId(order._id)}
                </p>
                <p
                  style={{
                    fontSize: "10px",
                    color: "#9ca3af",
                    margin: "1px 0 0",
                  }}
                >
                  {fmtDateTime(order.createdAt)}
                </p>
              </div>

              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr",
                  gap: "8px",
                  marginBottom: "10px",
                  fontSize: "11px",
                }}
              >
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: "700",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      margin: "0 0 3px",
                    }}
                  >
                    Bill To
                  </p>
                  <p
                    style={{
                      fontWeight: "600",
                      color: "#111827",
                      margin: "0 0 1px",
                    }}
                  >
                    {billing.name}
                  </p>
                  <p style={{ color: "#4b5563", margin: "0 0 1px" }}>
                    {billing.phone}
                  </p>
                  {billing.email && (
                    <p style={{ color: "#6b7280", margin: 0 }}>
                      {billing.email}
                    </p>
                  )}
                </div>
                <div>
                  <p
                    style={{
                      fontSize: "9px",
                      fontWeight: "700",
                      color: "#9ca3af",
                      textTransform: "uppercase",
                      margin: "0 0 3px",
                    }}
                  >
                    Ship To
                  </p>
                  <p style={{ color: "#374151", margin: 0, lineHeight: "1.4" }}>
                    {address || "—"}
                  </p>
                </div>
              </div>

              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "8px",
                  marginBottom: "8px",
                }}
              >
                <p
                  style={{
                    fontSize: "10px",
                    fontWeight: "700",
                    color: "#374151",
                    margin: "0 0 6px",
                  }}
                >
                  Items
                </p>
                {(order.items || []).map((item, i) => {
                  const productUrl = item.productId
                    ? `${scanBase}/product/${item.productId}`
                    : null;
                  return (
                    <div
                      key={i}
                      style={{
                        display: "flex",
                        justifyContent: "space-between",
                        alignItems: "flex-start",
                        gap: "8px",
                        paddingBottom: i < order.items.length - 1 ? "7px" : 0,
                        marginBottom: i < order.items.length - 1 ? "7px" : 0,
                        borderBottom:
                          i < order.items.length - 1
                            ? "1px dashed #e5e7eb"
                            : "none",
                      }}
                    >
                      <div style={{ flex: 1, minWidth: 0 }}>
                        <p
                          style={{
                            fontSize: "11px",
                            fontWeight: "600",
                            color: "#111827",
                            margin: "0 0 1px",
                            lineHeight: "1.3",
                          }}
                        >
                          {item.title}
                        </p>
                        {(item.color || item.size) && (
                          <p
                            style={{
                              fontSize: "9px",
                              color: "#6b7280",
                              margin: "0 0 4px",
                            }}
                          >
                            {[item.color, item.size]
                              .filter(Boolean)
                              .join(" · ")}
                          </p>
                        )}
                        <p
                          style={{
                            fontSize: "9px",
                            color: "#6b7280",
                            margin: "0 0 2px",
                          }}
                        >
                          ৳{item.price} × {item.quantity}
                        </p>
                        {item.barcode && (
                          <div style={{ marginTop: "3px" }}>
                            <BarcodeSvg code={item.barcode} />
                            <p
                              style={{
                                fontSize: "8px",
                                color: "#9ca3af",
                                fontFamily: "monospace",
                                margin: "1px 0 0",
                                lineHeight: 1,
                              }}
                            >
                              {scanBase}/scan/{item.barcode}
                            </p>
                          </div>
                        )}
                      </div>
                      <div
                        style={{
                          display: "flex",
                          flexDirection: "column",
                          alignItems: "center",
                          gap: "2px",
                          flexShrink: 0,
                        }}
                      >
                        {productUrl && (
                          <QRCodeImg value={productUrl} size={64} />
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>

              <div
                style={{
                  borderTop: "1.5px solid #111827",
                  paddingTop: "7px",
                  marginBottom: "6px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    justifyContent: "space-between",
                    alignItems: "center",
                  }}
                >
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "#111827",
                      margin: 0,
                    }}
                  >
                    Total: ৳{order.total?.toLocaleString()}
                  </p>
                  {order.shipment?.courier && (
                    <p
                      style={{
                        fontSize: "9px",
                        color: "#9ca3af",
                        margin: 0,
                        textAlign: "right",
                      }}
                    >
                      {order.shipment.courier}
                      {order.shipment.trackingId &&
                        ` · ${order.shipment.trackingId}`}
                    </p>
                  )}
                </div>
                <p
                  style={{
                    fontSize: "10px",
                    color: "#6b7280",
                    margin: "2px 0 0",
                    textTransform: "capitalize",
                  }}
                >
                  Payment: {order.paymentMethod} · {order.paymentStatus}
                </p>
              </div>

              {(order.items || []).some((i) => i.barcode) && (
                <p
                  style={{
                    fontSize: "8px",
                    color: "#9ca3af",
                    borderTop: "1px solid #e5e7eb",
                    paddingTop: "5px",
                    margin: 0,
                  }}
                >
                  Scan barcode or visit <strong>{scanBase}/scan/[code]</strong>{" "}
                  to view product details.
                </p>
              )}
            </div>
          )}

          {/* ─── TAX INVOICE ───────────────────────────────────── */}
          {!isSlip && (
            <div
              style={{
                fontFamily: "'Arial', sans-serif",
                fontSize: "11px",
                color: "#111827",
                lineHeight: "1.5",
              }}
            >
              {/* Header: Logo + TAX INVOICE */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  paddingBottom: "14px",
                  borderBottom: "2.5px solid #111827",
                  marginBottom: "14px",
                }}
              >
                <div
                  style={{
                    display: "flex",
                    flexDirection: "column",
                    gap: "4px",
                  }}
                >
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={logoUrl}
                    alt={storeName}
                    style={{
                      height: "44px",
                      objectFit: "contain",
                      objectPosition: "left",
                    }}
                  />
                  <span style={{ fontSize: "10px", color: "#6b7280" }}>
                    {storeName}
                  </span>
                </div>
                <div style={{ textAlign: "right" }}>
                  <p
                    style={{
                      fontSize: "24px",
                      fontWeight: "900",
                      letterSpacing: "2px",
                      margin: 0,
                      color: "#111827",
                    }}
                  >
                    TAX INVOICE
                  </p>
                </div>
              </div>

              {/* Order meta: 4-column strip */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr 1fr",
                  gap: "0",
                  marginBottom: "14px",
                  border: "1px solid #e5e7eb",
                  borderRadius: "4px",
                  overflow: "hidden",
                }}
              >
                {[
                  { label: "Order ID", value: `${formatOrderId(order._id)}` },
                  {
                    label: "Invoice No",
                    value: `INV-${order._id?.slice(-6).toUpperCase()}`,
                  },
                  { label: "Order Date", value: fmtDate(order.createdAt) },
                  { label: "Invoice Date", value: fmtDate(new Date()) },
                ].map((item, i) => (
                  <div
                    key={i}
                    style={{
                      padding: "8px 10px",
                      borderRight: i < 3 ? "1px solid #e5e7eb" : "none",
                      background: i % 2 === 0 ? "#f9fafb" : "#fff",
                    }}
                  >
                    <p
                      style={{
                        fontSize: "8px",
                        fontWeight: "700",
                        color: "#9ca3af",
                        textTransform: "uppercase",
                        margin: "0 0 2px",
                        letterSpacing: "0.5px",
                      }}
                    >
                      {item.label}
                    </p>
                    <p
                      style={{ margin: 0, fontWeight: "600", fontSize: "11px" }}
                    >
                      {item.value}
                    </p>
                  </div>
                ))}
              </div>

              {/* Bill From + Billed To + Deliver To */}
              <div
                style={{
                  display: "grid",
                  gridTemplateColumns: "1fr 1fr 1fr",
                  gap: "10px",
                  marginBottom: "16px",
                }}
              >
                {/* Bill From */}
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "8px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      color: "#9ca3af",
                      letterSpacing: "0.5px",
                      margin: "0 0 6px",
                    }}
                  >
                    Bill From
                  </p>
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "12px",
                      margin: "0 0 3px",
                    }}
                  >
                    {storeName}
                  </p>
                  {storeEmail && (
                    <p
                      style={{
                        margin: "0 0 2px",
                        color: "#4b5563",
                        fontSize: "10px",
                      }}
                    >
                      {storeEmail}
                    </p>
                  )}
                  <p style={{ margin: 0, color: "#4b5563", fontSize: "10px" }}>
                    Bangladesh
                  </p>
                </div>
                {/* Billed To */}
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "8px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      color: "#9ca3af",
                      letterSpacing: "0.5px",
                      margin: "0 0 6px",
                    }}
                  >
                    Billed To
                  </p>
                  <p
                    style={{
                      fontWeight: "700",
                      fontSize: "12px",
                      margin: "0 0 3px",
                    }}
                  >
                    {billing.name || "—"}
                  </p>
                  <p
                    style={{
                      margin: "0 0 2px",
                      color: "#4b5563",
                      fontSize: "10px",
                    }}
                  >
                    {billing.phone}
                  </p>
                  {billing.email && (
                    <p
                      style={{ margin: 0, color: "#6b7280", fontSize: "10px" }}
                    >
                      {billing.email}
                    </p>
                  )}
                </div>
                {/* Deliver To */}
                <div
                  style={{
                    padding: "10px 12px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                  }}
                >
                  <p
                    style={{
                      fontSize: "8px",
                      fontWeight: "700",
                      textTransform: "uppercase",
                      color: "#9ca3af",
                      letterSpacing: "0.5px",
                      margin: "0 0 6px",
                    }}
                  >
                    Deliver To
                  </p>
                  <p
                    style={{
                      margin: 0,
                      color: "#4b5563",
                      fontSize: "10px",
                      lineHeight: "1.6",
                    }}
                  >
                    {address || "—"}
                  </p>
                </div>
              </div>

              {/* Products table */}
              <table
                style={{
                  width: "100%",
                  borderCollapse: "collapse",
                  marginBottom: "14px",
                  fontSize: "11px",
                }}
              >
                <thead>
                  <tr style={{ background: "#1f2937", color: "#ffffff" }}>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "center",
                        width: "36px",
                        fontWeight: "700",
                      }}
                    >
                      Sl.
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "left",
                        fontWeight: "700",
                      }}
                    >
                      Products
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "center",
                        width: "54px",
                        fontWeight: "700",
                      }}
                    >
                      Qty
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        width: "80px",
                        fontWeight: "700",
                      }}
                    >
                      MRP
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        width: "80px",
                        fontWeight: "700",
                      }}
                    >
                      Discount
                    </th>
                    <th
                      style={{
                        padding: "8px 10px",
                        textAlign: "right",
                        width: "90px",
                        fontWeight: "700",
                      }}
                    >
                      Amount
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {(order.items || []).map((item, i) => {
                    const mrp = item.compareAtPrice || item.price;
                    const unitDiscount =
                      mrp > item.price ? mrp - item.price : 0;
                    const totalDiscount = unitDiscount * item.quantity;
                    const amount = item.price * item.quantity;
                    return (
                      <tr
                        key={i}
                        style={{
                          borderBottom: "1px solid #e5e7eb",
                          background: i % 2 === 0 ? "#ffffff" : "#f9fafb",
                        }}
                      >
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "center",
                            color: "#6b7280",
                          }}
                        >
                          {i + 1}
                        </td>
                        <td style={{ padding: "8px 10px" }}>
                          <p
                            style={{
                              margin: 0,
                              fontWeight: "600",
                              lineHeight: "1.4",
                            }}
                          >
                            {item.title}
                          </p>
                          {(item.color || item.size) && (
                            <p
                              style={{
                                margin: "2px 0 0",
                                fontSize: "9px",
                                color: "#9ca3af",
                              }}
                            >
                              {[
                                item.color && `Color: ${item.color}`,
                                item.size && `Size: ${item.size}`,
                              ]
                                .filter(Boolean)
                                .join("  ·  ")}
                            </p>
                          )}
                          {item.barcode && (
                            <div style={{ marginTop: "4px" }}>
                              <BarcodeSvg code={item.barcode} />
                            </div>
                          )}
                        </td>
                        <td
                          style={{ padding: "8px 10px", textAlign: "center" }}
                        >
                          {item.quantity > 1 ? `1 x ${item.quantity}` : "1 x 1"}
                        </td>
                        <td style={{ padding: "8px 10px", textAlign: "right" }}>
                          ৳{mrp?.toLocaleString()}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            color: totalDiscount > 0 ? "#dc2626" : "#9ca3af",
                          }}
                        >
                          {totalDiscount > 0
                            ? `-৳${totalDiscount.toLocaleString()}`
                            : "—"}
                        </td>
                        <td
                          style={{
                            padding: "8px 10px",
                            textAlign: "right",
                            fontWeight: "600",
                          }}
                        >
                          ৳{amount?.toLocaleString()}
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              {/* Totals + shipment */}
              <div
                style={{
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-start",
                  gap: "20px",
                  marginBottom: "16px",
                }}
              >
                {/* Shipment/payment info on the left */}
                <div
                  style={{
                    flex: 1,
                    fontSize: "10px",
                    color: "#6b7280",
                    paddingTop: "6px",
                  }}
                >
                  {order.shipment?.courier && (
                    <p style={{ margin: "0 0 3px" }}>
                      <strong>Courier:</strong> {order.shipment.courier}
                      {order.shipment.trackingId &&
                        ` · ID: ${order.shipment.trackingId}`}
                    </p>
                  )}
                  <p
                    style={{ margin: "0 0 10px", textTransform: "capitalize" }}
                  >
                    <strong>Payment:</strong>{" "}
                    {order.paymentMethod?.replace(/-/g, " ")}
                    {order.paymentStatus && ` (${order.paymentStatus})`}
                  </p>
                  {/* QR codes — one per product */}
                  <div
                    style={{ display: "flex", flexWrap: "wrap", gap: "10px" }}
                  >
                    {(order.items || [])
                      .filter((item) => item.productId)
                      .map((item, i) => (
                        <QRCodeImg
                          key={i}
                          value={`${scanBase}/product/${item.productId}`}
                          size={64}
                        />
                      ))}
                  </div>
                </div>
                {/* Totals on the right */}
                <div
                  style={{
                    width: "240px",
                    border: "1px solid #e5e7eb",
                    borderRadius: "4px",
                    overflow: "hidden",
                  }}
                >
                  <div
                    style={{
                      padding: "6px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <span style={{ color: "#4b5563" }}>Subtotal</span>
                    <span>৳{order.subtotal?.toLocaleString()}</span>
                  </div>
                  {order.discount > 0 && (
                    <div
                      style={{
                        padding: "6px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #e5e7eb",
                        background: "#fff9f9",
                      }}
                    >
                      <span style={{ color: "#dc2626" }}>
                        Discount
                        {order.couponCode ? ` (${order.couponCode})` : ""}
                      </span>
                      <span style={{ color: "#dc2626" }}>
                        -৳{order.discount?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  {order.rewardPointsDiscount > 0 && (
                    <div
                      style={{
                        padding: "6px 12px",
                        display: "flex",
                        justifyContent: "space-between",
                        borderBottom: "1px solid #e5e7eb",
                        background: "#fff9f9",
                      }}
                    >
                      <span style={{ color: "#dc2626" }}>Reward Points</span>
                      <span style={{ color: "#dc2626" }}>
                        -৳{order.rewardPointsDiscount?.toLocaleString()}
                      </span>
                    </div>
                  )}
                  <div
                    style={{
                      padding: "6px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      borderBottom: "1px solid #e5e7eb",
                      background: "#f9fafb",
                    }}
                  >
                    <span style={{ color: "#4b5563" }}>Delivery Charge</span>
                    <span>৳{order.shipping?.toLocaleString()}</span>
                  </div>
                  <div
                    style={{
                      padding: "8px 12px",
                      display: "flex",
                      justifyContent: "space-between",
                      background: "#1f2937",
                      color: "#ffffff",
                    }}
                  >
                    <span style={{ fontWeight: "700" }}>Amount Payable</span>
                    <span style={{ fontWeight: "700", fontSize: "13px" }}>
                      ৳{order.total?.toLocaleString()}
                    </span>
                  </div>
                </div>
              </div>

              {/* Reward points earned notice */}
              {order.rewardPointsEarned > 0 && (
                <div
                  style={{
                    background: "#f0fdf4",
                    border: "1px solid #bbf7d0",
                    borderRadius: "4px",
                    padding: "10px 14px",
                    marginBottom: "14px",
                    textAlign: "center",
                  }}
                >
                  <p
                    style={{
                      margin: 0,
                      fontWeight: "700",
                      fontSize: "13px",
                      color: "#16a34a",
                    }}
                  >
                    {order.rewardPointsEarned} Points Rewarded For This Order
                  </p>
                  <p
                    style={{
                      margin: "3px 0 0",
                      fontSize: "9px",
                      color: "#4b5563",
                    }}
                  >
                    * Points will be credited to your account after successful
                    delivery
                  </p>
                </div>
              )}

              {/* Footer */}
              <div
                style={{
                  borderTop: "1px solid #e5e7eb",
                  paddingTop: "10px",
                  display: "flex",
                  justifyContent: "space-between",
                  alignItems: "flex-end",
                }}
              >
                <p
                  style={{
                    margin: 0,
                    fontSize: "8px",
                    color: "#9ca3af",
                    maxWidth: "75%",
                    lineHeight: "1.5",
                  }}
                >
                  This is a computer generated invoice, does not require any
                  signature.
                </p>
                <p
                  style={{
                    margin: 0,
                    fontSize: "9px",
                    color: "#6b7280",
                    fontWeight: "600",
                  }}
                >
                  Page 1/1
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
