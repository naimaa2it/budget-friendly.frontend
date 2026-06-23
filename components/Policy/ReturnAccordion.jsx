"use client";

import Accordion from './Accordion';
import { useStoreSettings } from '@/components/context/StoreSettingsContext';

export default function ReturnAccordion() {
  const { policyContent } = useStoreSettings();
  const items = policyContent?.return || [];

  return (
    <div>
      <div className="flex items-center gap-3 mb-6">
        <div className="flex items-center justify-center w-10 h-10 rounded-full bg-blue-100 text-blue-500">
          <svg xmlns="http://www.w3.org/2000/svg" className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M3 10h10a8 8 0 018 8v2M3 10l6 6m-6-6l6-6" />
          </svg>
        </div>
        <div>
          <h2 className="text-lg font-bold text-gray-800">রিটার্ন ও রিফান্ড</h2>
          <p className="text-xs text-gray-500">সহজ রিটার্ন প্রক্রিয়া ও দ্রুত রিফান্ড</p>
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
