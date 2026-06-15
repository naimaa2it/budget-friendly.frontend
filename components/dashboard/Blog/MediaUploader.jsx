"use client";

import React, { useState } from "react";
import BlogMediaLibrary from "./BlogMediaLibrary";

export default function MediaUploader({
  onUploadComplete,
  folder = "SmartBuy BD/blog/images",
  accept = "image/*,video/*",
  multiple = true,
  label = "Upload Media",
  currentMedia = [],
  showMediaLibrary = true,
  allowUrlPaste = false,
  urlPlaceholder = "Paste video link (YouTube, Facebook, MP4, etc.)",
}) {
  const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";
  const [uploading, setUploading] = useState(false);
  const [uploadProgress, setUploadProgress] = useState("");
  const [showLibrary, setShowLibrary] = useState(false);
  const [urlInput, setUrlInput] = useState("");

  const normalizeUrl = (raw) => {
    const trimmed = String(raw || "").trim();
    if (!trimmed) return "";
    if (/^https?:\/\//i.test(trimmed)) return trimmed;
    return `https://${trimmed}`;
  };

  const isDirectVideoUrl = (url) => {
    return /\.(mp4|webm|ogg|mov|m4v)(\?|#|$)/i.test(String(url || ""));
  };

  const handleFileChange = async (e) => {
    const files = Array.from(e.target.files || []);
    if (files.length === 0) return;

    setUploading(true);
    const uploadedAssets = [];

    for (let i = 0; i < files.length; i++) {
      const file = files[i];
      setUploadProgress(`Uploading ${i + 1} of ${files.length}...`);

      try {
        const fd = new FormData();
        fd.append("file", file);
        fd.append("folder", folder);

        const r = await fetch(`${API}/api/admin/upload`, {
          method: "POST",
          body: fd,
          credentials: "include",
        });

        const b = await r.json();
        if (!r.ok) throw new Error(b.error || "Upload failed");

        uploadedAssets.push(b.asset);
      } catch (err) {
        console.error("Upload error:", err);
        alert(`Failed to upload ${file.name}: ${err.message}`);
      }
    }

    setUploading(false);
    setUploadProgress("");

    if (uploadedAssets.length > 0) {
      onUploadComplete(uploadedAssets);
    }

    // Reset input
    e.target.value = "";
  };

  const handleLibrarySelect = (item) => {
    // Convert cloudinary item to our asset format
    const asset = {
      url: item.secure_url || item.url,
      public_id: item.public_id || item.publicId,
      width: item.width,
      height: item.height,
      format: item.format,
      resourceType: item.resource_type || item.resourceType || "image",
    };

    if (multiple) {
      onUploadComplete([...currentMedia, asset]);
    } else {
      onUploadComplete([asset]);
    }

    setShowLibrary(false);
  };

  const handleRemove = (indexToRemove) => {
    const updated = currentMedia.filter((_, idx) => idx !== indexToRemove);
    onUploadComplete(updated);
  };

  const handleAddUrl = () => {
    const normalized = normalizeUrl(urlInput);
    if (!normalized) return;

    try {
      // Validate URL format before adding it to media.
      new URL(normalized);
    } catch {
      alert("Please enter a valid video URL");
      return;
    }

    const asset = {
      url: normalized,
      resourceType: "video",
      format: "link",
    };

    if (multiple) {
      onUploadComplete([...(currentMedia || []), asset]);
    } else {
      onUploadComplete([asset]);
    }

    setUrlInput("");
  };

  return (
    <div className="space-y-3">
      <div className="flex gap-2">
        <label className="inline-block px-4 py-2 bg-blue-600 text-white rounded cursor-pointer hover:bg-blue-700 transition">
          {uploading ? uploadProgress : label}
          <input
            type="file"
            accept={accept}
            multiple={multiple}
            onChange={handleFileChange}
            disabled={uploading}
            className="hidden"
          />
        </label>

        {showMediaLibrary && (
          <button
            type="button"
            onClick={() => setShowLibrary(true)}
            className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-700 transition"
          >
            Select from Library
          </button>
        )}
      </div>

      {allowUrlPaste && (
        <div className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={urlInput}
            onChange={(e) => setUrlInput(e.target.value)}
            placeholder={urlPlaceholder}
            className="w-full sm:flex-1 px-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            type="button"
            onClick={handleAddUrl}
            className="px-4 py-2 bg-emerald-600 text-white rounded hover:bg-emerald-700 transition"
          >
            Paste Link
          </button>
        </div>
      )}

      {currentMedia && currentMedia.length > 0 && (
        <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 gap-4">
          {currentMedia.map((asset, idx) => (
            <div
              key={idx}
              className="relative group border rounded overflow-hidden bg-gray-50"
            >
              {asset.resourceType === "video" ? (
                isDirectVideoUrl(asset.url) ? (
                  <video
                    src={asset.url}
                    className="w-full h-32 object-cover"
                    controls
                  />
                ) : (
                  <div className="w-full h-32 bg-gray-900 text-white flex items-center justify-center text-xs px-2 text-center">
                    External video link
                  </div>
                )
              ) : (
                <img
                  src={asset.url}
                  alt=""
                  className="w-full h-32 object-cover"
                />
              )}
              <button
                onClick={() => handleRemove(idx)}
                className="absolute top-1 right-1 bg-red-600 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition"
              >
                ×
              </button>
              <div className="p-1 text-xs text-gray-600 truncate">
                {asset.resourceType === "video" ? "🎥" : "🖼️"}{" "}
                {asset.format || "media"}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Media Library Modal */}
      {showLibrary && (
        <div className="fixed inset-0 bg-black/40 bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg w-full max-w-6xl max-h-[90vh] overflow-hidden">
            <div className="p-4 border-b flex justify-between items-center">
              <h2 className="text-lg font-semibold">
                Select from Media Library
              </h2>
              <button
                onClick={() => setShowLibrary(false)}
                className="text-gray-400 hover:text-gray-600 text-2xl"
              >
                ×
              </button>
            </div>
            <div className="overflow-y-auto max-h-[calc(90vh-5rem)]">
              <BlogMediaLibrary
                onSelect={handleLibrarySelect}
                showSelection={false}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
