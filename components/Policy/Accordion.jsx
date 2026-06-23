"use client";

import React, { useState } from 'react';

export default function Accordion({ items = [] }) {
  const [openIndex, setOpenIndex] = useState(null);
  const toggle = (i) => setOpenIndex(openIndex === i ? null : i);

  return (
    <div className="space-y-2">
      {items.map((it, i) => {
        const isOpen = openIndex === i;
        return (
          <div
            key={i}
            className={`border rounded-xl overflow-hidden transition-all duration-200 ${
              isOpen
                ? 'border-orange-400 shadow-md shadow-orange-100'
                : 'border-gray-200 hover:border-orange-300'
            }`}
          >
            <button
              onClick={() => toggle(i)}
              className={`w-full flex justify-between items-center px-4 py-3 text-left transition-colors duration-200 ${
                isOpen
                  ? 'bg-orange-50 text-orange-700'
                  : 'bg-white text-gray-700 hover:bg-gray-50'
              }`}
            >
              <span className="font-medium text-sm pr-4">{it.question}</span>
              <span
                className={`shrink-0 flex items-center justify-center w-6 h-6 rounded-full border transition-all duration-200 ${
                  isOpen
                    ? 'bg-orange-500 border-orange-500 text-white rotate-180'
                    : 'bg-white border-gray-300 text-gray-500'
                }`}
              >
                <svg
                  className="w-3 h-3 transition-transform duration-200"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2.5"
                  viewBox="0 0 24 24"
                >
                  <path strokeLinecap="round" strokeLinejoin="round" d="M19 9l-7 7-7-7" />
                </svg>
              </span>
            </button>

            <div
              className={`overflow-hidden transition-all duration-300 ease-in-out ${
                isOpen ? 'max-h-96' : 'max-h-0'
              }`}
            >
              <div className="px-4 py-3 bg-white border-t border-orange-100">
                <p className="text-sm text-gray-600 leading-relaxed whitespace-pre-line">
                  {it.answer || '—'}
                </p>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
}
