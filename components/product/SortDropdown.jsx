import React from 'react';

// reuseable sort dropdown used across product listing pages
export const SORT_OPTIONS = [
  { value: 'position', label: 'Default' },
  { value: 'newest', label: 'Newest First' },
  { value: 'oldest', label: 'Oldest First' },
  { value: 'nameAsc', label: 'Name A to Z' },
  { value: 'nameDesc', label: 'Name Z to A' },
  { value: 'priceHigh', label: 'Price High to Low' },
  { value: 'priceLow', label: 'Price Low to High' },
  { value: 'expressDelivery', label: 'Express Delivery' },
];

export default function SortDropdown({ value, onChange, options = SORT_OPTIONS, className = '' }) {
  return (
    <div className={`inline-block relative ${className}`}>      
      <select
        value={value}
        onChange={e => onChange(e.target.value)}
        className="block appearance-none w-full bg-white border border-gray-300 hover:border-gray-400 px-3 py-2 pr-8 rounded leading-tight focus:outline-none focus:ring-2 focus:ring-rose-300"
      >
        {options.map(opt => (
          <option key={opt.value} value={opt.value}>{opt.label}</option>
        ))}
      </select>
      {/* chevron icon */}
      <div className="pointer-events-none absolute inset-y-0 right-0 flex items-center px-2 text-gray-700">
        <svg className="fill-current h-4 w-4" xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20">
          <path d="M5.516 7.548L10 12.032l4.484-4.484 1.032 1.032L10 14.096 4.484 8.58z"/>
        </svg>
      </div>
    </div>
  );
}
