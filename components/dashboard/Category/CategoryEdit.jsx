"use client";

import React, { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { useUser } from "@/components/context/UserContext";
import MediaPicker from "@/components/dashboard/MediaPicker";
import { uploadAdminImage } from "@/lib/uploadImage";

export default function CategoryEdit({ categoryId }) {
  const router = useRouter();
  const { user, refreshUser } = useUser();
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  const [category, setCategory] = useState({
    name: "",
    description: "",
    parentId: "",
    order: 0,
    isActive: true,
    images: [],
  });
  // helper to traverse tree by id
  const findNode = (nodes, id) => {
    if (!id) return null;
    for (const n of nodes || []) {
      if (String(n._id) === String(id)) return n;
      if (n.children) {
        const res = findNode(n.children, id);
        if (res) return res;
      }
    }
    return null;
  };
  const [tree, setTree] = useState([]);
  const [selectedPath, setSelectedPath] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [showPicker, setShowPicker] = useState(false);

  useEffect(() => {
    if (!user) refreshUser();
  }, [user, refreshUser]);

  useEffect(() => {
    if (!categoryId || categoryId === "new") return;
    let mounted = true;
    const load = async () => {
      setLoading(true);
      let parentIdVal = "";
      try {
        const r = await fetch(`${API}/api/admin/categories/${categoryId}`, {
          credentials: "include",
        });
        if (r.ok) {
          const body = await r.json();
          if (mounted && body && body.category) {
            const c = body.category;
            parentIdVal = c.parent || "";
            setCategory({
              name: c.name || "",
              description: c.description || "",
              parentId: parentIdVal,
              order: c.order || 0,
              isActive: typeof c.isActive === "boolean" ? c.isActive : true,
              images: c.images || [],
            });
          }
        } else {
          // fallback to public tree
          const r2 = await fetch(`${API}/api/products/categories`);
          if (r2.ok) {
            const j = await r2.json();
            const find = (nodes, id) => {
              for (const n of nodes || []) {
                if (String(n._id) === String(id)) {
                  parentIdVal = n.parent || "";
                  return n;
                }
                if (n.children && n.children.length) {
                  const res = find(n.children, id);
                  if (res) return res;
                }
              }
              return null;
            };
            find(j.categories || [], categoryId);
            if (mounted && parentIdVal) {
              setCategory((c) => ({ ...c, parentId: parentIdVal }));
            }
          }
        }
        // compute ancestor chain for selects
        const computeAncestors = (nodes, id, path = []) => {
          for (const n of nodes || []) {
            if (String(n._id) === String(id)) return [...path, String(n._id)];
            if (n.children) {
              const res = computeAncestors(n.children, id, [...path, String(n._id)]);
              if (res) return res;
            }
          }
          return null;
        };
        if (tree.length && parentIdVal) {
          const anc = computeAncestors(tree, parentIdVal);
          if (anc && anc.length) setSelectedPath(anc);
        }
      } catch (err) {
        console.error("Failed to load category for edit:", err);
      } finally {
        if (mounted) setLoading(false);
      }
    };
    load();
    return () => {
      mounted = false;
    };
  }, [categoryId, API, tree]);

  // load category tree for dropdowns
  useEffect(() => {
    fetch(`${API}/api/products/categories`)
      .then((r) => r.json())
      .then((b) => setTree(b.categories || []))
      .catch(() => setTree([]));
  }, [API]);

  const handleFile = async (file) => {
    const preview = URL.createObjectURL(file);
    setCategory((c) => ({
      ...c,
      images: [
        ...(c.images || []),
        { url: preview, __local: true, uploading: true },
      ],
    }));

    try {
      const body = await uploadAdminImage(file, "Pickob/categories");
      const asset = {
        public_id: body.asset.public_id,
        url: body.asset.url,
        width: body.asset.width,
        height: body.asset.height,
        format: body.asset.format,
      };
      setCategory((c) => ({
        ...c,
        images: (c.images || []).map((img) =>
          img.__local && img.url === preview ? asset : img,
        ),
      }));
      try {
        URL.revokeObjectURL(preview);
      } catch (e) {}
    } catch (err) {
      setCategory((c) => ({
        ...c,
        images: (c.images || []).filter(
          (i) => !(i.__local && i.url === preview),
        ),
      }));
      alert(err.message || "Upload failed");
    }
  };

  const removeImageAt = (idx) =>
    setCategory((c) => ({
      ...c,
      images: (c.images || []).filter((_, i) => i !== idx),
    }));

  const handleSave = async () => {
    if (!category.name) return alert("Name is required");
    setSaving(true);
    try {
      const parentId = selectedPath.length > 0 ? selectedPath[selectedPath.length - 1] : "";
      const payload = {
        name: category.name,
        description: category.description || "",
        parentId: parentId || undefined,
        order: category.order,
        isActive: category.isActive,
      };
      if (Array.isArray(category.images)) payload.images = category.images;
      const resp = await fetch(`${API}/api/admin/categories/${categoryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(payload),
      });
      const body = await resp.json();
      if (!resp.ok) throw new Error(body.error || "Save failed");
      router.push("/dashboard/categories");
    } catch (err) {
      alert(err.message || "Save failed");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="max-w-4xl mx-auto bg-white p-6 rounded shadow">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-4">
        <h2 className="text-lg font-semibold">Edit category</h2>
        <div>
          <button
            onClick={() => router.push("/dashboard/categories")}
            className="px-3 py-2 border rounded text-sm shrink-0"
          >
            Back
          </button>
        </div>
      </div>

      {loading ? (
        <div className="text-center py-12">Loading…</div>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium">Name</label>
            <input
              value={category.name}
              onChange={(e) =>
                setCategory((c) => ({ ...c, name: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="block text-sm font-medium">
              Description{" "}
              <span className="text-gray-400 font-normal">
                (shown on category page)
              </span>
            </label>
            <textarea
              value={category.description}
              onChange={(e) =>
                setCategory((c) => ({ ...c, description: e.target.value }))
              }
              className="w-full border px-3 py-2 rounded h-24 resize-none"
              placeholder={`e.g. Browse our best ${category.name || "products"} with fast delivery across Bangladesh.`}
            />
          </div>

          <div>
            <label className="block text-sm font-medium">Images</label>
            <div className="flex gap-3 flex-wrap mt-2">
              {(category.images || []).map((img, idx) => (
                <div
                  key={idx}
                  className="relative w-24 h-24 bg-gray-50 border rounded overflow-hidden"
                >
                  <img
                    src={img.url}
                    alt={img.alt || category.name || "category"}
                    className="w-full h-full object-cover"
                  />
                  <button
                    type="button"
                    onClick={() => removeImageAt(idx)}
                    className="absolute -top-1 -right-1 bg-red-600 text-white rounded-full w-6 h-6 text-xs"
                  >
                    ×
                  </button>
                </div>
              ))}

              <label className="w-24 h-24 flex items-center justify-center border border-dashed rounded cursor-pointer text-sm text-gray-500 bg-white">
                <input
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={(e) =>
                    e.target.files &&
                    e.target.files[0] &&
                    handleFile(e.target.files[0])
                  }
                />
                Upload
              </label>
              <button
                type="button"
                onClick={() => setShowPicker(true)}
                className="w-24 h-24 flex flex-col items-center justify-center border border-dashed border-indigo-300 rounded cursor-pointer text-xs text-indigo-500 bg-indigo-50 hover:bg-indigo-100 gap-1"
              >
                <span className="text-lg">🖼</span>Library
              </button>
            </div>
          </div>

          <MediaPicker
            open={showPicker}
            onSelect={(asset) => {
              setCategory((c) => ({
                ...c,
                images: [
                  ...(c.images || []),
                  { url: asset.url, public_id: asset.public_id },
                ],
              }));
              setShowPicker(false);
            }}
            onClose={() => setShowPicker(false)}
          />

          <div>
            <label className="block text-sm font-medium">
              Parent category (choose hierarchy)
            </label>
            <div className="flex flex-col gap-2">
              <select
                value={selectedPath[0] || ""}
                onChange={(e) => setSelectedPath(e.target.value ? [e.target.value] : [])}
                className="w-full border px-3 py-2 rounded"
              >
                <option value="">(no parent / top level)</option>
                {tree
                  .filter((n) => n.level === 0)
                  .map((n) => (
                    <option key={n._id} value={n._id}>
                      {n.name}
                    </option>
                  ))}
              </select>
              {selectedPath.map((selectedId, idx) => {
                const children = findNode(tree, selectedId)?.children || [];
                if (children.length === 0) return null;
                return (
                  <select
                    key={selectedId}
                    value={selectedPath[idx + 1] || ""}
                    onChange={(e) => {
                      const newPath = selectedPath.slice(0, idx + 1);
                      if (e.target.value) newPath.push(e.target.value);
                      setSelectedPath(newPath);
                    }}
                    className="w-full border px-3 py-2 rounded"
                  >
                    <option value="">(direct child of selected)</option>
                    {children.map((n) => (
                      <option key={n._id} value={n._id}>
                        {n.name}
                      </option>
                    ))}
                  </select>
                );
              })}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium">Order</label>
            <input
              type="number"
              value={category.order}
              onChange={(e) =>
                setCategory((c) => ({ ...c, order: Number(e.target.value) }))
              }
              className="w-40 border px-3 py-2 rounded"
            />
          </div>

          <div>
            <label className="inline-flex items-center gap-2">
              <input
                type="checkbox"
                checked={category.isActive}
                onChange={(e) =>
                  setCategory((c) => ({ ...c, isActive: e.target.checked }))
                }
              />
              <span className="text-sm">Active</span>
            </label>
          </div>

          <div className="flex gap-2">
            <button
              onClick={handleSave}
              className="px-3 py-2 bg-indigo-600 text-white rounded"
              disabled={saving}
            >
              {saving ? "Saving…" : "Save"}
            </button>
            <button
              onClick={() => router.push("/dashboard/categories")}
              className="px-3 py-2 border rounded"
            >
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
