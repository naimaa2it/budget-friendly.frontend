"use client";

import { useUser } from "@/components/context/UserContext";
import ProfitMarginManager from "@/components/dashboard/ProfitMargin/ProfitMarginManager";

export default function ProfitMarginPage() {
  const { user } = useUser();
  if (user && user.role !== "admin") {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">Only admins can view profit margins.</p>
      </div>
    );
  }
  return (
    <div>
      <div className="mb-5">
        <h1 className="text-2xl font-bold text-gray-900">Profit Margin</h1>
        <p className="text-sm text-gray-500 mt-1">
          Selling (discount) price ও cost per item (buying price + delivery +
          packaging)-এর basis-এ প্রতিটি product-এর profit margin দেখুন।
        </p>
      </div>
      <ProfitMarginManager />
    </div>
  );
}
