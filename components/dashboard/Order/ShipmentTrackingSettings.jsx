"use client";

import React, { useCallback, useEffect, useState } from "react";
import Link from "next/link";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const INTEGRATION_SLUGS = ["pathao", "steadfast", "redx"];

const CREDENTIAL_FIELDS = {
  pathao: [
    { key: "clientId", label: "Client ID", type: "text", secret: true },
    {
      key: "clientSecret",
      label: "Client Secret",
      type: "password",
      secret: true,
    },
    { key: "username", label: "Merchant username", type: "text", secret: true },
    {
      key: "password",
      label: "Merchant password",
      type: "password",
      secret: true,
    },
  ],
  steadfast: [
    { key: "apiKey", label: "API Key", type: "password", secret: true },
    { key: "secretKey", label: "Secret Key", type: "password", secret: true },
    { key: "email", label: "Login email", type: "email" },
    {
      key: "password",
      label: "Login password",
      type: "password",
      secret: true,
    },
  ],
  redx: [
    { key: "phone", label: "Merchant phone (01XXXXXXXXX)", type: "text" },
    {
      key: "password",
      label: "Merchant password",
      type: "password",
      secret: true,
    },
  ],
};

/** কোথায় পাবেন — settings page এ দেখানো হয় */
const COURIER_HELP = {
  pathao: {
    summary: "Pathao merchant panel + API access",
    steps: [
      "merchant.pathao.com এ login করুন",
      "API access apply করুন (Developer/API section)",
      "Client ID, Client Secret, Username, Password নিন",
      "Store ID: Merchant panel → Stores → আপনার shop's ID",
    ],
    storeId: "Stores মেনুতে shop list এ ID দেখাবে",
  },
  steadfast: {
    summary: "Steadfast merchant panel",
    steps: [
      "steadfast.com.bd এ merchant account খুলুন এবং account active/approved আছে কিনা নিশ্চিত করুন",
      "Parcel book: Dashboard → API → Api-Key ও Secret-Key copy করুন",
      "Test connection balance check পাস করলেও book fail হলে — account activate করতে Steadfast support (09678-045045)",
      "Customer lifetime check: যে email/password দিয়ে steadfast.com.bd login করেন সেটাই দিন",
    ],
  },
  redx: {
    summary: "RedX merchant panel",
    steps: [
      "redx.com.bd merchant panel এ login করুন",
      "যে phone ও password দিয়ে app/web login করেন সেটাই দিন",
      "Book parcel's সময় delivery area order modal এ দিতে পারবেন — settings এ লাগে না",
    ],
  },
};

function CourierManager({ couriers, onChange }) {
  const [name, setName] = useState("");
  const [slug, setSlug] = useState("");
  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState({ name: "" });
  const [saving, setSaving] = useState(false);

  const createCourier = async () => {
    if (!name.trim()) return alert("Courier name is required.");
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/couriers`, {
        method: "POST",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: name.trim(),
          slug: slug.trim() || undefined,
        }),
      });
      const data = await r.json();
      if (r.ok) {
        setName("");
        setSlug("");
        onChange();
      } else {
        alert(data.error || "Could not create courier.");
      }
    } finally {
      setSaving(false);
    }
  };

  const saveEdit = async (id) => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/couriers/${id}`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: editForm.name }),
      });
      if (r.ok) {
        setEditingId(null);
        onChange();
      }
    } finally {
      setSaving(false);
    }
  };

  const deleteCourier = async (id) => {
    if (!confirm("Delete this courier?")) return;
    const r = await fetch(`${API}/api/admin/couriers/${id}`, {
      method: "DELETE",
      credentials: "include",
    });
    if (r.ok) onChange();
  };

  return (
    <section className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-800">Courier Names</h2>
      <p className="text-xs text-gray-500">
        Names shown in order forms. API Key/Secret connect করতে উপরের
        &quot;Merchant API connections&quot; সেকশন ব্যবহার করুন।
      </p>
      <div className="flex flex-wrap gap-2">
        <input
          value={name}
          onChange={(e) => setName(e.target.value)}
          placeholder="Courier name (e.g. Pathao)"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 flex-1 min-w-48"
        />
        <input
          value={slug}
          onChange={(e) => setSlug(e.target.value)}
          placeholder="Slug (optional)"
          className="text-sm border border-gray-200 rounded-lg px-3 py-2 w-36"
        />
        <button
          type="button"
          onClick={createCourier}
          disabled={saving}
          className="px-4 py-2 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
        >
          Add courier
        </button>
      </div>
      <ul className="divide-y divide-gray-100 border rounded-lg">
        {couriers.map((c) => (
          <li
            key={c._id}
            className="px-3 py-2.5 flex flex-wrap items-center gap-2 text-sm"
          >
            {editingId === c._id ? (
              <>
                <input
                  value={editForm.name}
                  onChange={(e) => setEditForm({ name: e.target.value })}
                  className="border rounded px-2 py-1 flex-1 min-w-32"
                />
                <button
                  type="button"
                  onClick={() => saveEdit(c._id)}
                  className="text-xs text-green-700 font-medium"
                >
                  Save
                </button>
                <button
                  type="button"
                  onClick={() => setEditingId(null)}
                  className="text-xs text-gray-500"
                >
                  Cancel
                </button>
              </>
            ) : (
              <>
                <span className="font-medium text-gray-800">{c.name}</span>
                <span className="text-xs text-gray-400">({c.slug})</span>
                {c.apiEnabled && (
                  <span className="text-[10px] bg-green-100 text-green-700 px-1.5 py-0.5 rounded">
                    API on
                  </span>
                )}
                {c.isSystem && (
                  <span className="text-[10px] bg-gray-100 text-gray-500 px-1.5 py-0.5 rounded">
                    built-in
                  </span>
                )}
                <button
                  type="button"
                  onClick={() => {
                    setEditingId(c._id);
                    setEditForm({ name: c.name });
                  }}
                  className="text-xs text-blue-600 ml-auto"
                >
                  Edit
                </button>
                <button
                  type="button"
                  onClick={() => deleteCourier(c._id)}
                  className="text-xs text-red-600"
                >
                  Delete
                </button>
              </>
            )}
          </li>
        ))}
      </ul>
    </section>
  );
}

function CourierIntegrationCard({ courier, onSaved }) {
  const [expanded, setExpanded] = useState(false);
  const [data, setData] = useState(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [credForm, setCredForm] = useState({});
  const [storeForm, setStoreForm] = useState({});
  const [apiEnabled, setApiEnabled] = useState(false);

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const r = await fetch(
        `${API}/api/admin/couriers/${courier._id}/integration`,
        {
          credentials: "include",
        },
      );
      const body = await r.json();
      if (r.ok) {
        setData(body);
        setApiEnabled(Boolean(body.courier?.apiEnabled));
        setStoreForm(body.courier?.storeConfig || {});
        setCredForm({});
      }
    } finally {
      setLoading(false);
    }
  }, [courier._id]);

  useEffect(() => {
    load();
  }, [load]);

  const fields = CREDENTIAL_FIELDS[courier.slug] || [];
  const help = COURIER_HELP[courier.slug];

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(
        `${API}/api/admin/couriers/${courier._id}/integration`,
        {
          method: "PUT",
          credentials: "include",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            apiEnabled,
            credentials: credForm,
            storeConfig: storeForm,
          }),
        },
      );
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Save failed");
      setCredForm({});
      await load();
      onSaved?.();
      alert("Integration saved");
    } catch (err) {
      alert(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  const testConnection = async () => {
    setTesting(true);
    try {
      const r = await fetch(
        `${API}/api/admin/couriers/${courier._id}/test-connection`,
        {
          method: "POST",
          credentials: "include",
        },
      );
      const body = await r.json();
      if (!r.ok) throw new Error(body.error || "Test failed");
      alert(body.message || "Connected successfully");
      await load();
    } catch (err) {
      alert(err.message || "Connection test failed");
    } finally {
      setTesting(false);
    }
  };

  const status = data?.courier?.integrationStatus;
  const masked = data?.credentials || {};

  return (
    <div className="border rounded-xl bg-gray-50/50 overflow-hidden">
      <button
        type="button"
        onClick={() => setExpanded((v) => !v)}
        className="w-full flex items-center justify-between gap-2 p-4 hover:bg-gray-100/50 text-left transition"
      >
        <div className="flex items-center gap-3">
          <span
            className={`w-7 h-7 rounded-full flex items-center justify-center shrink-0 text-gray-500 ${expanded ? "bg-rose-100 text-rose-600" : "bg-gray-200"}`}
          >
            <svg
              className={`w-3.5 h-3.5 transition-transform ${expanded ? "rotate-90" : ""}`}
              viewBox="0 0 24 24"
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
            >
              <path d="M9 5l7 7-7 7" />
            </svg>
          </span>
          <div>
            <h3 className="font-semibold text-gray-900">{courier.name}</h3>
            <p className="text-xs text-gray-500">
              {data?.configured ? (
                <span className="text-green-700 font-medium">Configured</span>
              ) : (
                <span className="text-amber-700">Not configured</span>
              )}
              {data?.credentialSource && data.credentialSource !== "none" && (
                <span className="ml-2">· source: {data.credentialSource}</span>
              )}
            </p>
          </div>
        </div>
        <span className="text-xs text-gray-400 shrink-0">
          {expanded ? "Collapse" : "Expand to configure"}
        </span>
      </button>

      {expanded && (
        <div className="px-4 pb-4 space-y-3 border-t border-gray-200/80">
          <div className="flex justify-end pt-3">
            <label className="flex items-center gap-2 text-sm">
              <input
                type="checkbox"
                checked={apiEnabled}
                onChange={(e) => setApiEnabled(e.target.checked)}
              />
              API enabled
            </label>
          </div>

          {loading ? (
            <p className="text-xs text-gray-400">Loading…</p>
          ) : (
            <>
              {help ? (
                <div className="rounded-lg bg-blue-50 border border-blue-100 p-3 text-xs text-blue-900 space-y-1">
                  <p className="font-semibold">{help.summary}</p>
                  <ul className="list-disc list-inside space-y-0.5 opacity-90">
                    {help.steps.map((step) => (
                      <li key={step}>{step}</li>
                    ))}
                  </ul>
                </div>
              ) : null}

              <div className="grid sm:grid-cols-2 gap-3">
                {fields.map((f) => (
                  <div key={f.key}>
                    <label className="block text-xs text-gray-500 mb-1">
                      {f.label}
                    </label>
                    <input
                      type={f.type}
                      placeholder={
                        masked[
                          `has${f.key.charAt(0).toUpperCase()}${f.key.slice(1)}`
                        ]
                          ? masked[f.key] || "•••• saved"
                          : ""
                      }
                      value={credForm[f.key] || ""}
                      onChange={(e) =>
                        setCredForm((p) => ({ ...p, [f.key]: e.target.value }))
                      }
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 bg-white"
                    />
                  </div>
                ))}
              </div>

              {courier.slug === "pathao" && (
                <div>
                  <label className="block text-xs text-gray-500 mb-1">
                    Store ID{" "}
                    <span className="text-gray-400">(parcel book's জন্য)</span>
                  </label>
                  <input
                    type="number"
                    value={storeForm.pathaoStoreId ?? credForm.storeId ?? ""}
                    onChange={(e) =>
                      setStoreForm((p) => ({
                        ...p,
                        pathaoStoreId: e.target.value
                          ? Number(e.target.value)
                          : null,
                      }))
                    }
                    placeholder={help?.storeId || "Merchant panel → Stores"}
                    className="w-full text-sm border rounded-lg px-3 py-2 bg-white max-w-xs"
                  />
                </div>
              )}

              {courier.slug === "steadfast" && (
                <p className="text-[11px] text-gray-500">
                  API Key + Secret Key দিয়ে parcel book এবং customer courier
                  score দুটোই হয়। Login email/password শুধু backup (API fraud
                  check fail হলে)।
                </p>
              )}

              {status?.lastTestedAt && (
                <p
                  className={`text-xs ${status.lastTestOk ? "text-green-700" : "text-red-600"}`}
                >
                  Last test: {new Date(status.lastTestedAt).toLocaleString()} —{" "}
                  {status.lastTestMessage}
                </p>
              )}

              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={save}
                  disabled={saving}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg bg-purple-600 text-white hover:bg-purple-700 disabled:opacity-60"
                >
                  {saving ? "Saving…" : "Save credentials"}
                </button>
                <button
                  type="button"
                  onClick={testConnection}
                  disabled={testing}
                  className="px-3 py-1.5 text-sm font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-60"
                >
                  {testing ? "Testing…" : "Test connection"}
                </button>
              </div>
            </>
          )}
        </div>
      )}
    </div>
  );
}

function ShopShipmentConfig({ onSaved }) {
  const [form, setForm] = useState({
    pickupAddress: "",
    defaultCourierSlug: "pathao",
    bookSetsStatus: "shipped",
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    fetch(`${API}/api/admin/shipment-config`, { credentials: "include" })
      .then((r) => r.json())
      .then((data) => {
        if (data.shipmentConfig)
          setForm((p) => ({ ...p, ...data.shipmentConfig }));
      })
      .catch(() => {});
  }, []);

  const save = async () => {
    setSaving(true);
    try {
      const r = await fetch(`${API}/api/admin/shipment-config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ shipmentConfig: form }),
      });
      if (!r.ok) throw new Error("Save failed");
      onSaved?.();
      alert("Shop shipment settings saved");
    } catch (err) {
      alert(err.message || "Could not save");
    } finally {
      setSaving(false);
    }
  };

  return (
    <section className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
      <h2 className="text-base font-semibold text-gray-800">
        Shop pickup & defaults
      </h2>
      <p className="text-xs text-gray-500">
        Pickup address is where riders collect parcels. Order status after API
        booking is configurable.
      </p>
      <div>
        <label className="block text-xs text-gray-500 mb-1">
          Pickup address (your shop)
        </label>
        <textarea
          value={form.pickupAddress}
          onChange={(e) =>
            setForm((p) => ({ ...p, pickupAddress: e.target.value }))
          }
          rows={2}
          className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2"
          placeholder="House, road, area — where courier rider picks up"
        />
      </div>
      <div className="grid sm:grid-cols-2 gap-3">
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Default courier
          </label>
          <select
            value={form.defaultCourierSlug}
            onChange={(e) =>
              setForm((p) => ({ ...p, defaultCourierSlug: e.target.value }))
            }
            className="w-full text-sm border rounded-lg px-3 py-2"
          >
            <option value="pathao">Pathao</option>
            <option value="steadfast">Steadfast</option>
            <option value="redx">RedX</option>
          </select>
        </div>
        <div>
          <label className="block text-xs text-gray-500 mb-1">
            Status after book
          </label>
          <select
            value={form.bookSetsStatus}
            onChange={(e) =>
              setForm((p) => ({ ...p, bookSetsStatus: e.target.value }))
            }
            className="w-full text-sm border rounded-lg px-3 py-2"
          >
            <option value="shipped">Shipped</option>
            <option value="processing">Processing</option>
            <option value="confirmed">Confirmed</option>
          </select>
        </div>
      </div>
      <button
        type="button"
        onClick={save}
        disabled={saving}
        className="px-4 py-2 text-sm font-medium rounded-lg border border-purple-200 text-purple-700 hover:bg-purple-50 disabled:opacity-60"
      >
        {saving ? "Saving…" : "Save shop settings"}
      </button>
    </section>
  );
}

export default function ShipmentTrackingSettings() {
  const [couriers, setCouriers] = useState([]);

  const loadMeta = useCallback(async () => {
    const courierRes = await fetch(`${API}/api/admin/couriers`, {
      credentials: "include",
    });
    const courierData = courierRes.ok ? await courierRes.json() : { items: [] };
    setCouriers(courierData.items || []);
  }, []);

  useEffect(() => {
    loadMeta();
  }, [loadMeta]);

  const integrationCouriers = couriers.filter((c) =>
    INTEGRATION_SLUGS.includes(c.slug),
  );

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div>
        <Link
          href="/dashboard/shipment-tracking"
          className="text-sm text-gray-500 hover:text-rose-600"
        >
          ← Back to tracking orders
        </Link>
        <h1 className="text-2xl font-bold text-gray-900 mt-2">
          Courier Settings
        </h1>
        <p className="text-sm text-gray-500 mt-1">
          Connect merchant accounts and manage courier names. Tracking updates
          come automatically from live tracking URLs.
        </p>
      </div>

      <section className="bg-white rounded-xl border p-5 shadow-sm space-y-4">
        <h2 className="text-base font-semibold text-gray-800">
          Merchant API connections (Courier Connect)
        </h2>
        <p className="text-xs text-gray-500">
          Pathao, Steadfast, RedX — API Key/Secret বা merchant login এখানে দিন।
          Credentials encrypted থাকে। Save credentials → Test connection।
          Customer profile এ lifetime delivery history-ও এখান থেকেই কাজ করে।
        </p>
        <div className="rounded-lg bg-emerald-50 border border-emerald-100 p-3 text-xs text-emerald-900 space-y-1">
          <p className="font-semibold">
            Steadfast live tracking webhook (recommended)
          </p>
          <p>Steadfast merchant panel → Webhook → Callback URL:</p>
          <code className="block bg-white/80 px-2 py-1 rounded border text-[11px] break-all">
            {typeof window !== "undefined"
              ? `${process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000"}/api/orders/webhooks/steadfast`
              : "/api/orders/webhooks/steadfast"}
          </code>
          <p>
            Bearer token: backend <code>.env</code> এ{" "}
            <code>STEADFAST_WEBHOOK_BEARER</code> set করুন। Tracking URL save
            করলে auto sync-ও চলে।
          </p>
        </div>
        {integrationCouriers.length === 0 ? (
          <p className="text-sm text-gray-400">Loading built-in couriers…</p>
        ) : (
          <div className="space-y-4">
            {integrationCouriers.map((c) => (
              <CourierIntegrationCard
                key={c._id}
                courier={c}
                onSaved={loadMeta}
              />
            ))}
          </div>
        )}
      </section>

      <ShopShipmentConfig onSaved={loadMeta} />
      <CourierManager couriers={couriers} onChange={loadMeta} />
    </div>
  );
}
