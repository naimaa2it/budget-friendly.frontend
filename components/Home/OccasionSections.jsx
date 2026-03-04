"use client";

import React, { useEffect, useState } from 'react';
import Link from 'next/link';

export default function OccasionSections() {
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
  const [sections, setSections] = useState([]);

  useEffect(() => {
    fetch(`${API}/api/occasions`)
      .then(r => r.json())
      .then(b => setSections(b.items || []))
      .catch(() => {}); // silent fail — no occasion sections yet
  }, [API]);

  if (!sections.length) return null;

  return (
    <div className="space-y-10 px-4 md:px-8 max-w-screen-xl mx-auto py-6">
      {sections.map((section) => (
        <div key={section._id}>
          {/* Section header */}
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg md:text-xl font-bold text-gray-900">{section.title}</h2>
            {section.viewAllLink && section.viewAllLink !== '/' && (
              <Link
                href={section.viewAllLink}
                className="text-sm px-4 py-1.5 border border-gray-300 rounded-lg text-gray-600 hover:bg-gray-100 transition-colors whitespace-nowrap"
              >
                View All
              </Link>
            )}
          </div>

          {/* Cards row — horizontally scrollable on mobile */}
          <div className="flex gap-4 overflow-x-auto pb-2 snap-x snap-mandatory scrollbar-thin scrollbar-thumb-gray-300">
            {section.cards.map((card, idx) => (
              <Link
                key={card._id || idx}
                href={card.link || '#'}
                className="snap-start flex-shrink-0 w-44 sm:w-48 md:w-52 group"
              >
                <div className="border border-gray-200 rounded-xl overflow-hidden bg-white shadow-sm hover:shadow-md transition-shadow">
                  {/* Image */}
                  <div className="w-full aspect-[4/3] bg-gray-100 overflow-hidden">
                    {card.image?.url ? (
                      <img
                        src={card.image.url}
                        alt={card.label}
                        className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                      />
                    ) : (
                      <div className="w-full h-full flex items-center justify-center text-gray-300 text-3xl">🎁</div>
                    )}
                  </div>

                  {/* Subtitle */}
                  {card.subtitle && (
                    <div className="px-3 py-2 text-xs text-gray-500 text-center leading-relaxed">
                      {card.subtitle}
                    </div>
                  )}

                  {/* Label — blue pill at bottom */}
                  {card.label && (
                    <div className="bg-blue-600 text-white text-xs sm:text-sm font-semibold text-center py-2 px-2 truncate group-hover:bg-blue-700 transition-colors">
                      {card.label}
                    </div>
                  )}
                </div>
              </Link>
            ))}
          </div>
        </div>
      ))}
    </div>
  );
}
