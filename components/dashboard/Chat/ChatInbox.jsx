"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import toast from "react-hot-toast";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const POLL_MS = 6000;

// Merge a conversation's own details with the customer linked from past orders,
// so the inbox always shows the fullest picture of WHO is chatting.
function customerOf(c) {
  if (!c) return {};
  const lc = c.linkedCustomer || {};
  return {
    name: c.name || lc.name || "",
    phone: c.phone || lc.phone || "",
    email: c.email || lc.email || "",
    city: lc.city || "",
    orderCount: lc.orderCount || 0,
    visitorId: c.visitorId || "",
  };
}

// A short, human-friendly device label from the raw user-agent string.
function deviceLabel(ua = "") {
  if (!ua) return "";
  const os =
    /android/i.test(ua) ? "Android" :
    /iphone|ipad|ios/i.test(ua) ? "iOS" :
    /windows/i.test(ua) ? "Windows" :
    /mac os/i.test(ua) ? "Mac" :
    /linux/i.test(ua) ? "Linux" : "";
  const br =
    /edg/i.test(ua) ? "Edge" :
    /chrome|crios/i.test(ua) ? "Chrome" :
    /firefox|fxios/i.test(ua) ? "Firefox" :
    /safari/i.test(ua) ? "Safari" : "";
  return [os, br].filter(Boolean).join(" · ");
}

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

// Relative-time helper for the info panel ("3m ago", "2h ago", …).
function timeAgo(dt) {
  if (!dt) return "";
  const s = Math.floor((Date.now() - new Date(dt).getTime()) / 1000);
  if (s < 60) return "just now";
  const m = Math.floor(s / 60);
  if (m < 60) return `${m}m ago`;
  const h = Math.floor(m / 60);
  if (h < 24) return `${h}h ago`;
  const d = Math.floor(h / 24);
  return `${d}d ago`;
}

export default function ChatInbox() {
  const [conversations, setConversations] = useState([]);
  const [activeId, setActiveId] = useState(null);
  const [messages, setMessages] = useState([]);
  const [reply, setReply] = useState("");
  const [sending, setSending] = useState(false);
  const [search, setSearch] = useState("");
  const [showInfo, setShowInfo] = useState(false); // mobile: toggle info panel
  const scrollRef = useRef(null);
  const activeIdRef = useRef(null);
  const searchRef = useRef("");

  const scrollToBottom = () =>
    requestAnimationFrame(() => {
      if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    });

  const loadConversations = useCallback(() => {
    const q = searchRef.current.trim();
    api(`/conversations${q ? `?q=${encodeURIComponent(q)}` : ""}`)
      .then((d) => setConversations(d.conversations || []))
      .catch((e) => toast.error(e.message));
  }, []);

  // Keep the ref in sync so the polling interval always uses the latest query,
  // and reload (debounced) as the admin types.
  useEffect(() => {
    searchRef.current = search;
    const t = setTimeout(loadConversations, 300);
    return () => clearTimeout(t);
  }, [search, loadConversations]);

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

  const deleteConvo = () => {
    if (!activeId) return;
    if (!window.confirm("Puro chat ta permanently delete hobe. Sure?")) return;
    api(`/conversations/${activeId}`, { method: "DELETE" })
      .then(() => {
        toast.success("Deleted");
        setActiveId(null);
        setMessages([]);
        loadConversations();
      })
      .catch((e) => toast.error(e.message));
  };

  const active = conversations.find((c) => c._id === activeId);

  return (
    <div className="flex h-[calc(100vh-8rem)] gap-4">
      {/* conversation list */}
      <div className="w-72 shrink-0 overflow-y-auto rounded-xl border border-gray-200 bg-white">
        <div className="sticky top-0 z-10 border-b border-gray-100 bg-white px-4 py-3">
          <div className="mb-2 text-sm font-semibold">Conversations</div>
          <div className="relative">
            <svg
              className="pointer-events-none absolute left-2.5 top-1/2 h-3.5 w-3.5 -translate-y-1/2 text-gray-400"
              viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"
            >
              <circle cx="11" cy="11" r="7" />
              <path d="M21 21l-4.3-4.3" strokeLinecap="round" />
            </svg>
            <input
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Name বা phone দিয়ে খুঁজুন…"
              className="w-full rounded-lg border border-gray-200 py-1.5 pl-8 pr-3 text-xs focus:border-indigo-300 focus:outline-none focus:ring-2 focus:ring-indigo-100"
            />
          </div>
        </div>
        {conversations.length === 0 ? (
          <p className="p-4 text-sm text-gray-400">
            {search ? "Kono match paoa jayni." : "Ekhono kono chat nai."}
          </p>
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
                  {customerOf(c).name || customerOf(c).phone || customerOf(c).email || c.visitorId}
                </span>
                {c.linkedCustomer && !c.name && (
                  <span
                    title={`${c.linkedCustomer.orderCount} order(s) from this device`}
                    className="rounded bg-emerald-100 px-1 text-[9px] font-semibold text-emerald-700"
                  >
                    customer
                  </span>
                )}
                {c.flagged && <span className="text-xs text-amber-500">⚑</span>}
                {c.unreadForAdmin > 0 && (
                  <span className="ml-auto rounded-full bg-pink-600 px-1.5 text-[10px] text-white">
                    {c.unreadForAdmin}
                  </span>
                )}
              </span>
              {(() => {
                const cust = customerOf(c);
                const primary = cust.name || cust.phone || cust.email || c.visitorId;
                const details = [cust.phone, cust.email, c.visitorId].filter(
                  (v) => v && v !== primary,
                );
                return details.length ? (
                  <span className="truncate text-[11px] font-medium text-gray-500">
                    {details.join(" · ")}
                  </span>
                ) : null;
              })()}
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
              {(() => {
                const cust = customerOf(active);
                const dev = deviceLabel(active?.userAgent);
                return (
                  <div>
                    <p className="flex items-center gap-2 text-sm font-semibold">
                      {cust.name || cust.phone || cust.email || active?.visitorId}
                      {active?.linkedCustomer && !active?.name && (
                        <span className="rounded bg-emerald-100 px-1.5 py-0.5 text-[10px] font-semibold text-emerald-700">
                          {cust.orderCount} order{cust.orderCount > 1 ? "s" : ""}
                        </span>
                      )}
                    </p>
                    <div className="mt-0.5 flex flex-wrap gap-x-3 gap-y-0.5 text-xs text-gray-400">
                      {cust.phone && <span>📞 {cust.phone}</span>}
                      {cust.email && <span>✉️ {cust.email}</span>}
                      {cust.city && <span>📍 {cust.city}</span>}
                      {dev && <span>💻 {dev}</span>}
                      {active?.clientIp && <span>🌐 {active.clientIp}</span>}
                      <span>🆔 {active?.visitorId}</span>
                    </div>
                  </div>
                );
              })()}
              <div className="flex items-center gap-2">
                <button
                  onClick={() => setShowInfo((v) => !v)}
                  className={`rounded-lg border px-3 py-1.5 text-xs lg:hidden ${
                    showInfo ? "border-indigo-300 bg-indigo-50 text-indigo-600" : "border-gray-300 hover:bg-gray-50"
                  }`}
                >
                  Info
                </button>
                <button onClick={closeConvo} className="rounded-lg border border-gray-300 px-3 py-1.5 text-xs hover:bg-gray-50">
                  Close
                </button>
                <button onClick={deleteConvo} className="rounded-lg border border-red-300 px-3 py-1.5 text-xs text-red-600 hover:bg-red-50">
                  Delete
                </button>
              </div>
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

      {/* ── Visitor info panel ─────────────────────────────────────────────
          Everything we know about the person behind the active conversation.
          Always visible on large screens; toggled via the "Info" button below. */}
      {activeId && (
        <InfoPanel
          convo={active}
          className={`${showInfo ? "flex" : "hidden"} lg:flex`}
        />
      )}
    </div>
  );
}

function InfoRow({ label, children }) {
  if (!children) return null;
  return (
    <div className="flex flex-col gap-0.5 border-b border-gray-50 px-4 py-2.5">
      <span className="text-[10px] font-semibold uppercase tracking-wide text-gray-400">
        {label}
      </span>
      <span className="break-words text-sm text-gray-700">{children}</span>
    </div>
  );
}

function InfoPanel({ convo, className = "" }) {
  if (!convo) return null;
  const cust = customerOf(convo);
  const dev = deviceLabel(convo.userAgent);
  return (
    <aside
      className={`w-72 shrink-0 flex-col overflow-y-auto rounded-xl border border-gray-200 bg-white ${className}`}
    >
      <div className="border-b border-gray-100 px-4 py-3">
        <p className="text-sm font-semibold">Visitor details</p>
      </div>
      <InfoRow label="Name">
        {cust.name || <span className="text-gray-400">Unknown</span>}
      </InfoRow>
      <InfoRow label="Phone">
        {cust.phone ? (
          <a href={`tel:${cust.phone}`} className="text-indigo-600 hover:underline">
            📞 {cust.phone}
          </a>
        ) : null}
      </InfoRow>
      <InfoRow label="Email">
        {cust.email ? (
          <a href={`mailto:${cust.email}`} className="text-indigo-600 hover:underline">
            {cust.email}
          </a>
        ) : null}
      </InfoRow>
      {cust.city ? <InfoRow label="City">{cust.city}</InfoRow> : null}
      {convo.linkedCustomer && cust.orderCount ? (
        <InfoRow label="Orders (this device)">
          {cust.orderCount} order{cust.orderCount > 1 ? "s" : ""}
        </InfoRow>
      ) : null}
      <InfoRow label="First seen">
        {convo.createdAt ? new Date(convo.createdAt).toLocaleString("en-GB") : null}
      </InfoRow>
      <InfoRow label="Last active">
        {convo.lastMessageAt
          ? `${new Date(convo.lastMessageAt).toLocaleString("en-GB")} (${timeAgo(
              convo.lastMessageAt,
            )})`
          : null}
      </InfoRow>
      <InfoRow label="Total messages">
        {typeof convo.messageCount === "number" ? convo.messageCount : null}
      </InfoRow>
      <InfoRow label="Device / Browser">{dev}</InfoRow>
      <InfoRow label="IP address">{convo.clientIp}</InfoRow>
      <InfoRow label="Visitor ID">
        <span className="font-mono text-xs">{convo.visitorId}</span>
      </InfoRow>
      {convo.sessionId ? (
        <InfoRow label="Session ID">
          <span className="font-mono text-xs">{convo.sessionId}</span>
        </InfoRow>
      ) : null}
      <InfoRow label="Status">
        <span className={convo.status === "closed" ? "text-gray-500" : "text-emerald-600"}>
          {convo.status || "open"}
        </span>
      </InfoRow>
    </aside>
  );
}
