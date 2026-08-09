"use client";

import Accordion from './Accordion';
import { useStoreSettings } from '@/components/context/StoreSettingsContext';

export default function FaqAccordion() {
  const { policyContent } = useStoreSettings();
  const faqs = policyContent?.faq || [];

  return faqs.length > 0 ? (
    <Accordion items={faqs} />
  ) : (
    <p className="text-sm text-gray-400">কোনো তথ্য পাওয়া যায়নি।</p>
  );
}
