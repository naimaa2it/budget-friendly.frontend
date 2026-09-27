"use client";

import React, { useEffect, useState, useMemo } from "react";
import Image from "next/image";
import { FaTimes, FaPlus } from "react-icons/fa";
import { useCart } from "@/components/context/CartContext";

// A variation type may be named "Color", "Colors", "Colour", "Size", "Sizes",
// etc. The denormalized v.color.name / v.size fields are the primary source,
// but fall back to the matching attributes key (case/plural tolerant) so
// variants still render even when the type was named in the plural.
const COLOR_KEY_RE = /^colou?rs?$/i;
const SIZE_KEY_RE = /^sizes?$/i;

const attrValueByKey = (attributes, keyRe) => {
  const entry = Object.entries(attributes || {}).find(([key]) =>
    keyRe.test(String(key).trim()),
  );
  const value = entry?.[1];
  return value == null ? "" : String(value).trim();
};

export function variantColorName(v) {
  return v?.color?.name?.trim() || attrValueByKey(v?.attributes, COLOR_KEY_RE);
}

export function variantSizeValue(v) {
  return v?.size?.trim() || attrValueByKey(v?.attributes, SIZE_KEY_RE);
}

// Extract unique colors from variants (optionally filtered by size)
// filterBySize can be a string like "L" or "16 inch"
export function getVariantColors(product, filterBySize = null) {
  if (!product.variants?.length) return [];
  const colors = [];
  const seen = new Set();

  // Normalize filterBySize - it should be a string
  const filterSize =
    typeof filterBySize === "string"
      ? filterBySize?.trim()?.toLowerCase()
      : null;

  for (const v of product.variants) {
    const colorName = variantColorName(v);
    const variantSize = variantSizeValue(v)?.toLowerCase();

    // If filtering by size, only include colors that have this size
    if (filterSize && variantSize && variantSize !== filterSize) continue;

    if (colorName && !seen.has(colorName.toLowerCase())) {
      seen.add(colorName.toLowerCase());
      colors.push({
        name: colorName,
        hex: v.color?.hex || "#ccc",
        image: v.image || null,
      });
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
  if (typeof filterByColor === "string") {
    filterColor = filterByColor?.trim()?.toLowerCase();
  } else if (
    filterByColor &&
    typeof filterByColor === "object" &&
    filterByColor.name
  ) {
    filterColor = filterByColor.name?.trim()?.toLowerCase();
  }

  for (const v of product.variants) {
    const size = variantSizeValue(v);
    const variantColor = variantColorName(v)?.toLowerCase();

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

  // Match using the tolerant readers (color.name/size with attributes fallback).
  return (
    product.variants.find((v) => {
      const variantColor = variantColorName(v)?.toLowerCase();
      const variantSize = variantSizeValue(v)?.toLowerCase();
      const selectedColor = color?.trim()?.toLowerCase();
      const selectedSize = size?.trim()?.toLowerCase();

      // If variant has color, it must match (or selected color is empty)
      const colorMatches =
        !variantColor || !selectedColor || variantColor === selectedColor;
      // If variant has size, it must match (or selected size is empty)
      const sizeMatches =
        !variantSize || !selectedSize || variantSize === selectedSize;

      // At least one of them must be specified and match
      const hasMatch =
        (variantColor && selectedColor && variantColor === selectedColor) ||
        (variantSize && selectedSize && variantSize === selectedSize);

      return hasMatch && colorMatches && sizeMatches;
    }) || null
  );
}

// Get effective unit price given selected color + size
// Falls back to base product price if variant has no price or no variant matched
export function resolveVariantPrice(product, color, size) {
  const v = resolveVariant(product, color, size);
  const price = v?.price;
  return price != null && price > 0 ? price : (product.price ?? 0);
}

// Any variant attribute key besides Color/Size (e.g. "Type", "Material") is a
// generic, independent variant group — its options are never combined with
// Color/Size or with each other, each is its own standalone row.
export function getVariantExtraGroups(product) {
  if (!product?.variants?.length) return [];
  const order = [];
  const byName = new Map();

  for (const v of product.variants) {
    const attrs = v.attributes || {};
    Object.entries(attrs).forEach(([key, value]) => {
      if (!value || COLOR_KEY_RE.test(key) || SIZE_KEY_RE.test(key)) return;
      if (!byName.has(key)) {
        byName.set(key, { options: [], seen: new Set() });
        order.push(key);
      }
      const group = byName.get(key);
      const val = String(value).trim();
      const lower = val.toLowerCase();
      if (val && !group.seen.has(lower)) {
        group.seen.add(lower);
        group.options.push({ value: val, image: v.image || null });
      }
    });
  }

  return order.map((name) => ({ name, options: byName.get(name).options }));
}

// Resolve the single standalone row for a generic group (e.g. Type=Charging).
export function resolveExtraVariant(product, groupName, value) {
  if (!product?.variants?.length || !groupName || !value) return null;
  const target = String(value).trim().toLowerCase();
  return (
    product.variants.find((v) => {
      const attrs = v.attributes || {};
      const key = Object.keys(attrs).find(
        (k) => k.toLowerCase() === groupName.toLowerCase(),
      );
      if (!key) return false;
      return String(attrs[key]).trim().toLowerCase() === target;
    }) || null
  );
}

// ── Multi-dimensional (combined) variant helpers ──────────────────────────────
// A product's variants each carry a full attributes map (e.g.
// { Color: "White", Type: "8 Pin" }). These helpers let a shopper pick one
// option per group and resolve the single variant matching the WHOLE combo,
// instead of the older "one generic group only, never combined" behaviour.

// Normalised attribute map for a variant: explicit attributes plus Color/Size
// synthesised from the denormalised color.name / size fields when the attributes
// map omits them.
export function variantAttrMap(v) {
  const map = {};
  Object.entries(v?.attributes || {}).forEach(([k, val]) => {
    const s = val == null ? "" : String(val).trim();
    if (s) map[k] = s;
  });
  const colorName = variantColorName(v);
  if (colorName && !Object.keys(map).some((k) => COLOR_KEY_RE.test(k))) {
    map.Color = colorName;
  }
  const sizeVal = variantSizeValue(v);
  if (sizeVal && !Object.keys(map).some((k) => SIZE_KEY_RE.test(k))) {
    map.Size = sizeVal;
  }
  return map;
}

// All selectable groups across a product's variants, in first-seen order.
// Color groups carry hex; every option carries its linked image when set.
export function getVariantGroups(product) {
  if (!product?.variants?.length) return [];
  const order = [];
  const byName = new Map();
  for (const v of product.variants) {
    const map = variantAttrMap(v);
    for (const [key, val] of Object.entries(map)) {
      if (!byName.has(key)) {
        byName.set(key, new Map());
        order.push(key);
      }
      const opts = byName.get(key);
      const lower = val.toLowerCase();
      if (!opts.has(lower)) {
        opts.set(lower, {
          value: val,
          image: v.image || null,
          hex: COLOR_KEY_RE.test(key) ? v.color?.hex || null : null,
        });
      }
    }
  }
  return order.map((name) => ({
    name,
    isColor: COLOR_KEY_RE.test(name),
    isSize: SIZE_KEY_RE.test(name),
    options: [...byName.get(name).values()],
  }));
}

// True when at least one variant combines 2+ groups (e.g. Color + Type). Such
// products use the combined N-dimensional selection; single-key products keep
// the legacy standalone behaviour.
export function isComboVariantProduct(product) {
  return (product?.variants || []).some(
    (v) => Object.keys(variantAttrMap(v)).length >= 2,
  );
}

// Find the single variant matching ALL selected attributes (case-insensitive).
// `selected` is a plain map { groupName: value }; blank values are ignored.
export function resolveVariantByAttrs(product, selected) {
  if (!product?.variants?.length) return null;
  const entries = Object.entries(selected || {}).filter(
    ([, val]) => val != null && String(val).trim(),
  );
  if (!entries.length) return null;
  return (
    product.variants.find((v) => {
      const map = variantAttrMap(v);
      const keys = Object.keys(map);
      return entries.every(([g, val]) => {
        const k = keys.find((x) => x.toLowerCase() === g.toLowerCase());
        return k && map[k].toLowerCase() === String(val).trim().toLowerCase();
      });
    }) || null
  );
}

// Lower-cased set of values still available for `groupName` given the current
// picks in the OTHER groups — used to disable impossible combinations.
export function getAvailableValues(product, groupName, selected) {
  const others = Object.entries(selected || {}).filter(
    ([g, val]) =>
      g.toLowerCase() !== groupName.toLowerCase() &&
      val != null &&
      String(val).trim(),
  );
  const available = new Set();
  for (const v of product?.variants || []) {
    const map = variantAttrMap(v);
    const keys = Object.keys(map);
    const okOthers = others.every(([g, val]) => {
      const k = keys.find((x) => x.toLowerCase() === g.toLowerCase());
      return k && map[k].toLowerCase() === String(val).trim().toLowerCase();
    });
    if (!okOthers) continue;
    const k = keys.find((x) => x.toLowerCase() === groupName.toLowerCase());
    if (k) available.add(map[k].toLowerCase());
  }
  return available;
}

// Get effective compare at price given selected color + size
export function resolveVariantComparePrice(product, color, size) {
  const v = resolveVariant(product, color, size);
  const comparePrice = v?.compareAtPrice;
  return comparePrice != null && comparePrice > 0
    ? comparePrice
    : (product.compareAtPrice ?? null);
}

export default function VariantEditModal({
  item,
  onSave,
  onClose,
  mode = "edit",
}) {
  const { quantity } = item;
  const [product, setProduct] = useState(item.product);
  const { addToCart } = useCart();
  const [selColor, setSelColor] = useState(
    mode === "add" ? null : item.selectedColor || null,
  );
  const [selSize, setSelSize] = useState(
    mode === "add" ? null : item.selectedSize || null,
  );
  // Generic-group selections (e.g. { Type: "8 Pin" }) — combinable with
  // Color/Size and with each other.
  const [selExtras, setSelExtras] = useState(() => {
    if (mode === "add") return {};
    if (item.selectedAttributes) return { ...item.selectedAttributes };
    if (item.selectedAttr?.groupName) {
      return { [item.selectedAttr.groupName]: item.selectedAttr.value };
    }
    return {};
  });
  const [qty, setQty] = useState(mode === "add" ? 1 : quantity);

  useEffect(() => {
    if (product?.variants?.length) return;
    const id = product?._id || product?.id;
    if (!id) return;
    let mounted = true;
    const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
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
  const availableColors = useMemo(
    () => (selSize ? getVariantColors(product, selSize) : allColors),
    [product, selSize, allColors],
  );

  const availableSizes = useMemo(
    () => (selColor ? getVariantSizes(product, selColor) : allSizes),
    [product, selColor, allSizes],
  );

  const extraGroups = useMemo(() => getVariantExtraGroups(product), [product]);

  // Combined selection across Color, Size and each generic group.
  const selectedAttrMap = {};
  if (selColor) selectedAttrMap.Color = selColor;
  if (selSize) selectedAttrMap.Size = selSize;
  Object.entries(selExtras).forEach(([g, v]) => {
    if (v) selectedAttrMap[g] = v;
  });

  const comboVariant = resolveVariantByAttrs(product, selectedAttrMap);
  const colorSizeVariant =
    selColor || selSize ? resolveVariant(product, selColor, selSize) : null;
  const selectedVariant = comboVariant || colorSizeVariant;
  const price =
    selectedVariant?.price != null && selectedVariant.price > 0
      ? selectedVariant.price
      : resolveVariantPrice(product, selColor, selSize);
  const hasColors = allColors.length > 0; // Use allColors to check if product has any colors
  const hasSizes = allSizes.length > 0; // Use allSizes to check if product has any sizes
  const hasExtra = extraGroups.length > 0;
  const image = product.images?.[0]?.url;
  const variantStr = [
    selColor,
    selSize,
    ...Object.entries(selExtras)
      .filter(([, v]) => v)
      .map(([g, v]) => `${g}: ${v}`),
  ]
    .filter(Boolean)
    .join(" / ");

  // Groups are combinable — picking one no longer clears the others.
  const pickColor = (c) => setSelColor(c);
  const pickSize = (s) => setSelSize(s);
  const pickAttr = (groupName, value) =>
    setSelExtras((prev) => ({ ...prev, [groupName]: value }));

  const cleanExtras = () =>
    Object.fromEntries(Object.entries(selExtras).filter(([, v]) => v));

  const handleSave = () => {
    onSave(selColor, selSize, selectedVariant, qty, cleanExtras());
  };

  const handleAddMore = () => {
    addToCart(product, qty, {
      selectedColor: selColor,
      selectedSize: selSize,
      selectedAttributes: cleanExtras(),
      selectedVariant,
      silent: true, // Don't show FBT modal when adding more variants
    });
    onClose();
  };

  const isAddMode = mode === "add";
  const modalTitle = isAddMode ? "Add Another Variant" : "Edit Option";

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
          <button
            onClick={onClose}
            className="p-1 text-gray-500 hover:text-gray-800"
          >
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
              <p className="font-semibold text-sm text-gray-900 leading-snug">
                {product.title}
              </p>
              {variantStr && (
                <p className="text-xs text-gray-500 mt-0.5">{variantStr}</p>
              )}
              <p className="text-lg font-bold mt-1 text-red-600">
                ৳{price.toFixed(2)}
              </p>

              {/* Quantity */}
              <div className="flex items-center gap-2 mt-2">
                <span className="text-xs text-gray-500">Qty:</span>
                <button
                  onClick={() => setQty((q) => Math.max(1, q - 1))}
                  className="w-7 h-7 rounded border border-gray-300 text-gray-700 font-bold hover:bg-gray-100 flex items-center justify-center"
                >
                  −
                </button>
                <span className="w-7 text-center text-sm font-semibold">
                  {qty}
                </span>
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
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  Color:
                </span>
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
                    onClick={() => pickColor(selColor === c.name ? null : c.name)}
                    title={c.name}
                    className="flex flex-col items-center gap-1 group"
                  >
                    <span
                      style={{ backgroundColor: c.hex || "#ccc" }}
                      className={`w-10 h-10 rounded-full border-2 transition-all relative ${
                        selColor === c.name
                          ? "border-gray-900 scale-110 ring-2 ring-offset-1 ring-gray-900"
                          : "border-gray-200 hover:border-gray-400 hover:scale-105"
                      }`}
                    >
                      {selColor === c.name && (
                        <span className="absolute inset-0 flex items-center justify-center">
                          <svg
                            className="w-4 h-4 text-white drop-shadow-md"
                            fill="currentColor"
                            viewBox="0 0 20 20"
                          >
                            <path
                              fillRule="evenodd"
                              d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z"
                              clipRule="evenodd"
                            />
                          </svg>
                        </span>
                      )}
                    </span>
                    <span
                      className={`text-[10px] text-center max-w-[44px] truncate ${
                        selColor === c.name
                          ? "font-bold text-gray-900"
                          : "text-gray-500"
                      }`}
                    >
                      {c.name}
                    </span>
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Size selector */}
          {hasSizes && (
            <div>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  Size:
                </span>
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
                    onClick={() => pickSize(selSize === s ? null : s)}
                    className={`min-w-[44px] h-10 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                      selSize === s
                        ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                        : "bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50"
                    }`}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Generic variant groups (e.g. Type, Material) — standalone,
              independent of Color/Size */}
          {extraGroups.map((group) => (
            <div key={group.name}>
              <div className="flex items-center gap-2 mb-1">
                <span className="text-sm font-semibold text-gray-800">
                  {group.name}:
                </span>
                {selAttr?.groupName === group.name && (
                  <span className="text-sm text-gray-600 font-medium px-2 py-0.5 bg-gray-100 rounded">
                    {selAttr.value}
                  </span>
                )}
              </div>
              <div className="flex flex-wrap gap-2">
                {group.options.map((option, i) => {
                  const isSelected =
                    selAttr?.groupName === group.name &&
                    selAttr?.value === option.value;
                  return (
                    <button
                      key={i}
                      onClick={() =>
                        pickAttr(group.name, isSelected ? null : option.value)
                      }
                      className={`min-w-[44px] h-10 px-3 text-sm font-semibold rounded-lg border-2 transition-all ${
                        isSelected
                          ? "bg-gray-900 text-white border-gray-900 shadow-md scale-105"
                          : "bg-white text-gray-700 border-gray-200 hover:border-gray-900 hover:bg-gray-50"
                      }`}
                    >
                      {option.value}
                    </button>
                  );
                })}
              </div>
            </div>
          ))}
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
              {(hasColors || hasSizes || hasExtra) && (
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
