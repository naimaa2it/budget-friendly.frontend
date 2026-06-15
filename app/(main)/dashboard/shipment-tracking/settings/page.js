"use client";

import { useUser } from "@/components/context/UserContext";
import ShipmentTrackingSettings from "@/components/dashboard/Order/ShipmentTrackingSettings";

export default function ShipmentSettingsPage() {
  const { user } = useUser();
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">Only admins can manage shipment settings.</p>
      </div>
    );
  }
  return <ShipmentTrackingSettings />;
}
