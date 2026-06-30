"use client";

import React, { useState, useEffect, useRef } from "react";

export default function TagInput({ tags = [], onChange }) {
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [inputValue, setInputValue] = useState("");
  const [suggestions, setSuggestions] = useState([]);
  const [allTags, setAllTags] = useState([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const inputRef = useRef(null);

  useEffect(() => {
    fetchAllTags();
  }, []);

  const fetchAllTags = async () => {
    try {
      const r = await fetch(`${API}/api/admin/blog/tags`, {
        credentials: "include",
      });
      const b = await r.json();
      if (r.ok) {
        setAllTags(b.tags || []);
      }
    } catch (err) {
      console.error("Error fetching tags:", err);
    }
  };

  const handleInputChange = (e) => {
    const value = e.target.value;
    setInputValue(value);

    if (value.trim()) {
      const filtered = allTags.filter(
        (tag) =>
          tag.toLowerCase().includes(value.toLowerCase()) &&
          !tags.includes(tag),
      );
      setSuggestions(filtered);
      setShowSuggestions(true);
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const addTag = (tag) => {
    const trimmedTag = tag.trim();
    if (trimmedTag && !tags.includes(trimmedTag)) {
      onChange([...tags, trimmedTag]);
      setInputValue("");
      setSuggestions([]);
      setShowSuggestions(false);
    }
  };

  const handleKeyDown = (e) => {
    if (e.key === "Enter") {
      e.preventDefault();
      if (inputValue.trim()) {
        addTag(inputValue);
      }
    } else if (e.key === "Backspace" && !inputValue && tags.length > 0) {
      // Remove last tag on backspace when input is empty
      onChange(tags.slice(0, -1));
    }
  };

  const removeTag = (tagToRemove) => {
    onChange(tags.filter((tag) => tag !== tagToRemove));
  };

  const handleSuggestionClick = (tag) => {
    addTag(tag);
    inputRef.current?.focus();
  };

  return (
    <div className="space-y-2">
      <label className="block text-sm font-medium text-gray-700">Tags</label>

      <div className="border rounded-md p-2 bg-white">
        {/* Selected tags as chips */}
        <div className="flex flex-wrap gap-2 mb-2">
          {tags.map((tag, idx) => (
            <span
              key={idx}
              className="inline-flex items-center gap-1 px-3 py-1 bg-blue-100 text-blue-800 rounded-full text-sm"
            >
              {tag}
              <button
                type="button"
                onClick={() => removeTag(tag)}
                className="hover:text-blue-900 font-bold ml-1"
              >
                ×
              </button>
            </span>
          ))}
        </div>

        {/* Input field */}
        <div className="relative">
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={handleInputChange}
            onKeyDown={handleKeyDown}
            onFocus={() => inputValue && setShowSuggestions(true)}
            onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
            className="w-full px-3 py-2 border-0 focus:outline-none focus:ring-0"
            placeholder={
              tags.length === 0
                ? "Type and press Enter to add tags..."
                : "Add more tags..."
            }
          />

          {/* Suggestions dropdown */}
          {showSuggestions && suggestions.length > 0 && (
            <div className="absolute z-10 w-full mt-1 bg-white border rounded-md shadow-lg max-h-48 overflow-y-auto">
              {suggestions.map((tag, idx) => (
                <button
                  key={idx}
                  type="button"
                  onClick={() => handleSuggestionClick(tag)}
                  className="w-full text-left px-4 py-2 hover:bg-gray-100 text-sm"
                >
                  {tag}
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      <p className="text-xs text-gray-500">
        Type a tag and press Enter. Select from existing tags or create new
        ones.
      </p>
    </div>
  );
}
