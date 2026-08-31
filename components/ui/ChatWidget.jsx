"use client";

import React, { useState, useEffect, useRef, useCallback } from "react";
import { usePathname } from "next/navigation";
import { useUser } from "@/components/context/UserContext";

const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
const VISITOR_KEY = "Pickob-chat-visitor";
const SESSION_KEY = "Pickob-chat-session"; // current conversation (New chat mints a fresh one)
const PHONE_KEY = "Pickob-chat-phone";
const NAME_KEY = "Pickob-chat-name";
const PHONE_TS_KEY = "Pickob-chat-phone-ts"; // last-activity time for the phone gate
const PHONE_TTL_MS = 5 * 60 * 1000; // 5 min idle → must re-confirm name + number
const POLL_MS = 5000;

// Env fallbacks used only until the live admin config (chatWidget) loads.
const ENV_FB = process.env.NEXT_PUBLIC_FB_MESSENGER_URL || "";
const ENV_WA = process.env.NEXT_PUBLIC_WHATSAPP_NUMBER || "";

// Phone-gate persistence with a 5-min *idle* window. Any activity (opening the
// widget, sending a message) refreshes the timer, so a continuous chat never
// locks; but leaving and coming back after 5 idle minutes asks the visitor to
// confirm name + number again (pre-filled with what we know — one click). The
// sessionId is unchanged, so the same chat history reappears once confirmed.
function loadPhone() {
  try {
    const p = localStorage.getItem(PHONE_KEY) || "";
    const ts = parseInt(localStorage.getItem(PHONE_TS_KEY) || "0", 10);
    if (p && ts && Date.now() - ts <= PHONE_TTL_MS) return p;
  } catch {}
  return "";
}
// The last name/phone we ever had — persists past the idle window so the
// re-confirm form can pre-fill it (making resume a single click).
function knownName() {
  try { return localStorage.getItem(NAME_KEY) || ""; } catch { return ""; }
}
function knownPhone() {
  try { return localStorage.getItem(PHONE_KEY) || ""; } catch { return ""; }
}
// Persist name + phone together and (re)start the idle window.
function saveGate(name, phone) {
  try {
    localStorage.setItem(NAME_KEY, name);
    localStorage.setItem(PHONE_KEY, phone);
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

// Chatbot (in-site "Chat with us") availability is controlled from the
// dashboard (Settings → Chatbot Availability) and stored per-weekday in
// Asia/Dhaka time. Off-hours hide only the in-site chat option — the external
// Facebook / WhatsApp buttons stay available 24/7. Until the schedule loads (or
// if the fetch fails), we fall back to the historical default below.
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

// Decide whether the in-site chat should be offered right now, per the schedule.
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

// The current conversation's session. Persisted so a returning visitor resumes
// the same thread; "＋ New chat" replaces it with a fresh one (see newChat).
function getSessionId() {
  if (typeof window === "undefined") return "";
  let id = localStorage.getItem(SESSION_KEY);
  if (!id) {
    id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(SESSION_KEY, id);
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
  const pathname = usePathname() || "";
  const { user } = useUser(); // logged-in customer, so the inbox knows who's chatting
  const [active, setActive] = useState(false); // within Dhaka active hours? (in-site chat)
  const schedule = useRef(null); // dashboard-controlled availability schedule
  // Admin-configured launcher settings (master toggle + external links). Seeded
  // from env as a fallback; overwritten once /top-banner loads.
  const [cfg, setCfg] = useState({
    enabled: true,
    facebookMessengerUrl: ENV_FB,
    whatsappNumber: ENV_WA,
  });
  const [open, setOpen] = useState(false); // launcher popup open?
  const [view, setView] = useState("menu"); // "menu" (3 options) | "chat"
  const [messages, setMessages] = useState([]);
  const [quick, setQuick] = useState(DEFAULT_QUICK);
  const [input, setInput] = useState("");
  const [sending, setSending] = useState(false);
  const [loaded, setLoaded] = useState(false);
  // Visitor's phone — gate the chat behind it so every conversation in the
  // inbox is tied to a real, identifiable number (and can be matched to orders).
  const [phone, setPhone] = useState(() =>
    typeof window === "undefined" ? "" : loadPhone()
  ); // saved/confirmed number (gate key)
  const [name, setName] = useState(() =>
    typeof window === "undefined" ? "" : loadPhone() ? knownName() : ""
  ); // saved/confirmed name
  const [phoneInput, setPhoneInput] = useState(""); // number being typed
  const [nameInput, setNameInput] = useState(""); // name being typed
  const [phoneError, setPhoneError] = useState("");
  const visitorId = useRef("");
  const sessionId = useRef("");
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
    sessionId.current = getSessionId();
    if (loadPhone()) touchPhone(); // returning within the window → extend it
  }, []);

  // A logged-in customer's own name + mobile satisfy the gate automatically (and
  // re-fill it even after the idle window expires — they stay identified).
  const userPhone = normalizeBdPhone(user?.mobile || "");
  if (!phone && userPhone) {
    setPhone(userPhone);
    setName(user?.name || "");
  }

  // Persist the confirmed gate (localStorage only — no setState).
  useEffect(() => {
    if (phone) saveGate(name, phone);
  }, [phone, name]);

  // Enforce the 5-min idle window: once activity stops for that long, drop the
  // phone so the re-confirm form reappears — pre-filled with the name/number we
  // already know, so resuming the previous chat is one click.
  useEffect(() => {
    if (!phone) return;
    const t = setInterval(() => {
      if (!loadPhone()) {
        setPhone(""); // expired → gate reappears
        setNameInput(knownName()); // pre-fill so re-confirm is one click
        setPhoneInput(knownPhone());
      }
    }, 30000);
    return () => clearInterval(t);
  }, [phone]);

  // Confirm the gate form (name + number) → unlock the chat.
  const submitPhone = () => {
    const nm = nameInput.trim();
    if (nm.length < 2) {
      setPhoneError("আপনার নামটি লিখুন।");
      return;
    }
    const n = normalizeBdPhone(phoneInput);
    if (!n) {
      setPhoneError("সঠিক মোবাইল নম্বর দিন (যেমন 01712345678)।");
      return;
    }
    setPhoneError("");
    setName(nm);
    setPhone(n);
    saveGate(nm, n);
  };

  // Track Dhaka active hours + load the launcher config. Re-check each minute so
  // in-site availability toggles without a reload.
  useEffect(() => {
    const tick = () => setActive(isChatActive(schedule.current));
    fetch(`${API}/api/admin/top-banner`)
      .then((r) => r.json())
      .then((d) => {
        if (d && d.chatbotSchedule) schedule.current = d.chatbotSchedule;
        if (d && d.chatWidget) {
          setCfg({
            enabled: d.chatWidget.enabled !== false,
            facebookMessengerUrl: d.chatWidget.facebookMessengerUrl || "",
            whatsappNumber: d.chatWidget.whatsappNumber || "",
          });
        }
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
    if (pendingSends.current > 0) return;
    const seq = ++reqSeq.current;
    fetch(
      `${API}/api/chat/thread?visitorId=${encodeURIComponent(
        visitorId.current
      )}&sessionId=${encodeURIComponent(sessionId.current)}`
    )
      .then((r) => r.json())
      .then((d) => {
        if (pendingSends.current > 0) return;
        applyMessages(seq, d.messages || []);
        if (d.quickReplies?.length) setQuick(d.quickReplies);
        setLoaded(true);
      })
      .catch(() => {})
      .finally(scrollToBottom);
  }, []);

  // Start a fresh conversation while KEEPING the same visitor identity (and
  // name/phone). A new sessionId spins up a brand new thread server-side; the
  // old one stays saved separately in the admin inbox.
  const newChat = () => {
    const id = "s_" + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    localStorage.setItem(SESSION_KEY, id);
    sessionId.current = id;
    reqSeq.current = 0;
    appliedSeq.current = 0;
    pendingSends.current = 0;
    setMessages([]);
    setInput("");
    setQuick(DEFAULT_QUICK);
    setLoaded(false);
    fetchThread();
  };

  // Poll only while the chat view is open.
  useEffect(() => {
    if (!open || view !== "chat") {
      if (pollRef.current) clearInterval(pollRef.current);
      return;
    }
    if (phone) touchPhone(); // opening/using the panel is activity
    fetchThread();
    pollRef.current = setInterval(fetchThread, POLL_MS);
    return () => pollRef.current && clearInterval(pollRef.current);
  }, [open, view, fetchThread, phone]);

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
        sessionId: sessionId.current,
        body,
        deviceId: getDeviceId(),
        phone,
        name: name || user?.name || "",
        ...(user
          ? {
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

  // ── Visibility ────────────────────────────────────────────────────────────
  // Never render inside the admin dashboard or auth screens.
  if (pathname.startsWith("/dashboard") || pathname.startsWith("/auth")) return null;
  // Master switch off → no widget at all.
  if (!cfg.enabled) return null;

  // Which launcher options are available.
  const fbUrl = cfg.facebookMessengerUrl?.trim() || "";
  const waNumber = (cfg.whatsappNumber || "").replace(/[^\d]/g, "");
  const showFb = !!fbUrl;
  const showWa = !!waNumber;
  const showChat = active; // in-site chat respects the availability schedule
  // Nothing to offer at all → hide the launcher entirely.
  if (!showFb && !showWa && !showChat) return null;

  const waUrl = showWa
    ? `https://wa.me/${waNumber}?text=${encodeURIComponent("Hello! I have a query.")}`
    : "";

  return (
    <>
      {/* Launcher button */}
      <button
        onClick={() =>
          setOpen((o) => {
            if (o) setView("menu"); // closing → next open starts at the menu
            return !o;
          })
        }
        aria-label="Chat with us"
        className="fixed bottom-14 right-4 z-[60] flex h-12 w-12 items-center justify-center rounded-full bg-blue-600 text-white shadow-lg transition hover:bg-blue-700"
      >
        {open ? (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M6 6l12 12M18 6L6 18" strokeLinecap="round" />
          </svg>
        ) : (
          <svg className="h-5 w-5" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z" strokeLinecap="round" strokeLinejoin="round" />
          </svg>
        )}
      </button>

      {/* ── Popup: 3-option menu ─────────────────────────────────────────── */}
      {open && view === "menu" && (
        <div className="fixed bottom-28 right-4 z-[60] w-[92vw] max-w-xs overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          <div className="bg-blue-600 px-5 py-4 text-white">
            <p className="text-base font-semibold leading-tight">Hi there! 👋</p>
            <p className="mt-0.5 text-xs text-blue-100">Got questions? Chat with our team!</p>
          </div>
          <div className="flex flex-col gap-2 p-3">
            {showFb && (
              <a
                href={fbUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#0866FF] text-white ">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M12 2C6.48 2 2 6.14 2 11.25c0 2.88 1.43 5.45 3.67 7.15V22l3.36-1.84c.9.25 1.85.38 2.97.38 5.52 0 10-4.14 10-9.25S17.52 2 12 2zm1 12.4l-2.55-2.72-4.98 2.72 5.48-5.82 2.61 2.72 4.92-2.72-5.48 5.82z" />
                  </svg>
                </span>
                <span>Facebook Messenger</span>
              </a>
            )}
            {showChat && (
              <button
                onClick={() => {
                  setView("chat");
                  setLoaded(false);
                }}
                className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-2.5 text-left text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-blue-600 text-white text-lg">💬</span>
                <span>Chat Here</span>
              </button>
            )}
            {showWa && (
              <a
                href={waUrl}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 rounded-xl border border-gray-300 px-3 py-2.5 text-sm font-medium text-gray-700 transition hover:bg-gray-50"
              >
                <span className="flex h-9 w-9 items-center justify-center rounded-full bg-[#25D366] text-white">
                  <svg className="h-5 w-5" viewBox="0 0 24 24" fill="currentColor">
                    <path d="M17.5 14.4c-.3-.15-1.77-.87-2.04-.97-.27-.1-.47-.15-.67.15-.2.3-.77.97-.94 1.17-.17.2-.35.22-.65.07-.3-.15-1.26-.46-2.4-1.48-.89-.79-1.49-1.77-1.66-2.07-.17-.3-.02-.46.13-.61.13-.13.3-.35.45-.52.15-.17.2-.3.3-.5.1-.2.05-.37-.02-.52-.07-.15-.67-1.62-.92-2.22-.24-.58-.49-.5-.67-.51h-.57c-.2 0-.52.07-.8.37-.27.3-1.04 1.02-1.04 2.48 0 1.46 1.07 2.87 1.22 3.07.15.2 2.1 3.2 5.08 4.49.71.31 1.26.49 1.69.62.71.23 1.36.2 1.87.12.57-.08 1.77-.72 2.02-1.42.25-.7.25-1.29.17-1.42-.07-.13-.27-.2-.57-.35zM12 2C6.48 2 2 6.48 2 12c0 1.85.5 3.58 1.38 5.06L2 22l5.06-1.35A9.94 9.94 0 0012 22c5.52 0 10-4.48 10-10S17.52 2 12 2z" />
                  </svg>
                </span>
                <span>WhatsApp</span>
              </a>
            )}
          </div>
        </div>
      )}

      {/* ── Panel: in-site chat ──────────────────────────────────────────── */}
      {open && view === "chat" && (
        <div className="fixed bottom-28 right-4 z-[60] flex h-[70vh] max-h-[540px] w-[92vw] max-w-sm flex-col overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-2xl">
          {/* header */}
          <div className="flex items-center gap-3 bg-blue-600 px-4 py-3 text-white">
            <button
              onClick={() => setView("menu")}
              title="Back"
              className="flex h-7 w-7 items-center justify-center rounded-full bg-white/20 transition hover:bg-white/30"
              aria-label="Back to menu"
            >
              <svg className="h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M15 18l-6-6 6-6" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </button>
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
                <path d="M12 5v14M5 12h14" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
              New chat
            </button>
          </div>

          {!phone ? (
            /* phone gate — must give a number before chatting */
            <div className="flex flex-1 flex-col items-center justify-center gap-3 bg-gray-50 px-6 text-center">
              <div className="text-3xl">📱</div>
              <p className="text-sm font-semibold text-gray-700">
                চ্যাট শুরু করতে আপনার নাম ও মোবাইল নম্বর দিন
              </p>
              <p className="text-xs text-gray-400">
                আপনাকে দ্রুত সাহায্য করতে ও অর্ডার আপডেট দিতে এগুলো লাগবে।
              </p>
              <input
                type="text"
                value={nameInput}
                onChange={(e) => setNameInput(e.target.value)}
                onKeyDown={(e) => e.key === "Enter" && submitPhone()}
                placeholder="আপনার নাম"
                className="w-full rounded-lg border border-gray-300 px-4 py-2 text-center text-sm focus:border-blue-500 focus:outline-none"
              />
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
