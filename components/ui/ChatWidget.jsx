"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const VISITOR_KEY = "Pickob-chat-visitor";
const PHONE_KEY = "Pickob-chat-phone";
const PHONE_TS_KEY = "Pickob-chat-phone-ts"; // last-activity time for the phone gate
const PHONE_TTL_MS = 30 * 60 * 1000; // 30 min idle → must re-enter the number
const POLL_MS = 5000;

// Phone-gate persistence with a 30-min *idle* window. Any activity (opening the
// widget, sending a message) refreshes the timer, so a continuous chat never
// locks; but leaving and coming back after 30 idle minutes asks for the number
// again.
function loadPhone() {
  try {
    const p = localStorage.getItem(PHONE_KEY) || "";
    const ts = parseInt(localStorage.getItem(PHONE_TS_KEY) || "0", 10);
    if (p && ts && Date.now() - ts <= PHONE_TTL_MS) return p;
  } catch {}
  return "";
}
function savePhone(p) {
  try {
    localStorage.setItem(PHONE_KEY, p);
    localStorage.setItem(PHONE_TS_KEY, String(Date.now()));
  } catch {}
}
function touchPhone() {
  try { localStorage.setItem(PHONE_TS_KEY, String(Date.now())); } catch {}
}

// Validate + normalise a Bangladeshi mobile number (accepts 01XXXXXXXXX,
// +8801XXXXXXXXX, 8801XXXXXXXXX). Returns "" when it isn't a valid BD number.
function normalizeBdPhone(raw) {
  let d = String(raw || "").replace(/[^\d]/g, "");
  if (d.startsWith("880")) d = d.slice(3);
  else if (d.startsWith("88")) d = d.slice(2);
  if (d.length === 11 && /^01[3-9]\d{8}$/.test(d)) return d;
  if (d.length === 10 && /^1[3-9]\d{8}$/.test(d)) return "0" + d;
  return "";
}

// fallback menu (also comes from the server so it stays in sync)
const DEFAULT_QUICK = [
  { key: "track", emoji: "📦", label: "Track Order", text: "Track order" },
  { key: "delivery", emoji: "🚚", label: "Delivery", text: "Delivery charge koto?" },
  { key: "products", emoji: "🛍️", label: "Products", text: "Products dekhte chai" },
  { key: "agent", emoji: "👤", label: "Agent", text: "Agent er sathe kotha bolbo" },
];

// Chatbot availability is controlled from the dashboard (Settings → Chatbot
// Availability) and stored per-weekday in Asia/Dhaka time. The widget fetches
// that schedule and hides itself during off-hours. Until the schedule loads (or
// if the fetch fails), we fall back to the historical default below.
//
// Default: Sun–Thu evening→morning (5 PM–9 AM), Fri & Sat all day. Index 0 = Sun.
const DEFAULT_SCHEDULE = {
  enabled: true,
  days: [
    { mode: "range", start: "17:00", end: "09:00" }, // Sun
    { mode: "range", start: "17:00", end: "09:00" }, // Mon
    { mode: "range", start: "17:00", end: "09:00" }, // Tue
    { mode: "range", start: "17:00", end: "09:00" }, // Wed
    { mode: "range", start: "17:00", end: "09:00" }, // Thu
    { mode: "allday", start: "00:00", end: "23:59" }, // Fri
    { mode: "allday", start: "00:00", end: "23:59" }, // Sat
  ],
};

const WEEKDAY_INDEX = { Sun: 0, Mon: 1, Tue: 2, Wed: 3, Thu: 4, Fri: 5, Sat: 6 };

// Parse "HH:MM" → minutes since midnight (safe fallback on bad input).
function toMinutes(hhmm) {
  const [h, m] = String(hhmm || "").split(":").map((n) => parseInt(n, 10));
  if (Number.isNaN(h)) return 0;
  return h * 60 + (Number.isNaN(m) ? 0 : m);
}

// Decide whether the widget should be visible right now, per the schedule.
function isChatActive(schedule, now = new Date()) {
  const sched = schedule || DEFAULT_SCHEDULE;
  if (sched.enabled === false) return false; // master off
  try {
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone: "Asia/Dhaka",
      weekday: "short",
      hour: "2-digit",
      minute: "2-digit",
      hour12: false,
    }).formatToParts(now);
    const wd = parts.find((p) => p.type === "weekday")?.value || "";
    let hour = parseInt(parts.find((p) => p.type === "hour")?.value || "0", 10);
    if (hour === 24) hour = 0; // some engines render midnight as "24"
    const minute = parseInt(parts.find((p) => p.type === "minute")?.value || "0", 10);
    const nowMin = hour * 60 + minute;

    const dayIdx = WEEKDAY_INDEX[wd] ?? 0;
    const day = (sched.days && sched.days[dayIdx]) || DEFAULT_SCHEDULE.days[dayIdx];
    if (!day || day.mode === "off") return false;
    if (day.mode === "allday") return true;

    // range: end < start ⇒ window wraps past midnight (e.g. 17:00→09:00).
    const start = toMinutes(day.start);
    const end = toMinutes(day.end);
    if (start === end) return true; // treat as full-day
    return start < end
      ? nowMin >= start && nowMin < end
      : nowMin >= start || nowMin < end;
  } catch {
    return true; // if the timezone lookup ever fails, don't block support
  }
}

function getVisitorId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(VISITOR_KEY);
  if (!id) {
    id = "v_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(VISITOR_KEY, id);
  }
  return id;
}

// Same device fingerprint the checkout uses (`_yh_did`), so a chat can be
// linked to orders placed from this browser — surfacing the real customer.
function getDeviceId() {
  if (typeof window === "undefined") return "";
  try {
    let id = localStorage.getItem("_yh_did") || "";
    if (!id) {
      id = "dev-" + Math.random().toString(36).slice(2) + Date.now().toString(36);
      localStorage.setItem("_yh_did", id);
    }
    return id;
  } catch {
    return "";
  }
}

export default function ChatWidget() {
  const { user } = useUser(); // logged-in customer, so the inbox knows who's chatting
  const [active, setActive] = useState(false); // within Dhaka active hours?
  const schedule = useRef(null); // dashboard-controlled availability schedule
  const [open, setOpen] = useState(false);
  const [messages, setMessages] = useState([]);
  const [quick, setQuick] = useState(DEFAULT_QUICK);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Visitor's phone — gate the chat behind it so every conversation in the
  // inbox is tied to a real, identifiable number (and can be matched to orders).
  const [phone, setPhone] = useState(""); // saved/confirmed number
  const [phoneInput, setPhoneInput] = useState(""); // what they're typing
  const [phoneError, setPhoneError] = useState("");
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
    const saved = loadPhone();
    if (saved) {
      setPhone(saved);
      touchPhone(); // they're back within the window → extend it
    }
  }, []);

  // A logged-in customer's own mobile satisfies the gate automatically (and
  // re-fills it even after the idle window expires — they stay identified).
  useEffect(() => {
    if (!phone && user?.mobile) {
      const n = normalizeBdPhone(user.mobile);
      if (n) {
        setPhone(n);
        savePhone(n);
      }
    }
  }, [user, phone]);

  // Enforce the 30-min idle window: once activity stops for that long, drop the
  // phone so the gate reappears. Checked on a short interval while mounted.
  useEffect(() => {
    if (!phone) return;
    const t = setInterval(() => {
      if (!loadPhone()) setPhone(""); // expired → re-ask for the number
    }, 30000);
    return () => clearInterval(t);
  }, [phone]);

  // Confirm the phone-gate form → unlock the chat.
  const submitPhone = () => {
    const n = normalizeBdPhone(phoneInput);
    if (!n) {
      setPhoneError("সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)।");
      return;
    }
    setPhoneError("");
    setPhone(n);
    savePhone(n);
  };

  // Track Dhaka active hours; re-check each minute so it toggles without reload.
  // The schedule comes from the dashboard (Settings → Chatbot Availability);
  // fetch it once, then re-evaluate against it on each tick.
  useEffect(() => {
    const tick = () => {
      const a = isChatActive(schedule.current);
      setActive(a);
      if (!a) setOpen(false); // going off-hours closes any open panel
    };
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.chatbotSchedule) schedule.current = d.chatbotSchedule;
      })
      .catch(() => {})
      .finally(tick); // evaluate with whatever schedule we have (or the default)
    const t = setInterval(tick, 60000);
    return () => clearInterval(t);
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
    if (phone) touchPhone(); // opening/using the panel is activity
    fetchThread();
    pollRef.current = setInterval(fetchThread, POLL_MS);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [open, fetchThread, phone]);

  // send a message (typed, or a quick-reply button's text)
  const send = (overrideText) => {
    const body = (overrideText ?? input).trim();
    if (!body || sending) return;
    touchPhone(); // sending is activity → keep the phone gate open
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
      body: JSON.stringify({
        visitorId: visitorId.current,
        body,
        deviceId: getDeviceId(),
        // The gate guarantees a phone; send it so the inbox always identifies
        // this visitor (and can match them to past orders).
        phone,
        // If the customer is logged in, add their account details too.
        ...(user
          ? {
              name: user.name || "",
              email: user.email || "",
              userId: user._id || user.id || undefined,
            }
          : {}),
      }),
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

  // Off-hours (outside Dhaka active hours) → hide the widget entirely.
  if (!active) return null;

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

          {!phone ? (
            /* phone gate — must give a number before chatting */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
              <div className="text-3xl">📱</div>
              <p className="text-sm font-semibold text-gray-700">
                চ্যাট শুরু করতে আপনার মোবাইল নম্বরটি দিন
              </p>
              <p className="text-xs text-gray-400">
                আপনাকে দ্রুত সাহায্য করতে ও অর্ডার আপডেট দিতে নম্বরটি লাগবে।
              </p>
              <input
                type="tel"
                inputMode="numeric"
                value={phoneInput}
                onChange={(e) => setPhoneInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitPhone()}
                placeholder="01712345678"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm focus:border-blue-500 focus:outline-none"
              />
              {phoneError && <p className="text-xs text-red-500">{phoneError}</p>}
              <button
                onClick={submitPhone}
                className="w-full rounded-lg bg-blue-600 px-4 py-2 text-sm font-semibold text-white transition hover:bg-blue-700"
              >
                চ্যাট শুরু করুন
              </button>
            </div>
          ) : (
          <>
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
              onChange={(e) => { setInput(e.target.value); touchPhone(); }}
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
          </>
          )}
        </div>
      )}
    </>
  );
}
