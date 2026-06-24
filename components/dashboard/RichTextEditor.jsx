"use client";
import { useEffect, useRef, useState } from "react";

const CSS = `
  .rte-area ul { list-style-type: disc !important; padding-left: 1.5rem !important; margin: 0.4rem 0 !important; }
  .rte-area ol { list-style-type: decimal !important; padding-left: 1.5rem !important; margin: 0.4rem 0 !important; }
  .rte-area li { display: list-item !important; margin: 0.15rem 0 !important; }
  .rte-area h2 { font-size: 1.4rem !important; font-weight: 700 !important; margin: 0.6rem 0 0.3rem !important; line-height: 1.3 !important; }
  .rte-area h3 { font-size: 1.15rem !important; font-weight: 600 !important; margin: 0.5rem 0 0.25rem !important; line-height: 1.3 !important; }
  .rte-area p  { margin: 0.3rem 0 !important; }
  .rte-area a  { color: #4f46e5 !important; text-decoration: underline !important; }
  .rte-area strong, .rte-area b { font-weight: 700 !important; }
  .rte-area em, .rte-area i     { font-style: italic !important; }
  .rte-area u { text-decoration: underline !important; }

  [data-rte-editable]:empty:before {
    content: attr(data-placeholder);
    color: #9ca3af;
    pointer-events: none;
  }
`;

export default function RichTextEditor({
  value = "",
  onChange,
  placeholder = "Start typing...",
  minHeight = "min-h-[200px]",
  showLinkButton = false,
}) {
  const editorRef = useRef(null);
  const lastRange = useRef(null);
  const initialised = useRef(false);
  const [previewHtml, setPreviewHtml] = useState(value || "");
  const [showPreview, setShowPreview] = useState(true);

  useEffect(() => {
    if (editorRef.current && !initialised.current) {
      editorRef.current.innerHTML = value || "";
      setPreviewHtml(value || "");
      initialised.current = true;
    }
  }, [value]);

  useEffect(() => {
    if (initialised.current && editorRef.current && value === "") {
      editorRef.current.innerHTML = "";
      setPreviewHtml("");
    }
  }, [value]);

  const saveSelection = () => {
    const sel = window.getSelection();
    if (sel && sel.rangeCount > 0) lastRange.current = sel.getRangeAt(0).cloneRange();
  };

  const restoreSelection = () => {
    const sel = window.getSelection();
    if (!sel || !lastRange.current) return;
    sel.removeAllRanges();
    sel.addRange(lastRange.current);
  };

  const exec = (cmd, val = null) => {
    if (!editorRef.current) return;
    editorRef.current.focus();
    restoreSelection();
    document.execCommand(cmd, false, val);
    const html = editorRef.current.innerHTML;
    setPreviewHtml(html);
    onChange?.(html);
  };

  const handleInput = (e) => {
    const html = e.currentTarget.innerHTML;
    setPreviewHtml(html);
    onChange?.(html);
  };

  const btn =
    "px-2 py-1 border border-gray-300 rounded text-sm hover:bg-gray-100 transition select-none";
  const activeBtn =
    "px-2 py-1 border rounded text-sm transition select-none bg-indigo-100 border-indigo-400 text-indigo-700";

  return (
    <div className="border border-gray-300 rounded-lg overflow-hidden">
      <style>{CSS}</style>

      {/* ── Toolbar ── */}
      <div className="flex flex-wrap gap-1 p-2 bg-gray-50 border-b border-gray-200">
        {/* Inline formatting */}
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("bold")}
          className={`${btn} font-bold`} title="Bold">B</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("italic")}
          className={`${btn} italic`} title="Italic">I</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("underline")}
          className={`${btn} underline`} title="Underline">U</button>

        <span className="border-l border-gray-300 mx-1" />

        {/* Block formatting */}
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("formatBlock", "<h2>")}
          className={`${btn} font-bold text-base`} title="Heading 2">H2</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("formatBlock", "<h3>")}
          className={`${btn} font-semibold`} title="Heading 3">H3</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("formatBlock", "<p>")}
          className={btn} title="Paragraph">P</button>

        <span className="border-l border-gray-300 mx-1" />

        {/* Lists */}
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("insertUnorderedList")}
          className={btn} title="Bullet list">• List</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("insertOrderedList")}
          className={btn} title="Numbered list">1. List</button>

        <span className="border-l border-gray-300 mx-1" />

        {/* Undo / Redo */}
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("undo")}
          className={btn} title="Undo">↶</button>
        <button type="button" onMouseDown={saveSelection} onClick={() => exec("redo")}
          className={btn} title="Redo">↷</button>

        {/* Link */}
        {showLinkButton && (
          <>
            <span className="border-l border-gray-300 mx-1" />
            <button type="button" onMouseDown={saveSelection}
              onClick={() => {
                const url = window.prompt("Enter link URL:", "https://");
                if (url?.trim()) exec("createLink", url.trim());
              }}
              className={`${btn} text-indigo-600`} title="Insert link">🔗 Link</button>
            <button type="button" onMouseDown={saveSelection} onClick={() => exec("unlink")}
              className={`${btn} text-red-500`} title="Remove link">⛓ Unlink</button>
          </>
        )}

        {/* Preview toggle — right side */}
        <button
          type="button"
          onClick={() => setShowPreview((v) => !v)}
          className={`ml-auto ${showPreview ? activeBtn : btn}`}
          title="Toggle live preview"
        >
          👁 Preview
        </button>
      </div>

      {/* ── Editor + Preview split ── */}
      <div className={showPreview ? "grid grid-cols-2 divide-x divide-gray-200" : ""}>

        {/* Editor pane */}
        <div className="relative">
          <div
            ref={editorRef}
            contentEditable
            suppressContentEditableWarning
            data-rte-editable
            data-placeholder={placeholder}
            onInput={handleInput}
            onMouseUp={saveSelection}
            onKeyUp={saveSelection}
            className={`${minHeight} p-3 outline-none text-gray-800 rte-area`}
          />
        </div>

        {/* Live preview pane */}
        {showPreview && (
          <div className={`${minHeight} overflow-auto bg-white`}>
            <div className="px-2 py-1 text-[10px] font-semibold uppercase tracking-widest text-gray-400 bg-gray-50 border-b border-gray-100">
              Live Preview
            </div>
            <div className="p-3 text-gray-800 text-sm rte-area">
              {previewHtml ? (
                <div dangerouslySetInnerHTML={{ __html: previewHtml }} />
              ) : (
                <span className="text-gray-400 italic text-xs">
                  Preview will appear here as you type…
                </span>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
