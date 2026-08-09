"use client";

import React, { createContext, useContext, useState, useEffect } from "react";

const CategoryContext = createContext();

// Flatten the tree structure into { categories, categoriesMap, subcategories }
// — shared by the build-time initial seed and the client-side refetch so
// both produce identical shapes.
function deriveCategoryState(tree) {
  const flattenCategories = (cats, result = []) => {
    cats.forEach((cat) => {
      result.push({ ...cat, parent: cat.parent || null });
      if (cat.children && cat.children.length > 0) {
        flattenCategories(cat.children, result);
      }
    });
    return result;
  };

  const allCategories = flattenCategories(tree || []);

  const categories = allCategories.filter((cat) => cat.level === 0);

  const categoriesMap = {};
  allCategories.forEach((cat) => {
    categoriesMap[cat._id] = cat;
  });

  const subcategories = {};
  allCategories.forEach((cat) => {
    if (cat.parent) {
      if (!subcategories[cat.parent]) {
        subcategories[cat.parent] = [];
      }
      subcategories[cat.parent].push(cat);
    }
  });

  return { categories, categoriesMap, subcategories };
}

export function CategoryProvider({ children, initialCategories }) {
  const initialState = deriveCategoryState(initialCategories);
  const [categories, setCategories] = useState(initialState.categories);
  const [categoriesMap, setCategoriesMap] = useState(
    initialState.categoriesMap,
  );
  const [subcategories, setSubcategories] = useState(
    initialState.subcategories,
  );
  // Nothing to wait on when the server already handed us a populated tree.
  const [loading, setLoading] = useState(
    initialState.categories.length === 0,
  );
  const [error, setError] = useState(null);
  // True once a live fetch has actually succeeded — distinct from `loading`,
  // which starts false whenever the build-time seed was non-empty. Consumers
  // (e.g. a category page built from now-stale static data) need this to
  // tell "context hasn't confirmed live state yet" apart from "confirmed —
  // this category no longer exists" before treating a lookup miss as real.
  const [refreshedOnce, setRefreshedOnce] = useState(false);
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

  useEffect(() => {
    // Refresh from the live API even when the server seed was present, so
    // categories added after the last build still show up without a rebuild.
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      setError(null);
      const res = await fetch(`${API}/api/products/categories`);
      if (res.ok) {
        const data = await res.json();
        const derived = deriveCategoryState(data.categories || []);
        setCategories(derived.categories);
        setCategoriesMap(derived.categoriesMap);
        setSubcategories(derived.subcategories);
        // Only a successful fetch counts as "confirmed" — a network error
        // shouldn't make a stale build-time category look deleted.
        setRefreshedOnce(true);
      } else {
        throw new Error("Failed to fetch categories");
      }
    } catch (err) {
      console.error("Failed to fetch categories:", err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  // Helper functions
  const getCategoryById = (id) => {
    return categoriesMap[id] || null;
  };

  const getCategoryBySlug = (slug, parentId = null) => {
    const all = Object.values(categoriesMap);
    if (parentId) {
      const withParent = all.find(
        (cat) => cat.slug === slug && String(cat.parent) === String(parentId),
      );
      if (withParent) return withParent;
    }
    return all.find((cat) => cat.slug === slug) || null;
  };

  const getCategoryBySlugAndParentSlug = (slug, parentSlug) => {
    const all = Object.values(categoriesMap);
    return (
      all.find((cat) => {
        if (cat.slug !== slug) return false;
        if (!cat.parent) return false;
        const parentCat = categoriesMap[cat.parent];
        return parentCat && parentCat.slug === parentSlug;
      }) || null
    );
  };

  const getSubcategories = (parentId) => {
    return subcategories[parentId] || [];
  };

  const getMainCategories = () => {
    return categories;
  };

  const getAllCategories = () => {
    return Object.values(categoriesMap);
  };

  // Refresh categories (can be called manually if needed)
  const refresh = () => {
    fetchCategories();
  };

  const value = {
    categories,
    categoriesMap,
    subcategories,
    loading,
    refreshedOnce,
    error,
    getCategoryById,
    getCategoryBySlug,
    getCategoryBySlugAndParentSlug,
    getSubcategories,
    getMainCategories,
    getAllCategories,
    refresh,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategories() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error("useCategories must be used within a CategoryProvider");
  }
  return context;
}
