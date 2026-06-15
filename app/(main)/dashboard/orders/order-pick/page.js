"use client";

import { useUser } from "@/components/context/UserContext";
import OrderPickManager from "@/components/dashboard/Order/OrderPickManager";

export default function OrderPickPage() {
  const { user } = useUser();
  if (user && !['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
      </div>
    );
  }
  return <OrderPickManager />;
}
