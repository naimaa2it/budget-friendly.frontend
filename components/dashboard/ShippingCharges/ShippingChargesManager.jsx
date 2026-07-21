"use client";

import React, { useEffect, useMemo, useState } from "react";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const emptyRateForm = { zone: "", area: "", charge: "" };

export default function ShippingChargesManager() {
  const { user } = useUser();

  // Base inside/outside Dhaka charges
  const [settings, setSettings] = useState({
    insideDhakaCharge: "",
    outsideDhakaCharge: "",
  });
  const [settingsLoading, setSettingsLoading] = useState(true);
  const [settingsSaving, setSettingsSaving] = useState(false);

  // Dhaka zone -> areas, sourced from the same location data checkout uses
  const [dhakaZones, setDhakaZones] = useState({}); // { zoneName: [areaName, ...] }
  const zoneNames = useMemo(
    () => Object.keys(dhakaZones).sort(),
    [dhakaZones],
  );

  // Zone/area overrides
  const [rates, setRates] = useState([]);
  const [ratesLoading, setRatesLoading] = useState(true);
  const [rateForm, setRateForm] = useState(emptyRateForm);
  const [rateSaving, setRateSaving] = useState(false);

  const loadSettings = async () => {
    setSettingsLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/shipping-settings`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Failed to load settings");
      setSettings({
        insideDhakaCharge: body.settings?.insideDhakaCharge ?? "",
        outsideDhakaCharge: body.settings?.outsideDhakaCharge ?? "",
      });
    } catch (err) {
      alert(err.message || "Failed to load shipping settings");
    } finally {
      setSettingsLoading(false);
    }
  };

  const loadRates = async () => {
    setRatesLoading(true);
    try {
      const resp = await fetch(`${API}/api/admin/shipping-zone-rates`, {
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Failed to load overrides");
      setRates(body.items || []);
    } catch (err) {
      alert(err.message || "Failed to load zone overrides");
    } finally {
      setRatesLoading(false);
    }
  };

  const loadDhakaZones = async () => {
    try {
      const resp = await fetch("/api/locations");
      const body = await resp.json();
      const zones = body.locationData?.Dhaka?.zones || {};
      setDhakaZones(zones);
    } catch (err) {
      console.error("Failed to load Dhaka zone list", err);
    }
  };

  useEffect(() => {
    loadSettings();
    loadRates();
    loadDhakaZones();
  }, []);

  const saveSettings = async (e) => {
    e.preventDefault();
    if (settings.insideDhakaCharge === "" || settings.outsideDhakaCharge === "")
      return;
    setSettingsSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/shipping-settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          insideDhakaCharge: Number(settings.insideDhakaCharge),
          outsideDhakaCharge: Number(settings.outsideDhakaCharge),
        }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      setSettings({
        insideDhakaCharge: body.settings.insideDhakaCharge,
        outsideDhakaCharge: body.settings.outsideDhakaCharge,
      });
    } catch (err) {
      alert(err.message || "Failed to save shipping settings");
    } finally {
      setSettingsSaving(false);
    }
  };

  const addRate = async (e) => {
    e.preventDefault();
    if (!rateForm.zone || rateForm.charge === "") return;
    setRateSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/shipping-zone-rates`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          zone: rateForm.zone,
          area: rateForm.area || null,
          charge: Number(rateForm.charge),
        }),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      setRateForm(emptyRateForm);
      loadRates();
    } catch (err) {
      alert(err.message || "Failed to add override");
    } finally {
      setRateSaving(false);
    }
  };

  const updateRateCharge = async (item, charge) => {
    try {
      const resp = await fetch(
        `${API}/api/admin/shipping-zone-rates/${item._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ charge: Number(charge) }),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Update failed");
      loadRates();
    } catch (err) {
      alert(err.message || "Failed to update override");
    }
  };

  const toggleRateActive = async (item) => {
    try {
      const resp = await fetch(
        `${API}/api/admin/shipping-zone-rates/${item._id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          credentials: "include",
          body: JSON.stringify({ isActive: !item.isActive }),
        },
      );
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Update failed");
      loadRates();
    } catch (err) {
      alert(err.message || "Failed to update override");
    }
  };

  const deleteRate = async (id) => {
    if (!confirm("Delete this zone/area shipping override?")) return;
    try {
      const resp = await fetch(`${API}/api/admin/shipping-zone-rates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Delete failed");
      loadRates();
    } catch (err) {
      alert(err.message || "Failed to delete override");
    }
  };

  const areasForSelectedZone = rateForm.zone
    ? dhakaZones[rateForm.zone] || []
    : [];

  return (
    <div className="space-y-10">
      {/* Base charges */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Shipping Charges
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Default checkout shipping charge, applied whenever no zone/area
            override matches. This replaces the hardcoded checkout amount.
          </p>
        </div>

        {settingsLoading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <form
            onSubmit={saveSettings}
            className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-[10rem_10rem_auto]"
          >
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Inside Dhaka (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.insideDhakaCharge}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    insideDhakaCharge: e.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="70"
              />
            </div>
            <div>
              <label className="mb-1 block text-xs font-medium text-gray-600">
                Outside Dhaka (৳)
              </label>
              <input
                type="number"
                step="0.01"
                value={settings.outsideDhakaCharge}
                onChange={(e) =>
                  setSettings((p) => ({
                    ...p,
                    outsideDhakaCharge: e.target.value,
                  }))
                }
                className="w-full rounded border border-gray-300 px-3 py-2"
                placeholder="130"
              />
            </div>
            <div className="flex items-end">
              <button
                type="submit"
                disabled={settingsSaving}
                className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
              >
                {settingsSaving ? "Saving..." : "Save"}
              </button>
            </div>
          </form>
        )}
      </div>

      {/* Zone/area overrides */}
      <div className="space-y-4">
        <div>
          <h2 className="text-xl font-semibold text-gray-900">
            Dhaka Zone/Area Overrides
          </h2>
          <p className="mt-1 text-sm text-gray-500">
            Set a fixed shipping charge for a specific Dhaka zone, or for one
            area within a zone. Area overrides take priority over zone
            overrides, which take priority over the Inside Dhaka charge above.
          </p>
        </div>

        <form
          onSubmit={addRate}
          className="grid gap-3 rounded-lg border border-gray-200 bg-gray-50 p-4 md:grid-cols-[1fr_1fr_8rem_auto]"
        >
          <select
            value={rateForm.zone}
            onChange={(e) =>
              setRateForm({ zone: e.target.value, area: "", charge: "" })
            }
            className="rounded border border-gray-300 px-3 py-2"
          >
            <option value="">Select zone...</option>
            {zoneNames.map((zone) => (
              <option key={zone} value={zone}>
                {zone}
              </option>
            ))}
          </select>
          <select
            value={rateForm.area}
            onChange={(e) =>
              setRateForm((p) => ({ ...p, area: e.target.value }))
            }
            disabled={!rateForm.zone}
            className="rounded border border-gray-300 px-3 py-2 disabled:bg-gray-100"
          >
            <option value="">Whole zone (all areas)</option>
            {areasForSelectedZone.map((area) => (
              <option key={area} value={area}>
                {area}
              </option>
            ))}
          </select>
          <input
            type="number"
            step="0.01"
            value={rateForm.charge}
            onChange={(e) =>
              setRateForm((p) => ({ ...p, charge: e.target.value }))
            }
            className="rounded border border-gray-300 px-3 py-2"
            placeholder="Charge"
          />
          <button
            type="submit"
            disabled={rateSaving}
            className="rounded bg-indigo-600 px-4 py-2 text-sm font-semibold text-white disabled:opacity-60"
          >
            {rateSaving ? "Adding..." : "Add"}
          </button>
        </form>

        {ratesLoading ? (
          <div className="py-8 text-center text-gray-500">Loading...</div>
        ) : (
          <div className="overflow-hidden rounded-lg border border-gray-200">
            <div className="overflow-x-auto">
              <table className="w-full text-left text-sm">
                <thead className="bg-gray-50 text-gray-600">
                  <tr>
                    <th className="px-4 py-3">Zone</th>
                    <th className="px-4 py-3">Area</th>
                    <th className="px-4 py-3">Charge (৳)</th>
                    <th className="px-4 py-3">Active</th>
                    <th className="px-4 py-3 text-right">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {rates.map((item) => (
                    <tr key={item._id}>
                      <td className="px-4 py-3 font-medium text-gray-900">
                        {item.zone}
                      </td>
                      <td className="px-4 py-3 text-gray-600">
                        {item.area || (
                          <span className="italic text-gray-400">
                            whole zone
                          </span>
                        )}
                      </td>
                      <td className="px-4 py-3">
                        <input
                          type="number"
                          step="0.01"
                          defaultValue={item.charge}
                          onBlur={(e) => {
                            const v = e.target.value;
                            if (v !== "" && Number(v) !== item.charge) {
                              updateRateCharge(item, v);
                            }
                          }}
                          className="w-24 rounded border border-gray-300 px-2 py-1"
                        />
                      </td>
                      <td className="px-4 py-3">
                        <button
                          type="button"
                          onClick={() => toggleRateActive(item)}
                          className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                            item.isActive
                              ? "bg-green-100 text-green-700"
                              : "bg-gray-100 text-gray-500"
                          }`}
                        >
                          {item.isActive ? "Active" : "Inactive"}
                        </button>
                      </td>
                      <td className="px-4 py-3 text-right">
                        {user?.role === "admin" && (
                          <button
                            type="button"
                            onClick={() => deleteRate(item._id)}
                            className="rounded border border-red-300 px-3 py-1.5 text-sm text-red-600"
                          >
                            Delete
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}
                  {!rates.length && (
                    <tr>
                      <td
                        colSpan={5}
                        className="px-4 py-8 text-center text-gray-500"
                      >
                        No zone/area overrides yet.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
