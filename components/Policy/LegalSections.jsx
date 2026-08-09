"use client";

import { useStoreSettings } from '@/components/context/StoreSettingsContext';

// Shared by the Privacy and Terms pages, which only differ in which
// policyContent key they read and the intro line's wording/accent color.
export default function LegalSections({ policyKey, borderColorClass, introText }) {
  const { storeName, policyContent } = useStoreSettings();
  const sections = policyContent?.[policyKey] || [];

  if (sections.length === 0) {
    return <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>;
  }

  return (
    <>
      <p className="text-sm text-gray-600 mb-6 leading-relaxed">
        {introText(storeName)}
      </p>
      <div className="space-y-6">
        {sections.map((sec, i) => (
          <section key={i} className={`border-l-4 ${borderColorClass} pl-4`}>
            <h2 className="text-base font-semibold text-gray-800 mb-2">{sec.heading}</h2>
            <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">{sec.content}</p>
          </section>
        ))}
      </div>
    </>
  );
}
