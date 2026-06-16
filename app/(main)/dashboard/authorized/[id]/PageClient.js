"use client";

import React from 'react';
import AdminEditor from '@/components/dashboard/Admin/AdminEditor';
import { useUser } from '@/components/context/UserContext';
import { useUrlParam } from '@/hooks/useUrlParam';

export default function Page() {
  const { user } = useUser();
  const id = useUrlParam();

  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">Only admins can view this page.</p>
      </div>
    );
  }

  if (!id) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <AdminEditor adminId={id} />
    </div>
  );
}
