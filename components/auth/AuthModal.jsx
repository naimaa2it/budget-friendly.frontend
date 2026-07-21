"use client";

import React, { useState, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import { useUser } from "@/components/context/UserContext";
import { auth, googleProvider } from "@/lib/firebase";
import {
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendEmailVerification,
  sendPasswordResetEmail,
} from "firebase/auth";
import WebsiteLogo from "@/components/ui/WebsiteLogo";

const MAX_ATTEMPTS = 5;
const LOCKOUT_SECONDS = 60;

// Helper function to convert Firebase error codes to user-friendly messages
const getFirebaseErrorMessage = (error) => {
  const errorCode = error?.code || "";

  const errorMessages = {
    // Registration errors
    "auth/email-already-in-use": {
      message: "This email is already registered.",
      action: "login",
      actionText: "Login instead",
    },
    "auth/invalid-email": {
      message: "Please enter a valid email address.",
      action: null,
    },
    "auth/weak-password": {
      message: "Password should be at least 6 characters long.",
      action: null,
    },
    "auth/operation-not-allowed": {
      message:
        "Email/password accounts are not enabled. Please contact support.",
      action: null,
    },

    // Login errors
    "auth/user-not-found": {
      message: "No account found with this email.",
      action: "register",
      actionText: "Create an account",
    },
    "auth/wrong-password": {
      message: "Incorrect password. Please try again.",
      action: "forgot",
      actionText: "Reset password",
    },
    "auth/invalid-credential": {
      message: "Invalid email or password. Please check and try again.",
      action: "forgot",
      actionText: "Reset password",
    },
    "auth/user-disabled": {
      message: "This account has been disabled. Please contact support.",
      action: null,
    },
    "auth/too-many-requests": {
      message:
        "Too many failed attempts. Please try again later or reset your password.",
      action: "forgot",
      actionText: "Reset password",
    },

    // Google sign-in errors
    "auth/popup-closed-by-user": {
      message: "Sign-in was cancelled. Please try again.",
      action: null,
    },
    "auth/popup-blocked": {
      message:
        "Pop-up was blocked by your browser. Please allow pop-ups and try again.",
      action: null,
    },
    "auth/cancelled-popup-request": {
      message: "Sign-in was cancelled.",
      action: null,
    },
    "auth/account-exists-with-different-credential": {
      message:
        "An account already exists with this email using a different sign-in method.",
      action: "login",
      actionText: "Try email login",
    },

    // Password reset errors
    "auth/missing-email": {
      message: "Please enter your email address.",
      action: null,
    },

    // Network errors
    "auth/network-request-failed": {
      message:
        "Network error. Please check your internet connection and try again.",
      action: null,
    },
  };

  return (
    errorMessages[errorCode] || {
      message: "Something went wrong. Please try again.",
      action: null,
    }
  );
};

export default function AuthModal({ isOpen, onClose }) {
  const { setUser, refreshUser } = useUser();
  // Track client-side mount so we can use createPortal safely (avoids SSR mismatch)
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);

  const [view, setView] = useState("choose"); // choose | email-login | email-register
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [name, setName] = useState("");
  const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";
  const [message, setMessage] = useState("");
  const [messageType, setMessageType] = useState("error"); // 'error' | 'success' | 'info'
  const [messageAction, setMessageAction] = useState(null); // { action: string, text: string }
  const [isLoading, setIsLoading] = useState(false);

  const [failedAttempts, setFailedAttempts] = useState(0);
  const [lockoutUntil, setLockoutUntil] = useState(null);
  const [secondsLeft, setSecondsLeft] = useState(0);
  const timerRef = useRef(null);

  useEffect(() => {
    if (!lockoutUntil) return;
    const tick = () => {
      const left = Math.ceil((lockoutUntil - Date.now()) / 1000);
      if (left <= 0) {
        setLockoutUntil(null);
        setSecondsLeft(0);
        setFailedAttempts(0);
        clearInterval(timerRef.current);
      } else {
        setSecondsLeft(left);
      }
    };
    tick();
    timerRef.current = setInterval(tick, 1000);
    return () => clearInterval(timerRef.current);
  }, [lockoutUntil]);

  if (!isOpen || !mounted) return null;

  const isLockedOut = lockoutUntil && Date.now() < lockoutUntil;

  const recordFailure = () => {
    const next = failedAttempts + 1;
    setFailedAttempts(next);
    if (next >= MAX_ATTEMPTS) {
      const until = Date.now() + LOCKOUT_SECONDS * 1000;
      setLockoutUntil(until);
      showMessage(
        `Too many failed attempts. Please wait ${LOCKOUT_SECONDS} seconds before trying again.`,
        "error",
      );
    }
  };

  const recordSuccess = () => {
    setFailedAttempts(0);
    setLockoutUntil(null);
    setSecondsLeft(0);
    clearInterval(timerRef.current);
  };

  const clearMessages = () => {
    setMessage("");
    setMessageType("error");
    setMessageAction(null);
  };

  const showMessage = (msg, type = "error", action = null) => {
    setMessage(msg);
    setMessageType(type);
    setMessageAction(action);
  };

  const handleActionClick = (action) => {
    clearMessages();
    if (action === "login") setView("email-login");
    else if (action === "register") setView("email-register");
    else if (action === "forgot") handleForgot();
  };

  const handleGoogle = async () => {
    if (isLockedOut) return;
    clearMessages();
    setIsLoading(true);
    try {
      const result = await signInWithPopup(auth, googleProvider);
      const user = result.user;
      if (!user || !user.email)
        throw new Error("No email returned from Google sign-in");

      // send to backend to create session
      const resp = await fetch(`${API}/api/auth/firebase-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: user.email,
          name: user.displayName,
          image: user.photoURL,
          provider: "google",
        }),
      });

      if (!resp.ok) {
        const errBody = await resp.json().catch(() => ({}));
        throw new Error(
          errBody.error || `Backend responded with ${resp.status}`,
        );
      }

      // update context immediately using response body if available
      const data = await resp.json().catch(() => ({}));
      if (data.user) {
        setUser(data.user);
      }
      // still refresh to be safe
      await refreshUser();
      recordSuccess();
      onClose();
    } catch (err) {
      console.error("Google sign-in error:", err);
      const errorInfo = getFirebaseErrorMessage(err);
      if (err?.code === "auth/too-many-requests") {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        showMessage(
          "Too many failed attempts. Please wait before trying again.",
          "error",
        );
      } else if (
        err?.code !== "auth/popup-closed-by-user" &&
        err?.code !== "auth/cancelled-popup-request"
      ) {
        recordFailure();
        showMessage(
          errorInfo.message,
          "error",
          errorInfo.action
            ? { action: errorInfo.action, text: errorInfo.actionText }
            : null,
        );
      } else {
        showMessage(errorInfo.message, "error");
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailRegister = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;
    clearMessages();

    // Client-side validation
    if (password.length < 6) {
      showMessage("Password should be at least 6 characters long.", "error");
      return;
    }

    setIsLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(
        auth,
        email,
        password,
      );
      await sendEmailVerification(userCredential.user);
      recordSuccess();
      showMessage(
        "Verification email sent! Please check your inbox and verify your email, then login.",
        "success",
      );
      setView("email-login");
    } catch (err) {
      console.error(err);
      const errorInfo = getFirebaseErrorMessage(err);
      if (err?.code === "auth/too-many-requests") {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        showMessage(
          "Too many failed attempts. Please wait before trying again.",
          "error",
        );
      } else {
        recordFailure();
        showMessage(
          errorInfo.message,
          "error",
          errorInfo.action
            ? { action: errorInfo.action, text: errorInfo.actionText }
            : null,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleEmailLogin = async (e) => {
    e.preventDefault();
    if (isLockedOut) return;
    clearMessages();
    setIsLoading(true);
    try {
      const userCredential = await signInWithEmailAndPassword(
        auth,
        email,
        password,
      );
      if (!userCredential.user.emailVerified) {
        showMessage(
          "Please verify your email before signing in. Check your inbox for the verification link.",
          "info",
          { action: "resend", text: "Resend verification email" },
        );
        await sendEmailVerification(userCredential.user);
        setIsLoading(false);
        return;
      }

      // send user info to backend to create session
      const resp2 = await fetch(`${API}/api/auth/firebase-login`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({
          email: userCredential.user.email,
          name: userCredential.user.displayName || name,
          image: userCredential.user.photoURL || "",
        }),
      });
      const data2 = await resp2.json().catch(() => ({}));
      if (data2.user) {
        setUser(data2.user);
      }
      await refreshUser();
      recordSuccess();
      onClose();
    } catch (err) {
      console.error(err);
      const errorInfo = getFirebaseErrorMessage(err);
      if (err?.code === "auth/too-many-requests") {
        setLockoutUntil(Date.now() + LOCKOUT_SECONDS * 1000);
        showMessage(
          "Too many failed attempts. Please wait before trying again.",
          "error",
        );
      } else {
        recordFailure();
        showMessage(
          errorInfo.message,
          "error",
          errorInfo.action
            ? { action: errorInfo.action, text: errorInfo.actionText }
            : null,
        );
      }
    } finally {
      setIsLoading(false);
    }
  };

  const handleForgot = async () => {
    if (!email) {
      showMessage(
        "Please enter your email address to reset your password.",
        "info",
      );
      return;
    }
    setIsLoading(true);
    try {
      await sendPasswordResetEmail(auth, email);
      showMessage(
        "Password reset email sent! Check your inbox for instructions.",
        "success",
      );
    } catch (err) {
      console.error(err);
      const errorInfo = getFirebaseErrorMessage(err);
      showMessage(errorInfo.message, "error");
    } finally {
      setIsLoading(false);
    }
  };

  // Render via portal so fixed positioning is always relative to viewport,
  // not a parent with CSS transform (e.g. slider cards, carousels).
  return createPortal(
    <div className="fixed inset-0 z-[9999] flex items-center justify-center">
      <div className="absolute inset-0 bg-black/40" onClick={onClose}></div>
      <div className="bg-white rounded-lg p-0 relative z-10 w-full max-w-md overflow-hidden shadow-xl">
        <button
          onClick={onClose}
          className="absolute top-3 right-3 text-gray-600 hover:text-gray-900"
        >
          ✕
        </button>
        {/* header area */}
        <div className="bg-gradient-to-r from-pink-100 to-white px-6 py-5 text-center">
          <p className="text-lg font-semibold text-gray-800">
            Hello Trendsetter!
          </p>
          <p className="text-sm text-gray-600 italic ">
            "Style it. Power it. Own it."
          </p>
          <div className="flex justify-center items-center gap-2">
            <h2 className="text-xl font-bold text-gray-900 mt-2">
              Continue with
            </h2>
            <div className="flex items-center justify-center">
              <WebsiteLogo className="w-20 h-6 " />
            </div>
          </div>
        </div>
        <div className="px-6 py-3">
          {view === "choose" && (
            <div className="space-y-3 bg-gray-50 px-4 rounded-lg">
              <button
                onClick={handleGoogle}
                disabled={isLoading || isLockedOut}
                className="w-full border border-gray-200 px-4 py-3 flex items-center justify-center gap-3 text-gray-800 bg-white hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                {isLoading ? (
                  <svg
                    className="animate-spin h-5 w-5 text-gray-600"
                    xmlns="http://www.w3.org/2000/svg"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    ></circle>
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    ></path>
                  </svg>
                ) : (
                  <svg
                    className="w-5 h-5"
                    viewBox="0 0 533.5 544.3"
                    xmlns="http://www.w3.org/2000/svg"
                    aria-hidden="true"
                  >
                    <path
                      fill="#4285F4"
                      d="M533.5 278.4c0-18.5-1.7-36.3-4.9-53.6H272v101.4h146.9c-6.3 34.7-25.2 64.1-53.9 83.9v69.6h87.1c51-47 80.4-116.5 80.4-201.3z"
                    />
                    <path
                      fill="#34A853"
                      d="M272 544.3c72.6 0 133.6-24 178.2-65.1l-87.1-69.6c-24.2 16.2-55.2 25.8-91.1 25.8-69.9 0-129.2-47.1-150.4-110.4H31.9v69.5C76.5 492.5 168.9 544.3 272 544.3z"
                    />
                    <path
                      fill="#FBBC05"
                      d="M121.6 323.8c-10.8-32-10.8-66.6 0-98.6V155.7H31.9c-35.3 69.9-35.3 153.6 0 223.5l89.7-55.4z"
                    />
                    <path
                      fill="#EA4335"
                      d="M272 107.7c39.4-.6 77.1 14.5 104.8 40.6l78.5-78.5C403.8 24.6 341.6 0 272 0 168.9 0 76.5 51.8 31.9 155.7l89.7 69.5C142.8 154.8 202.1 107.7 272 107.7z"
                    />
                  </svg>
                )}
                <span>
                  {isLoading ? "Please wait..." : "Continue with Google"}
                </span>
              </button>
              <button
                onClick={() => {
                  clearMessages();
                  setView("email-login");
                }}
                disabled={isLoading}
                className="w-full border border-gray-200 px-4 py-3 flex items-center justify-center gap-3 text-gray-800 bg-white hover:bg-rose-100 disabled:opacity-50 disabled:cursor-not-allowed transition"
              >
                <svg
                  className="w-5 h-5 text-gray-800"
                  viewBox="0 0 24 24"
                  fill="none"
                  xmlns="http://www.w3.org/2000/svg"
                  aria-hidden="true"
                >
                  <path
                    d="M3 7.5v9A2.5 2.5 0 0 0 5.5 19h13a2.5 2.5 0 0 0 2.5-2.5v-9A2.5 2.5 0 0 0 18.5 5h-13A2.5 2.5 0 0 0 3 7.5z"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                  <path
                    d="M21 7.5l-9 6-9-6"
                    stroke="currentColor"
                    strokeWidth="1.2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  />
                </svg>
                <span>Continue with Email</span>
              </button>
            </div>
          )}

          {view === "email-register" && (
            <form onSubmit={handleEmailRegister} className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-2">
                Create your account
              </p>
              <div>
                <input
                  required
                  placeholder="Full Name"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={isLoading}
                />
              </div>
              <div>
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={isLoading}
                />
              </div>
              <div className="relative">
                <input
                  required
                  placeholder="Password (min. 6 characters)"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={isLoading}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.02-2.1 2.6-3.89 4.54-5.06" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || isLockedOut}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
                >
                  {isLoading && (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isLoading ? "Creating account..." : "Create Account"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setView("choose");
                  }}
                  disabled={isLoading}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded disabled:opacity-50 transition-opacity"
                >
                  Back
                </button>
              </div>
              <p className="text-sm text-gray-500 text-center">
                Already have an account?{" "}
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setView("email-login");
                  }}
                  className="text-indigo-600 hover:text-indigo-800 font-medium"
                >
                  Login here
                </button>
              </p>
            </form>
          )}

          {view === "email-login" && (
            <form onSubmit={handleEmailLogin} className="space-y-3">
              <p className="text-sm text-gray-600 text-center mb-2">
                Login to your account
              </p>
              {failedAttempts > 0 && !isLockedOut && (
                <p className="text-xs text-amber-700 bg-amber-50 border border-amber-200 rounded px-2 py-1">
                  {MAX_ATTEMPTS - failedAttempts} attempt
                  {MAX_ATTEMPTS - failedAttempts !== 1 ? "s" : ""} remaining
                  before temporary lockout.
                </p>
              )}
              <div>
                <input
                  required
                  type="email"
                  placeholder="Email address"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={isLoading || isLockedOut}
                />
              </div>
              <div className="relative">
                <input
                  required
                  placeholder="Password"
                  type={showPassword ? "text" : "password"}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pr-10 border border-gray-200 bg-white text-gray-900 placeholder-gray-400 px-3 py-2 rounded focus:outline-none focus:ring-2 focus:ring-indigo-100"
                  disabled={isLoading || isLockedOut}
                />
                <button
                  type="button"
                  onClick={() => setShowPassword((s) => !s)}
                  aria-label={showPassword ? "Hide password" : "Show password"}
                  disabled={isLoading || isLockedOut}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-gray-500 hover:text-gray-900"
                >
                  {showPassword ? (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M17.94 17.94A10.94 10.94 0 0 1 12 20c-5 0-9.27-3-11-7 1.02-2.1 2.6-3.89 4.54-5.06" />
                      <path d="M1 1l22 22" />
                    </svg>
                  ) : (
                    <svg
                      xmlns="http://www.w3.org/2000/svg"
                      className="h-5 w-5"
                      viewBox="0 0 24 24"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    >
                      <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z" />
                      <circle cx="12" cy="12" r="3" />
                    </svg>
                  )}
                </button>
              </div>
              <div className="flex gap-2">
                <button
                  type="submit"
                  disabled={isLoading || isLockedOut}
                  className="bg-gray-700 hover:bg-gray-800 text-white px-4 py-2 rounded disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-2 transition-opacity"
                >
                  {isLoading && (
                    <svg
                      className="animate-spin h-4 w-4 text-white"
                      xmlns="http://www.w3.org/2000/svg"
                      fill="none"
                      viewBox="0 0 24 24"
                    >
                      <circle
                        className="opacity-25"
                        cx="12"
                        cy="12"
                        r="10"
                        stroke="currentColor"
                        strokeWidth="4"
                      ></circle>
                      <path
                        className="opacity-75"
                        fill="currentColor"
                        d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                      ></path>
                    </svg>
                  )}
                  {isLoading ? "Logging in..." : "Login"}
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setView("email-register");
                  }}
                  disabled={isLoading || isLockedOut}
                  className="px-4 py-2 text-gray-700 hover:bg-gray-50 rounded disabled:opacity-50 transition-opacity"
                >
                  Register
                </button>
              </div>
              <div className="flex justify-between items-center">
                <button
                  type="button"
                  onClick={handleForgot}
                  disabled={isLoading || isLockedOut}
                  className="text-sm text-indigo-600 hover:text-indigo-800 disabled:opacity-50"
                >
                  Forgot password?
                </button>
                <button
                  type="button"
                  onClick={() => {
                    clearMessages();
                    setView("choose");
                  }}
                  disabled={isLoading}
                  className="text-sm text-gray-500 hover:text-gray-700 disabled:opacity-50"
                >
                  ← Back
                </button>
              </div>
            </form>
          )}

          {/* Lockout banner with countdown */}
          {isLockedOut && (
            <div className="mt-4 p-3 rounded-lg text-sm bg-red-50 text-red-800 border border-red-200 flex items-center gap-2">
              <svg
                className="w-5 h-5 text-red-500 shrink-0"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 15v2m0-6v2m-6 4h12a2 2 0 002-2V9a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zM10 9h4V7a2 2 0 00-4 0v2z"
                />
              </svg>
              <span>
                Too many failed attempts. Try again in{" "}
                <span className="font-bold tabular-nums">{secondsLeft}s</span>.
              </span>
            </div>
          )}

          {/* Message display with different styles for success/error/info */}
          {message && !isLockedOut && (
            <div
              className={`mt-4 p-3 rounded-lg text-sm ${
                messageType === "success"
                  ? "bg-green-50 text-green-800 border border-green-200"
                  : messageType === "info"
                    ? "bg-blue-50 text-blue-800 border border-blue-200"
                    : "bg-red-50 text-red-800 border border-red-200"
              }`}
            >
              <div className="flex items-start gap-2">
                {messageType === "success" && (
                  <svg
                    className="w-5 h-5 text-green-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {messageType === "error" && (
                  <svg
                    className="w-5 h-5 text-red-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                {messageType === "info" && (
                  <svg
                    className="w-5 h-5 text-blue-500 shrink-0 mt-0.5"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth="2"
                      d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z"
                    />
                  </svg>
                )}
                <div className="flex-1">
                  <p>{message}</p>
                  {messageAction && (
                    <button
                      type="button"
                      onClick={() => handleActionClick(messageAction.action)}
                      className={`mt-2 font-medium underline hover:no-underline ${
                        messageType === "success"
                          ? "text-green-700"
                          : messageType === "info"
                            ? "text-blue-700"
                            : "text-red-700"
                      }`}
                    >
                      {messageAction.text} →
                    </button>
                  )}
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>,
    document.body,
  );
}
