"use client";

import { Suspense } from 'react';
import { useUser } from '@/components/context/UserContext';
import OrdersList from '@/components/dashboard/Order/OrdersList';

export default function OrdersPage() {
  const { user } = useUser();
  if (user && !['admin', 'moderator'].includes(user.role)) {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">You need admin or moderator access to view orders.</p>
      </div>
    );
  }
  return (
    <Suspense fallback={<div className="py-20 text-center text-gray-400 text-sm">Loading…</div>}>
      <OrdersList />
    </Suspense>
  );
}
