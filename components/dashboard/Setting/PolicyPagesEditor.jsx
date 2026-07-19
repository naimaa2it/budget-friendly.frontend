"use client";

import React, { useEffect, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const TABS = [
  { key: "about", label: "About Us", type: "section", icon: "ℹ️" },
  { key: "shipping", label: "শিপিং", type: "qa", icon: "🚚" },
  { key: "return", label: "রিটার্ন", type: "qa", icon: "↩️" },
  { key: "faq", label: "FAQ", type: "qa", icon: "❓" },
  { key: "privacy", label: "প্রাইভেসি", type: "section", icon: "🔒" },
  { key: "terms", label: "শর্তাবলী", type: "section", icon: "📄" },
  { key: "footer", label: "Footer", type: "custom", icon: "🦶" },
  { key: "contact", label: "Contact Page", type: "custom", icon: "📞" },
];

/* ───────────── Default Bengali content ───────────── */
const DEFAULT_CONTENT = {
  about: [
    {
      heading: "আমাদের সম্পর্কে",
      content:
        "আমরা আপনাকে বাছাইকৃত গ্যাজেট ও ইলেকট্রনিক্স দ্রুত ডেলিভারি ও নির্ভরযোগ্য কাস্টমার সার্ভিসের সাথে উপহার দিই। আমরা বিশ্বাস করি, প্রত্যেকেরই সাশ্রয়ী মূল্যে মানসম্পন্ন প্রযুক্তি পাওয়ার অধিকার আছে।",
    },
    {
      heading: "আমাদের যাত্রা",
      content:
        "প্রযুক্তির প্রতি ভালোবাসা থেকে প্রতিষ্ঠিত, আমরা স্মার্টফোন, এক্সেসরিজ এবং স্মার্ট গ্যাজেট প্রয়োজনীয় সামগ্রীর জন্য আপনার এক-স্টপ গন্তব্য।",
    },
  ],
  shipping: [
    {
      question: "ফ্রি শিপিং কি পাওয়া যায়?",
      answer:
        "হ্যাঁ! ৳১৫৯৯ বা তার বেশি কেনাকাটায় সারাদেশে সম্পূর্ণ বিনামূল্যে ডেলিভারি পাবেন।",
    },
    {
      question: "ডেলিভারি চার্জ কত?",
      answer:
        "৳১৫৯৯ এর নিচে যেকোনো অর্ডারে মাত্র ৳৬৯ ডেলিভারি চার্জ প্রযোজ্য — ঢাকার ভেতরে ও বাইরে উভয় ক্ষেত্রে।",
    },
    {
      question: "ঢাকায় ডেলিভারি পেতে কতদিন লাগে?",
      answer:
        "ঢাকা ও চট্টগ্রামের ভেতরে সাধারণত ১–২ কার্যদিবসের মধ্যে ডেলিভারি দেওয়া হয়।",
    },
    {
      question: "ঢাকার বাইরে কতদিনে ডেলিভারি পাব?",
      answer:
        "সারাদেশে ৩–৫ কার্যদিবসের মধ্যে ডেলিভারি দেওয়া হয়। হরতাল বা প্রাকৃতিক দুর্যোগে সামান্য বিলম্ব হতে পারে।",
    },
    {
      question: "bKash / Nagad / Rocket-এ পেমেন্ট করা যাবে?",
      answer:
        "হ্যাঁ! আমরা bKash, Nagad ও Rocket সহ সকল মোবাইল ব্যাংকিং সেবা সমর্থন করি। এছাড়া ক্রেডিট/ডেবিট কার্ডেও পেমেন্ট করা যাবে।",
    },
    {
      question: "ক্যাশ অন ডেলিভারি (COD) পাওয়া যায়?",
      answer:
        "হ্যাঁ! পণ্য হাতে পাওয়ার পর পেমেন্ট করার সুবিধা রয়েছে। COD-তে অর্ডার করলে পণ্য দেখে সন্তুষ্ট হয়ে পেমেন্ট করুন।",
    },
    {
      question: "ডেলিভারি ট্র্যাক করব কীভাবে?",
      answer:
        "অর্ডার শিপ হওয়ার পর আপনার ফোন নম্বরে SMS এবং ইমেইলে ট্র্যাকিং নম্বর পাঠানো হবে। সেটি দিয়ে আপনার পার্সেল ট্র্যাক করতে পারবেন।",
    },
    {
      question: "ডেলিভারি ঠিকানা পরিবর্তন করা যাবে?",
      answer:
        "হ্যাঁ, তবে অর্ডার দেওয়ার ২ ঘণ্টার মধ্যে কাস্টমার কেয়ারে যোগাযোগ করতে হবে। একবার শিপমেন্ট হয়ে গেলে ঠিকানা পরিবর্তন সম্ভব নয়।",
    },
    {
      question: "ডেলিভারি মিস হলে কী হবে?",
      answer:
        "আমাদের ডেলিভারি এজেন্ট আপনাকে কল করবে। সংযোগ না পেলে পরের কার্যদিবসে পুনরায় ডেলিভারির চেষ্টা করা হবে। পরপর ৩ বার মিস হলে অর্ডার বাতিল ও রিফান্ড প্রক্রিয়া শুরু হবে।",
    },
    {
      question: "Pickup Point থেকে পণ্য নেওয়া যাবে?",
      answer:
        "হ্যাঁ! অর্ডার করার সময় 'Click & Collect' অপশন বেছে নিলে ডেলিভারি চার্জ ছাড়াই আমাদের পয়েন্ট থেকে পণ্য সংগ্রহ করতে পারবেন।",
    },
    {
      question: "আন্তর্জাতিক ডেলিভারি কি হয়?",
      answer: "না, আমরা বর্তমানে শুধুমাত্র বাংলাদেশের ভেতরে ডেলিভারি দিচ্ছি।",
    },
    {
      question: "পণ্য কীভাবে প্যাক করা হয়?",
      answer:
        "প্রতিটি পণ্য মজবুত কার্ডবোর্ড বক্সে এবং ইনভয়েস সহ প্যাক করা হয়। ভঙ্গুর পণ্য বাড়তি বাবল র‍্যাপে সুরক্ষিত করা হয়।",
    },
  ],
  return: [
    {
      question: "কতদিনের মধ্যে পণ্য ফেরত দেওয়া যাবে?",
      answer:
        "পণ্য হাতে পাওয়ার ৩ দিনের (৭২ ঘণ্টার) মধ্যে রিটার্নের জন্য আবেদন করতে হবে। এর পরে রিটার্ন গ্রহণ করা হবে না।",
    },
    {
      question: "কোন কোন ক্ষেত্রে পণ্য ফেরত দেওয়া যাবে?",
      answer:
        "নিচের কারণে পণ্য ফেরত দেওয়া যাবে:\n• ত্রুটিপূর্ণ বা নষ্ট পণ্য\n• ভুল পণ্য ডেলিভারি\n• ক্ষতিগ্রস্ত প্যাকেজিং\n• বিজ্ঞাপনের সাথে পণ্যের মিল নেই",
    },
    {
      question: "কোন পণ্য ফেরত দেওয়া যাবে না?",
      answer:
        "নিচের পণ্যগুলো রিটার্ন করা যাবে না:\n• ব্যবহৃত বা সীল ভাঙা পণ্য\n• ডিজিটাল পণ্য ও সফটওয়্যার\n• কাস্টমাইজড পণ্য\n• ইনারওয়্যার ও হাইজিন পণ্য\n• খাদ্যপণ্য",
    },
    {
      question: "রিটার্ন কীভাবে করব?",
      answer:
        "রিটার্নের জন্য:\n১. আমাদের কাস্টমার কেয়ারে ফোন করুন\n২. পণ্যের ছবি বা ভিডিও সহ সমস্যা জানান\n৩. আমাদের টিম ২৪ ঘণ্টার মধ্যে যোগাযোগ করবে",
    },
    {
      question: "ঢাকায় কি পিক-আপ সুবিধা আছে?",
      answer:
        "হ্যাঁ! ঢাকার মধ্যে ত্রুটিপূর্ণ পণ্যের ক্ষেত্রে আমাদের এজেন্ট বিনামূল্যে বাসা থেকে পিক-আপ করবে। ঢাকার বাইরে থেকে কুরিয়ারে পাঠাতে হবে।",
    },
    {
      question: "রিটার্নের পর পণ্য কি চেক করা হয়?",
      answer:
        "হ্যাঁ, পণ্য পাওয়ার পর আমাদের QC টিম যাচাই করে। ত্রুটি প্রমাণিত হলে রিপ্লেসমেন্ট বা সম্পূর্ণ রিফান্ড দেওয়া হবে।",
    },
    {
      question: "রিফান্ড কতদিনে পাব?",
      answer:
        "পণ্য যাচাইয়ের পর ৭–১০ কার্যদিবসের মধ্যে রিফান্ড দেওয়া হবে — bKash, Nagad বা কার্ডে (যেটায় পেমেন্ট করেছিলেন)।",
    },
    {
      question: "রিটার্ন চার্জ কত?",
      answer:
        "ত্রুটিপূর্ণ পণ্যের ক্ষেত্রে রিটার্ন চার্জ সম্পূর্ণ বিনামূল্যে। কাস্টমারের ভুলে (ভুল সাইজ, মন পরিবর্তন) রিটার্নের ক্ষেত্রে কুরিয়ার চার্জ কাস্টমার বহন করবেন।",
    },
    {
      question: "ডেলিভারির পরপরই সমস্যা পেলে কী করব?",
      answer:
        "প্যাকেজ খোলার সময় ভিডিও করুন। সমস্যা দেখামাত্র ছবি/ভিডিও সহ আমাদের কাস্টমার কেয়ারে ৩ দিনের মধ্যে জানান।",
    },
  ],
  faq: [
    {
      question: "অর্ডার ট্র্যাক করব কীভাবে?",
      answer:
        "অর্ডার শিপ হলে আপনার ফোনে SMS ও ইমেইলে ট্র্যাকিং নম্বর পাঠানো হবে। 'My Orders' থেকেও রিয়েল-টাইম স্ট্যাটাস দেখতে পারবেন।",
    },
    {
      question: "অর্ডার বাতিল করা যাবে?",
      answer:
        "অর্ডার দেওয়ার ১ ঘণ্টার মধ্যে বাতিল করা যাবে। এরপর প্রসেসিং শুরু হলে বাতিল সম্ভব নয়। বাতিলের জন্য কাস্টমার কেয়ারে যোগাযোগ করুন।",
    },
    {
      question: "পণ্যগুলো কি আসল ও মানসম্পন্ন?",
      answer:
        "হ্যাঁ। আমরা শুধুমাত্র অনুমোদিত পরিবেশক ও যাচাইকৃত সরবরাহকারীদের কাছ থেকে পণ্য সংগ্রহ করি। প্রতিটি পণ্য মান নিয়ন্ত্রণ পরীক্ষায় পাস করে।",
    },
    {
      question: "ওয়ারেন্টি আছে?",
      answer:
        "নির্বাচিত পণ্যে ব্র্যান্ডের অফিশিয়াল ওয়ারেন্টি প্রযোজ্য। পণ্যের পেজে ওয়ারেন্টির বিস্তারিত তথ্য দেওয়া থাকে।",
    },
    {
      question: "ডিসকাউন্ট বা কুপন কোড কোথায় পাব?",
      answer:
        "আমাদের Facebook পেজ ও ওয়েবসাইটের প্রমো ব্যানারে নিয়মিত অফার দেওয়া হয়। নিউজলেটার সাবস্ক্রাইব করলে এক্সক্লুসিভ ডিল পাবেন।",
    },
    {
      question: "অ্যাকাউন্ট না খুলে অর্ডার করা যাবে?",
      answer:
        "হ্যাঁ, গেস্ট হিসেবেও অর্ডার করা যাবে। তবে অ্যাকাউন্ট খুললে অর্ডার ট্র্যাক, রিটার্ন এবং ভবিষ্যৎ অর্ডার আরও সহজ হবে।",
    },
    {
      question: "পেমেন্ট কি নিরাপদ?",
      answer:
        "হ্যাঁ, আমাদের সকল পেমেন্ট SSL এনক্রিপশনের মাধ্যমে নিরাপদে প্রক্রিয়া করা হয়। আপনার কার্ড বা মোবাইল ব্যাংকিং তথ্য আমাদের সার্ভারে সংরক্ষণ করা হয় না।",
    },
    {
      question: "পণ্যের স্টক শেষ হলে কী করব?",
      answer:
        "'Notify Me' বাটনে ক্লিক করুন — স্টকে আসার সাথে সাথে আপনাকে SMS/ইমেইলে জানানো হবে।",
    },
    {
      question: "কাস্টমার কেয়ারের সময় কখন?",
      answer:
        "আমাদের কাস্টমার কেয়ার সকাল ১০টা থেকে রাত ৮টা পর্যন্ত (শুক্রবার ছাড়া) সপ্তাহের ৬ দিন সেবা দিচ্ছে।",
    },
  ],
  privacy: [
    {
      heading: "আমরা কী তথ্য সংগ্রহ করি",
      content:
        "অ্যাকাউন্ট তৈরি বা অর্ডার দেওয়ার সময় আপনার নাম, ফোন নম্বর, ইমেইল, ডেলিভারি ঠিকানা এবং অর্ডার ইতিহাস সংগ্রহ করা হয়। সাইটের মান উন্নয়নের জন্য ব্যবহারের তথ্য (পেজ ভিজিট, ক্লিক) ও সংগ্রহ করা হয়।",
    },
    {
      heading: "আপনার তথ্য কীভাবে ব্যবহার করা হয়",
      content:
        "অর্ডার প্রসেস করা, ডেলিভারি নিশ্চিত করা এবং কাস্টমার সাপোর্ট দেওয়ার জন্য আপনার তথ্য ব্যবহার করা হয়। আমরা কখনো আপনার ব্যক্তিগত তথ্য তৃতীয় পক্ষের কাছে বিক্রি করি না।",
    },
    {
      heading: "কুকিজ নীতি",
      content:
        "আমরা লগইন সেশন ও পছন্দ সংরক্ষণের জন্য প্রয়োজনীয় কুকিজ ব্যবহার করি। অ্যানালিটিক্স কুকিজ শুধুমাত্র আপনার সম্মতিতে ব্যবহার করা হয়।",
    },
    {
      heading: "তথ্য সুরক্ষা",
      content:
        "আপনার সকল তথ্য SSL এনক্রিপশন প্রযুক্তিতে সুরক্ষিত রাখা হয়। আমাদের সার্ভার নিয়মিত নিরাপত্তা অডিটের মধ্য দিয়ে যায়। পেমেন্ট তথ্য কোনো অবস্থায় আমাদের সার্ভারে সংরক্ষণ করা হয় না।",
    },
    {
      heading: "আপনার অধিকার",
      content:
        "আপনি যেকোনো সময় আমাদের সাপোর্ট টিমের সাথে যোগাযোগ করে আপনার ব্যক্তিগত তথ্য দেখা, সংশোধন করা বা মুছে ফেলার অনুরোধ করতে পারবেন।",
    },
    {
      heading: "পরিবর্তনের বিজ্ঞপ্তি",
      content:
        "এই গোপনীয়তা নীতিতে কোনো পরিবর্তন আনা হলে ওয়েবসাইটে এবং নিবন্ধিত ইমেইলে আপনাকে জানানো হবে।",
    },
  ],
  terms: [
    {
      heading: "সাইট ব্যবহারের শর্ত",
      content:
        "Pickob BD ব্যবহার করতে আপনার বয়স কমপক্ষে ১৮ বছর হতে হবে। আপনি অননুমোদিতভাবে সাইটে প্রবেশ বা অপব্যবহার করবেন না বলে সম্মত হচ্ছেন।",
    },
    {
      heading: "অর্ডার ও মূল্য নির্ধারণ",
      content:
        "সকল মূল্য বাংলাদেশি টাকায় (BDT) নির্ধারিত। মূল্য ত্রুটি বা অস্বাভাবিক পরিস্থিতিতে আমরা যেকোনো অর্ডার বাতিল করার অধিকার রাখি। অর্ডার কনফার্মেশনের পর চূড়ান্ত মূল্য নির্ধারিত হয়।",
    },
    {
      heading: "পেমেন্ট নীতি",
      content:
        "আমরা bKash, Nagad, Rocket, ক্রেডিট/ডেবিট কার্ড এবং ক্যাশ অন ডেলিভারি (COD) গ্রহণ করি। সকল পেমেন্ট নিরাপদ এনক্রিপশনের মাধ্যমে প্রক্রিয়া করা হয়।",
    },
    {
      heading: "ডেলিভারি ও রিটার্ন",
      content:
        "ডেলিভারি ও রিটার্ন সংক্রান্ত বিস্তারিত আমাদের শিপিং পলিসি ও রিটার্ন পলিসি পেজে দেওয়া আছে। উক্ত নীতিগুলো এই শর্তাবলীর অংশ হিসেবে গণ্য হবে।",
    },
    {
      heading: "মেধাস্বত্ব",
      content:
        "এই সাইটের সকল কনটেন্ট — লোগো, ছবি, লেখা — Pickob BD-এর মালিকানাধীন। লিখিত অনুমতি ছাড়া পুনরুৎপাদন বা বাণিজ্যিক ব্যবহার নিষিদ্ধ।",
    },
    {
      heading: "দায় সীমাবদ্ধতা",
      content:
        "Pickob BD সাইট ব্যবহার বা ক্রয়কৃত পণ্য থেকে সৃষ্ট পরোক্ষ বা আনুষঙ্গিক ক্ষতির জন্য দায়ী নয়। তৃতীয় পক্ষের কুরিয়ার সার্ভিসের কারণে ডেলিভারিতে বিলম্বের জন্য আমরা দায়ী নই।",
    },
    {
      heading: "শর্তাবলী পরিবর্তন",
      content:
        "আমরা যেকোনো সময় এই শর্তাবলী পরিবর্তন করার অধিকার রাখি। পরিবর্তনের পরও সাইট ব্যবহার অব্যাহত রাখলে আপনি নতুন শর্তাবলী মেনে নিয়েছেন বলে গণ্য হবে।",
    },
  ],
};
/* ─────────────────────────────────────────────────── */

function QAEditor({ items, onChange }) {
  const add = () => onChange([...items, { question: "", answer: "" }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    onChange(
      items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative"
        >
          <span className="absolute top-3 left-3 text-xs text-gray-400 font-mono">
            #{i + 1}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs"
          >
            ✕ মুছুন
          </button>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                প্রশ্ন
              </label>
              <input
                value={item.question}
                onChange={(e) => update(i, "question", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="প্রশ্ন লিখুন…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                উত্তর
              </label>
              <textarea
                value={item.answer}
                onChange={(e) => update(i, "answer", e.target.value)}
                rows={4}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-y"
                placeholder="উত্তর লিখুন…"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl py-3 text-sm transition"
      >
        + নতুন প্রশ্ন যোগ করুন
      </button>
    </div>
  );
}

function SectionEditor({ items, onChange }) {
  const add = () => onChange([...items, { heading: "", content: "" }]);
  const remove = (i) => onChange(items.filter((_, idx) => idx !== i));
  const update = (i, field, value) =>
    onChange(
      items.map((it, idx) => (idx === i ? { ...it, [field]: value } : it)),
    );

  return (
    <div className="space-y-4">
      {items.map((item, i) => (
        <div
          key={i}
          className="border border-gray-200 rounded-xl p-4 bg-gray-50 relative"
        >
          <span className="absolute top-3 left-3 text-xs text-gray-400 font-mono">
            #{i + 1}
          </span>
          <button
            type="button"
            onClick={() => remove(i)}
            className="absolute top-3 right-3 text-red-400 hover:text-red-600 text-xs"
          >
            ✕ মুছুন
          </button>
          <div className="mt-4 space-y-2">
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                শিরোনাম
              </label>
              <input
                value={item.heading}
                onChange={(e) => update(i, "heading", e.target.value)}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400"
                placeholder="বিভাগের শিরোনাম লিখুন…"
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 mb-1">
                বিষয়বস্তু
              </label>
              <textarea
                value={item.content}
                onChange={(e) => update(i, "content", e.target.value)}
                rows={5}
                className="w-full border border-gray-200 rounded-lg px-3 py-2 text-sm focus:outline-none focus:border-indigo-400 resize-y"
                placeholder="বিষয়বস্তু লিখুন…"
              />
            </div>
          </div>
        </div>
      ))}
      <button
        type="button"
        onClick={add}
        className="w-full border-2 border-dashed border-gray-300 hover:border-indigo-400 text-gray-500 hover:text-indigo-600 rounded-xl py-3 text-sm transition"
      >
        + নতুন বিভাগ যোগ করুন
      </button>
    </div>
  );
}

const EMPTY_SITE_INFO = {
  footerInfo: { phone: "", email: "", address: "" },
  contactInfo: { phone: "", email: "", address: "" },
  socialLinks: {},
  footerLinks: { quickLinks: [], customerService: [] },
};

const INPUT =
  "w-full border border-gray-200 px-3 py-2 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300";

const SOCIAL_PLATFORMS = [
  {
    key: "facebook",
    label: "Facebook",
    color: "#1877F2",
    placeholder: "https://facebook.com/yourpage",
  },
  {
    key: "instagram",
    label: "Instagram",
    color: "#E1306C",
    placeholder: "https://instagram.com/yourprofile",
  },
  {
    key: "twitter",
    label: "Twitter / X",
    color: "#000000",
    placeholder: "https://twitter.com/yourhandle",
  },
  {
    key: "tiktok",
    label: "TikTok",
    color: "#010101",
    placeholder: "https://tiktok.com/@yourprofile",
  },
  {
    key: "youtube",
    label: "YouTube",
    color: "#FF0000",
    placeholder: "https://youtube.com/@yourchannel",
  },
];

function FooterEditor({
  footerInfo,
  socialLinks,
  footerLinks,
  setFooter,
  setSocial,
  setFooterLinks,
}) {
  return (
    <div className="space-y-6">
      {/* Contact info */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">
          ফুটার — যোগাযোগ তথ্য
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ফোন নম্বর
            </label>
            <input
              value={footerInfo?.phone || ""}
              onChange={(e) => setFooter("phone", e.target.value)}
              className={INPUT}
              placeholder="+880 1700-000000"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ইমেইল
            </label>
            <input
              value={footerInfo?.email || ""}
              onChange={(e) => setFooter("email", e.target.value)}
              className={INPUT}
              placeholder="info@example.com"
            />
          </div>
          <div className="sm:col-span-2">
            <label className="block text-xs font-medium text-gray-600 mb-1">
              ঠিকানা
            </label>
            <input
              value={footerInfo?.address || ""}
              onChange={(e) => setFooter("address", e.target.value)}
              className={INPUT}
              placeholder="Mirpur, Dhaka-1216, Bangladesh"
            />
          </div>
        </div>
      </div>

      {/* Social links */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">
          সোশ্যাল মিডিয়া লিংক
        </p>
        <div className="space-y-2">
          {SOCIAL_PLATFORMS.map(({ key, label, color, placeholder }) => {
            const link = socialLinks?.[key] || {};
            return (
              <div
                key={key}
                className="flex items-center gap-3 px-3 py-2.5 border border-gray-200 rounded-lg bg-gray-50"
              >
                <span
                  className="w-3 h-3 rounded-full shrink-0"
                  style={{ backgroundColor: color }}
                />
                <span className="text-xs font-medium text-gray-700 w-20 shrink-0">
                  {label}
                </span>
                <input
                  type="url"
                  value={link.url || ""}
                  onChange={(e) => setSocial(key, "url", e.target.value)}
                  className="flex-1 border border-gray-200 px-2.5 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100 focus:border-indigo-300 bg-white"
                  placeholder={placeholder}
                />
                <label className="flex items-center gap-1.5 text-xs cursor-pointer shrink-0 text-gray-600">
                  <input
                    type="checkbox"
                    checked={link.enabled !== false}
                    onChange={(e) =>
                      setSocial(key, "enabled", e.target.checked)
                    }
                    className="w-3.5 h-3.5 accent-indigo-600"
                  />
                  Show
                </label>
              </div>
            );
          })}
        </div>
      </div>

      {/* Footer nav links */}
      <div>
        <p className="text-xs font-semibold text-gray-700 mb-2">
          ফুটার নেভিগেশন লিংক
        </p>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
          {[
            { key: "quickLinks", title: "Quick Links" },
            { key: "customerService", title: "Customer Service" },
          ].map(({ key, title }) => {
            const links = footerLinks?.[key] || [];
            const setLinks = (updater) => setFooterLinks(key, updater);

            return (
              <div key={key}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-semibold text-gray-700">
                    {title}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setLinks((prev) => [...prev, { label: "", href: "" }])
                    }
                    className="flex items-center gap-1 text-xs px-2.5 py-1 bg-indigo-50 text-indigo-600 border border-indigo-200 rounded-lg hover:bg-indigo-100"
                  >
                    + Add
                  </button>
                </div>

                {links.length === 0 ? (
                  <p className="text-[11px] text-gray-400 italic py-3 text-center border border-dashed border-gray-200 rounded-lg">
                    কোনো link নেই
                  </p>
                ) : (
                  <div className="space-y-1.5">
                    {links.map((item, idx) => (
                      <div key={idx} className="flex items-center gap-1.5">
                        <input
                          value={item.label}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, label: e.target.value } : l,
                              ),
                            )
                          }
                          placeholder="Label"
                          className="w-24 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <input
                          value={item.href}
                          onChange={(e) =>
                            setLinks((prev) =>
                              prev.map((l, i) =>
                                i === idx ? { ...l, href: e.target.value } : l,
                              ),
                            )
                          }
                          onBlur={(e) => {
                            const val = e.target.value.trim();
                            if (
                              val &&
                              !val.startsWith("/") &&
                              !val.startsWith("http://") &&
                              !val.startsWith("https://")
                            ) {
                              setLinks((prev) =>
                                prev.map((l, i) =>
                                  i === idx ? { ...l, href: `/${val}` } : l,
                                ),
                              );
                            }
                          }}
                          placeholder="/path"
                          className="flex-1 border border-gray-200 px-2 py-1.5 rounded-lg text-xs focus:outline-none focus:ring-2 focus:ring-indigo-100"
                        />
                        <button
                          type="button"
                          onClick={() =>
                            setLinks((prev) => prev.filter((_, i) => i !== idx))
                          }
                          className="p-1.5 text-red-400 hover:text-red-600 border border-red-100 rounded-lg hover:bg-red-50"
                          title="Remove"
                        >
                          ✕
                        </button>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}

function ContactInfoEditor({ contactInfo, setContact }) {
  return (
    <div>
      <p className="text-xs font-semibold text-gray-700 mb-2">
        /contact পেজ — যোগাযোগ তথ্য
      </p>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            ফোন নম্বর
          </label>
          <input
            value={contactInfo?.phone || ""}
            onChange={(e) => setContact("phone", e.target.value)}
            className={INPUT}
            placeholder="+880 1700-000000"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 mb-1">
            ইমেইল
          </label>
          <input
            value={contactInfo?.email || ""}
            onChange={(e) => setContact("email", e.target.value)}
            className={INPUT}
            placeholder="support@example.com"
          />
        </div>
        <div className="sm:col-span-2">
          <label className="block text-xs font-medium text-gray-600 mb-1">
            ঠিকানা
          </label>
          <input
            value={contactInfo?.address || ""}
            onChange={(e) => setContact("address", e.target.value)}
            className={INPUT}
            placeholder="Mirpur, Dhaka-1216, Bangladesh"
          />
        </div>
      </div>
    </div>
  );
}

export default function PolicyPagesEditor() {
  const [activeTab, setActiveTab] = useState("about");
  const [policyContent, setPolicyContent] = useState({
    about: [],
    shipping: [],
    return: [],
    faq: [],
    privacy: [],
    terms: [],
  });
  const [siteInfo, setSiteInfo] = useState(EMPTY_SITE_INFO);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [toast, setToast] = useState("");

  useEffect(() => {
    fetch(`${API}/api/admin/settings`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        const s = b.settings || {};
        const pc = s.policyContent || {};
        setPolicyContent({
          about: pc.about || [],
          shipping: pc.shipping || [],
          return: pc.return || [],
          faq: pc.faq || [],
          privacy: pc.privacy || [],
          terms: pc.terms || [],
        });
        setSiteInfo({
          footerInfo: s.footerInfo || EMPTY_SITE_INFO.footerInfo,
          contactInfo: s.contactInfo || EMPTY_SITE_INFO.contactInfo,
          socialLinks: s.socialLinks || {},
          footerLinks: s.footerLinks || EMPTY_SITE_INFO.footerLinks,
        });
      })
      .catch(console.error)
      .finally(() => setLoading(false));
  }, []);

  const showToast = (msg) => {
    setToast(msg);
    setTimeout(() => setToast(""), 3000);
  };

  const save = async (data) => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings/policy`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ policyContent: data }),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || "Save failed");
      showToast("✅ সেভ হয়েছে!");
    } catch (err) {
      alert(err.message || "সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const saveSiteInfo = async (payload) => {
    setSaving(true);
    try {
      const resp = await fetch(`${API}/api/admin/settings`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      if (!resp.ok) throw new Error((await resp.json()).error || "Save failed");
      showToast("✅ সেভ হয়েছে!");
    } catch (err) {
      alert(err.message || "সেভ করতে সমস্যা হয়েছে");
    } finally {
      setSaving(false);
    }
  };

  const handleSave = () => {
    if (activeTab === "footer") {
      return saveSiteInfo({
        footerInfo: siteInfo.footerInfo,
        socialLinks: siteInfo.socialLinks,
        footerLinks: siteInfo.footerLinks,
      });
    }
    if (activeTab === "contact") {
      return saveSiteInfo({ contactInfo: siteInfo.contactInfo });
    }
    return save(policyContent);
  };

  const setFooter = (key, val) =>
    setSiteInfo((s) => ({ ...s, footerInfo: { ...s.footerInfo, [key]: val } }));

  const setContact = (key, val) =>
    setSiteInfo((s) => ({
      ...s,
      contactInfo: { ...s.contactInfo, [key]: val },
    }));

  const setSocial = (platform, field, val) =>
    setSiteInfo((s) => ({
      ...s,
      socialLinks: {
        ...(s.socialLinks || {}),
        [platform]: { ...(s.socialLinks?.[platform] || {}), [field]: val },
      },
    }));

  const setFooterLinks = (listKey, updater) =>
    setSiteInfo((s) => ({
      ...s,
      footerLinks: {
        ...(s.footerLinks || {}),
        [listKey]:
          typeof updater === "function"
            ? updater(s?.footerLinks?.[listKey] || [])
            : updater,
      },
    }));

  const handleQuickSetup = async () => {
    if (
      !confirm(
        "সব ট্যাবে বাংলা কনটেন্ট যোগ করে সেভ করা হবে। বিদ্যমান কনটেন্ট মুছে যাবে। নিশ্চিত?",
      )
    )
      return;
    setPolicyContent(DEFAULT_CONTENT);
    await save(DEFAULT_CONTENT);
  };

  const handleChange = (key, value) =>
    setPolicyContent((prev) => ({ ...prev, [key]: value }));

  const handleLoadTabDefault = () => {
    if (
      !confirm(
        `"${TABS.find((t) => t.key === activeTab)?.label}" ট্যাবে default কনটেন্ট লোড করা হবে। নিশ্চিত?`,
      )
    )
      return;
    setPolicyContent((prev) => ({
      ...prev,
      [activeTab]: DEFAULT_CONTENT[activeTab],
    }));
    showToast("Default কনটেন্ট লোড হয়েছে — সেভ করুন");
  };

  if (loading)
    return (
      <div className="text-center py-16 text-gray-400 text-sm">লোড হচ্ছে…</div>
    );

  const activeTabConfig = TABS.find((t) => t.key === activeTab);
  const totalItems = Object.values(policyContent).reduce(
    (s, a) => s + a.length,
    0,
  );

  return (
    <div className="max-w-4xl mx-auto space-y-4">
      {/* Quick Setup banner — shown when DB is empty */}
      {totalItems === 0 && (
        <div className="bg-amber-50 border border-amber-200 rounded-xl px-5 py-4 flex items-center justify-between gap-4">
          <div>
            <p className="text-sm font-semibold text-amber-800">
              কনটেন্ট এখনো যোগ করা হয়নি
            </p>
            <p className="text-xs text-amber-600 mt-0.5">
              নিচের বাটনে ক্লিক করলে সব পলিসি পেজে বাংলা কনটেন্ট একসাথে সেভ হয়ে
              যাবে।
            </p>
          </div>
          <button
            onClick={handleQuickSetup}
            disabled={saving}
            className="shrink-0 px-4 py-2 bg-amber-500 hover:bg-amber-600 text-white text-sm font-medium rounded-lg transition disabled:opacity-60"
          >
            {saving ? "সেভ হচ্ছে…" : "⚡ Quick Setup — সব কনটেন্ট যোগ করুন"}
          </button>
        </div>
      )}

      <div className="bg-white rounded-2xl shadow-sm border border-gray-100 overflow-hidden">
        {/* Header */}
        <div className="border-b border-gray-100 px-6 py-4 flex items-center justify-between">
          <div>
            <h2 className="text-lg font-semibold text-gray-800">
              Policy Pages Editor
            </h2>
            <p className="text-xs text-gray-500 mt-0.5">
              Dashboard থেকে About, Footer, Contact ও পলিসি পেজ এডিট করুন
            </p>
          </div>
          <div className="flex items-center gap-3">
            {toast && (
              <span className="text-xs text-green-700 bg-green-50 border border-green-200 px-3 py-1 rounded-full">
                {toast}
              </span>
            )}
            <button
              onClick={handleQuickSetup}
              disabled={saving}
              className="px-3 py-1.5 text-xs border border-amber-300 text-amber-700 hover:bg-amber-50 rounded-lg transition disabled:opacity-60"
            >
              ⚡ Quick Setup
            </button>
            <button
              onClick={handleSave}
              disabled={saving}
              className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
            >
              {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
            </button>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 px-4 pt-3 border-b border-gray-100 overflow-x-auto">
          {TABS.map((tab) => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              className={`px-4 py-2 text-sm font-medium rounded-t-lg whitespace-nowrap transition border-b-2 ${
                activeTab === tab.key
                  ? "border-indigo-500 text-indigo-700 bg-indigo-50"
                  : "border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50"
              }`}
            >
              {tab.icon} {tab.label}
              {tab.type !== "custom" && (
                <span className="ml-1.5 text-xs text-gray-400">
                  ({(policyContent[tab.key] || []).length})
                </span>
              )}
            </button>
          ))}
        </div>

        {/* Editor body */}
        <div className="p-6">
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <span className="text-sm font-medium text-gray-700">
                {activeTabConfig?.icon} {activeTabConfig?.label} পেজ
              </span>
              {activeTabConfig?.type !== "custom" && (
                <span className="text-xs text-gray-400 bg-gray-100 px-2 py-0.5 rounded">
                  /
                  {activeTab === "faq"
                    ? "faq"
                    : activeTab === "shipping"
                      ? "shipping"
                      : activeTab === "return"
                        ? "returns"
                        : activeTab === "about"
                          ? "about"
                          : activeTab}
                </span>
              )}
            </div>
            {activeTabConfig?.type !== "custom" && (
              <button
                onClick={handleLoadTabDefault}
                className="text-xs text-indigo-600 hover:text-indigo-800 border border-indigo-200 hover:bg-indigo-50 px-3 py-1 rounded-lg transition"
              >
                এই ট্যাবে default কনটেন্ট লোড করুন
              </button>
            )}
          </div>

          {activeTabConfig?.type === "qa" ? (
            <QAEditor
              items={policyContent[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          ) : activeTabConfig?.type === "section" ? (
            <SectionEditor
              items={policyContent[activeTab] || []}
              onChange={(val) => handleChange(activeTab, val)}
            />
          ) : activeTab === "footer" ? (
            <FooterEditor
              footerInfo={siteInfo.footerInfo}
              socialLinks={siteInfo.socialLinks}
              footerLinks={siteInfo.footerLinks}
              setFooter={setFooter}
              setSocial={setSocial}
              setFooterLinks={setFooterLinks}
            />
          ) : activeTab === "contact" ? (
            <ContactInfoEditor
              contactInfo={siteInfo.contactInfo}
              setContact={setContact}
            />
          ) : null}
        </div>

        <div className="border-t border-gray-100 px-6 py-3 bg-gray-50 flex justify-between items-center">
          {activeTabConfig?.type !== "custom" ? (
            <button
              onClick={() => {
                handleChange(activeTab, []);
                showToast("ট্যাব খালি করা হয়েছে");
              }}
              className="text-xs text-gray-400 hover:text-red-500 transition"
            >
              এই ট্যাব রিসেট করুন
            </button>
          ) : (
            <span />
          )}
          <button
            onClick={handleSave}
            disabled={saving}
            className="px-4 py-2 bg-indigo-600 hover:bg-indigo-700 disabled:opacity-60 text-white text-sm font-medium rounded-lg transition"
          >
            {saving ? "সেভ হচ্ছে…" : "সেভ করুন"}
          </button>
        </div>
      </div>
    </div>
  );
}
