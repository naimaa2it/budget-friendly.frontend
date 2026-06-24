"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

const CategoryContext = createContext();

export function CategoryProvider({ children }) {
  const [categories, setCategories] = useState([]);
  const [categoriesMap, setCategoriesMap] = useState({});
  const [subcategories, setSubcategories] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

  useEffect(() => {
    fetchCategories();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      setError(null);
      const res = await fetch(`${API}/api/products/categories`);
      if (res.ok) {
        const data = await res.json();
        
        // Flatten the tree structure
        const flattenCategories = (cats, result = []) => {
          cats.forEach(cat => {
            result.push({ ...cat, parent: cat.parent || null });
            if (cat.children && cat.children.length > 0) {
              flattenCategories(cat.children, result);
            }
          });
          return result;
        };
        
        const allCategories = flattenCategories(data.categories || []);
        
        // Get only level 0 (main) categories
        const mainCategories = allCategories.filter(cat => cat.level === 0);
        setCategories(mainCategories);
        
        // Create a map for quick lookup by ID
        const map = {};
        allCategories.forEach(cat => {
          map[cat._id] = cat;
        });
        setCategoriesMap(map);
        
        // Organize subcategories by parent
        const subMap = {};
        allCategories.forEach(cat => {
          if (cat.parent) {
            if (!subMap[cat.parent]) {
              subMap[cat.parent] = [];
            }
            subMap[cat.parent].push(cat);
          }
        });
        setSubcategories(subMap);
      } else {
        throw new Error('Failed to fetch categories');
      }
    } catch (err) {
      console.error('Failed to fetch categories:', err);
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
        cat => cat.slug === slug && String(cat.parent) === String(parentId)
      );
      if (withParent) return withParent;
    }
    return all.find(cat => cat.slug === slug) || null;
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
    error,
    getCategoryById,
    getCategoryBySlug,
    getSubcategories,
    getMainCategories,
    getAllCategories,
    refresh
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
    throw new Error('useCategories must be used within a CategoryProvider');
  }
  return context;
}
