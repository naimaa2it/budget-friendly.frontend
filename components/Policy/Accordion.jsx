"use client";

import React, { useState } from 'react';

export default function Accordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="space-y-2">
      {items.map((it, i) => (
        <div key={i} className="border border-gray-200 rounded-lg">
          <button
            onClick={() => toggle(i)}
            className="w-full flex justify-between items-center px-4 py-3 bg-gray-50 hover:bg-gray-100 font-medium"
          >
            <span>{it.question}</span>
            <svg
              className={`w-4 h-4 transform transition-transform ${openIndex === i ? 'rotate-180' : ''}`}
              fill="none"
              stroke="currentColor"
              strokeWidth="2"
              viewBox="0 0 24 24"
            >
              <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
            </svg>
          </button>
          {openIndex === i && (
            <div className="px-4 py-3 bg-white text-gray-700 text-sm">
              {it.answer}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
