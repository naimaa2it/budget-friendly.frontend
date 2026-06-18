"use client";

import { useState } from "react";

const normalizeBlocks = (value) => {
  if (Array.isArray(value) && value.length > 0) return value;
  if (typeof value === "string" && value.trim())
    return [{ id: "legacy", type: "text", content: value, align: "left" }];
  return [];
};

export default function DetailedDescriptionRenderer({ value }) {
  const blocks = normalizeBlocks(value);
  const [previewUrl, setPreviewUrl] = useState(null);

  if (!blocks.length) return null;

  return (
    <>
      <section className="w-full bg-white">
        {blocks.map((block, i) => {
          /* ── Text block ── */
          if (block.type === "text") {
            const align =
              block.align === "center"
                ? "text-center"
                : block.align === "right"
                  ? "text-right"
                  : "text-left";
            return (
              <div key={block.id || i} className="max-w-5xl mx-auto px-4 py-8">
                <div
                  className={`prose prose-base max-w-none text-gray-700 ${align}
                    [&_h1]:text-3xl [&_h1]:font-bold [&_h1]:text-gray-900 [&_h1]:mb-4
                    [&_h2]:text-2xl [&_h2]:font-bold [&_h2]:text-gray-900 [&_h2]:mb-3
                    [&_h3]:text-xl  [&_h3]:font-semibold [&_h3]:text-gray-800 [&_h3]:mb-2
                    [&_p]:mb-3 [&_p]:leading-relaxed
                    [&_ul]:list-disc [&_ul]:pl-5 [&_ul]:space-y-1
                    [&_ol]:list-decimal [&_ol]:pl-5 [&_ol]:space-y-1
                    [&_strong]:font-semibold [&_em]:italic
                    [&_a]:text-indigo-600 [&_a]:underline [&_a:hover]:text-indigo-800`}
                  dangerouslySetInnerHTML={{ __html: block.content || "" }}
                />
              </div>
            );
          }

          /* ── Full-width image ── */
          if (block.type === "image" && block.url) {
            return (
              <div
                key={block.id || i}
                className="w-full py-1 cursor-zoom-in"
                onClick={() => setPreviewUrl(block.url)}
              >
                {/* eslint-disable-next-line @next/next/no-img-element */}
                <img
                  src={block.url}
                  alt={block.alt || ""}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              </div>
            );
          }

          /* ── Side-by-side images ── */
          if (block.type === "image-row") {
            const imgs = (block.images || []).filter((img) => img?.url);
            if (!imgs.length) return null;
            const cols = block.cols || imgs.length;
            const gridClass =
              cols <= 1
                ? "grid-cols-1"
                : cols === 2
                  ? "grid-cols-2"
                  : cols === 3
                    ? "grid-cols-3"
                    : "grid-cols-4";
            return (
              <div key={block.id || i} className={`grid gap-1 ${gridClass} py-1`}>
                {imgs.map((img, idx) => (
                  <div
                    key={idx}
                    className="h-64 overflow-hidden cursor-zoom-in"
                    onClick={() => setPreviewUrl(img.url)}
                  >
                    {/* eslint-disable-next-line @next/next/no-img-element */}
                    <img
                      src={img.url}
                      alt={img.alt || ""}
                      className="w-full h-full object-cover"
                      loading="lazy"
                    />
                  </div>
                ))}
              </div>
            );
          }

          return null;
        })}
      </section>

      {/* Lightbox */}
      {previewUrl && (
        <div
          className="fixed inset-0 bg-black bg-opacity-90 flex items-center justify-center z-50 p-4"
          onClick={() => setPreviewUrl(null)}
        >
          <button
            className="absolute top-4 right-4 text-white text-3xl leading-none hover:text-gray-300"
            onClick={() => setPreviewUrl(null)}
          >
            ✕
          </button>
          {/* eslint-disable-next-line @next/next/no-img-element */}
          <img
            src={previewUrl}
            alt=""
            className="max-w-full max-h-[90vh] object-contain"
            onClick={(e) => e.stopPropagation()}
          />
        </div>
      )}
    </>
  );
}
