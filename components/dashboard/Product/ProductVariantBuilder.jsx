"use client";

import React, { useEffect, useMemo, useState } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "http://localhost:5000";

const uid = () =>
  `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 8)}`;

const DEFAULT_VARIATIONS = [];

const normalizeKey = (value) =>
  String(value || "")
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "_")
    .replace(/^_+|_+$/g, "");

const comboKey = (attributes) =>
  Object.entries(attributes || {})
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([key, value]) => `${key}:${value}`)
    .join("|");

const cartesian = (groups) =>
  groups.reduce(
    (acc, group) =>
      acc.flatMap((item) =>
        group.options.map((option) => ({
          ...item,
          [group.name]: option.value,
        })),
      ),
    [{}],
  );

const titleFromAttributes = (attributes) =>
  Object.values(attributes || {})
    .filter(Boolean)
    .join(" / ");

const colorHex = (name) => {
  const map = {
    black: "#111827",
    white: "#ffffff",
    red: "#ef4444",
    blue: "#2563eb",
    green: "#16a34a",
    yellow: "#facc15",
    pink: "#ec4899",
    purple: "#9333ea",
    gray: "#6b7280",
    grey: "#6b7280",
    orange: "#f97316",
    brown: "#92400e",
  };
  return (
    map[
      String(name || "")
        .trim()
        .toLowerCase()
    ] || "#000000"
  );
};

const inferVariationCatalog = (variants) => {
  const byName = new Map();

  (variants || []).forEach((variant) => {
    const attrs = { ...(variant.attributes || {}) };
    if (variant.color?.name) attrs.Color = variant.color.name;
    if (variant.size) attrs.Size = variant.size;

    Object.entries(attrs).forEach(([name, value]) => {
      if (!name || !value || typeof value !== "string") return;
      const id = normalizeKey(name) || uid();
      if (!byName.has(name)) byName.set(name, { id, name, options: [] });
      const group = byName.get(name);
      if (!group.options.some((option) => option.value === value)) {
        group.options.push({ id: uid(), value, selected: true });
      }
    });
  });

  return Array.from(byName.values());
};

const normalizeCatalogItem = (item) => ({
  id: item.id || item._id || uid(),
  name: item.name,
  options: (item.options || [])
    .map((option) => ({
      id: option.id || option._id || uid(),
      value: option.value || option,
    }))
    .filter((option) => option.value),
});

const mergeCatalogs = (base, incoming) => {
  const merged = [
    ...base.map((group) => ({
      ...group,
      options: [...(group.options || [])],
    })),
  ];
  incoming.forEach((group) => {
    if (!group.name) return;
    const found = merged.find(
      (item) => item.name.toLowerCase() === group.name.toLowerCase(),
    );
    if (!found) {
      merged.push(group);
      return;
    }
    (group.options || []).forEach((option) => {
      if (
        !found.options.some(
          (item) => item.value.toLowerCase() === option.value.toLowerCase(),
        )
      ) {
        found.options.push(option);
      }
    });
  });
  return merged;
};

export default function ProductVariantBuilder({
  product,
  setProduct,
  inputClass,
  labelClass,
}) {
  const [catalog, setCatalog] = useState(DEFAULT_VARIATIONS);
  const [selectedNames, setSelectedNames] = useState([]);
  const [optionDrafts, setOptionDrafts] = useState({});
  const [newVariationName, setNewVariationName] = useState("");
  const [catalogLoading, setCatalogLoading] = useState(false);
  const [editingGroup, setEditingGroup] = useState(null);
  const [editingName, setEditingName] = useState("");

  useEffect(() => {
    let mounted = true;
    const fetchCatalog = async () => {
      setCatalogLoading(true);
      try {
        const resp = await fetch(`${API}/api/admin/variations?per_page=50`, {
          credentials: "include",
        });
        const data = await resp.json();
        if (!resp.ok) throw new Error(data.error || "Failed to load variants");
        const remote = (data.result?.data || []).map(normalizeCatalogItem);
        if (mounted && remote.length) {
          setCatalog((current) => mergeCatalogs(current, remote));
        }
      } catch (err) {
        console.error("Failed to load product variation catalog:", err);
      } finally {
        if (mounted) setCatalogLoading(false);
      }
    };
    fetchCatalog();
    return () => {
      mounted = false;
    };
  }, []);

  useEffect(() => {
    if (!(product.variants || []).length) return;
    const inferred = inferVariationCatalog(product.variants);
    if (!inferred.length) return;

    setCatalog((current) => {
      const merged = [...current];
      inferred.forEach((group) => {
        const found = merged.find(
          (item) => item.name.toLowerCase() === group.name.toLowerCase(),
        );
        if (!found) {
          merged.push(group);
          return;
        }
        group.options.forEach((option) => {
          if (!found.options.some((item) => item.value === option.value)) {
            found.options.push(option);
          }
        });
      });
      return merged;
    });
    setSelectedNames((current) =>
      current.length ? current : inferred.map((group) => group.name),
    );
    // Run only when loading an existing product's initial variant set.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const selectedGroups = useMemo(
    () =>
      catalog
        .filter((group) => selectedNames.includes(group.name))
        .map((group) => ({
          ...group,
          options: group.options.filter((option) => option.selected),
        }))
        .filter((group) => group.options.length),
    [catalog, selectedNames],
  );

  const selectedOptionCount = selectedGroups.reduce(
    (sum, group) => sum + group.options.length,
    0,
  );

  const syncGeneratedVariants = () => {
    if (!selectedGroups.length) {
      setProduct((prev) => ({ ...prev, variants: [] }));
      return;
    }

    const combinations = cartesian(selectedGroups);
    const existingByKey = new Map(
      (product.variants || []).map((variant) => [
        comboKey(variant.attributes || {}),
        variant,
      ]),
    );

    const variants = combinations.map((attributes) => {
      const previous = existingByKey.get(comboKey(attributes)) || {};
      const colorValue = attributes.Color || attributes.color;
      const sizeValue = attributes.Size || attributes.size;

      return {
        ...previous,
        name: previous.name || titleFromAttributes(attributes),
        color: colorValue
          ? {
              name: colorValue,
              hex: previous.color?.hex || colorHex(colorValue),
            }
          : previous.color || { name: "", hex: "#000000" },
        size: sizeValue || previous.size || "",
        sku: previous.sku || "",
        buyingPrice: previous.buyingPrice ?? product.buyingPrice,
        price: previous.price ?? product.price ?? undefined,
        compareAtPrice: previous.compareAtPrice ?? product.compareAtPrice,
        inventory: previous.inventory ?? product.inventory ?? undefined,
        attributes,
      };
    });

    setProduct((prev) => ({ ...prev, variants }));
  };

  const updateVariant = (index, patch) => {
    setProduct((prev) => {
      const variants = [...(prev.variants || [])];
      variants[index] = { ...(variants[index] || {}), ...patch };
      return { ...prev, variants };
    });
  };

  const removeVariant = (index) => {
    setProduct((prev) => ({
      ...prev,
      variants: (prev.variants || []).filter((_, i) => i !== index),
    }));
  };

  const toggleVariation = (groupName) => {
    setSelectedNames((current) =>
      current.includes(groupName)
        ? current.filter((name) => name !== groupName)
        : [...current, groupName],
    );
  };

  const toggleOption = (groupName, optionId) => {
    setCatalog((current) =>
      current.map((group) =>
        group.name !== groupName
          ? group
          : {
              ...group,
              options: group.options.map((option) =>
                option.id === optionId
                  ? { ...option, selected: !option.selected }
                  : option,
              ),
            },
      ),
    );
  };

  const addOption = (groupName) => {
    const value = String(optionDrafts[groupName] || "").trim();
    if (!value) return;
    setCatalog((current) =>
      current.map((group) =>
        group.name !== groupName
          ? group
          : group.options.some(
                (option) => option.value.toLowerCase() === value.toLowerCase(),
              )
            ? group
            : {
                ...group,
                options: [
                  ...group.options,
                  { id: uid(), value, selected: true },
                ],
              },
      ),
    );
    setOptionDrafts((current) => ({ ...current, [groupName]: "" }));
  };

  const addVariation = () => {
    const name = newVariationName.trim();
    if (!name) return;
    if (
      catalog.some((group) => group.name.toLowerCase() === name.toLowerCase())
    )
      return;
    setCatalog((current) => [...current, { id: uid(), name, options: [] }]);
    setSelectedNames((current) => [...current, name]);
    setNewVariationName("");
  };

  const renameVariation = (oldName, newName) => {
    const trimmed = newName.trim();
    if (!trimmed || trimmed === oldName) {
      setEditingGroup(null);
      return;
    }
    setCatalog((current) =>
      current.map((group) =>
        group.name === oldName ? { ...group, name: trimmed } : group,
      ),
    );
    setSelectedNames((current) =>
      current.map((name) => (name === oldName ? trimmed : name)),
    );
    setOptionDrafts((current) => {
      const next = { ...current };
      if (oldName in next) {
        next[trimmed] = next[oldName];
        delete next[oldName];
      }
      return next;
    });
    setProduct((prev) => ({
      ...prev,
      variants: (prev.variants || []).map((v) => {
        const attrs = { ...(v.attributes || {}) };
        if (oldName in attrs) {
          attrs[trimmed] = attrs[oldName];
          delete attrs[oldName];
        }
        return { ...v, attributes: attrs };
      }),
    }));
    setEditingGroup(null);
  };

  return (
    <section className="rounded-2xl border border-gray-200 bg-white p-6 shadow-sm">
      <div className="mb-6 flex flex-col gap-4 lg:flex-row lg:items-start lg:justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-[0.2em] text-gray-500">
            Product Variant Setup
          </p>
          <h2 className="mt-2 text-2xl font-bold text-gray-900">
            Product Variants
          </h2>
          <p className="mt-1 text-sm text-gray-600">
            Pick a type like Color or Size, choose its options, then create the
            editable buying price, offer price, previous price, and stock rows.
          </p>
          <div className="mt-3 grid gap-2 text-xs text-gray-600 sm:grid-cols-3">
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              1. Select variant types
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              2. Tick options or add new ones
            </div>
            <div className="rounded-lg bg-gray-50 px-3 py-2">
              3. Generate rows and edit price
            </div>
          </div>
          {catalogLoading && (
            <p className="mt-2 text-xs font-medium text-indigo-600">
              Loading saved variation catalog...
            </p>
          )}
        </div>
        <button
          type="button"
          onClick={syncGeneratedVariants}
          className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-indigo-700"
        >
          Create variant rows
        </button>
      </div>

      <div className="grid grid-cols-1 gap-5 xl:grid-cols-[22rem_minmax(0,1fr)]">
        <div className="space-y-4">
          <div className="rounded-xl border border-gray-200 bg-gray-50 p-4">
            <label className={labelClass}>Need another type?</label>
            <div className="flex gap-2">
              <input
                value={newVariationName}
                onChange={(e) => setNewVariationName(e.target.value)}
                className={inputClass}
                placeholder="e.g., Material, Pack Size"
              />
              <button
                type="button"
                onClick={addVariation}
                className="shrink-0 rounded-lg border border-indigo-300 px-3 text-sm font-semibold text-indigo-700 hover:bg-indigo-50"
              >
                Add
              </button>
            </div>
          </div>

          {catalog.map((group) => {
            const selected = selectedNames.includes(group.name);
            return (
              <div
                key={group.id}
                className={`rounded-xl border p-4 ${
                  selected
                    ? "border-indigo-200 bg-indigo-50"
                    : "border-gray-200 bg-white"
                }`}
              >
                <div className="flex items-center justify-between gap-3">
                  <span className="flex items-center gap-2 font-semibold text-gray-900 min-w-0 flex-1">
                    <input
                      type="checkbox"
                      checked={selected}
                      onChange={() => toggleVariation(group.name)}
                      className="h-4 w-4 shrink-0"
                    />
                    {editingGroup === group.name ? (
                      <span className="flex items-center gap-1 flex-1">
                        <input
                          autoFocus
                          value={editingName}
                          onChange={(e) => setEditingName(e.target.value)}
                          onKeyDown={(e) => {
                            if (e.key === "Enter") renameVariation(group.name, editingName);
                            if (e.key === "Escape") setEditingGroup(null);
                          }}
                          className="flex-1 rounded border border-indigo-300 px-2 py-0.5 text-sm font-semibold"
                        />
                        <button
                          type="button"
                          onClick={() => renameVariation(group.name, editingName)}
                          className="shrink-0 rounded bg-indigo-600 px-2 py-0.5 text-xs text-white hover:bg-indigo-700"
                        >
                          Save
                        </button>
                        <button
                          type="button"
                          onClick={() => setEditingGroup(null)}
                          className="shrink-0 rounded border border-gray-300 px-2 py-0.5 text-xs text-gray-600 hover:bg-gray-50"
                        >
                          ✕
                        </button>
                      </span>
                    ) : (
                      <span className="flex items-center gap-1.5 flex-1 min-w-0">
                        <span className="truncate">{group.name}</span>
                        <button
                          type="button"
                          onClick={() => { setEditingGroup(group.name); setEditingName(group.name); }}
                          className="shrink-0 text-gray-400 hover:text-indigo-600 transition-colors"
                          title="Rename"
                        >
                          <svg xmlns="http://www.w3.org/2000/svg" className="h-3.5 w-3.5" viewBox="0 0 20 20" fill="currentColor">
                            <path d="M13.586 3.586a2 2 0 112.828 2.828l-.793.793-2.828-2.828.793-.793zM11.379 5.793L3 14.172V17h2.828l8.38-8.379-2.83-2.828z" />
                          </svg>
                        </button>
                      </span>
                    )}
                  </span>
                  <span className="text-xs text-gray-500 shrink-0">
                    {group.options.filter((option) => option.selected).length}{" "}
                    selected
                  </span>
                </div>

                {selected && (
                  <div className="mt-3 space-y-3">
                    <div className="flex flex-wrap gap-2">
                      {group.options.map((option) => (
                        <label
                          key={option.id}
                          className={`inline-flex cursor-pointer items-center gap-2 rounded-full border px-3 py-1.5 text-sm ${
                            option.selected
                              ? "border-indigo-300 bg-white text-indigo-700"
                              : "border-gray-200 bg-white text-gray-600"
                          }`}
                        >
                          <input
                            type="checkbox"
                            checked={!!option.selected}
                            onChange={() => toggleOption(group.name, option.id)}
                            className="h-3.5 w-3.5"
                          />
                          {option.value}
                        </label>
                      ))}
                    </div>
                    <div className="flex gap-2">
                      <input
                        value={optionDrafts[group.name] || ""}
                        onChange={(e) =>
                          setOptionDrafts((current) => ({
                            ...current,
                            [group.name]: e.target.value,
                          }))
                        }
                        className={inputClass}
                        placeholder={`New ${group.name} option`}
                      />
                      <button
                        type="button"
                        onClick={() => addOption(group.name)}
                        className="shrink-0 rounded-lg border border-indigo-300 px-3 text-sm font-semibold text-indigo-700 hover:bg-white"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        <div className="min-w-0">
          <div className="mb-3 flex flex-wrap items-center justify-between gap-2">
            <p className="text-sm text-gray-600">
              {selectedNames.length} variation type
              {selectedNames.length !== 1 ? "s" : ""}, {selectedOptionCount}{" "}
              selected option{selectedOptionCount !== 1 ? "s" : ""}
            </p>
            <p className="text-sm font-semibold text-gray-900">
              {(product.variants || []).length} row
              {(product.variants || []).length !== 1 ? "s" : ""}
            </p>
          </div>

          {(product.variants || []).length === 0 ? (
            <div className="rounded-xl border border-dashed border-gray-300 bg-gray-50 p-10 text-center text-sm text-gray-500">
              Select options and click Generate rows.
            </div>
          ) : (
            <div className="overflow-x-auto rounded-xl border border-gray-200">
              <table className="min-w-[1040px] w-full text-sm">
                <thead className="bg-gray-50 text-left text-xs font-semibold uppercase tracking-wide text-gray-500">
                  <tr>
                    <th className="px-3 py-3">Variant</th>
                    <th className="px-3 py-3">SKU</th>
                    <th className="px-3 py-3">Buying Price</th>
                    <th className="px-3 py-3">Selling Price ✱</th>
                    <th className="px-3 py-3">MRP / Original Price</th>
                    <th className="px-3 py-3">Discount</th>
                    <th className="px-3 py-3">Stock</th>
                    <th className="px-3 py-3">Color</th>
                    <th className="px-3 py-3"></th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100 bg-white">
                  {(product.variants || []).map((variant, index) => (
                    <tr key={`${comboKey(variant.attributes)}-${index}`}>
                      <td className="px-3 py-3 align-top">
                        <input
                          value={
                            variant.name ||
                            titleFromAttributes(variant.attributes) ||
                            ""
                          }
                          onChange={(e) =>
                            updateVariant(index, { name: e.target.value })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                        <p className="mt-1 text-xs text-gray-500">
                          {Object.entries(variant.attributes || {})
                            .map(([key, value]) => `${key}: ${value}`)
                            .join(" | ")}
                        </p>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          value={variant.sku || ""}
                          onChange={(e) =>
                            updateVariant(index, { sku: e.target.value })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          placeholder="SKU"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          value={variant.buyingPrice ?? ""}
                          onChange={(e) =>
                            updateVariant(index, {
                              buyingPrice:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          value={variant.price ?? ""}
                          onChange={(e) =>
                            updateVariant(index, {
                              price:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          value={variant.compareAtPrice ?? ""}
                          onChange={(e) =>
                            updateVariant(index, {
                              compareAtPrice:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                          step="0.01"
                        />
                      </td>
                      <td className="px-3 py-3 align-top text-sm font-semibold text-red-600">
                        {variant.compareAtPrice &&
                        variant.price &&
                        variant.compareAtPrice > variant.price
                          ? `${Math.round(
                              ((variant.compareAtPrice - variant.price) /
                                variant.compareAtPrice) *
                                100,
                            )}%`
                          : "-"}
                      </td>
                      <td className="px-3 py-3 align-top">
                        <input
                          type="number"
                          value={variant.inventory ?? ""}
                          onChange={(e) =>
                            updateVariant(index, {
                              inventory:
                                e.target.value === ""
                                  ? undefined
                                  : Number(e.target.value),
                            })
                          }
                          className="w-full rounded-lg border border-gray-300 px-3 py-2"
                        />
                      </td>
                      <td className="px-3 py-3 align-top">
                        <div className="flex items-center gap-2">
                          <input
                            type="color"
                            value={variant.color?.hex || "#000000"}
                            onChange={(e) =>
                              updateVariant(index, {
                                color: {
                                  ...(variant.color || {}),
                                  hex: e.target.value,
                                },
                              })
                            }
                            className="h-9 w-10 rounded border border-gray-300"
                          />
                          <input
                            value={variant.color?.name || ""}
                            onChange={(e) =>
                              updateVariant(index, {
                                color: {
                                  ...(variant.color || {}),
                                  name: e.target.value,
                                },
                              })
                            }
                            className="w-28 rounded-lg border border-gray-300 px-3 py-2"
                            placeholder="Color"
                          />
                        </div>
                      </td>
                      <td className="px-3 py-3 align-top">
                        <button
                          type="button"
                          onClick={() => removeVariant(index)}
                          className="rounded-lg border border-red-200 px-3 py-2 text-red-600 hover:bg-red-50"
                        >
                          Remove
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </section>
  );
}
