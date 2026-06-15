"use client";

import React, { useEffect, useState } from 'react';
import AdminEditor from '@/components/dashboard/Admin/AdminEditor';
import { useUser } from '@/components/context/UserContext';

export default function Page({ params }) {
  const { user } = useUser();
  const [id, setId] = useState(null);

  useEffect(() => {
    const resolveParams = async () => {
      const resolvedParams = params instanceof Promise ? await params : params;
      const adminId = resolvedParams?.id || 'new';
      setId(adminId);
    };
    resolveParams();
  }, [params]);

  if (user && user.role !== 'admin') {
    return (
      <div className="max-w-3xl mx-auto mt-12 p-6 bg-white rounded shadow text-center">
        <h2 className="text-xl font-semibold">Access denied</h2>
        <p className="mt-2 text-sm text-gray-600">Only admins can view this page.</p>
      </div>
    );
  }

  if (id === null) return <div className="p-6">Loading...</div>;

  return (
    <div>
      <AdminEditor adminId={id} />
    </div>
  );
}
