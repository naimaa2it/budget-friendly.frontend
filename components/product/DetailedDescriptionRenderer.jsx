"use client";

const normalizeBlocks = (value) => {
  if (Array.isArray(value) && value.length > 0) return value;
  if (typeof value === "string" && value.trim())
    return [{ id: "legacy", type: "text", content: value, align: "left" }];
  return [];
};

export default function DetailedDescriptionRenderer({ value }) {
  const blocks = normalizeBlocks(value);
  if (!blocks.length) return null;

  return (
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
            <div key={block.id || i} className="w-full">
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
            cols <= 1 ? "grid-cols-1"
            : cols === 2 ? "grid-cols-2"
            : cols === 3 ? "grid-cols-3"
            : "grid-cols-4";
          return (
            <div key={block.id || i} className={`grid gap-0 ${gridClass}`}>
              {imgs.map((img, idx) => (
                // eslint-disable-next-line @next/next/no-img-element
                <img
                  key={idx}
                  src={img.url}
                  alt={img.alt || ""}
                  className="w-full h-auto object-cover"
                  loading="lazy"
                />
              ))}
            </div>
          );
        }

        return null;
      })}
    </section>
  );
}
