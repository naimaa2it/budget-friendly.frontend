"use client";

import React from 'react';
import ProductCreate from './ProductCreate';
import ProductEdit from './ProductEdit';

/**
 * ProductEditor — DEPRECATED
 * The editor was split into `ProductCreate` (new) and `ProductEdit` (existing).
 * This file is kept as a tiny compatibility wrapper so accidental imports won't fail.
 * Please update imports to use `ProductCreate` or `ProductEdit` directly.
 */
export default function ProductEditor({ productId }) {
  return productId === 'new' || !productId ? <ProductCreate /> : <ProductEdit productId={productId} />;
}

