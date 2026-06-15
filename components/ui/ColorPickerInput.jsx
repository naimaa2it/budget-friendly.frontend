"use client";

import React, { useState, useRef, useEffect, useCallback } from 'react';
import { HexColorPicker } from 'react-colorful';

// ── Nearest-color-name lookup ─────────────────────────────────────────────────
const NAMED_COLORS = [
  ['Black',        '#000000'], ['White',        '#ffffff'], ['Red',          '#ff0000'],
  ['Green',        '#008000'], ['Blue',         '#0000ff'], ['Yellow',       '#ffff00'],
  ['Orange',       '#ff8000'], ['Purple',       '#800080'], ['Pink',         '#ff69b4'],
  ['Brown',        '#8b4513'], ['Gray',         '#808080'], ['Cyan',         '#00ffff'],
  ['Magenta',      '#ff00ff'], ['Lime',         '#00ff00'], ['Navy',         '#001f5b'],
  ['Teal',         '#008080'], ['Maroon',       '#800000'], ['Olive',        '#808000'],
  ['Coral',        '#ff6347'], ['Salmon',       '#fa8072'], ['Gold',         '#ffd700'],
  ['Beige',        '#f5f5dc'], ['Ivory',        '#fffff0'], ['Lavender',     '#e6e6fa'],
  ['Mint',         '#98ff98'], ['Peach',        '#ffcba4'], ['Lilac',        '#c8a2c8'],
  ['Turquoise',    '#40e0d0'], ['Indigo',       '#4b0082'], ['Violet',       '#ee82ee'],
  ['Crimson',      '#dc143c'], ['Scarlet',      '#ff2400'], ['Rose',         '#ff007f'],
  ['Sky Blue',     '#87ceeb'], ['Royal Blue',   '#4169e1'], ['Steel Blue',   '#4682b4'],
  ['Forest Green', '#228b22'], ['Emerald',      '#50c878'], ['Sage',         '#bcb88a'],
  ['Tan',          '#d2b48c'], ['Khaki',        '#c3b091'], ['Sand',         '#c2b280'],
  ['Charcoal',     '#36454f'], ['Slate',        '#708090'], ['Silver',       '#c0c0c0'],
  ['Off White',    '#f8f8f0'], ['Cream',        '#fffdd0'], ['Lemon',        '#fff44f'],
  ['Amber',        '#ffbf00'], ['Rust',         '#b7410e'], ['Burgundy',     '#800020'],
  ['Fuchsia',      '#ff00ff'], ['Hot Pink',     '#ff69b4'], ['Baby Blue',    '#89cff0'],
  ['Powder Blue',  '#b0e0e6'], ['Midnight Blue','#191970'], ['Light Blue',   '#add8e6'],
  ['Dark Green',   '#006400'], ['Lime Green',   '#32cd32'], ['Olive Green',  '#6b8e23'],
  ['Light Gray',   '#d3d3d3'], ['Dark Gray',    '#a9a9a9'], ['Warm White',   '#fdf5e6'],
];

function hexToRgb(hex) {
  const h = hex.replace('#', '');
  return [
    parseInt(h.substring(0, 2), 16),
    parseInt(h.substring(2, 4), 16),
    parseInt(h.substring(4, 6), 16),
  ];
}

function colorDistance([r1, g1, b1], [r2, g2, b2]) {
  return Math.sqrt((r1-r2)**2 + (g1-g2)**2 + (b1-b2)**2);
}

function nearestColorName(hex) {
  if (!hex || hex.length < 7) return '';
  try {
    const rgb = hexToRgb(hex);
    let best = NAMED_COLORS[0][0];
    let bestDist = Infinity;
    for (const [name, h] of NAMED_COLORS) {
      const d = colorDistance(rgb, hexToRgb(h));
      if (d < bestDist) { bestDist = d; best = name; }
    }
    return best;
  } catch {
    return '';
  }
}

// ── Component ─────────────────────────────────────────────────────────────────
/**
 * ColorPickerInput
 *
 * Props:
 *   color   – { name: string, hex: string }
 *   onChange – (newColor: { name, hex }) => void
 *   onRemove – () => void  (optional)
 */
export default function ColorPickerInput({ color, onChange, onRemove }) {
  const [open, setOpen] = useState(false);
  const ref = useRef(null);

  // close on outside click
  useEffect(() => {
    const handler = (e) => { if (ref.current && !ref.current.contains(e.target)) setOpen(false); };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, []);

  const hex = color?.hex || '#000000';
  const name = color?.name || '';

  const handlePickerChange = useCallback((newHex) => {
    onChange({ hex: newHex, name: nearestColorName(newHex) });
  }, [onChange]);

  const handleHexChange = useCallback((e) => {
    const val = e.target.value;
    const full = val.startsWith('#') ? val : `#${val}`;
    onChange({ hex: full, name: /^#[0-9a-fA-F]{6}$/.test(full) ? nearestColorName(full) : name });
  }, [onChange, name]);

  const handleNameChange = useCallback((e) => {
    onChange({ hex, name: e.target.value });
  }, [onChange, hex]);

  return (
    <div className="flex gap-2 items-center w-full" ref={ref}>
      {/* Color swatch toggle */}
      <button
        type="button"
        onClick={() => setOpen(v => !v)}
        className="shrink-0 w-10 h-10 rounded-lg border-2 border-gray-300 hover:border-indigo-500 transition shadow-sm relative"
        style={{ backgroundColor: hex }}
        title="Pick color"
      >
        {open && (
          /* picker popover */
          <div
            className="absolute left-0 top-12 z-50 p-3 bg-white rounded-xl shadow-2xl border border-gray-200"
            onClick={e => e.stopPropagation()}
          >
            <HexColorPicker color={hex} onChange={handlePickerChange} style={{ width: 200, height: 160 }} />
            <div className="mt-2 flex items-center gap-2">
              <span className="text-xs text-gray-500">Hex:</span>
              <input
                type="text"
                value={hex}
                onChange={handleHexChange}
                maxLength={7}
                className="flex-1 px-2 py-1 text-xs border border-gray-300 rounded-md font-mono focus:outline-none focus:ring-1 focus:ring-indigo-400"
              />
            </div>
          </div>
        )}
      </button>

      {/* Name field */}
      <input
        type="text"
        value={name}
        onChange={handleNameChange}
        placeholder="Color name (e.g., Navy)"
        className="flex-1 px-3 py-2 border border-gray-300 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      {/* Hex field */}
      <input
        type="text"
        value={hex}
        onChange={handleHexChange}
        placeholder="#000000"
        maxLength={7}
        className="w-28 px-3 py-2 border border-gray-300 rounded-lg text-sm font-mono focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:border-transparent"
      />

      {/* Remove */}
      {onRemove && (
        <button
          type="button"
          onClick={onRemove}
          className="shrink-0 px-3 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition text-sm font-medium"
        >
          Remove
        </button>
      )}
    </div>
  );
}
