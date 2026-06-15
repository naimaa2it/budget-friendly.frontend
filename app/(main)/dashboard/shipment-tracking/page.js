"use client";

import { Suspense } from "react";
import { useUser } from "@/components/context/UserContext";
import ShipmentTrackingManager from "@/components/dashboard/Order/ShipmentTrackingManager";

export default function ShipmentTrackingPage() {
  const { user } = useUser();
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">Only admins can manage shipment tracking.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<p className="text-center text-gray-400 py-16">Loading…</p>}>
      <ShipmentTrackingManager />
    </Suspense>
  );
}
