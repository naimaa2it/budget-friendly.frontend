"use client";

import React, { useState, useEffect } from "react";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

export const COLOR_THEMES = {
  pink: {
    bgColor: "from-pink-50 to-white",
    textColor: "text-pink-600",
    borderColor: "border-pink-400",
    label: "Pink",
    swatch: "bg-pink-400",
  },
  blue: {
    bgColor: "from-blue-50 to-white",
    textColor: "text-blue-600",
    borderColor: "border-blue-400",
    label: "Blue",
    swatch: "bg-blue-400",
  },
  orange: {
    bgColor: "from-orange-50 to-white",
    textColor: "text-orange-600",
    borderColor: "border-orange-400",
    label: "Orange",
    swatch: "bg-orange-400",
  },
  green: {
    bgColor: "from-green-50 to-white",
    textColor: "text-green-600",
    borderColor: "border-green-400",
    label: "Green",
    swatch: "bg-green-400",
  },
  purple: {
    bgColor: "from-purple-50 to-white",
    textColor: "text-purple-600",
    borderColor: "border-purple-400",
    label: "Purple",
    swatch: "bg-purple-400",
  },
  red: {
    bgColor: "from-red-50 to-white",
    textColor: "text-red-600",
    borderColor: "border-red-400",
    label: "Red",
    swatch: "bg-red-400",
  },
  teal: {
    bgColor: "from-teal-50 to-white",
    textColor: "text-teal-600",
    borderColor: "border-teal-400",
    label: "Teal",
    swatch: "bg-teal-400",
  },
};

const BLANK = {
  title: "",
  subtitle: "",
  spend: "",
  highlight: "",
  highlightSecondary: "",
  description: "",
  couponCode: "",
  theme: "pink",
  isActive: true,
  // Functional coupon fields
  discountType: "fixed",
  discountValue: 0,
  minOrderAmount: 0,
  maxDiscountAmount: 0,
  isFirstOrderOnly: false,
  isNewUserOnly: false,
  maxUsesTotal: 0,
  maxUsesPerUser: 0,
  stackable: false,
  expiresAt: "",
};

function OfferCard({ offer }) {
  const t = COLOR_THEMES[offer.theme] || COLOR_THEMES.pink;
  return (
    <div
      className={`relative border-2 ${t.borderColor} rounded-lg px-4 py-5 bg-linear-to-br ${t.bgColor} overflow-hidden h-44`}
    >
      <div
        className={`absolute -top-3 left-2/3 -translate-x-1/2 w-6 h-6 bg-white border-2 ${t.borderColor} rounded-full z-10`}
      />
      <div
        className={`absolute -bottom-3 left-2/3 -translate-x-1/2 w-6 h-6 bg-white border-2 ${t.borderColor} rounded-full z-10`}
      />
      <div className="absolute left-2/3 -translate-x-1/2 top-0 bottom-0 w-0.5 border-l-2 border-dashed border-orange-300" />
      <div className="flex h-full">
        <div className="w-2/3 pr-4 flex flex-col justify-center">
          <p className="text-sm text-gray-600 mb-1">
            Spend: {offer.spend || "—"}
          </p>
          {offer.highlightSecondary ? (
            <>
              <h2 className={`text-3xl font-bold ${t.textColor} mb-1`}>
                {offer.highlight}
              </h2>
              <h3 className={`text-2xl font-bold ${t.textColor}`}>
                {offer.highlightSecondary}
              </h3>
            </>
          ) : (
            <h2 className={`text-5xl font-bold ${t.textColor}`}>
              {offer.highlight || "—"}
            </h2>
          )}
          <p className="text-sm text-gray-600 mt-1">{offer.subtitle}</p>
        </div>
        <div className="w-1/3 pl-3 flex flex-col justify-center">
          <h3 className="text-sm font-semibold text-gray-900 mb-1">
            {offer.title}
          </h3>
          {offer.description && (
            <p className="text-xs text-gray-600 leading-relaxed mb-1">
              {offer.description}
            </p>
          )}
          {offer.couponCode && (
            <span className="inline-block bg-white border border-dashed border-gray-400 rounded px-2 py-0.5 text-xs font-mono font-bold text-gray-700 truncate">
              {offer.couponCode}
            </span>
          )}
        </div>
      </div>
    </div>
  );
}

export default function DiscountsManager() {
  const { user } = useUser();
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [editing, setEditing] = useState(null); // null = closed, 'new' or item._id
  const [form, setForm] = useState(BLANK);
  const [saving, setSaving] = useState(false);
  const [showFunctional, setShowFunctional] = useState(false);

  const load = async () => {
    setLoading(true);
    try {
      const r = await fetch(`${API}/api/admin/discounts`, {
        credentials: "include",
      });
      const d = await r.json();
      setItems(d.items || []);
    } catch (e) {
      console.error(e);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const openNew = () => {
    setForm(BLANK);
    setEditing("new");
    setShowFunctional(false);
  };
  const openEdit = (item) => {
    setForm({
      ...item,
      expiresAt: item.expiresAt
        ? new Date(item.expiresAt).toISOString().slice(0, 16)
        : "",
    });
    setEditing(item._id);
    setShowFunctional(!!item.couponCode);
  };
  const closeForm = () => {
    setEditing(null);
    setForm(BLANK);
  };

  const handleSave = async () => {
    if (!form.title.trim() || !form.highlight.trim()) {
      alert("Title and Highlight are required.");
      return;
    }
    setSaving(true);
    try {
      const isNew = editing === "new";
      const url = isNew
        ? `${API}/api/admin/discounts`
        : `${API}/api/admin/discounts/${editing}`;

      const payload = { ...form };
      if (payload.expiresAt) {
        payload.expiresAt = new Date(payload.expiresAt).toISOString();
      } else {
        payload.expiresAt = null;
      }

      const r = await fetch(url, {
        method: isNew ? "POST" : "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const d = await r.json();
      if (!r.ok) throw new Error(d.error || "Save failed");
      await load();
      closeForm();
    } catch (e) {
      alert(e.message);
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async (id) => {
    if (!confirm("Delete this offer?")) return;
    try {
      await fetch(`${API}/api/admin/discounts/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      setItems((p) => p.filter((i) => i._id !== id));
    } catch (e) {
      alert("Delete failed");
    }
  };

  const toggleActive = async (item) => {
    try {
      const r = await fetch(`${API}/api/admin/discounts/${item._id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ isActive: !item.isActive }),
      });
      const d = await r.json();
      if (d.ok)
        setItems((p) => p.map((i) => (i._id === item._id ? d.item : i)));
    } catch (e) {
      console.error(e);
    }
  };

  const move = async (index, dir) => {
    const next = [...items];
    const swap = index + dir;
    if (swap < 0 || swap >= next.length) return;
    [next[index], next[swap]] = [next[swap], next[index]];
    const reordered = next.map((it, i) => ({ ...it, order: i }));
    setItems(reordered);
    try {
      await fetch(`${API}/api/admin/discounts-reorder`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(
          reordered.map(({ _id, order }) => ({ _id, order })),
        ),
      });
    } catch (e) {
      console.error(e);
    }
  };

  const inp =
    "w-full border border-gray-300 rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-rose-400";
  const lbl = "block text-sm font-medium text-gray-700 mb-1";

  return (
    <div className="max-w-5xl mx-auto p-4 sm:p-6 space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
        <div>
          <h1 className="text-2xl font-bold text-gray-900">
            Discounts & Coupons
          </h1>
          <p className="text-sm text-gray-500 mt-1">
            Manage offer cards and functional coupon codes. Coupons with codes
            can be applied at checkout.
          </p>
        </div>
        <button
          onClick={openNew}
          className="flex items-center gap-2 px-4 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium shrink-0"
        >
          <span className="text-lg leading-none">+</span> Add Offer/Coupon
        </button>
      </div>

      {/* Inline form */}
      {editing !== null && (
        <div className="bg-white border border-gray-200 rounded-xl shadow-sm p-6 space-y-5">
          <h2 className="text-lg font-semibold text-gray-800">
            {editing === "new" ? "New Offer/Coupon" : "Edit Offer/Coupon"}
          </h2>

          {/* Display fields */}
          <div className="bg-gray-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-gray-700 uppercase tracking-wide">
              Display Settings
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className={lbl}>
                  Title <span className="text-red-500">*</span>
                </label>
                <input
                  className={inp}
                  value={form.title}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, title: e.target.value }))
                  }
                  placeholder="e.g. Free Delivery"
                />
              </div>
              <div>
                <label className={lbl}>Subtitle / Badge</label>
                <input
                  className={inp}
                  value={form.subtitle}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, subtitle: e.target.value }))
                  }
                  placeholder="e.g. Auto Applied"
                />
              </div>
              <div>
                <label className={lbl}>Spend Threshold (display text)</label>
                <input
                  className={inp}
                  value={form.spend}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, spend: e.target.value }))
                  }
                  placeholder="e.g. 999 TK"
                />
              </div>
              <div>
                <label className={lbl}>
                  Highlight (big text) <span className="text-red-500">*</span>
                </label>
                <input
                  className={inp}
                  value={form.highlight}
                  onChange={(e) =>
                    setForm((p) => ({ ...p, highlight: e.target.value }))
                  }
                  placeholder="e.g. Free  or  ৳150"
                />
              </div>
              <div>
                <label className={lbl}>
                  Highlight Line 2{" "}
                  <span className="text-xs text-gray-400">(optional)</span>
                </label>
                <input
                  className={inp}
                  value={form.highlightSecondary}
                  onChange={(e) =>
                    setForm((p) => ({
                      ...p,
                      highlightSecondary: e.target.value,
                    }))
                  }
                  placeholder="e.g. Delivery"
                />
              </div>
              <div>
                <label className={lbl}>Color Theme</label>
                <div className="flex flex-wrap gap-2 mt-1">
                  {Object.entries(COLOR_THEMES).map(([key, t]) => (
                    <button
                      key={key}
                      type="button"
                      onClick={() => setForm((p) => ({ ...p, theme: key }))}
                      className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border-2 text-xs font-medium transition-all ${
                        form.theme === key
                          ? "border-gray-800 shadow"
                          : "border-gray-200 hover:border-gray-400"
                      }`}
                    >
                      <span className={`w-3 h-3 rounded-full ${t.swatch}`} />
                      {t.label}
                    </button>
                  ))}
                </div>
              </div>
            </div>

            <div>
              <label className={lbl}>Description</label>
              <textarea
                className={inp}
                rows={2}
                value={form.description}
                onChange={(e) =>
                  setForm((p) => ({ ...p, description: e.target.value }))
                }
                placeholder="Short description shown on the card"
              />
            </div>
          </div>

          {/* Coupon Code */}
          <div className="bg-blue-50 rounded-lg p-4 space-y-4">
            <h3 className="text-sm font-semibold text-blue-800 uppercase tracking-wide">
              Coupon Code
            </h3>
            <div>
              <label className={lbl}>
                Coupon Code{" "}
                <span className="text-xs text-gray-400">
                  (enter a code to make this a functional coupon)
                </span>
              </label>
              <input
                className={`${inp} uppercase font-mono`}
                value={form.couponCode}
                onChange={(e) => {
                  const code = e.target.value.toUpperCase();
                  setForm((p) => ({ ...p, couponCode: code }));
                  if (code) setShowFunctional(true);
                }}
                placeholder="e.g. SAVE150, NEWUSER26"
              />
            </div>

            {form.couponCode && (
              <button
                type="button"
                onClick={() => setShowFunctional(!showFunctional)}
                className="text-sm text-blue-600 hover:text-blue-800 underline"
              >
                {showFunctional
                  ? "Hide functional settings"
                  : "Show functional settings"}
              </button>
            )}
          </div>

          {/* Functional coupon fields */}
          {form.couponCode && showFunctional && (
            <div className="bg-green-50 rounded-lg p-4 space-y-4">
              <h3 className="text-sm font-semibold text-green-800 uppercase tracking-wide">
                Coupon Functional Settings
              </h3>
              <p className="text-xs text-green-700">
                These settings control how the coupon actually works when
                applied at checkout.
              </p>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div>
                  <label className={lbl}>Discount Type</label>
                  <select
                    className={inp}
                    value={form.discountType}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, discountType: e.target.value }))
                    }
                  >
                    <option value="fixed">Fixed Amount (৳)</option>
                    <option value="percentage">Percentage (%)</option>
                    <option value="free_shipping">Free Shipping</option>
                  </select>
                </div>

                {form.discountType !== "free_shipping" && (
                  <div>
                    <label className={lbl}>
                      Discount Value{" "}
                      {form.discountType === "percentage" ? "(%)" : "(৳)"}
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inp}
                      value={form.discountValue === 0 ? "" : form.discountValue}
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setForm((p) => ({
                          ...p,
                          discountValue: val === "" ? 0 : parseFloat(val) || 0,
                        }));
                      }}
                      placeholder={
                        form.discountType === "percentage"
                          ? "e.g. 10"
                          : "e.g. 150"
                      }
                    />
                  </div>
                )}

                <div>
                  <label className={lbl}>Minimum Order Amount (৳)</label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inp}
                    value={form.minOrderAmount === 0 ? "" : form.minOrderAmount}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9.]/g, "");
                      setForm((p) => ({
                        ...p,
                        minOrderAmount: val === "" ? 0 : parseFloat(val) || 0,
                      }));
                    }}
                    placeholder="e.g. 800"
                  />
                </div>

                {form.discountType === "percentage" && (
                  <div>
                    <label className={lbl}>
                      Max Discount Cap (৳){" "}
                      <span className="text-xs text-gray-400">
                        (0 = no cap)
                      </span>
                    </label>
                    <input
                      type="text"
                      inputMode="numeric"
                      className={inp}
                      value={
                        form.maxDiscountAmount === 0
                          ? ""
                          : form.maxDiscountAmount
                      }
                      onChange={(e) => {
                        const val = e.target.value.replace(/[^0-9.]/g, "");
                        setForm((p) => ({
                          ...p,
                          maxDiscountAmount:
                            val === "" ? 0 : parseFloat(val) || 0,
                        }));
                      }}
                      placeholder="e.g. 200"
                    />
                  </div>
                )}

                <div>
                  <label className={lbl}>
                    Max Total Uses{" "}
                    <span className="text-xs text-gray-400">
                      (0 = unlimited)
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inp}
                    value={form.maxUsesTotal === 0 ? "" : form.maxUsesTotal}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setForm((p) => ({
                        ...p,
                        maxUsesTotal: val === "" ? 0 : parseInt(val) || 0,
                      }));
                    }}
                    placeholder="e.g. 100"
                  />
                </div>

                <div>
                  <label className={lbl}>
                    Max Uses Per User{" "}
                    <span className="text-xs text-gray-400">
                      (0 = unlimited)
                    </span>
                  </label>
                  <input
                    type="text"
                    inputMode="numeric"
                    className={inp}
                    value={form.maxUsesPerUser === 0 ? "" : form.maxUsesPerUser}
                    onChange={(e) => {
                      const val = e.target.value.replace(/[^0-9]/g, "");
                      setForm((p) => ({
                        ...p,
                        maxUsesPerUser: val === "" ? 0 : parseInt(val) || 0,
                      }));
                    }}
                    placeholder="e.g. 1"
                  />
                </div>

                <div>
                  <label className={lbl}>
                    Expires At{" "}
                    <span className="text-xs text-gray-400">(optional)</span>
                  </label>
                  <input
                    type="datetime-local"
                    className={inp}
                    value={form.expiresAt}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, expiresAt: e.target.value }))
                    }
                  />
                </div>
              </div>

              <div className="flex flex-wrap gap-6">
                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isNewUserOnly}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isNewUserOnly: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    New users only (registered &lt; 30 days)
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.isFirstOrderOnly}
                    onChange={(e) =>
                      setForm((p) => ({
                        ...p,
                        isFirstOrderOnly: e.target.checked,
                      }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    First order only
                  </span>
                </label>

                <label className="inline-flex items-center gap-2 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={form.stackable}
                    onChange={(e) =>
                      setForm((p) => ({ ...p, stackable: e.target.checked }))
                    }
                    className="w-4 h-4"
                  />
                  <span className="text-sm text-gray-700">
                    allowMultiple (can combine with other coupons)
                  </span>
                </label>
              </div>

              {form.usageCount > 0 && (
                <p className="text-xs text-gray-500">
                  This coupon has been used {form.usageCount} time(s).
                </p>
              )}
            </div>
          )}

          <label className="inline-flex items-center gap-2 cursor-pointer">
            <input
              type="checkbox"
              checked={form.isActive}
              onChange={(e) =>
                setForm((p) => ({ ...p, isActive: e.target.checked }))
              }
              className="w-4 h-4"
            />
            <span className="text-sm font-medium text-gray-700">
              Active (visible on homepage & usable at checkout)
            </span>
          </label>

          {/* Live preview */}
          <div>
            <p className="text-xs text-gray-500 font-medium mb-2 uppercase tracking-wide">
              Live Preview
            </p>
            <div className="max-w-sm">
              <OfferCard offer={form} />
            </div>
          </div>

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-5 py-2 bg-rose-600 text-white rounded-lg hover:bg-rose-700 text-sm font-medium disabled:opacity-60"
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={closeForm}
              className="px-5 py-2 border border-gray-300 rounded-lg text-sm hover:bg-gray-50"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Offers list */}
      {loading ? (
        <div className="text-center py-16 text-gray-400">Loading…</div>
      ) : items.length === 0 ? (
        <div className="text-center py-16 border-2 border-dashed border-gray-200 rounded-xl text-gray-400">
          No offers yet. Click <strong>+ Add Offer/Coupon</strong> to create
          one.
        </div>
      ) : (
        <div className="space-y-4">
          {items.map((item, index) => (
            <div
              key={item._id}
              className="bg-white border border-gray-200 rounded-xl p-4 flex flex-col md:flex-row gap-4 items-start"
            >
              {/* Reorder */}
              <div className="flex md:flex-col gap-1 shrink-0">
                <button
                  onClick={() => move(index, -1)}
                  disabled={index === 0}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  ▲
                </button>
                <button
                  onClick={() => move(index, 1)}
                  disabled={index === items.length - 1}
                  className="p-1.5 rounded hover:bg-gray-100 disabled:opacity-30 text-gray-500"
                >
                  ▼
                </button>
              </div>

              {/* Card preview */}
              <div className="flex-1 min-w-0">
                <OfferCard offer={item} />
                {item.couponCode && (
                  <div className="mt-2 flex flex-wrap gap-2 text-xs">
                    <span className="px-2 py-0.5 bg-blue-100 text-blue-700 rounded">
                      {item.discountType === "free_shipping"
                        ? "Free Shipping"
                        : item.discountType === "percentage"
                          ? `${item.discountValue}% off`
                          : `৳${item.discountValue} off`}
                    </span>
                    {item.minOrderAmount > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Min: ৳{item.minOrderAmount}
                      </span>
                    )}
                    {item.isNewUserOnly && (
                      <span className="px-2 py-0.5 bg-purple-100 text-purple-700 rounded">
                        New Users
                      </span>
                    )}
                    {item.isFirstOrderOnly && (
                      <span className="px-2 py-0.5 bg-orange-100 text-orange-700 rounded">
                        First Order
                      </span>
                    )}
                    {item.stackable && (
                      <span className="px-2 py-0.5 bg-green-100 text-green-700 rounded">
                        allowMultiple
                      </span>
                    )}
                    {item.usageCount > 0 && (
                      <span className="px-2 py-0.5 bg-gray-100 text-gray-600 rounded">
                        Used: {item.usageCount}x
                      </span>
                    )}
                  </div>
                )}
              </div>

              {/* Actions */}
              <div className="flex md:flex-col gap-2 shrink-0">
                <button
                  onClick={() => toggleActive(item)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-medium ${
                    item.isActive
                      ? "bg-green-100 text-green-700 hover:bg-green-200"
                      : "bg-gray-100 text-gray-500 hover:bg-gray-200"
                  }`}
                >
                  {item.isActive ? "Active" : "Inactive"}
                </button>
                <button
                  onClick={() => openEdit(item)}
                  className="px-3 py-1.5 rounded-lg bg-blue-50 text-blue-700 hover:bg-blue-100 text-xs font-medium"
                >
                  Edit
                </button>
                {user?.role === "admin" && (
                  <button
                    onClick={() => handleDelete(item._id)}
                    className="px-3 py-1.5 rounded-lg bg-red-50 text-red-700 hover:bg-red-100 text-xs font-medium"
                  >
                    Delete
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
