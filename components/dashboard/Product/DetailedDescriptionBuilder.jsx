"use client";
import { useRef, useCallback, useState } from "react";
import RichTextEditor from "@/components/dashboard/RichTextEditor";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeBlocks = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim())
    return [{ id: uid(), type: "text", content: value, align: "left" }];
  return [];
};

async function uploadFile(file) {
  const fd = new FormData();
  fd.append("file", file);
  const resp = await fetch(`${API}/api/admin/upload`, {
    method: "POST",
    body: fd,
    credentials: "include",
  });
  const body = await resp.json();
  if (!resp.ok) throw new Error(body.error || "Upload failed");
  return { url: body.asset.url, public_id: body.asset.public_id };
}

/* ── Single image slot ── */
function ImageSlot({
  image,
  onUpload,
  onRemove,
  draggable,
  onDragStart,
  onDragOver,
  onDrop,
  onDragEnd,
  isDragOver,
}) {
  const inputRef = useRef();
  const [uploading, setUploading] = useState(false);

  const handleFiles = useCallback(
    async (files) => {
      const file = files?.[0];
      if (!file || !file.type.startsWith("image/")) return;
      setUploading(true);
      try {
        const asset = await uploadFile(file);
        onUpload(asset);
      } catch (err) {
        alert(err.message || "Upload failed");
      } finally {
        setUploading(false);
      }
    },
    [onUpload],
  );

  if (image?.url) {
    return (
      <div
        className={`relative group rounded-lg overflow-hidden border-2 transition-all cursor-grab ${
          isDragOver ? "border-indigo-500 scale-95 opacity-60" : "border-transparent"
        }`}
        style={{ aspectRatio: "4/3" }}
        draggable={draggable}
        onDragStart={onDragStart}
        onDragOver={onDragOver}
        onDrop={onDrop}
        onDragEnd={onDragEnd}
      >
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={image.url}
          alt={image.alt || ""}
          className="w-full h-full object-cover"
          draggable={false}
        />
        {/* drag hint */}
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors flex items-start justify-end p-2">
          <span className="text-white text-lg opacity-0 group-hover:opacity-80 transition-opacity select-none" title="Drag to reorder">⠿</span>
        </div>
        <button
          type="button"
          onClick={onRemove}
          className="absolute top-2 right-2 bg-red-500 text-white rounded-full w-7 h-7 flex items-center justify-center text-sm opacity-0 group-hover:opacity-100 transition-opacity shadow z-10"
        >
          ✕
        </button>
      </div>
    );
  }

  return (
    <div
      className={`relative border-2 border-dashed rounded-lg bg-gray-50 flex flex-col items-center justify-center cursor-pointer hover:border-indigo-400 hover:bg-indigo-50 transition-colors ${
        isDragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      style={{ aspectRatio: "4/3", minHeight: 120 }}
      onClick={() => inputRef.current?.click()}
      onDragOver={(e) => { e.preventDefault(); onDragOver?.(e); }}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        else onDrop?.(e);
      }}
      tabIndex={0}
      onKeyDown={(e) => e.key === "Enter" && inputRef.current?.click()}
    >
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        className="sr-only"
        onChange={(e) => handleFiles(e.target.files)}
      />
      {uploading ? (
        <div className="text-sm text-indigo-600 font-medium">Uploading…</div>
      ) : (
        <>
          <svg className="w-7 h-7 text-gray-400 mb-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
          </svg>
          <p className="text-xs text-gray-500 text-center px-1">Click, drop or paste</p>
        </>
      )}
    </div>
  );
}

/* ── Image Row block (2/3/4 cols, draggable to reorder) ── */
function ImageRowBlock({ block, onPatch }) {
  const dragSrc = useRef(null);
  const [dragOverIdx, setDragOverIdx] = useState(null);

  const images = block.images || [];
  const cols = block.cols || images.length || 2;

  const setCols = (n) => {
    const cur = [...images];
    while (cur.length < n) cur.push({ url: "", public_id: "", alt: "" });
    onPatch({ cols: n, images: cur.slice(0, n) });
  };

  const patchImage = (idx, val) => {
    const imgs = [...images];
    imgs[idx] = { ...(imgs[idx] || {}), ...val };
    onPatch({ images: imgs });
  };

  const gridClass =
    cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div>
      {/* Column selector */}
      <div className="flex items-center gap-2 mb-3">
        <span className="text-xs text-gray-500 font-medium">Columns:</span>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => setCols(n)}
            className={`px-3 py-1 text-xs rounded-full border font-semibold transition ${
              cols === n
                ? "bg-indigo-600 text-white border-indigo-600"
                : "border-gray-300 text-gray-600 hover:border-indigo-400"
            }`}
          >
            {n}
          </button>
        ))}
      </div>

      <div className={`grid ${gridClass} gap-2`}>
        {images.slice(0, cols).map((img, idx) => (
          <ImageSlot
            key={idx}
            image={img}
            isDragOver={dragOverIdx === idx}
            draggable={!!img.url}
            onDragStart={() => { dragSrc.current = idx; }}
            onDragOver={(e) => { e.preventDefault(); setDragOverIdx(idx); }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverIdx(null);
              if (dragSrc.current === null || dragSrc.current === idx) return;
              const imgs = [...images];
              [imgs[dragSrc.current], imgs[idx]] = [imgs[idx], imgs[dragSrc.current]];
              dragSrc.current = null;
              onPatch({ images: imgs });
            }}
            onDragEnd={() => { dragSrc.current = null; setDragOverIdx(null); }}
            onUpload={(asset) => patchImage(idx, asset)}
            onRemove={() => patchImage(idx, { url: "", public_id: "", alt: "" })}
          />
        ))}
      </div>
    </div>
  );
}

/* ── Block wrapper ── */
function BlockWrapper({ index, total, onMoveUp, onMoveDown, onRemove, label, children }) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">{label}</span>
        <div className="flex gap-1">
          <button type="button" onClick={onMoveUp} disabled={index === 0}
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-25 transition" title="Move up">▲</button>
          <button type="button" onClick={onMoveDown} disabled={index === total - 1}
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-25 transition" title="Move down">▼</button>
          <button type="button" onClick={onRemove}
            className="p-1.5 rounded text-red-400 hover:text-red-600 transition ml-1" title="Remove block">🗑</button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ── Main builder ── */
export default function DetailedDescriptionBuilder({ value, onChange }) {
  const blocks = normalizeBlocks(value);
  const update = (b) => onChange(b);

  const addBlock = (type, extra = {}) => {
    let block;
    if (type === "text") block = { id: uid(), type: "text", content: "", align: "left" };
    else if (type === "image") block = { id: uid(), type: "image", url: "", public_id: "", alt: "" };
    else if (type === "image-row") block = { id: uid(), type: "image-row", cols: extra.cols || 2, images: Array.from({ length: extra.cols || 2 }, () => ({ url: "", public_id: "", alt: "" })) };
    update([...blocks, block]);
  };

  const removeBlock = (i) => update(blocks.filter((_, idx) => idx !== i));

  const moveBlock = (i, dir) => {
    const arr = [...blocks];
    const j = i + dir;
    if (j < 0 || j >= arr.length) return;
    [arr[i], arr[j]] = [arr[j], arr[i]];
    update(arr);
  };

  const patchBlock = (i, patch) => {
    const arr = [...blocks];
    arr[i] = { ...arr[i], ...patch };
    update(arr);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return (
            <BlockWrapper key={block.id} index={i} total={blocks.length} label="Text Block"
              onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)} onRemove={() => removeBlock(i)}>
              <div className="flex gap-1.5 mb-2">
                {["left", "center", "right"].map((a) => (
                  <button key={a} type="button" onClick={() => patchBlock(i, { align: a })}
                    className={`px-2.5 py-1 text-xs rounded border transition ${block.align === a ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"}`}>
                    {a === "left" ? "⬅ Left" : a === "center" ? "↔ Center" : "➡ Right"}
                  </button>
                ))}
              </div>
              <RichTextEditor
                value={block.content || ""}
                onChange={(html) => patchBlock(i, { content: html })}
                placeholder="Type or paste content…"
                minHeight="min-h-[100px]"
                showLinkButton
              />
            </BlockWrapper>
          );
        }

        if (block.type === "image") {
          return (
            <BlockWrapper key={block.id} index={i} total={blocks.length} label="Full-Width Image"
              onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)} onRemove={() => removeBlock(i)}>
              <div className="max-w-xl mx-auto">
                <ImageSlot
                  image={block}
                  onUpload={(asset) => patchBlock(i, asset)}
                  onRemove={() => patchBlock(i, { url: "", public_id: "" })}
                />
                {block.url && (
                  <input type="text" value={block.alt || ""} onChange={(e) => patchBlock(i, { alt: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Alt text (optional)" />
                )}
              </div>
            </BlockWrapper>
          );
        }

        if (block.type === "image-row") {
          return (
            <BlockWrapper key={block.id} index={i} total={blocks.length} label="Image Row"
              onMoveUp={() => moveBlock(i, -1)} onMoveDown={() => moveBlock(i, 1)} onRemove={() => removeBlock(i)}>
              <ImageRowBlock block={block} onPatch={(patch) => patchBlock(i, patch)} />
            </BlockWrapper>
          );
        }

        return null;
      })}

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button type="button" onClick={() => addBlock("text")}
          className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition">
          T&nbsp; Add Text
        </button>
        <button type="button" onClick={() => addBlock("image")}
          className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition">
          🖼 Full-Width Image
        </button>
        {[2, 3, 4].map((n) => (
          <button key={n} type="button" onClick={() => addBlock("image-row", { cols: n })}
            className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition">
            ⊞ {n} Images
          </button>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          No blocks yet — use the buttons above to add content.
        </p>
      )}
    </div>
  );
}
