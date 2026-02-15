"use client";

import CustomerEditor from '@/components/dashbaord/Customer/CustomerEditor';
import React from 'react';


export default function page({ params }) {
  const id = params.id || 'new';
  return <CustomerEditor userId={id} />;
}
