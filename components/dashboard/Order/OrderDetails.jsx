"use client";

import React, { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import OrderTrackingTimeline from "@/components/order/OrderTrackingTimeline";
import BookWithCourierModal from "@/components/dashboard/Order/BookWithCourierModal";
import { formatOrderId } from "@/lib/orderId";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const STATUS_STYLE = {
  pending: "bg-yellow-100 text-yellow-700",
  accepted: "bg-emerald-100 text-emerald-700",
  picked: "bg-orange-100 text-orange-700",
  approved: "bg-blue-100 text-blue-700",
  rejected: "bg-red-100 text-red-700",
  confirmed: "bg-blue-100 text-blue-700",
  processing: "bg-indigo-100 text-indigo-700",
  shipped: "bg-purple-100 text-purple-700",
  delivered: "bg-green-100 text-green-700",
  cancelled: "bg-gray-100 text-gray-600",
  failed: "bg-red-100 text-red-600",
};

const PAYMENT_STYLE = {
  unpaid: "bg-red-100 text-red-700",
  cod: "bg-orange-100 text-orange-700",
  paid: "bg-green-100 text-green-700",
  failed: "bg-red-100 text-red-600",
  cancelled: "bg-gray-100 text-gray-600",
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

export default function OrderDetails({ orderId }) {
  const router = useRouter();
  const [order, setOrder] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [customerEditing, setCustomerEditing] = useState(false);
  const [customerForm, setCustomerForm] = useState({
    name: "",
    phone: "",
    email: "",
    city: "",
    zone: "",
    area: "",
    address: "",
    note: "",
  });
  const [editItems, setEditItems] = useState([]);
  const [editShipping, setEditShipping] = useState(0);
  const [editDiscount, setEditDiscount] = useState(0);
  const [shippingEdit, setShippingEdit] = useState(false);
  const [discountEdit, setDiscountEdit] = useState(false);
  const [statusModal, setStatusModal] = useState({
    open: false,
    status: "pending",
    reason: "",
    submitting: false,
  });
  const [bookModalOpen, setBookModalOpen] = useState(false);
  const [actionsOpen, setActionsOpen] = useState(false);

  const loadOrder = useCallback(() => {
    setLoading(true);
    fetch(`${API}/api/admin/orders/${orderId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((d) => {
        setOrder(d);
        const billing = d?.billingDetails || {};
        setCustomerForm({
          name: billing.name || "",
          phone: billing.phone || "",
          email: billing.email || d?.userEmail || "",
          city: billing.city || "",
          zone: billing.zone || "",
          area: billing.area || "",
          address: billing.address || "",
          note: billing.note || "",
        });
        setEditItems((d?.items || []).map((item) => ({ ...item })));
        setEditShipping(d?.shipping || 0);
        setEditDiscount(d?.discount || 0);
        setStatusModal((prev) => ({ ...prev, status: d?.status || "pending" }));
      })
      .catch(() => setOrder(null))
      .finally(() => setLoading(false));
  }, [orderId]);

  useEffect(() => {
    if (orderId) loadOrder();
  }, [orderId, loadOrder]);

  const saveLineItems = async (items, shipping, discount) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}/line-items`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ items, shipping, discount }),
      });
      const data = await r.json();
      if (r.ok) {
        setOrder(data);
        setEditItems((data.items || []).map((item) => ({ ...item })));
        setEditShipping(data.shipping || 0);
        setEditDiscount(data.discount || 0);
      } else {
        alert(data.error || "Could not save order.");
      }
    } finally {
      setSaving(false);
    }
  };

  const updateItemQty = (index, qty) => {
    const next = editItems.map((item, i) =>
      i === index ? { ...item, quantity: Math.max(1, Number(qty) || 1) } : item,
    );
    setEditItems(next);
    saveLineItems(next, editShipping, editDiscount);
  };

  const removeItem = (index) => {
    if (editItems.length <= 1)
      return alert("Order must have at least one item.");
    const next = editItems.filter((_, i) => i !== index);
    setEditItems(next);
    saveLineItems(next, editShipping, editDiscount);
  };

  const saveShipping = () => {
    saveLineItems(editItems, editShipping, editDiscount);
    setShippingEdit(false);
  };

  const saveDiscount = () => {
    saveLineItems(editItems, editShipping, editDiscount);
    setDiscountEdit(false);
  };

  const saveCustomerDetails = async () => {
    if (!customerForm.name.trim() || !customerForm.phone.trim()) {
      return alert("Customer name and phone are required.");
    }
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}/customer`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...customerForm, syncUser: true }),
      });
      const data = await r.json();
      if (r.ok) {
        setOrder(data);
        setCustomerEditing(false);
      } else {
        alert(data.error || "Could not update customer info.");
      }
    } finally {
      setSaving(false);
    }
  };

  const markAsPaid = async () => {
    setSaving(true);
    try {
      const r = await fetch(
        `${API}/api/admin/orders/${orderId}/payment-status`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ paymentStatus: "paid" }),
        },
      );
      const data = await r.json();
      if (r.ok) setOrder(data);
      else alert(data.error || "Could not update payment.");
    } finally {
      setSaving(false);
    }
  };

  const updateStatus = async () => {
    if (!statusModal.reason.trim())
      return alert("Status update reason is required.");
    setStatusModal((prev) => ({ ...prev, submitting: true }));
    try {
      const r = await fetch(`${API}/api/admin/orders/${orderId}/status`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: statusModal.status,
          reason: statusModal.reason.trim(),
        }),
      });
      const updated = await r.json();
      if (r.ok) {
        setOrder(updated);
        setStatusModal({
          open: false,
          status: updated.status,
          reason: "",
          submitting: false,
        });
      } else {
        alert(updated.error || "Could not update status.");
      }
    } finally {
      setStatusModal((prev) => ({ ...prev, submitting: false }));
    }
  };

  const handleBooked = (updated) => {
    setOrder(updated);
    setBookModalOpen(false);
    router.push(`/dashboard/shipment-tracking?order=${updated._id}`);
  };

  if (loading) {
    return (
      <div className="text-center py-16 text-gray-400">Loading order…</div>
    );
  }
  if (!order) {
    return (
      <div className="text-center py-16 text-red-500">Order not found.</div>
    );
  }

  const paidAmount =
    order.paidAmount ??
    (order.paymentStatus === "paid" || order.paymentStatus === "cod"
      ? order.total
      : 0);
  const dueAmount = Math.max(0, (order.total || 0) - (paidAmount || 0));
  const billing = order.billingDetails || {};
  const address = [billing.address, billing.area, billing.zone, billing.city]
    .filter(Boolean)
    .join(", ");
  const itemCount = order.items?.length || 0;
  const courierName = order.shipment?.courier || order.courierName || "N/A";

  return (
    <div className="max-w-6xl mx-auto space-y-5">
      {/* Header */}
      <div className="flex flex-wrap items-start justify-between gap-4">
        <div>
          <Link
            href="/dashboard/orders"
            className="text-sm text-gray-500 hover:text-rose-600 inline-flex items-center gap-1"
          >
            ← Back
          </Link>
          <div className="flex flex-wrap items-center gap-2 mt-2">
            <h1 className="text-2xl font-bold text-gray-900">
              {formatOrderId(order._id)}
            </h1>
            <span className="text-xs font-medium px-2 py-1 rounded-full bg-pink-100 text-pink-700">
              Online Store
            </span>
            <span
              className={`text-xs font-medium px-2 py-1 rounded-full capitalize ${PAYMENT_STYLE[order.paymentStatus] || ""}`}
            >
              {order.paymentStatus === "unpaid" ? "Due" : order.paymentStatus}
            </span>
            <button
              type="button"
              onClick={() =>
                setStatusModal((prev) => ({
                  ...prev,
                  open: true,
                  status: order.status,
                }))
              }
              className={`text-xs font-medium px-2 py-1 rounded-full capitalize hover:opacity-80 ${STATUS_STYLE[order.status] || ""}`}
            >
              {order.status}
            </button>
          </div>
          <p className="text-sm text-gray-500 mt-2">
            {fmt(order.createdAt)} · {itemCount} Item
            {itemCount !== 1 ? "s" : ""} · Courier:{" "}
            <span className="capitalize">{courierName}</span>
          </p>
        </div>
        <div className="flex flex-wrap gap-2">
          <Link
            href={`/dashboard/orders/${orderId}/invoice`}
            className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
          >
            Print
          </Link>
          <div className="relative">
            <button
              type="button"
              onClick={() => setActionsOpen((v) => !v)}
              className="px-3 py-2 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50"
            >
              More Action ▾
            </button>
            {actionsOpen && (
              <>
                <div
                  className="fixed inset-0 z-10"
                  onClick={() => setActionsOpen(false)}
                />
                <div className="absolute right-0 top-full mt-1 z-20 bg-white border rounded-lg shadow-lg py-1 text-sm min-w-[10rem]">
                  <Link
                    href={`/dashboard/orders/${orderId}/slip`}
                    className="block px-3 py-2 hover:bg-gray-50"
                    onClick={() => setActionsOpen(false)}
                  >
                    Print slip
                  </Link>
                  <button
                    type="button"
                    onClick={() => {
                      setActionsOpen(false);
                      setStatusModal((prev) => ({
                        ...prev,
                        open: true,
                        status: order.status,
                      }));
                    }}
                    className="w-full text-left px-3 py-2 hover:bg-gray-50"
                  >
                    Update status
                  </button>
                </div>
              </>
            )}
          </div>
        </div>
      </div>

      <div className="grid lg:grid-cols-3 gap-5">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-5">
          {/* Products */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full capitalize ${STATUS_STYLE[order.status] || ""}`}
              >
                {order.status}
              </span>
            </div>
            <table className="w-full text-sm">
              <thead>
                <tr className="text-xs text-gray-500 uppercase border-b">
                  <th className="px-5 py-3 text-left font-medium">Product</th>
                  <th className="px-5 py-3 text-center font-medium w-24">
                    Qty
                  </th>
                  <th className="px-5 py-3 text-right font-medium w-28">
                    Total
                  </th>
                  <th className="w-10" />
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-50">
                {editItems.map((item, i) => (
                  <tr key={i}>
                    <td className="px-5 py-4">
                      <div className="flex items-center gap-3">
                        {item.image ? (
                          <img
                            src={item.image}
                            alt=""
                            className="w-12 h-12 rounded-lg object-cover border"
                          />
                        ) : (
                          <div className="w-12 h-12 rounded-lg bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">
                            N/A
                          </div>
                        )}
                        <div>
                          <p className="font-medium text-gray-800">
                            {item.title}
                          </p>
                          <p className="text-xs text-gray-500">
                            ৳ {item.price?.toLocaleString()}
                          </p>
                        </div>
                      </div>
                    </td>
                    <td className="px-5 py-4 text-center">
                      <input
                        type="number"
                        min={1}
                        value={item.quantity}
                        disabled={saving}
                        onChange={(e) => updateItemQty(i, e.target.value)}
                        className="w-16 text-center text-sm border border-gray-200 rounded-lg px-2 py-1.5"
                      />
                    </td>
                    <td className="px-5 py-4 text-right font-semibold text-gray-800">
                      ৳ {(item.price * item.quantity).toLocaleString()}
                    </td>
                    <td className="px-2 py-4">
                      <button
                        type="button"
                        onClick={() => removeItem(i)}
                        disabled={editItems.length <= 1 || saving}
                        className="text-gray-300 hover:text-red-500 disabled:opacity-30"
                        title="Remove item"
                      >
                        ×
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
            <div className="px-5 py-4 border-t">
              <button
                type="button"
                onClick={() => setBookModalOpen(true)}
                className="px-5 py-2.5 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800"
              >
                Book Courier ▾
              </button>
            </div>
          </div>

          {/* Payment summary */}
          <div className="bg-white rounded-xl border shadow-sm overflow-hidden">
            <div className="flex items-center justify-between px-5 py-3 border-b bg-gray-50/50">
              <span
                className={`text-xs font-semibold px-2 py-1 rounded-full ${PAYMENT_STYLE[order.paymentStatus] || ""}`}
              >
                {order.paymentStatus === "unpaid" ? "Due" : order.paymentStatus}
              </span>
            </div>
            <div className="px-5 py-4 space-y-2 text-sm">
              <div className="flex justify-between py-1.5 border-b border-gray-50">
                <span className="text-gray-500">
                  Original Order · {fmt(order.createdAt)}
                </span>
                <span className="font-medium">
                  ৳ {order.subtotal?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                {shippingEdit ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Shipping</span>
                    <input
                      type="number"
                      min={0}
                      value={editShipping}
                      onChange={(e) =>
                        setEditShipping(Number(e.target.value) || 0)
                      }
                      className="w-20 text-sm border rounded px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={saveShipping}
                      disabled={saving}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditShipping(order.shipping || 0);
                        setShippingEdit(false);
                      }}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShippingEdit(true)}
                    className="text-rose-600 hover:underline"
                  >
                    Edit Shipping Charge
                  </button>
                )}
                <span className="font-medium">
                  ৳ {order.shipping?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between items-center py-1.5 border-b border-gray-50">
                {discountEdit ? (
                  <div className="flex items-center gap-2">
                    <span className="text-gray-500">Discount</span>
                    <input
                      type="number"
                      min={0}
                      value={editDiscount}
                      onChange={(e) =>
                        setEditDiscount(Number(e.target.value) || 0)
                      }
                      className="w-20 text-sm border rounded px-2 py-1"
                    />
                    <button
                      type="button"
                      onClick={saveDiscount}
                      disabled={saving}
                      className="text-xs text-rose-600 hover:underline"
                    >
                      Save
                    </button>
                    <button
                      type="button"
                      onClick={() => {
                        setEditDiscount(order.discount || 0);
                        setDiscountEdit(false);
                      }}
                      className="text-xs text-gray-400 hover:underline"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setDiscountEdit(true)}
                    className="text-rose-600 hover:underline"
                  >
                    Apply Discount
                  </button>
                )}
                <span className="font-medium">
                  ৳ {order.discount?.toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5">
                <span className="text-gray-500">Paid Amount</span>
                <span className="font-medium">
                  ৳ {(paidAmount || 0).toLocaleString()}
                </span>
              </div>
              <div className="flex justify-between py-1.5 font-semibold text-gray-900">
                <span>Due Amount</span>
                <span>৳ {dueAmount.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-1.5 text-gray-500 text-xs">
                <span>Subtotal ({itemCount} items)</span>
                <span>৳ {order.subtotal?.toLocaleString()}</span>
              </div>
              <div className="flex justify-between py-2 text-base font-bold border-t">
                <span>Total</span>
                <span>৳ {order.total?.toLocaleString()}</span>
              </div>
            </div>
            {order.paymentStatus !== "paid" && (
              <div className="px-5 py-4 border-t">
                <button
                  type="button"
                  onClick={markAsPaid}
                  disabled={saving}
                  className="w-full py-2.5 text-sm font-semibold rounded-lg bg-gray-900 text-white hover:bg-gray-800 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Mark as Paid"}
                </button>
              </div>
            )}
          </div>

          {/* Tracking */}
          {(order.shipment?.trackingUrl ||
            order.shipment?.trackingEvents?.length > 0) && (
            <div className="bg-white rounded-xl border shadow-sm p-5">
              <h2 className="text-sm font-semibold text-gray-500 uppercase tracking-wide mb-4">
                Tracking
              </h2>
              {order.shipment?.trackingUrl && (
                <a
                  href={order.shipment.trackingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-sm text-rose-600 hover:underline font-medium"
                >
                  Open live tracking link ↗
                </a>
              )}
              <div className="mt-4">
                <OrderTrackingTimeline order={order} />
              </div>
              <Link
                href={`/dashboard/shipment-tracking?order=${order._id}`}
                className="inline-block mt-3 text-sm text-purple-700 hover:underline"
              >
                Manage tracking →
              </Link>
            </div>
          )}
        </div>

        {/* Right sidebar */}
        <div className="space-y-5">
          {/* Courier Score */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <h2 className="text-sm font-semibold text-gray-800 mb-3">
              Courier Score
            </h2>
            <p className="text-xs text-gray-500 mb-3">
              Customer's lifetime courier delivery history visit।
            </p>
            {order.customerUserId ? (
              <Link
                href={`/dashboard/customers/${order.customerUserId}/profile`}
                className="flex items-center justify-center gap-2 w-full py-2.5 text-sm font-medium rounded-lg border border-gray-200 hover:bg-gray-50 text-gray-700"
              >
                <span>👁</span> View Courier Score
              </Link>
            ) : (
              <p className="text-xs text-gray-400">
                Guest order — courier score unavailable (no linked customer
                account).
              </p>
            )}
          </div>

          {/* Customer Info */}
          <div className="bg-white rounded-xl border shadow-sm p-5">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-sm font-semibold text-gray-800">
                Customer Info
              </h2>
              {!customerEditing && (
                <button
                  type="button"
                  onClick={() => setCustomerEditing(true)}
                  className="text-xs text-blue-600 hover:underline"
                >
                  Edit
                </button>
              )}
            </div>
            {!customerEditing ? (
              <div className="space-y-3 text-sm">
                <div>
                  <p className="font-semibold text-gray-900">
                    {billing.name || "—"}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <span className="text-gray-700">{billing.phone || "—"}</span>
                </div>
                <p className="text-gray-500 text-xs">
                  {billing.email || order.userEmail || "No email address"}
                </p>
                <div>
                  <p className="text-xs text-gray-400 mb-1">Shipping Address</p>
                  <p className="text-gray-700">{address || "—"}</p>
                </div>
                <p className="text-xs text-gray-400">
                  Billing: Same as shipping address
                </p>
              </div>
            ) : (
              <div className="space-y-2">
                {[
                  ["name", "Name *"],
                  ["phone", "Phone *"],
                  ["email", "Email"],
                  ["city", "City"],
                  ["zone", "Zone"],
                  ["area", "Area"],
                  ["address", "Address"],
                  ["note", "Note"],
                ].map(([key, label]) => (
                  <div key={key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {label}
                    </label>
                    <input
                      value={customerForm[key]}
                      onChange={(e) =>
                        setCustomerForm((prev) => ({
                          ...prev,
                          [key]: e.target.value,
                        }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
                    />
                  </div>
                ))}
                <div className="flex gap-2 pt-1">
                  <button
                    type="button"
                    disabled={saving}
                    onClick={saveCustomerDetails}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
                  >
                    {saving ? "Saving…" : "Save"}
                  </button>
                  <button
                    type="button"
                    disabled={saving}
                    onClick={() => setCustomerEditing(false)}
                    className="px-3 py-1.5 text-xs font-medium rounded-lg border hover:bg-gray-50"
                  >
                    Cancel
                  </button>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {statusModal.open && (
        <div className="fixed inset-0 z-50 bg-black/40 flex items-center justify-center p-4">
          <div className="w-full max-w-md bg-white rounded-2xl shadow-2xl border p-5 space-y-4">
            <h3 className="text-lg font-semibold text-gray-900">
              Update status
            </h3>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                New status
              </label>
              <select
                value={statusModal.status}
                onChange={(e) =>
                  setStatusModal((prev) => ({
                    ...prev,
                    status: e.target.value,
                  }))
                }
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              >
                {[
                  "pending",
                  "accepted",
                  "rejected",
                  "confirmed",
                  "processing",
                  "shipped",
                  "delivered",
                  "failed",
                  "cancelled",
                ].map((s) => (
                  <option key={s} value={s}>
                    {s}
                  </option>
                ))}
              </select>
            </div>
            <div>
              <label className="block text-xs text-gray-500 mb-1">
                Reason <span className="text-rose-600">*</span>
              </label>
              <textarea
                value={statusModal.reason}
                onChange={(e) =>
                  setStatusModal((prev) => ({
                    ...prev,
                    reason: e.target.value,
                  }))
                }
                rows={3}
                placeholder="Why are you changing this status?"
                className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
              />
            </div>
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() =>
                  setStatusModal({
                    open: false,
                    status: order.status,
                    reason: "",
                    submitting: false,
                  })
                }
                className="px-4 py-2 text-sm rounded-lg border hover:bg-gray-50"
              >
                Cancel
              </button>
              <button
                type="button"
                onClick={updateStatus}
                disabled={statusModal.submitting}
                className="px-4 py-2 text-sm rounded-lg bg-rose-600 text-white hover:bg-rose-700 disabled:opacity-60"
              >
                {statusModal.submitting ? "Saving…" : "Update"}
              </button>
            </div>
          </div>
        </div>
      )}

      <BookWithCourierModal
        order={order}
        open={bookModalOpen}
        onClose={() => setBookModalOpen(false)}
        onBooked={handleBooked}
      />
    </div>
  );
}
