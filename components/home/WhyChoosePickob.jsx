"use client";

import React from "react";
import {
  FaCheckCircle,
  FaTags,
  FaShippingFast,
  FaUndoAlt,
  FaLock,
  FaHeadset,
  FaStar,
  FaGem,
  FaCommentDots,
} from "react-icons/fa";
import { useLanguage } from "@/components/context/LanguageContext";

const FEATURES = [
  {
    icon: FaCheckCircle,
    color: "text-green-500 bg-green-50",
    titleKey: "home.why_original",
    subKey: "home.why_original_sub",
  },
  {
    icon: FaUndoAlt,
    color: "text-teal-500 bg-teal-50",
    titleKey: "home.why_return",
    subKey: "home.why_return_sub",
  },
  {
    icon: FaTags,
    color: "text-rose-500 bg-rose-50",
    titleKey: "home.why_price",
    subKey: "home.why_price_sub",
  },
  {
    icon: FaLock,
    color: "text-orange-500 bg-orange-50",
    titleKey: "home.why_payment",
    subKey: "home.why_payment_sub",
  },
  {
    icon: FaShippingFast,
    color: "text-blue-500 bg-blue-50",
    titleKey: "home.why_delivery",
    subKey: "home.why_delivery_sub",
  },
  {
    icon: FaHeadset,
    color: "text-indigo-500 bg-indigo-50",
    titleKey: "home.why_support",
    subKey: "home.why_support_sub",
  },
];

const TESTIMONIALS = [
  {
    name: "Ashik Mahmud",
    nameBn: "আশিক মাহমুদ",
    location: "Dhaka",
    locationBn: "ঢাকা",
    text: "Full check delivery and the product was completely original. Pickob is the best!",
    textBn: "ফুল চেক ডেলিভারি এবং প্রোডাক্ট একদম অরিজিনাল। Pickob সেরা!",
    avatarColor: "bg-rose-100 text-rose-600",
  },
  {
    name: "Nusrat Jahan",
    nameBn: "নুসরাত জাহান",
    location: "Chattogram",
    locationBn: "চট্টগ্রাম",
    text: "Got the product much cheaper than others, plus fast delivery. Very convenient!",
    textBn: "প্রোডাক্টটা অন্যদের চেয়ে অনেক কমে পেয়েছি। সাথে ফাস্ট ডেলিভারি অসম্ভব সুবিধাজনক।",
    avatarColor: "bg-purple-100 text-purple-600",
  },
  {
    name: "Rasel Ahmed",
    nameBn: "রাসেল আহমেদ",
    location: "Khulna",
    locationBn: "খুলনা",
    text: "Amazing service and support — will definitely buy again!",
    textBn: "অসাধারণ সার্ভিস এবং সাপোর্ট। অবশ্যই আবার থেকে কিনবো!",
    avatarColor: "bg-amber-100 text-amber-600",
  },
];

function Stars() {
  return (
    <div className="flex gap-0.5 text-amber-400 text-xs my-1.5">
      {Array.from({ length: 5 }).map((_, i) => (
        <FaStar key={i} />
      ))}
    </div>
  );
}

export default function WhyChoosePickob() {
  const { t, lang } = useLanguage();

  return (
    <div className="max-w-screen-xl mx-auto px-3 md:px-6 py-4">
      <div className="flex flex-col lg:flex-row gap-4">
        {/* ── Why Choose Pickob ── */}
        <div className="lg:w-[38%] bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-sm md:text-base font-bold text-gray-900 uppercase mb-4">
            <FaGem className="text-teal-500" aria-hidden="true" />
            {t("home.why_choose_title")}
          </h2>
          <div className="grid grid-cols-2 gap-x-4 gap-y-4">
            {FEATURES.map((f) => (
              <div key={f.titleKey} className="flex items-start gap-2.5">
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center shrink-0 ${f.color}`}
                >
                  <f.icon className="w-3.5 h-3.5" aria-hidden="true" />
                </span>
                <div className="min-w-0">
                  <p className="text-xs md:text-sm font-semibold text-gray-900 leading-tight">
                    {t(f.titleKey)}
                  </p>
                  <p className="text-[11px] md:text-xs text-gray-500 mt-0.5">
                    {t(f.subKey)}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* ── What Our Customers Say ── */}
        <div className="flex-1 bg-white border border-gray-200 rounded-xl shadow-sm p-4 md:p-5">
          <h2 className="flex items-center gap-2 text-sm md:text-base font-bold text-gray-900 uppercase mb-4">
            <FaCommentDots className="text-blue-500" aria-hidden="true" />
            {t("home.customers_say_title")}
          </h2>
          <div className="grid sm:grid-cols-3 gap-3">
            {TESTIMONIALS.map((r) => (
              <div
                key={r.name}
                className="bg-gray-50 border border-gray-100 rounded-lg p-3"
              >
                <div className="flex items-center gap-2.5">
                  <span
                    className={`w-9 h-9 rounded-full flex items-center justify-center font-bold text-sm shrink-0 ${r.avatarColor}`}
                  >
                    {(lang === "bn" ? r.nameBn : r.name).charAt(0)}
                  </span>
                  <div className="min-w-0">
                    <p className="text-xs font-semibold text-gray-900 truncate">
                      {lang === "bn" ? r.nameBn : r.name}
                    </p>
                    <p className="text-[11px] text-gray-400">
                      {lang === "bn" ? r.locationBn : r.location}
                    </p>
                  </div>
                </div>
                <Stars />
                <p className="text-[11px] md:text-xs text-gray-600 leading-relaxed">
                  {lang === "bn" ? r.textBn : r.text}
                </p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
