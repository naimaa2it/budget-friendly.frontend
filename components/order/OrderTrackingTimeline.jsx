"use client";

import React from "react";

const DEFAULT_COURIER_LABELS = {
  pathao: "Pathao",
  steadfast: "Steadfast",
  redx: "RedX",
  sundarban: "Sundarban Courier",
  other: "Courier",
};

function fmtDateTime(value) {
  if (!value) return null;
  return new Date(value).toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function getCourierLabel(courier, courierLabels = {}) {
  if (!courier) return "Courier";
  return courierLabels[courier] || DEFAULT_COURIER_LABELS[courier] || courier;
}

function buildCourierTimeline(order) {
  const shipment = order.shipment || {};
  const events = Array.isArray(shipment.trackingEvents) ? shipment.trackingEvents : [];
  const courierEvents = events.filter((e) => e.source === "courier" && e.message);

  if (courierEvents.length > 0) {
    return [...courierEvents]
      .sort((a, b) => new Date(b.at) - new Date(a.at))
      .map((ev, i) => ({
        key: `courier-${i}-${ev.at}`,
        title: ev.message,
        subtitle: fmtDateTime(ev.at),
        reached: true,
      }));
  }

  const steps = [
    {
      key: "placed",
      title: "Order Placed",
      subtitle: fmtDateTime(order.createdAt),
      reached: true,
    },
  ];

  if (order.status === "cancelled") {
    steps.push({
      key: "cancelled",
      title: "Order Cancelled",
      subtitle: "This order was cancelled",
      reached: true,
      tone: "cancelled",
    });
    return steps;
  }

  if (shipment.trackingUrl || shipment.trackingId) {
    steps.push({
      key: "awaiting-sync",
      title: "Tracking link saved",
      subtitle: shipment.courierStatus
        ? `Latest: ${shipment.courierStatus}`
        : "Courier updates will appear here automatically",
      reached: Boolean(shipment.courierStatus),
    });
  }

  if (order.status === "delivered") {
    steps.push({
      key: "delivered",
      title: "Delivered",
      subtitle: fmtDateTime(shipment.deliveredAt) || "Package delivered",
      reached: true,
    });
  }

  return steps;
}

export default function OrderTrackingTimeline({ order, courierLabels = {} }) {
  const steps = buildCourierTimeline(order);
  const shipment = order.shipment || {};
  const trackingUrl = shipment.trackingUrl;
  const courierLabel = getCourierLabel(shipment.courier, courierLabels);
  const hasCourierEvents = (shipment.trackingEvents || []).some(
    (e) => e.source === "courier" && e.message,
  );

  return (
    <div className="rounded-lg border border-gray-100 bg-gray-50 p-4">
      <div className="mb-4 space-y-3">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wide text-gray-500">
            {hasCourierEvents ? "Live courier updates" : "Delivery Tracking"}
          </p>
          {shipment.courierStatus && (
            <p className="text-sm text-gray-600 mt-0.5">
              Current status: {shipment.courierStatus}
            </p>
          )}
          {shipment.trackingId && (
            <p className="text-xs text-gray-500 mt-0.5">
              Tracking ID: {shipment.trackingId}
            </p>
          )}
        </div>
        {trackingUrl && (
          <a
            href={trackingUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="inline-flex items-center justify-center gap-2 w-full sm:w-auto px-5 py-3 rounded-xl bg-rose-600 text-white text-sm font-semibold shadow-sm hover:bg-rose-700 transition"
          >
            Live tracking on {courierLabel}
            <span aria-hidden="true">↗</span>
          </a>
        )}
      </div>

      <ol className="space-y-0 mt-2">
        {steps.map((step, index) => {
          const isLast = index === steps.length - 1;
          const dotClass =
            step.tone === "cancelled"
              ? "bg-red-500 ring-red-100"
              : step.reached
                ? "bg-green-500 ring-green-100"
                : "bg-gray-300 ring-gray-100";

          return (
            <li key={step.key} className="flex gap-3">
              <div className="flex flex-col items-center">
                <span className={`w-3 h-3 rounded-full ring-4 ${dotClass}`} />
                {!isLast && (
                  <span
                    className={`w-0.5 flex-1 min-h-[2rem] ${step.reached ? "bg-green-300" : "bg-gray-200"}`}
                  />
                )}
              </div>
              <div className={`pb-5 ${isLast ? "pb-0" : ""}`}>
                <p className="text-sm font-semibold text-gray-900">{step.title}</p>
                {step.subtitle && (
                  <p className="text-xs mt-0.5 text-gray-500">{step.subtitle}</p>
                )}
              </div>
            </li>
          );
        })}
      </ol>

      {!hasCourierEvents && trackingUrl && (
        <p className="text-[11px] text-gray-400 mt-3 border-t border-gray-200 pt-3">
          Tracking URL save করার পর courier থেকে updates auto fetch হবে। কিছুক্ষণ পর
          refresh করুন।
        </p>
      )}
    </div>
  );
}
