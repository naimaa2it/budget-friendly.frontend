"use client";

import Accordion from './Accordion';
import { useStoreSettings } from '@/components/context/StoreSettingsContext';

export default function ShippingAccordion() {
  const { policyContent } = useStoreSettings();
  const items = policyContent?.shipping || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-orange-100 text-orange-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path d="M9 17a2 2 0 11-4 0 2 2 0 014 0zM19 17a2 2 0 11-4 0 2 2 0 014 0z" />
            <path strokeLinecap="round" strokeLinejoin="round" d="M13 16V6a1 1 0 00-1-1H4a1 1 0 00-1 1v10l2 .001M13 16l2 .001M13 16H9m4 0h2m0 0h2a1 1 0 001-1v-5l-3-4H9" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">শিপিং ও ডেলিভারি</h2>
          <p className="text-xs text-gray-500">সারাবাংলাদেশে দ্রুত ও নিরাপদ ডেলিভারি</p>
        </div>
      </div>
      {items.length > 0 ? (
        <Accordion items={items} />
      ) : (
        <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
      )}
    </div>
  );
}
