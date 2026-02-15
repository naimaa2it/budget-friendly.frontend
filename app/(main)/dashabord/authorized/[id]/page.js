"use client";

import React from 'react';
import AdminEditor from '@/components/dashbaord/AdminEditor';

export default function page({ params }) {
  const id = params.id || 'new';
  return (
    <div>
      <AdminEditor adminId={id} />
    </div>
  );
}
