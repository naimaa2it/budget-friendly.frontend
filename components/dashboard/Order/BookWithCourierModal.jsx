"use client";

import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

export default function BookWithCourierModal({
  order,
  open,
  onClose,
  onBooked,
}) {
  const [options, setOptions] = useState([]);
  const [loadingOptions, setLoadingOptions] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [form, setForm] = useState({
    courier: "",
    weight: "0.5",
    codAmount: "",
    note: "",
    deliveryAreaId: "",
    deliveryAreaName: "",
  });

  const isCod = order?.paymentMethod === "cash-on-delivery";
  const alreadyBooked =
    order?.shipment?.bookingSource === "api" && order?.shipment?.trackingId;

  useEffect(() => {
    if (!open || !order) return;
    setForm((prev) => ({
      ...prev,
      codAmount: String(
        prev.codAmount || (isCod ? Math.round(Number(order.total || 0)) : 0),
      ),
      note: order.billingDetails?.note || "",
    }));
    setLoadingOptions(true);
    fetch(`${API}/api/admin/couriers/booking-options`, {
      credentials: "include",
    })
      .then((r) => r.json())
      .then((data) => {
        const items = data.items || [];
        setOptions(items);
        if (items.length && !form.courier) {
          setForm((p) => ({ ...p, courier: items[0].slug }));
        }
      })
      .catch(() => setOptions([]))
      .finally(() => setLoadingOptions(false));
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [open, order?._id]);

  const selected = options.find((o) => o.slug === form.courier);

  const submit = async () => {
    if (!form.courier) return alert("Select a courier");
    setSubmitting(true);
    try {
      const r = await fetch(
        `${API}/api/admin/orders/${order._id}/book-courier`,
        {
          method: "POST",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            courier: form.courier,
            weight: Number(form.weight) || 0.5,
            codAmount: Number(form.codAmount) || 0,
            note: form.note,
            deliveryAreaId: form.deliveryAreaId
              ? Number(form.deliveryAreaId)
              : undefined,
            deliveryAreaName: form.deliveryAreaName || undefined,
          }),
        },
      );
      const data = await r.json();
      if (!r.ok) {
        const msg =
          data.error || data.message || `Booking failed (${r.status})`;
        throw new Error(msg);
      }
      onBooked?.(data);
      onClose?.();
    } catch (err) {
      alert(err.message || "Could not book parcel");
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
      <div className="w-full max-w-lg bg-white rounded-2xl shadow-2xl border p-5 space-y-4 max-h-[90vh] overflow-y-auto">
        <div>
          <h3 className="text-lg font-semibold text-gray-900">
            Book with courier
          </h3>
          <p className="text-xs text-gray-500 mt-1">
            Creates parcel in courier system — rider will be notified for
            pickup.
          </p>
        </div>

        {alreadyBooked ? (
          <div className="rounded-lg bg-amber-50 border border-amber-200 p-3 text-sm text-amber-800">
            Already booked via API: {order.shipment.trackingId}
          </div>
        ) : null}

        {loadingOptions ? (
          <p className="text-sm text-gray-400">Loading configured couriers…</p>
        ) : options.length === 0 ? (
          <div className="rounded-lg bg-blue-50 border border-blue-200 p-3 text-sm text-blue-800">
            No courier API configured. Go to{" "}
            <a
              href="/dashboard/shipment-tracking/settings"
              className="font-semibold underline"
            >
              Shipment Settings
            </a>{" "}
            and connect Pathao, Steadfast, or RedX.
          </div>
        ) : (
          <>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Courier
              </label>
              <select
                value={form.courier}
                onChange={(e) =>
                  setForm((p) => ({ ...p, courier: e.target.value }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                {options.map((o) => (
                  <option key={o.slug} value={o.slug}>
                    {o.name}
                  </option>
                ))}
              </select>
            </div>

            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  Weight (kg)
                </label>
                <input
                  type="number"
                  step="0.1"
                  min="0.1"
                  value={form.weight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, weight: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                />
              </div>
              <div>
                <label className="block text-xs text-gray-500 mb-1">
                  COD amount (৳)
                </label>
                <input
                  type="number"
                  min="0"
                  value={form.codAmount}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, codAmount: e.target.value }))
                  }
                  className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                />
              </div>
            </div>

            {form.courier === "redx" && (
              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    RedX area ID
                  </label>
                  <input
                    value={form.deliveryAreaId}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, deliveryAreaId: e.target.value }))
                    }
                    placeholder={
                      selected?.storeConfig?.redxDeliveryAreaId
                        ? `Default: ${selected.storeConfig.redxDeliveryAreaId}`
                        : "Required if not in settings"
                    }
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Area name
                  </label>
                  <input
                    value={form.deliveryAreaName}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        deliveryAreaName: e.target.value,
                      }))
                    }
                    placeholder={order.billingDetails?.city || "Dhaka"}
                    className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                  />
                </div>
              </div>
            )}

            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Note / instruction
              </label>
              <textarea
                value={form.note}
                onChange={(e) =>
                  setForm((p) => ({ ...p, note: e.target.value }))
                }
                rows={2}
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>

            <div className="text-xs text-gray-500 bg-gray-50 rounded-lg p-3 space-y-1">
              <p>
                <strong>To:</strong> {order.billingDetails?.name} ·{" "}
                {order.billingDetails?.phone}
              </p>
              <p>
                <strong>Address:</strong>{" "}
                {[
                  order.billingDetails?.address,
                  order.billingDetails?.area,
                  order.billingDetails?.zone,
                  order.billingDetails?.city,
                ]
                  .filter(Boolean)
                  .join(", ") || "—"}
              </p>
            </div>
          </>
        )}

        <div className="flex justify-end gap-2 pt-2">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={submit}
            disabled={submitting || options.length === 0 || alreadyBooked}
            className="px-4 py-2 text-sm rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-50"
          >
            {submitting ? "Booking…" : "Book parcel"}
          </button>
        </div>
      </div>
    </div>
  );
}
