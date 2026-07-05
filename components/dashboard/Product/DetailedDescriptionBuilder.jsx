"use client";
import { useRef, useCallback, useState } from "react";
import RichTextEditor from "@/components/dashboard/RichTextEditor";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadImageDirect, MAX_UPLOAD_BYTES } from "@/lib/uploadImage";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 7)}`;

const normalizeBlocks = (value) => {
  if (Array.isArray(value)) return value;
  if (typeof value === "string" && value.trim())
    return [{ id: uid(), type: "text", content: value, align: "left" }];
  return [];
};

async function uploadFile(file) {
  return uploadImageDirect(file, "Pickob/products");
}

/* ── Single image slot ── */
function ImageSlot({
  image,
  onUpload,
  onRemove,
  onPickFromLibrary,
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
      if (file.size > MAX_UPLOAD_BYTES) {
        alert(`"${file.name}" সাইজ ${(file.size / 1024 / 1024).toFixed(1)}MB — সর্বোচ্চ ১০MB অনুমোদিত।`);
        return;
      }
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
          isDragOver
            ? "border-indigo-500 scale-95 opacity-60"
            : "border-transparent"
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
          <span
            className="text-white text-lg opacity-0 group-hover:opacity-80 transition-opacity select-none"
            title="Drag to reorder"
          >
            ⠿
          </span>
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
      className={`relative border-2 border-dashed rounded-lg bg-gray-50 flex flex-col items-center justify-center transition-colors ${
        isDragOver ? "border-indigo-500 bg-indigo-50" : "border-gray-300"
      } ${uploading ? "pointer-events-none opacity-60" : ""}`}
      style={{ aspectRatio: "4/3", minHeight: 120 }}
      onDragOver={(e) => {
        e.preventDefault();
        onDragOver?.(e);
      }}
      onDrop={(e) => {
        e.preventDefault();
        if (e.dataTransfer.files?.length) handleFiles(e.dataTransfer.files);
        else onDrop?.(e);
      }}
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
        <div className="flex flex-col items-center gap-2 px-2">
          <svg
            className="w-7 h-7 text-gray-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={1.5}
              d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
            />
          </svg>
          <button
            type="button"
            onClick={() => inputRef.current?.click()}
            className="text-xs font-medium text-indigo-600 hover:text-indigo-800 underline"
          >
            Upload image
          </button>
          {onPickFromLibrary && (
            <button
              type="button"
              onClick={onPickFromLibrary}
              className="text-xs font-medium text-gray-500 hover:text-indigo-600 border border-gray-300 rounded px-2 py-0.5 hover:border-indigo-400 transition"
            >
              🖼 Media Library
            </button>
          )}
          <p className="text-xs text-gray-400 text-center">
            or drag &amp; drop
          </p>
        </div>
      )}
    </div>
  );
}

/* ── Image Row block (2/3/4 cols, draggable to reorder) ── */
function ImageRowBlock({
  block,
  onPatch,
  onPickFromLibrary,
  onPickAllFromLibrary,
  onImageUploaded,
}) {
  const dragSrc = useRef(null);
  const bulkInputRef = useRef();
  const [dragOverIdx, setDragOverIdx] = useState(null);
  const [bulkUploading, setBulkUploading] = useState(false);

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

  const handleBulkFiles = useCallback(
    async (files) => {
      const oversized = Array.from(files).filter(
        (f) => f.type.startsWith("image/") && f.size > MAX_UPLOAD_BYTES,
      );
      if (oversized.length) {
        alert(
          oversized
            .map((f) => `"${f.name}" (${(f.size / 1024 / 1024).toFixed(1)}MB)`)
            .join("\n") + "\n\nসর্বোচ্চ ১০MB অনুমোদিত — এই ছবিগুলো বাদ দেওয়া হয়েছে।",
        );
      }
      const fileArr = Array.from(files)
        .filter((f) => f.type.startsWith("image/") && f.size <= MAX_UPLOAD_BYTES)
        .slice(0, cols);
      if (!fileArr.length) return;
      setBulkUploading(true);
      try {
        const results = await Promise.all(fileArr.map((f) => uploadFile(f)));
        const newImgs = [...images];
        while (newImgs.length < cols)
          newImgs.push({ url: "", public_id: "", alt: "" });
        results.forEach((asset, i) => {
          newImgs[i] = { ...(newImgs[i] || {}), ...asset, alt: "" };
        });
        onPatch({ images: newImgs });
        results.forEach((asset) => onImageUploaded?.(asset));
      } catch (err) {
        alert(err.message || "Upload failed");
      } finally {
        setBulkUploading(false);
      }
    },
    [images, cols, onPatch, onImageUploaded],
  );

  const gridClass =
    cols === 2 ? "grid-cols-2" : cols === 3 ? "grid-cols-3" : "grid-cols-4";

  return (
    <div>
      {/* Toolbar: column selector + bulk actions */}
      <div className="flex items-center gap-2 mb-3 flex-wrap">
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

        {/* Bulk upload / library — pushed to right */}
        <div className="ml-auto flex items-center gap-2">
          <input
            ref={bulkInputRef}
            type="file"
            accept="image/*"
            multiple
            className="sr-only"
            onChange={(e) => handleBulkFiles(e.target.files)}
          />
          <button
            type="button"
            onClick={() => bulkInputRef.current?.click()}
            disabled={bulkUploading}
            className="flex items-center gap-1 text-xs font-medium text-indigo-600 border border-indigo-200 bg-indigo-50 rounded px-2.5 py-1 hover:bg-indigo-100 disabled:opacity-50 transition"
          >
            {bulkUploading ? "Uploading…" : "⬆ Upload all"}
          </button>
          {onPickAllFromLibrary && (
            <button
              type="button"
              onClick={onPickAllFromLibrary}
              className="flex items-center gap-1 text-xs font-medium text-gray-600 border border-gray-300 rounded px-2.5 py-1 hover:bg-gray-50 transition"
            >
              🖼 Pick from library
            </button>
          )}
        </div>
      </div>

      <div className={`grid ${gridClass} gap-2`}>
        {images.slice(0, cols).map((img, idx) => (
          <ImageSlot
            key={idx}
            image={img}
            isDragOver={dragOverIdx === idx}
            draggable={!!img.url}
            onDragStart={() => {
              dragSrc.current = idx;
            }}
            onDragOver={(e) => {
              e.preventDefault();
              setDragOverIdx(idx);
            }}
            onDrop={(e) => {
              e.preventDefault();
              setDragOverIdx(null);
              if (dragSrc.current === null || dragSrc.current === idx) return;
              const imgs = [...images];
              [imgs[dragSrc.current], imgs[idx]] = [
                imgs[idx],
                imgs[dragSrc.current],
              ];
              dragSrc.current = null;
              onPatch({ images: imgs });
            }}
            onDragEnd={() => {
              dragSrc.current = null;
              setDragOverIdx(null);
            }}
            onUpload={(asset) => {
              patchImage(idx, asset);
              onImageUploaded?.(asset);
            }}
            onRemove={() =>
              patchImage(idx, { url: "", public_id: "", alt: "" })
            }
            onPickFromLibrary={
              onPickFromLibrary ? () => onPickFromLibrary(idx) : undefined
            }
          />
        ))}
      </div>
    </div>
  );
}

/* ── Block wrapper ── */
function BlockWrapper({
  index,
  total,
  onMoveUp,
  onMoveDown,
  onRemove,
  label,
  children,
}) {
  return (
    <div className="border border-gray-200 rounded-xl bg-white shadow-sm overflow-hidden">
      <div className="flex items-center justify-between px-4 py-2 bg-gray-50 border-b border-gray-200">
        <span className="text-xs font-bold uppercase tracking-widest text-gray-400">
          {label}
        </span>
        <div className="flex gap-1">
          <button
            type="button"
            onClick={onMoveUp}
            disabled={index === 0}
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-25 transition"
            title="Move up"
          >
            ▲
          </button>
          <button
            type="button"
            onClick={onMoveDown}
            disabled={index === total - 1}
            className="p-1.5 rounded text-gray-400 hover:text-gray-700 disabled:opacity-25 transition"
            title="Move down"
          >
            ▼
          </button>
          <button
            type="button"
            onClick={onRemove}
            className="p-1.5 rounded text-red-400 hover:text-red-600 transition ml-1"
            title="Remove block"
          >
            🗑
          </button>
        </div>
      </div>
      <div className="p-4">{children}</div>
    </div>
  );
}

/* ── Main builder ── */
export default function DetailedDescriptionBuilder({
  value,
  onChange,
  onImageUploaded,
}) {
  const blocks = normalizeBlocks(value);
  const update = (b) => onChange(b);
  const [pickerTarget, setPickerTarget] = useState(null);

  const addBlock = (type, extra = {}) => {
    let block;
    if (type === "text")
      block = { id: uid(), type: "text", content: "", align: "left" };
    else if (type === "image")
      block = { id: uid(), type: "image", url: "", public_id: "", alt: "" };
    else if (type === "image-row")
      block = {
        id: uid(),
        type: "image-row",
        cols: extra.cols || 2,
        images: Array.from({ length: extra.cols || 2 }, () => ({
          url: "",
          public_id: "",
          alt: "",
        })),
      };
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

  // pickerTarget shape:
  //   { blockIdx }              — single full-width image block
  //   { blockIdx, imageIdx }    — single slot inside image-row
  //   { blockIdx, multi: true } — pick multiple for entire image-row
  const isMultiPicker = pickerTarget?.multi === true;

  const handlePickerSelect = (assetOrAssets) => {
    if (!pickerTarget) return;
    const { blockIdx, imageIdx, multi } = pickerTarget;
    const block = blocks[blockIdx];
    if (!block) return;

    if (block.type === "image") {
      const asset = Array.isArray(assetOrAssets)
        ? assetOrAssets[0]
        : assetOrAssets;
      if (asset)
        patchBlock(blockIdx, { url: asset.url, public_id: asset.public_id });
    } else if (block.type === "image-row") {
      if (multi && Array.isArray(assetOrAssets)) {
        const imgs = [...(block.images || [])];
        assetOrAssets.forEach((asset, i) => {
          if (i < imgs.length) {
            imgs[i] = {
              ...(imgs[i] || {}),
              url: asset.url,
              public_id: asset.public_id,
            };
          }
        });
        patchBlock(blockIdx, { images: imgs });
      } else if (imageIdx !== undefined) {
        const asset = Array.isArray(assetOrAssets)
          ? assetOrAssets[0]
          : assetOrAssets;
        if (asset) {
          const imgs = [...(block.images || [])];
          imgs[imageIdx] = {
            ...(imgs[imageIdx] || {}),
            url: asset.url,
            public_id: asset.public_id,
          };
          patchBlock(blockIdx, { images: imgs });
        }
      }
    }
    setPickerTarget(null);
  };

  return (
    <div className="space-y-3">
      {blocks.map((block, i) => {
        if (block.type === "text") {
          return (
            <BlockWrapper
              key={block.id}
              index={i}
              total={blocks.length}
              label="Text Block"
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              onRemove={() => removeBlock(i)}
            >
              <div className="flex gap-1.5 mb-2">
                {["left", "center", "right"].map((a) => (
                  <button
                    key={a}
                    type="button"
                    onClick={() => patchBlock(i, { align: a })}
                    className={`px-2.5 py-1 text-xs rounded border transition ${block.align === a ? "bg-indigo-600 text-white border-indigo-600" : "border-gray-300 text-gray-600 hover:border-indigo-400"}`}
                  >
                    {a === "left"
                      ? "⬅ Left"
                      : a === "center"
                        ? "↔ Center"
                        : "➡ Right"}
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
            <BlockWrapper
              key={block.id}
              index={i}
              total={blocks.length}
              label="Full-Width Image"
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              onRemove={() => removeBlock(i)}
            >
              <div className="max-w-xl mx-auto">
                <ImageSlot
                  image={block}
                  onUpload={(asset) => {
                    patchBlock(i, asset);
                    onImageUploaded?.(asset);
                  }}
                  onRemove={() => patchBlock(i, { url: "", public_id: "" })}
                  onPickFromLibrary={() => setPickerTarget({ blockIdx: i })}
                />
                {block.url && (
                  <input
                    type="text"
                    value={block.alt || ""}
                    onChange={(e) => patchBlock(i, { alt: e.target.value })}
                    className="mt-2 w-full rounded-lg border border-gray-300 px-3 py-1.5 text-sm"
                    placeholder="Alt text (optional)"
                  />
                )}
              </div>
            </BlockWrapper>
          );
        }

        if (block.type === "image-row") {
          return (
            <BlockWrapper
              key={block.id}
              index={i}
              total={blocks.length}
              label="Image Row"
              onMoveUp={() => moveBlock(i, -1)}
              onMoveDown={() => moveBlock(i, 1)}
              onRemove={() => removeBlock(i)}
            >
              <ImageRowBlock
                block={block}
                onPatch={(patch) => patchBlock(i, patch)}
                onPickFromLibrary={(imageIdx) =>
                  setPickerTarget({ blockIdx: i, imageIdx })
                }
                onPickAllFromLibrary={() =>
                  setPickerTarget({ blockIdx: i, multi: true })
                }
                onImageUploaded={onImageUploaded}
              />
            </BlockWrapper>
          );
        }

        return null;
      })}

      {/* Add buttons */}
      <div className="flex flex-wrap gap-2 pt-1">
        <button
          type="button"
          onClick={() => addBlock("text")}
          className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition"
        >
          T&nbsp; Add Text
        </button>
        <button
          type="button"
          onClick={() => addBlock("image")}
          className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition"
        >
          🖼 Full-Width Image
        </button>
        {[2, 3, 4].map((n) => (
          <button
            key={n}
            type="button"
            onClick={() => addBlock("image-row", { cols: n })}
            className="flex items-center gap-1.5 rounded-lg border-2 border-dashed border-gray-300 px-3 py-2 text-sm font-medium text-gray-600 hover:border-indigo-400 hover:text-indigo-700 transition"
          >
            ⊞ {n} Images
          </button>
        ))}
      </div>

      {blocks.length === 0 && (
        <p className="text-sm text-gray-400 text-center py-8 border-2 border-dashed border-gray-200 rounded-xl">
          No blocks yet — use the buttons above to add content.
        </p>
      )}

      <MediaPicker
        open={pickerTarget !== null}
        multiple={isMultiPicker}
        onSelect={handlePickerSelect}
        onClose={() => setPickerTarget(null)}
      />
    </div>
  );
}
