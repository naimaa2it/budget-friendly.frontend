"use client";

import React from 'react';

export default function QuantitySelector({ quantity, onChange, min = 1 }) {
  const dec = () => onChange(Math.max(min, quantity - 1));
  const inc = () => onChange(quantity + 1);
  return (
    <div className="flex items-center border rounded-md overflow-hidden w-24 justify-between">
      <button
        onClick={dec}
        disabled={quantity <= min}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200 disabled:opacity-50"
      >
        -
      </button>
      <span className="px-2 text-sm text-center flex-1">{quantity}</span>
      <button
        onClick={inc}
        className="px-3 py-1 bg-gray-100 hover:bg-gray-200"
      >
        +
      </button>
    </div>
  );
}
