"use client";

import React, { useEffect, useState, useMemo } from 'react';
import Image from 'next/image';
import { FaTimes, FaPlus } from 'react-icons/fa';
import { useCart } from '@/components/context/CartContext';

// Extract unique colors from variants (optionally filtered by size)
// filterBySize can be a string like "L" or "16 inch"
export function getVariantColors(product, filterBySize = null) {
  if (!product.variants?.length) return [];
  const colors = [];
  const seen = new Set();
  
  // Normalize filterBySize - it should be a string
  const filterSize = typeof filterBySize === 'string' ? filterBySize?.trim()?.toLowerCase() : null;
  
  for (const v of product.variants) {
    const colorName = v.color?.name?.trim();
    const variantSize = v.size?.trim()?.toLowerCase();
    
    // If filtering by size, only include colors that have this size
    if (filterSize && variantSize && variantSize !== filterSize) continue;
    
    if (colorName && !seen.has(colorName.toLowerCase())) {
      seen.add(colorName.toLowerCase());
      colors.push({ name: colorName, hex: v.color?.hex || '#ccc' });
    }
  }
  return colors;
}

// Extract unique sizes from variants (optionally filtered by color)
// filterByColor can be a string like "Red" or an object {name: "Red", hex: "#ff0000"}
export function getVariantSizes(product, filterByColor = null) {
  if (!product.variants?.length) return [];
  const sizes = [];
  const seen = new Set();
  
  // Normalize filterByColor - handle both string and object {name, hex}
  let filterColor = null;
  if (typeof filterByColor === 'string') {
    filterColor = filterByColor?.trim()?.toLowerCase();
  } else if (filterByColor && typeof filterByColor === 'object' && filterByColor.name) {
    filterColor = filterByColor.name?.trim()?.toLowerCase();
  }
  
  for (const v of product.variants) {
    const size = v.size?.trim();
    const variantColor = v.color?.name?.trim()?.toLowerCase();
    
    // If filtering by color, only include sizes that have this color
    if (filterColor && variantColor && variantColor !== filterColor) continue;
    
    if (size && !seen.has(size.toLowerCase())) {
      seen.add(size.toLowerCase());
      sizes.push(size);
    }
  }
  return sizes;
}

// Find a variant that EXACTLY matches the selected color + size
// Returns null if no exact match found - will fall back to base product price
export function resolveVariant(product, color, size) {
  if (!product.variants?.length) return null;
  // If no color/size selected, don't match any variant - use base product price
  if (!color && !size) return null;
  
  // Try to find matching variant using new structure (v.color.name, v.size)
  const newStyleMatch = product.variants.find((v) => {
    const variantColor = v.color?.name?.trim()?.toLowerCase();
    const variantSize = v.size?.trim()?.toLowerCase();
    const selectedColor = color?.trim()?.toLowerCase();
    const selectedSize = size?.trim()?.toLowerCase();
    
    // If variant has color, it must match (or selected color is empty)
    const colorMatches = !variantColor || !selectedColor || variantColor === selectedColor;
    // If variant has size, it must match (or selected size is empty)
    const sizeMatches = !variantSize || !selectedSize || variantSize === selectedSize;
    
    // At least one of them must be specified and match
    const hasMatch = (variantColor && selectedColor && variantColor === selectedColor) ||
                     (variantSize && selectedSize && variantSize === selectedSize);
    
    return hasMatch && colorMatches && sizeMatches;
  });
  
  if (newStyleMatch) return newStyleMatch;
  
  // Fallback: try old structure (v.attributes.color, v.attributes.size)
  return product.variants.find((v) => {
    const a = v.attributes || {};
    const variantColor = a.color?.trim()?.toLowerCase();
    const variantSize = a.size?.trim()?.toLowerCase();
    const selectedColor = color?.trim()?.toLowerCase();
    const selectedSize = size?.trim()?.toLowerCase();
    
    const colorMatches = !variantColor || !selectedColor || variantColor === selectedColor;
    const sizeMatches = !variantSize || !selectedSize || variantSize === selectedSize;
    
    const hasMatch = (variantColor && selectedColor && variantColor === selectedColor) ||
                     (variantSize && selectedSize && variantSize === selectedSize);
    
    return hasMatch && colorMatches && sizeMatches;
  }) || null;
}

// Get effective unit price given selected color + size
// Falls back to base product price if variant has no price or no variant matched
export function resolveVariantPrice(product, color, size) {
  const v = resolveVariant(product, color, size);
  const price = v?.price;
  return (price != null && price > 0) ? price : (product.price ?? 0);
}

// Get effective compare at price given selected color + size
export function resolveVariantComparePrice(product, color, size) {
  const v = resolveVariant(product, color, size);
  const comparePrice = v?.compareAtPrice;
  return (comparePrice != null && comparePrice > 0) ? comparePrice : (product.compareAtPrice ?? null);
}

export default function VariantEditModal({ item, onSave, onClose, mode = 'edit' }) {
  const { quantity } = item;
  const [product, setProduct] = useState(item.product);
  const { addToCart } = useCart();
  const [selColor, setSelColor] = useState(mode === 'add' ? null : (item.selectedColor || null));
  const [selSize,  setSelSize]  = useState(mode === 'add' ? null : (item.selectedSize  || null));
  const [qty, setQty] = useState(mode === 'add' ? 1 : quantity);

  useEffect(() => {
    if (product?.variants?.length) return;
    const id = product?._id || product?.id;
    if (!id) return;
    let mounted = true;
    const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';
    fetch(`${API}/api/products/${id}`)
      .then((r) => r.json())
      .then((body) => {
        if (mounted && body.product) setProduct(body.product);
      })
      .catch(() => {});
    return () => {
      mounted = false;
    };
  }, [product]);

  // Get all available colors and sizes (unfiltered) for initial display
  const allColors = useMemo(() => getVariantColors(product), [product]);
  const allSizes = useMemo(() => getVariantSizes(product), [product]);
  
  // Get filtered colors/sizes based on current selection
  // When a size is selected, show only colors available for that size
  // When a color is selected, show only sizes available for that color
  const availableColors = useMemo(() => 
    selSize ? getVariantColors(product, selSize) : allColors
  , [product, selSize, allColors]);
  
  const availableSizes = useMemo(() => 
    selColor ? getVariantSizes(product, selColor) : allSizes
  , [product, selColor, allSizes]);

  const price      = resolveVariantPrice(product, selColor, selSize);
  const hasColors  = allColors.length > 0;  // Use allColors to check if product has any colors
  const hasSizes   = allSizes.length  > 0;  // Use allSizes to check if product has any sizes
  const image      = product.images?.[0]?.url;
  const variantStr = [selColor, selSize].filter(Boolean).join(' / ');

  const handleSave = () => {
    const variant = resolveVariant(product, selColor, selSize);
    onSave(selColor, selSize, variant, qty);
  };

  const handleAddMore = () => {
    const variant = resolveVariant(product, selColor, selSize);
    addToCart(product, qty, {
      selectedColor: selColor,
      selectedSize: selSize,
      selectedVariant: variant,
      silent: true // Don't show FBT modal when adding more variants
    });
    onClose();
  };

  const isAddMode = mode === 'add';
  const modalTitle = isAddMode ? 'Add Another Variant' : 'Edit Option';

  return (
    <div
      className="fixed inset-0 z-[200] flex items-center justify-center"
      onClick={onClose}
    >
      <div className="absolute inset-0 bg-black/50" />
      <div
        className="relative bg-white rounded-xl shadow-2xl w-full max-w-md mx-4 overflow-hidden"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 pt-5 pb-3 border-b border-gray-100">
          <h2 className="text-lg font-bold">{modalTitle}</h2>
          <button onClick={onClose} className="p-1 text-gray-500 hover:text-gray-800">
            <FaTimes />
          </button>
        </div>

        <div className="px-5 py-4 space-y-4">
          {/* Product summary */}
          <div className="flex gap-4">
            {image && (
              <div className="shrink-0 w-24 h-28 rounded-lg overflow-hidden border border-gray-100 bg-gray-50">
                <Image
                  src={image}
                  alt={product.title}
                  width={96}
                  height={112}
                  className="w-full h-full object-contain"
                />
              </div>
            )}
            <div className="flex-1 min-w-0">
              <p className="font-semibold text-sm text-gray-900 leading-snug">{product.title}</p>
              {variantStr && (
                <p className="text-xs text-gray-500 mt-0.5">{variantStr}</p>
              )}
              <p className="text-lg font-bold mt-1 text-red-600">৳{price.toFixed(2)}</p>

              {/* Quantity */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Qty:</span>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold">{qty}</span>
                <button
                  onClick={() => setQty((q) => q + 1)}
                  className="w-7 h-7 rounded border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center"
                >
                  +
                </button>
              </div>
            </div>
          </div>

          {/* Color selector */}
          {hasColors && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-800">Color:</span>
                {selColor && (
                  <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                    {selColor}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableColors.map((c, i) => (
                  <button
                    key={i}
                    onClick={() => setSelColor(selColor === c.name ? null : c.name)}
                    title={c.name}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <span
                      style={{ backgroundColor: c.hex || '#ccc' }}
                      className={`w-10 h-10 rounded-full border-2 transition-all relative ${
                        selColor === c.name
                          ? 'border-gray-900 scale-110 ring-2 ring-offset-1 ring-gray-900'
                          : 'border-gray-200 hover:border-gray-400 hover:scale-105'
                      }`}
                    >
                      {selColor === c.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg className="w-4 h-4 text-white drop-shadow-md" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span className={`text-[10px] text-center max-w-[44px] truncate ${
                      selColor === c.name ? 'font-bold text-gray-900' : 'text-gray-500'
                    }`}>{c.name}</span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {hasSizes && (
            <div>
              <div className="flex items-center gap-2 mb-3">
                <span className="text-sm font-semibold text-gray-800">Size:</span>
                {selSize && (
                  <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                    {selSize}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {availableSizes.map((s, i) => (
                  <button
                    key={i}
                    onClick={() => setSelSize(selSize === s ? null : s)}
                    className={`min-w-[44px] h-10 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                      selSize === s
                        ? 'bg-gray-900 text-white border-gray-900 shadow-md scale-105'
                        : 'bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50'
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-5 pb-5 space-y-2">
          {isAddMode ? (
            <button
              onClick={handleAddMore}
              className="w-full py-3 bg-green-600 text-white font-semibold rounded-lg hover:bg-green-700 transition flex items-center justify-center gap-2"
            >
              <FaPlus className="w-4 h-4" />
              Add to Cart
            </button>
          ) : (
            <>
              <button
                onClick={handleSave}
                className="w-full py-3 bg-gray-900 text-white font-semibold rounded-lg hover:bg-gray-700 transition"
              >
                Update Cart
              </button>
              {(hasColors || hasSizes) && (
                <button
                  onClick={handleAddMore}
                  className="w-full py-2.5 bg-white text-green-600 font-semibold rounded-lg border-2 border-green-600 hover:bg-green-50 transition flex items-center justify-center gap-2"
                >
                  <FaPlus className="w-3.5 h-3.5" />
                  Add More in Cart
                </button>
              )}
            </>
          )}
        </div>
      </div>
    </div>
  );
}
