"use client";

import React, { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import MediaPicker from "@/components/dashboard/MediaPicker";
import MediaUploader from "./MediaUploader";
import CategorySelector from "./CategorySelector";
import TagInput from "./TagInput";
import DynamicSectionBuilder from "./DynamicSectionBuilder";

export default function BlogEdit({ postId }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const router = useRouter();
  const { user } = useUser();

  const [post, setPost] = useState(null);
  const [title, setTitle] = useState("");
  const [excerpt, setExcerpt] = useState("");
  const [content, setContent] = useState("<p></p>");
  const [tags, setTags] = useState([]);
  const [featuredImage, setFeaturedImage] = useState(null);
  const [categories, setCategories] = useState([]);
  const [isFeatured, setIsFeatured] = useState(false);
  const [additionalImages, setAdditionalImages] = useState([]);
  const [videos, setVideos] = useState([]);
  const [dynamicSections, setDynamicSections] = useState([]);
  const [publishDate, setPublishDate] = useState("");
  const [readingTime, setReadingTime] = useState(5);
  const [status, setStatus] = useState("draft");
  const [seoTitle, setSeoTitle] = useState("");
  const [seoDescription, setSeoDescription] = useState("");
  const [seoKeywords, setSeoKeywords] = useState("");
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);
  const editorRef = useRef(null);
  const lastRange = useRef(null);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastRange.current = sel.getRangeAt(0).cloneRange();
    }
  };
  const restoreSelection = () => {
    const sel = window.getSelection();
    sel.removeAllRanges();
    if (lastRange.current) sel.addRange(lastRange.current);
  };

  const exec = (cmd, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);

    if (cmd === "createLink" && val) {
      const sel = window.getSelection();
      if (sel && sel.rangeCount) {
        let node = sel.anchorNode;
        while (node && node.nodeType === 3) node = node.parentElement;
        if (node && node.tagName === "A") {
          node.setAttribute("target", "_blank");
          node.style.color = "#2563eb";
          node.style.textDecoration = "underline";
        }
      }
    }

    setContent(editorRef.current.innerHTML);
  };

  const handleLink = () => {
    const sel = window.getSelection();
    if (!sel || !sel.rangeCount) return;

    // Check if we're in an existing link
    let node = sel.anchorNode;
    while (node && node.nodeType === 3) node = node.parentElement;

    let linkElement = null;
    if (node && node.tagName === "A") {
      linkElement = node;
    } else {
      // Check if selection contains a link
      const range = sel.getRangeAt(0);
      const container = range.commonAncestorContainer;
      if (container.nodeType === 1 && container.tagName === "A") {
        linkElement = container;
      } else if (
        container.parentElement &&
        container.parentElement.tagName === "A"
      ) {
        linkElement = container.parentElement;
      }
    }

    if (linkElement) {
      // We're in an existing link - show edit/remove options
      const currentUrl = linkElement.href;
      const action = prompt(
        `Current link: ${currentUrl}\n\nOptions:\n1. Enter a NEW URL to change the link\n2. Type "remove" to delete the link\n3. Click Cancel to keep as is`,
        currentUrl,
      );

      if (action === null) return; // User clicked cancel

      if (action.toLowerCase().trim() === "remove") {
        // Remove the link but keep the text
        const text = linkElement.textContent;
        const textNode = document.createTextNode(text);
        linkElement.parentNode.replaceChild(textNode, linkElement);
        setContent(editorRef.current.innerHTML);
      } else if (action.trim()) {
        // Update the link URL
        linkElement.href = action.trim();
        linkElement.setAttribute("target", "_blank");
        linkElement.style.color = "#2563eb";
        linkElement.style.textDecoration = "underline";
        setContent(editorRef.current.innerHTML);
      }
    } else {
      // No existing link - create new one
      const url = prompt("Enter link URL (e.g., https://example.com)");
      if (url && url.trim()) {
        exec("createLink", url.trim());
      }
    }
  };

  useEffect(() => {
    document.execCommand("enableObjectResizing", false, true);
    document.execCommand("enableInlineTableEditing", false, true);
  }, []);

  const insertImageFile = async (file) => {
    if (!file) return;
    const fd = new FormData();
    fd.append("file", file);
    fd.append("folder", "Pickob/blog/images");
    const r = await fetch(`${API}/api/admin/upload`, {
      method: "POST",
      body: fd,
      credentials: "include",
    });
    const b = await r.json();
    if (!r.ok) throw new Error(b.error || "Upload failed");
    const url = b.asset.url;
    exec("insertImage", url);
    setTimeout(() => {
      const imgs = editorRef.current?.querySelectorAll("img");
      if (imgs && imgs.length) {
        const img = imgs[imgs.length - 1];
        img.style.maxHeight = "200px";
        img.style.height = "auto";
        img.style.cursor = "pointer";
        img.addEventListener("click", () => {
          const action = prompt(
            'Enter new max-height in px, or type "remove" to delete the image:',
          );
          if (!action) return;
          if (action.toLowerCase().trim() === "remove") {
            img.remove();
          } else {
            const h = parseInt(action, 10);
            if (!isNaN(h) && h > 0) {
              img.style.maxHeight = h + "px";
            }
          }
        });
      }
    }, 100);
  };

  const handleImageChange = (e) => {
    const f = e.target.files?.[0];
    if (!f) return;
    insertImageFile(f).catch((err) => alert(err.message || "Upload failed"));
  };

  useEffect(() => {
    if (!postId || postId === "new") return;
    fetch(`${API}/api/admin/blog/${postId}`, { credentials: "include" })
      .then((r) => r.json())
      .then((b) => {
        if (b.post) {
          setPost(b.post);
          setTitle(b.post.title || "");
          setExcerpt(b.post.excerpt || "");
          setContent(b.post.content || "<p></p>");
          setTags(b.post.tags || []);

          // Handle both new object format and legacy string format
          if (
            b.post.featuredImage &&
            typeof b.post.featuredImage === "object"
          ) {
            setFeaturedImage(b.post.featuredImage);
          } else if (
            b.post.featuredImage &&
            typeof b.post.featuredImage === "string"
          ) {
            // Legacy format - convert to object
            setFeaturedImage({
              url: b.post.featuredImage,
              resourceType: "image",
            });
          }

          setCategories((b.post.categories || []).map((c) => c._id || c));
          setIsFeatured(b.post.isFeatured || false);
          setAdditionalImages(b.post.additionalImages || []);
          setVideos(b.post.videos || []);
          setDynamicSections(b.post.dynamicSections || []);
          setPublishDate(
            b.post.publishDate
              ? new Date(b.post.publishDate).toISOString().split("T")[0]
              : "",
          );
          setReadingTime(b.post.readingTime || 5);
          setStatus(b.post.status || "draft");
          setSeoTitle(b.post.seo?.title || "");
          setSeoDescription(b.post.seo?.description || "");
          setSeoKeywords((b.post.seo?.keywords || []).join(", "));
        }
      })
      .catch(console.error);
  }, [postId, API]);

  const handleFeaturedImageUpload = (assets) => {
    if (assets && assets.length > 0) {
      setFeaturedImage(assets[0]);
    } else {
      setFeaturedImage(null);
    }
  };

  const handleAdditionalImagesUpload = (assets) => {
    setAdditionalImages(assets);
  };

  const handleVideosUpload = (assets) => {
    setVideos(assets);
  };

  const handleCancel = () => {
    router.push("/dashboard/blog");
  };

  const handleSave = async (publish = false) => {
    if (!title.trim()) return alert("Title is required");
    setSaving(true);
    try {
      const payload = {
        title: title.trim(),
        excerpt: excerpt.trim(),
        content,
        tags,
        featuredImage,
        categories,
        isFeatured,
        additionalImages,
        videos,
        dynamicSections,
        publishDate: publishDate || null,
        readingTime: readingTime || 5,
        status: publish ? "published" : status || "draft",
        seo: {
          title: seoTitle.trim(),
          description: seoDescription.trim(),
          keywords: seoKeywords
            .split(",")
            .map((k) => k.trim())
            .filter(Boolean),
        },
      };
      const method = "PUT";
      const resp = await fetch(`${API}/api/admin/blog/${postId}`, {
        method,
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      router.push("/dashboard/blog");
    } catch (err) {
      alert(err.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  if (!post) {
    return <div className="p-6 text-center">Loading post…</div>;
  }

  return (
    <div className="bg-white p-6 rounded shadow max-w-5xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Edit Blog Post</h1>

      <div className="flex flex-col sm:flex-row justify-between items-start gap-6 mb-6">
        <div className="flex-1 space-y-4 min-w-0">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title *
            </label>
            <input
              className="w-full text-xl font-semibold border rounded px-3 py-2"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Post title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Excerpt(Optional need for featured blog)
            </label>
            <textarea
              className="w-full border rounded px-3 py-2"
              value={excerpt}
              onChange={(e) => setExcerpt(e.target.value)}
              placeholder="Short excerpt (shows in listing)"
              rows={2}
            />
          </div>
        </div>

        <div className="w-full sm:w-48 shrink-0">
          <div className="text-sm font-medium text-gray-700 mb-2">Status</div>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value)}
            className="w-full border rounded px-3 py-2"
          >
            <option value="draft">Draft</option>
            <option value="published">Published</option>
            <option value="archived">Archived</option>
          </select>
        </div>
      </div>

      {/* Featured Image Section - BEFORE Editor */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold mb-3">Featured Image</h3>
        <MediaUploader
          onUploadComplete={handleFeaturedImageUpload}
          folder="Pickob/blog/images"
          accept="image/*"
          multiple={false}
          label="Upload Featured Image"
          currentMedia={featuredImage ? [featuredImage] : []}
        />
      </div>

      {/* Rich Text Editor */}
      <div className="mb-6">
        <h3 className="text-sm font-semibold mb-2">Content</h3>
        <div className="text-xs text-gray-500 mb-2">
          Select text and click 🔗 to add/edit/remove links. Click on existing
          links to edit or remove them.
        </div>
        <div className="flex flex-wrap gap-2 mb-2 sticky top-0 bg-white z-10 p-2 border-b">
          <button
            type="button"
            onClick={() => exec("bold")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            B
          </button>
          <button
            type="button"
            onClick={() => exec("italic")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            I
          </button>
          <button
            type="button"
            onClick={() => exec("underline")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            U
          </button>
          <button
            type="button"
            onClick={() => exec("formatBlock", "<h2>")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            H2
          </button>
          <button
            type="button"
            onClick={() => exec("formatBlock", "<p>")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            P
          </button>
          <button
            type="button"
            onClick={() => exec("insertUnorderedList")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            • List
          </button>
          <button
            type="button"
            onClick={() => exec("insertOrderedList")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            1. List
          </button>
          <button
            onMouseDown={saveSelection}
            type="button"
            onClick={handleLink}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            🔗 Link
          </button>
          <label
            onMouseDown={saveSelection}
            className="px-3 py-1.5 border rounded cursor-pointer hover:bg-gray-100"
          >
            📷 Img
            <input
              onChange={handleImageChange}
              type="file"
              accept="image/*"
              className="hidden"
            />
          </label>
          <button
            type="button"
            onMouseDown={saveSelection}
            onClick={() => setShowPicker(true)}
            className="px-3 py-1.5 border rounded text-blue-600 hover:bg-blue-50"
          >
            📚 Library
          </button>
          <button
            type="button"
            onClick={() => exec("undo")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            ↶
          </button>
          <button
            type="button"
            onClick={() => exec("redo")}
            className="px-3 py-1.5 border rounded hover:bg-gray-100"
          >
            ↷
          </button>
        </div>

        <div className="max-h-[60vh] overflow-y-auto border rounded">
          <div
            ref={editorRef}
            contentEditable
            className="min-h-[300px] p-4 prose max-w-none focus:outline-none"
            onInput={(e) => setContent(e.currentTarget.innerHTML)}
            dangerouslySetInnerHTML={{ __html: content }}
          />
        </div>
      </div>

      {/* Category Selection - AFTER Editor */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <CategorySelector
          selectedCategories={categories}
          onChange={setCategories}
        />
      </div>

      {/* Mark as Featured */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isFeatured}
            onChange={(e) => setIsFeatured(e.target.checked)}
            className="w-4 h-4"
          />
          <span className="text-sm font-medium">Mark as Featured Post</span>
        </label>
      </div>

      {/* Tags */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <TagInput tags={tags} onChange={setTags} />
      </div>

      {/* Publish Date & Reading Time */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Publish Date (Optional)
            </label>
            <input
              type="date"
              value={publishDate}
              onChange={(e) => setPublishDate(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Leave empty to use creation date
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Reading Time (minutes)
            </label>
            <input
              type="number"
              min="1"
              max="60"
              value={readingTime}
              onChange={(e) => setReadingTime(parseInt(e.target.value) || 5)}
              className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-500 mt-1">
              Estimated reading time for the blog post
            </p>
          </div>
        </div>
      </div>

      {/* Additional Images */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold mb-3">Additional Images</h3>
        <MediaUploader
          onUploadComplete={handleAdditionalImagesUpload}
          folder="Pickob/blog/images"
          accept="image/*"
          multiple={true}
          label="Upload Additional Images"
          currentMedia={additionalImages}
        />
      </div>

      {/* Videos */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold mb-3">Videos</h3>
        <MediaUploader
          onUploadComplete={handleVideosUpload}
          folder="Pickob/blog/videos"
          accept="video/*"
          multiple={true}
          label="Upload Videos"
          currentMedia={videos}
          allowUrlPaste={true}
        />
      </div>

      {/* Dynamic Sections (FAQ, Accordion, Steps) */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold mb-3">
          Dynamic Sections (FAQ, Accordion, Steps)
        </h3>
        <DynamicSectionBuilder
          sections={dynamicSections}
          onChange={setDynamicSections}
        />
      </div>

      {/* SEO */}
      <div className="mb-6 p-4 border rounded-lg bg-gray-50">
        <h3 className="text-sm font-semibold mb-3">SEO</h3>
        <div className="space-y-3">
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              SEO Title{" "}
              <span className="text-gray-400">
                (leave blank to use post title)
              </span>
            </label>
            <input
              type="text"
              value={seoTitle}
              onChange={(e) => setSeoTitle(e.target.value)}
              maxLength={70}
              placeholder="Custom SEO title (max 70 chars)"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
            <p className="text-xs text-gray-400 mt-0.5">{seoTitle.length}/70</p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Meta Description{" "}
              <span className="text-gray-400">
                (leave blank to use excerpt)
              </span>
            </label>
            <textarea
              value={seoDescription}
              onChange={(e) => setSeoDescription(e.target.value)}
              maxLength={160}
              rows={2}
              placeholder="Meta description (max 160 chars)"
              className="w-full border rounded px-3 py-1.5 text-sm resize-none"
            />
            <p className="text-xs text-gray-400 mt-0.5">
              {seoDescription.length}/160
            </p>
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 mb-1">
              Keywords <span className="text-gray-400">(comma-separated)</span>
            </label>
            <input
              type="text"
              value={seoKeywords}
              onChange={(e) => setSeoKeywords(e.target.value)}
              placeholder="e.g. smartphone, gadget, best price"
              className="w-full border rounded px-3 py-1.5 text-sm"
            />
          </div>
        </div>
      </div>

      {/* Action Buttons */}
      <div className="flex gap-3 pt-4 border-t">
        <button
          onClick={() => handleSave(false)}
          className="px-6 py-2 bg-gray-800 text-white rounded hover:bg-gray-900 disabled:opacity-50"
          disabled={saving}
        >
          {saving ? "Saving…" : "Save Draft"}
        </button>
        <button
          onClick={() => handleSave(true)}
          className="px-6 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
          disabled={saving}
        >
          Publish
        </button>
        <button
          onClick={handleCancel}
          className="px-6 py-2 border rounded hover:bg-gray-50"
        >
          Cancel
        </button>
      </div>

      <MediaPicker
        open={showPicker}
        onClose={() => setShowPicker(false)}
        onSelect={(asset) => {
          restoreSelection();
          exec("insertImage", asset.url);
          setShowPicker(false);
        }}
      />
    </div>
  );
}
