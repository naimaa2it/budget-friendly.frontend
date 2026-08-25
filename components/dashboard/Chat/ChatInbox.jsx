"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const POLL_MS = 6000;

async function api(path, opts = {}) {
  const res = await fetch(`${API}/api/chat${path}`, {
    credentials: "include",
    headers: { "Content-Type": "application/json" },
    ...opts,
  });
  const body = await res.json().catch(() => ({}));
  if (!res.ok) throw new Error(body.error || "Request failed");
  return body;
}

export default function ChatInbox() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const scrollRef = useRef(null);
  const activeIdRef = useRef(null);

  const scrollToBottom = () =>
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });

  const loadConversations = useCallback(() => {
    api("/conversations")
      .then((d) => setConversations(d.conversations || []))
      .catch((e) => toast.error(e.message));
  }, []);

  const loadMessages = useCallback((id) => {
    if (!id) return;
    api(`/conversations/${id}/messages`)
      .then((d) => {
        setMessages(d.messages || []);
        scrollToBottom();
      })
      .catch((e) => toast.error(e.message));
  }, []);

  // initial + poll conversation list
  useEffect(() => {
    loadConversations();
    const t = setInterval(loadConversations, POLL_MS);
    return () => clearInterval(t);
  }, [loadConversations]);

  // poll active thread
  useEffect(() => {
    activeIdRef.current = activeId;
    if (!activeId) return;
    loadMessages(activeId);
    const t = setInterval(() => loadMessages(activeIdRef.current), POLL_MS);
    return () => clearInterval(t);
  }, [activeId, loadMessages]);

  const send = () => {
    const body = reply.trim();
    if (!body || !activeId || sending) return;
    setSending(true);
    api(`/conversations/${activeId}/reply`, { method: "POST", body: JSON.stringify({ body }) })
      .then((d) => {
        setMessages((m) => [...m, d.message]);
        setReply("");
        scrollToBottom();
        loadConversations();
      })
      .catch((e) => toast.error(e.message))
      .finally(() => setSending(false));
  };

  const closeConvo = () => {
    if (!activeId) return;
    api(`/conversations/${activeId}`, { method: "PUT", body: JSON.stringify({ status: "closed" }) })
      .then(() => { toast.success("Closed"); loadConversations(); })
      .catch((e) => toast.error(e.message));
  };

  const active = conversations.find((c) => c._id === activeId);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* conversation list */}
      <div className="w-72 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white">
        <div className="border-b border-gray-100 px-4 py-3 text-sm font-semibold">
          Conversations
        </div>
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">Ekhono kono chat nai.</p>
        ) : (
          conversations.map((c) => (
            <button
              key={c._id}
              onClick={() => setActiveId(c._id)}
              className={`flex w-full flex-col gap-0.5 border-b border-gray-50 px-4 py-3 text-left hover:bg-gray-50 ${
                activeId === c._id ? "bg-pink-50" : ""
              }`}
            >
              <span className="flex items-center gap-2">
                <span className="truncate text-sm font-medium">
                  {c.name || c.visitorId}
                </span>
                {c.flagged && <span className="text-xs text-amber-500">⚑</span>}
                {c.unreadForAdmin > 0 && (
                  <span className="ml-auto rounded-full bg-pink-600 px-1.5 text-[10px] text-white">
                    {c.unreadForAdmin}
                  </span>
                )}
              </span>
              <span className="truncate text-xs text-gray-400">{c.lastMessage}</span>
              <span className="text-[10px] text-gray-300">
                {c.status === "closed" ? "closed · " : ""}
                {new Date(c.lastMessageAt).toLocaleString("en-GB")}
              </span>
            </button>
          ))
        )}
      </div>

      {/* thread */}
      <div className="flex flex-1 flex-col overflow-hidden rounded-xl border border-gray-200 bg-white">
        {!activeId ? (
          <div className="flex flex-1 items-center justify-center text-sm text-gray-400">
            Ekta conversation select korun
          </div>
        ) : (
          <>
            <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3">
              <div>
                <p className="text-sm font-semibold">{active?.name || active?.visitorId}</p>
                {active?.email && <p className="text-xs text-gray-400">{active.email}</p>}
              </div>
              <button onClick={closeConvo} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
                Close
              </button>
            </div>

            <div ref={scrollRef} className="flex-1 space-y-2 overflow-y-auto bg-gray-50 p-4">
              {messages.map((m) => {
                const isAdmin = m.sender === "admin";
                const isBot = m.sender === "bot";
                return (
                  <div key={m._id} className={`flex ${isAdmin || isBot ? "justify-end" : "justify-start"}`}>
                    <div className={`max-w-[70%] rounded-2xl px-3 py-2 text-sm ${
                      isAdmin
                        ? "bg-indigo-600 text-white"
                        : isBot
                          ? "bg-gray-200 text-gray-700"
                          : "bg-white text-gray-800 border border-gray-200"
                    }`}>
                      <span className="mb-0.5 block text-[10px] font-semibold opacity-60">
                        {m.sender}
                      </span>
                      {m.body}
                    </div>
                  </div>
                );
              })}
            </div>

            <div className="flex items-center gap-2 border-t border-gray-100 p-3">
              <input
                value={reply}
                onChange={(e) => setReply(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && send()}
                placeholder="Reply likhun…"
                className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm focus:border-indigo-500 focus:outline-none"
              />
              <button
                onClick={send}
                disabled={sending || !reply.trim()}
                className="rounded-lg bg-indigo-600 px-4 py-2 text-sm font-medium text-white hover:bg-indigo-700 disabled:opacity-50"
              >
                Send
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
