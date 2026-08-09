"use client";

import { useStoreSettings } from '@/components/context/StoreSettingsContext';

export default function AboutSections() {
  const { storeName, policyContent } = useStoreSettings();
  const sections = policyContent?.about || [];

  if (sections.length === 0) {
    return (
      <>
        <p className="text-gray-600 mb-4">
          {storeName} brings you curated gadgets and electronics with fast
          shipping and reliable customer service. We believe everyone
          deserves access to quality tech at budget-friendly prices.
        </p>
        <p className="text-gray-600">
          Founded with a passion for technology, {storeName} is your
          one-stop destination for smartphones, accessories, and smart
          gadget essentials.
        </p>
      </>
    );
  }

  return (
    <div className="space-y-4">
      {sections.map((sec, i) => {
        // Legacy items saved before the `type` field existed default to paragraph.
        const type = sec.type || (sec.question ? "qa" : "paragraph");
        return (
          <section key={i}>
            {type === "qa" ? (
              <>
                {sec.question && (
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    {sec.question}
                  </h2>
                )}
                <p className="text-gray-600 whitespace-pre-line">
                  {sec.answer}
                </p>
              </>
            ) : (
              <>
                {sec.heading && (
                  <h2 className="text-lg font-semibold text-gray-800 mb-1">
                    {sec.heading}
                  </h2>
                )}
                <p className="text-gray-600 whitespace-pre-line">
                  {sec.content}
                </p>
              </>
            )}
          </section>
        );
      })}
    </div>
  );
}
