"use client";

import React, { useState } from 'react';

export default function DynamicSectionBuilder({ sections = [], onChange }) {
  const [expandedSection, setExpandedSection] = useState(null);

  const addSection = (type) => {
    const newSection = {
      type,
      title: '',
      items: [{ title: '', content: '', order: 0 }]
    };
    onChange([...sections, newSection]);
    setExpandedSection(sections.length);
  };

  const removeSection = (sectionIdx) => {
    const updated = sections.filter((_, idx) => idx !== sectionIdx);
    onChange(updated);
    if (expandedSection === sectionIdx) setExpandedSection(null);
  };

  const updateSection = (sectionIdx, field, value) => {
    const updated = [...sections];
    updated[sectionIdx] = { ...updated[sectionIdx], [field]: value };
    onChange(updated);
  };

  const addItem = (sectionIdx) => {
    const updated = [...sections];
    const items = [...updated[sectionIdx].items];
    items.push({ title: '', content: '', order: items.length });
    updated[sectionIdx] = { ...updated[sectionIdx], items };
    onChange(updated);
  };

  const removeItem = (sectionIdx, itemIdx) => {
    const updated = [...sections];
    const items = updated[sectionIdx].items.filter((_, idx) => idx !== itemIdx);
    updated[sectionIdx] = { ...updated[sectionIdx], items };
    onChange(updated);
  };

  const updateItem = (sectionIdx, itemIdx, field, value) => {
    const updated = [...sections];
    const items = [...updated[sectionIdx].items];
    items[itemIdx] = { ...items[itemIdx], [field]: value };
    updated[sectionIdx] = { ...updated[sectionIdx], items };
    onChange(updated);
  };

  const getSectionLabel = (type) => {
    switch (type) {
      case 'faq': return 'FAQ';
      case 'accordion': return 'Accordion';
      case 'steps': return 'Steps';
      default: return type;
    }
  };

  const getItemLabels = (type) => {
    switch (type) {
      case 'faq': return { title: 'Question', content: 'Answer' };
      case 'accordion': return { title: 'Title', content: 'Content' };
      case 'steps': return { title: 'Step Title', content: 'Description' };
      default: return { title: 'Title', content: 'Content' };
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-2">
        <button
          type="button"
          onClick={() => addSection('faq')}
          className="px-3 py-1.5 text-sm bg-purple-600 text-white rounded hover:bg-purple-700"
        >
          + FAQ
        </button>
        <button
          type="button"
          onClick={() => addSection('accordion')}
          className="px-3 py-1.5 text-sm bg-indigo-600 text-white rounded hover:bg-indigo-700"
        >
          + Accordion
        </button>
        <button
          type="button"
          onClick={() => addSection('steps')}
          className="px-3 py-1.5 text-sm bg-teal-600 text-white rounded hover:bg-teal-700"
        >
          + Steps
        </button>
      </div>

      {sections.length === 0 && (
        <p className="text-gray-500 text-sm italic">No dynamic sections added yet</p>
      )}

      <div className="space-y-3">
        {sections.map((section, sIdx) => {
          const labels = getItemLabels(section.type);
          const isExpanded = expandedSection === sIdx;

          return (
            <div key={sIdx} className="border rounded-lg overflow-hidden bg-white shadow-sm">
              <div 
                className="flex items-center justify-between p-3 bg-gray-50 cursor-pointer hover:bg-gray-100"
                onClick={() => setExpandedSection(isExpanded ? null : sIdx)}
              >
                <div className="flex items-center gap-2">
                  <span className="font-semibold text-sm">
                    {getSectionLabel(section.type)}
                  </span>
                  {section.title && (
                    <span className="text-gray-600 text-sm">- {section.title}</span>
                  )}
                  <span className="text-xs text-gray-500">
                    ({section.items.length} {section.items.length === 1 ? 'item' : 'items'})
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={(e) => {
                      e.stopPropagation();
                      removeSection(sIdx);
                    }}
                    className="text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
                  <span className="text-gray-400">{isExpanded ? '▼' : '▶'}</span>
                </div>
              </div>

              {isExpanded && (
                <div className="p-4 space-y-4">
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">
                      Section Title (optional)
                    </label>
                    <input
                      type="text"
                      value={section.title || ''}
                      onChange={(e) => updateSection(sIdx, 'title', e.target.value)}
                      className="w-full px-3 py-2 border rounded-md"
                      placeholder={`${getSectionLabel(section.type)} Section Title`}
                    />
                  </div>

                  <div className="space-y-3">
                    {section.items.map((item, iIdx) => (
                      <div key={iIdx} className="p-3 border rounded bg-gray-50 space-y-2">
                        <div className="flex items-center justify-between mb-2">
                          <span className="text-sm font-medium text-gray-700">
                            {section.type === 'steps' ? `Step ${iIdx + 1}` : `Item ${iIdx + 1}`}
                          </span>
                          {section.items.length > 1 && (
                            <button
                              type="button"
                              onClick={() => removeItem(sIdx, iIdx)}
                              className="text-xs text-red-600 hover:text-red-800"
                            >
                              Remove
                            </button>
                          )}
                        </div>

                        <input
                          type="text"
                          value={item.title || ''}
                          onChange={(e) => updateItem(sIdx, iIdx, 'title', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          placeholder={labels.title}
                        />

                        <textarea
                          value={item.content || ''}
                          onChange={(e) => updateItem(sIdx, iIdx, 'content', e.target.value)}
                          className="w-full px-3 py-2 border rounded-md text-sm"
                          rows={3}
                          placeholder={labels.content}
                        />
                      </div>
                    ))}
                  </div>

                  <button
                    type="button"
                    onClick={() => addItem(sIdx)}
                    className="w-full px-3 py-2 border-2 border-dashed border-gray-300 rounded-md text-sm text-gray-600 hover:border-gray-400 hover:text-gray-800"
                  >
                    + Add {section.type === 'steps' ? 'Step' : 'Item'}
                  </button>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
