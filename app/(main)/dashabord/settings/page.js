import SettingsForm from '@/components/dashboard/Setting/SettingsForm';
import React from 'react';


export default function SettingsPage(){
  return (
    <div className="max-w-6xl mx-auto">
      <div className="bg-white p-6 rounded shadow mb-6">
        <h1 className="text-xl font-semibold">Settings</h1>
        <p className="text-sm text-gray-600 mt-2">Store settings, payment providers, shipping, integrations.</p>
      </div>

      <SettingsForm />
    </div>
  );
}
