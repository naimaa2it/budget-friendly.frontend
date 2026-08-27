"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const VISITOR_KEY = "Pickob-chat-visitor";
const POLL_MS = 5000;

// fallback menu (also comes from the server so it stays in sync)
const DEFAULT_QUICK = [
  { key: "track", emoji: "📦", label: "Track Order", text: "Track order" },
  { key: "delivery", emoji: "🚚", label: "Delivery", text: "Delivery charge koto?" },
  { key: "products", emoji: "🛍️", label: "Products", text: "Products dekhte chai" },
  { key: "agent", emoji: "👤", label: "Agent", text: "Agent er sathe kotha bolbo" },
];

function getVisitorId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = "v_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

export default function ChatWidget() {
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [quick, setQuick] = useState(DEFAULT_QUICK);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  const visitorId = useRef("");
  const scrollRef = useRef(null);
  const pollRef = useRef(null);
  // Ordering guards so a slow/stale poll can never overwrite a newer result.
  const reqSeq = useRef(0); // increments on every request we issue
  const appliedSeq = useRef(0); // highest seq whose response we've applied
  const pendingSends = useRef(0); // in-flight sends — pause polling while > 0

  // Apply a server message list only if it isn't older than what we've shown.
  const applyMessages = (seq, msgs) => {
    if (seq < appliedSeq.current) return; // a newer request already won
    appliedSeq.current = seq;
    setMessages(msgs);
  };

  useEffect(() => {
    visitorId.current = getVisitorId();
  }, []);

  const scrollToBottom = () => {
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });
  };

  const fetchThread = useCallback(() => {
    if (!visitorId.current) return;
    // Don't poll over a message that's mid-send — the send's own response is
    // authoritative and a poll here would briefly wipe the optimistic bubble.
    if (pendingSends.current > 0) return;
    const seq = ++reqSeq.current;
    fetch(`${API}/api/chat/thread?visitorId=${encodeURIComponent(visitorId.current)}`)
      .then((r) => r.json())
      .then((d) => {
        // A send may have started while this poll was in flight. Applying now
        // would replace the thread with a stale server copy that doesn't yet
        // contain the just-typed message — making the text look "erased".
        if (pendingSends.current > 0) return;
        applyMessages(seq, d.messages || []);
        if (d.quickReplies?.length) setQuick(d.quickReplies);
        setLoaded(true);
      })
      .catch(() => {})
      .finally(scrollToBottom);
  }, []);

  // Start a fresh conversation (e.g. after an order is confirmed and the
  // customer wants to place another one). A new visitorId spins up a brand new
  // thread server-side; the old one stays in the admin inbox.
  const newChat = () => {
    const id = "v_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(VISITOR_KEY, id);
    visitorId.current = id;
    reqSeq.current = 0;
    appliedSeq.current = 0;
    pendingSends.current = 0;
    setMessages([]);
    setInput("");
    setQuick(DEFAULT_QUICK);
    setLoaded(false);
    fetchThread();
  };

  useEffect(() => {
    if (!open) {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    fetchThread();
    pollRef.current = setInterval(fetchThread, POLL_MS);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [open, fetchThread]);

  // send a message (typed, or a quick-reply button's text)
  const send = (overrideText) => {
    const body = (overrideText ?? input).trim();
    if (!body || sending) return;
    setSending(true);
    pendingSends.current += 1;
    const seq = ++reqSeq.current;
    setMessages((m) => [
      ...m,
      { _id: "tmp-" + Date.now(), sender: "visitor", body, createdAt: new Date().toISOString() },
    ]);
    if (overrideText == null) setInput("");
    scrollToBottom();

    fetch(`${API}/api/chat/message`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ visitorId: visitorId.current, body }),
    })
      .then((r) => r.json())
      .then((d) => {
        if (d.messages) {
          applyMessages(seq, d.messages);
        } else if (d.error) {
          // server error — keep the sent message visible and show a friendly note
          setMessages((m) => [
            ...m,
            {
              _id: "err-" + Date.now(),
              sender: "bot",
              body: "একটু সমস্যা হলো 🙈 আবার চেষ্টা করুন।",
              createdAt: new Date().toISOString(),
            },
          ]);
        }
        if (d.quickReplies?.length) setQuick(d.quickReplies);
      })
      .catch(() => {
        setMessages((m) => [
          ...m,
          {
            _id: "err-" + Date.now(),
            sender: "bot",
            body: "নেটওয়ার্ক সমস্যা 🙈 আবার চেষ্টা করুন।",
            createdAt: new Date().toISOString(),
          },
        ]);
      })
      .finally(() => {
        pendingSends.current = Math.max(0, pendingSends.current - 1);
        setSending(false);
        scrollToBottom();
      });
  };

  const bubbleLabel = { visitor: null, bot: "Bot", admin: "Team" };

  return (
    <>
      {/* Launcher */}
      <button
        onClick={() => setOpen((o) => !o)}
        aria-label="Chat with us"
        className="fixed bottom-14 right-4 z-[60] flex h-10 w-10 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
      >
        {open ? (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* Panel */}
      {open && (
        <div className="fixed bottom-24 right-4 z-[60] flex h-[70vh] max-h-[540px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* header */}
          <div className="flex items-center gap-3 bg-blue-600 px-4 py-3 text-white">
            <div className="flex h-9 w-9 items-center justify-center rounded-full bg-white/20 text-lg">💬</div>
            <div>
              <p className="text-sm font-semibold leading-tight">Support</p>
              <p className="text-xs text-blue-100">Usually replies instantly</p>
            </div>
            <button
              onClick={newChat}
              title="Notun chat / notun order shuru korun"
              className="ml-auto flex items-center gap-1 rounded-full bg-white/20 px-2.5 py-1 text-xs font-medium transition hover:bg-white/30"
            >
              <svg className="h-3.5 w-3.5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M21 12a9 9 0 1 1-3-6.7L21 8" strokeLinecap="round" strokeLinejoin="round" />
                <path d="M21 3v5h-5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New chat
            </button>
          </div>

          {/* messages */}
          <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-3">
            {loaded && messages.length === 0 && (
              <p className="mt-6 text-center text-xs text-gray-400">
                Kono kichu janar thakle likhun 👇
              </p>
            )}
            {messages.map((m) => {
              const mine = m.sender === "visitor";
              return (
                <div key={m._id} className={`flex ${mine ? "justify-end" : "justify-start"}`}>
                  <div
                    className={`max-w-[80%] whitespace-pre-line rounded-2xl px-3 py-2 text-sm ${
                      mine
                        ? "rounded-br-sm bg-blue-600 text-white"
                        : m.sender === "bot"
                          ? "rounded-bl-sm border border-gray-200 bg-white text-gray-700"
                          : "rounded-bl-sm bg-indigo-600 text-white"
                    }`}
                  >
                    {!mine && bubbleLabel[m.sender] && (
                      <span className="mb-0.5 block text-[10px] font-semibold opacity-70">
                        {bubbleLabel[m.sender]}
                      </span>
                    )}
                    {m.body}
                  </div>
                </div>
              );
            })}
          </div>

          {/* quick-reply menu buttons */}
          <div className="flex gap-2 overflow-x-auto border-t border-gray-100 px-3 py-2">
            {quick.map((q) => (
              <button
                key={q.key}
                onClick={() => send(q.text)}
                disabled={sending}
                className="flex shrink-0 items-center gap-1 rounded-full border border-blue-200 bg-blue-50 px-3 py-1.5 text-xs font-medium text-blue-700 transition hover:bg-blue-100 disabled:opacity-50"
              >
                <span>{q.emoji}</span>
                <span>{q.label}</span>
              </button>
            ))}
          </div>

          {/* input */}
          <div className="flex items-center gap-2 border-t border-gray-100 p-2">
            <input
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && send()}
              placeholder="Message likhun…"
              className="flex-1 rounded-full border border-gray-300 px-4 py-2 text-sm focus:border-blue-500 focus:outline-none"
            />
            <button
              onClick={() => send()}
              disabled={sending || !input.trim()}
              className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white transition hover:bg-blue-700 disabled:opacity-50"
              aria-label="Send"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="currentColor">
                <path d="M3 20l18-8L3 4v6l12 2-12 2z" />
              </svg>
            </button>
          </div>
        </div>
      )}
    </>
  );
}
