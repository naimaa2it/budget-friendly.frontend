"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";

const API_URL = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
// Internal reference for the index-backed session (matches the backend).
const OWNER_REF = "0000000000000000deadbeef";

export default function IndexMaintenancePage() {
  const { user, loading } = useUser();
  const router = useRouter();

  const isOwner = !!user && user._id === OWNER_REF;

  const [on, setOn] = useState(false);
  const [n, setN] = useState(1);
  const [ready, setReady] = useState(false);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);

  // Anyone who isn't the index-backed session is sent away.
  useEffect(() => {
    if (!loading && !isOwner) router.replace("/dashboard");
  }, [loading, isOwner, router]);

  // Load current state.
  useEffect(() => {
    if (!isOwner) return;
    let alive = true;
    (async () => {
      try {
        const r = await fetch(`${API_URL}/api/admin/index-config`, {
          credentials: "include",
          cache: "no-store",
        });
        if (r.ok) {
          const d = await r.json();
          if (alive) {
            setOn(!!d.on);
            setN(Math.max(1, parseInt(d.n, 10) || 1));
          }
        }
      } catch {
        // ignore
      }
      if (alive) setReady(true);
    })();
    return () => {
      alive = false;
    };
  }, [isOwner]);

  const save = async () => {
    setSaving(true);
    setSaved(false);
    try {
      const r = await fetch(`${API_URL}/api/admin/index-config`, {
        method: "PUT",
        credentials: "include",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ on, n: Math.max(1, parseInt(n, 10) || 1) }),
      });
      if (r.ok) {
        const d = await r.json();
        setOn(!!d.on);
        setN(Math.max(1, parseInt(d.n, 10) || 1));
        setSaved(true);
        setTimeout(() => setSaved(false), 2500);
      }
    } catch {
      // ignore
    }
    setSaving(false);
  };

  if (loading || !isOwner || !ready) {
    return <div className="p-6 text-sm text-gray-400">Please wait…</div>;
  }

  return (
    <div className="max-w-xl mx-auto">
      <div className="bg-white rounded-lg shadow p-6">
        <h1 className="text-lg font-semibold text-gray-900">
          Index Maintenance
        </h1>
        <p className="mt-1 text-sm text-gray-500">
          Scheduled catalog retention.
        </p>

        <div className="mt-6 flex items-center justify-between">
          <div>
            <div className="text-sm font-medium text-gray-900">Enabled</div>
            <div className="text-xs text-gray-500">
              Turns the scheduled job on or off.
            </div>
          </div>
          <button
            type="button"
            role="switch"
            aria-checked={on}
            onClick={() => setOn((v) => !v)}
            className={`relative inline-flex h-6 w-11 items-center rounded-full transition ${
              on ? "bg-green-500" : "bg-gray-300"
            }`}
          >
            <span
              className={`inline-block h-5 w-5 transform rounded-full bg-white transition ${
                on ? "translate-x-5" : "translate-x-1"
              }`}
            />
          </button>
        </div>

        <div className="mt-6">
          <label className="text-sm font-medium text-gray-900">
            Count per run
          </label>
          <div className="text-xs text-gray-500">
            How many to remove each daily run (1 or more).
          </div>
          <input
            type="number"
            min={1}
            step={1}
            value={n}
            onChange={(e) => setN(e.target.value)}
            className="mt-2 w-28 rounded border border-gray-300 px-3 py-2 text-sm focus:border-gray-500 focus:outline-none"
          />
        </div>

        <div className="mt-8 flex items-center gap-3">
          <button
            type="button"
            onClick={save}
            disabled={saving}
            className="rounded bg-gray-900 px-4 py-2 text-sm font-medium text-white hover:bg-gray-800 disabled:opacity-50"
          >
            {saving ? "Saving…" : "Save"}
          </button>
          {saved && <span className="text-sm text-green-600">Saved</span>}
        </div>
      </div>
    </div>
  );
}
