"use client";
import { useEffect, useRef } from "react";

/**
 * Reusable rich-text editor (contentEditable + execCommand toolbar).
 * Props:
 *   value    – HTML string (controlled)
 *   onChange – (htmlString) => void
 *   placeholder – string (optional)
 *   minHeight   – tailwind class e.g. "min-h-[200px]" (optional)
 */
export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  minHeight = "min-h-[200px]",
  showLinkButton = false,
}) {
  const editorRef = useRef(null);
  const lastRange = useRef(null);
  // track whether we pushed value into the DOM already
  const initialised = useRef(false);

  // Set initial HTML only once (avoid cursor jumping on every keystroke)
  useEffect(() => {
    if (editorRef.current && !initialised.current) {
      editorRef.current.innerHTML = value || "";
      initialised.current = true;
    }
  }, [value]);

  // If parent resets value to empty (e.g. after form submit) – re-sync
  useEffect(() => {
    if (initialised.current && editorRef.current && value === "") {
      editorRef.current.innerHTML = "";
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) {
      lastRange.current = sel.getRangeAt(0).cloneRange();
    }
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel) return;
    sel.removeAllRanges();
    if (lastRange.current) sel.addRange(lastRange.current);
  };

  const exec = (cmd, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);
    onChange?.(editorRef.current.innerHTML);
  };

  const toolbarBtn =
    "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 transition";

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      {/* Toolbar */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200 sticky top-0 z-10">
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("bold")} className={`${toolbarBtn} font-bold`} title="Bold">B</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("italic")} className={`${toolbarBtn} italic`} title="Italic">I</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("underline")} className={`${toolbarBtn} underline`} title="Underline">U</button>
        <span className="border-l border-gray-300 mx-1" />
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("formatBlock", "<h2>")} className={`${toolbarBtn} font-semibold`} title="Heading">H2</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("formatBlock", "<h3>")} className={`${toolbarBtn}`} title="Sub-heading">H3</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("formatBlock", "<p>")} className={toolbarBtn} title="Paragraph">P</button>
        <span className="border-l border-gray-300 mx-1" />
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("insertUnorderedList")} className={toolbarBtn} title="Bullet list">• List</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("insertOrderedList")} className={toolbarBtn} title="Numbered list">1. List</button>
        <span className="border-l border-gray-300 mx-1" />
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("undo")} className={toolbarBtn} title="Undo">↶</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("redo")} className={toolbarBtn} title="Redo">↷</button>
        {showLinkButton && (
          <>
            <span className="border-l border-gray-300 mx-1" />
            <button
              type="button"
              onMouseDown={saveSelection}
              onClick={() => {
                const url = window.prompt("Enter link URL:", "https://");
                if (url && url.trim()) exec("createLink", url.trim());
              }}
              className={`${toolbarBtn} text-indigo-600`}
              title="Insert link"
            >🔗 Link</button>
            <button
              type="button"
              onMouseDown={saveSelection}
              onClick={() => exec("unlink")}
              className={`${toolbarBtn} text-red-500`}
              title="Remove link"
            >⛓ Unlink</button>
          </>
        )}
      </div>

      {/* Editable area */}
      <div className="relative">
        <div
          ref={editorRef}
          contentEditable
          suppressContentEditableWarning
          onInput={e => onChange?.(e.currentTarget.innerHTML)}
          onMouseUp={saveSelection}
          onKeyUp={saveSelection}
          className={`${minHeight} p-3 outline-none prose prose-sm max-w-none text-gray-800`}
          data-placeholder={placeholder}
        />
      </div>

      <style jsx>{`
        [contenteditable]:empty:before {
          content: attr(data-placeholder);
          color: #9ca3af;
          pointer-events: none;
        }
        .prose ul { list-style-type: disc; padding-left: 1.5rem; }
        .prose ol { list-style-type: decimal; padding-left: 1.5rem; }
        .prose h2 { font-size: 1.25rem; font-weight: 700; margin: 0.5rem 0; }
        .prose h3 { font-size: 1.1rem; font-weight: 600; margin: 0.4rem 0; }
        .prose p  { margin: 0.25rem 0; }
        .prose a  { color: #4f46e5; text-decoration: underline; }
        .prose a:hover { color: #3730a3; }
      `}</style>
    </div>
  );
}
