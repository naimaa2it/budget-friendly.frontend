"use client";

import { useUser } from "@/components/context/UserContext";
import InventoryManager from "@/components/dashboard/Inventory/InventoryManager";

export default function InventoryPage() {
  const { user } = useUser();
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">Only admins can manage inventory.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Product Inventory</h1>
        <p className="text-sm text-gray-500 mt-1">Manage stock levels, set low-stock thresholds, and control overselling per product.</p>
      </div>
      <InventoryManager />
    </div>
  );
}
