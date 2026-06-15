"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function GlobalError({ error, reset }) {
  useEffect(() => {
    console.error("[GlobalError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-screen gap-6 text-center px-4">
      <h1 className="text-2xl font-semibold text-gray-800">Something went wrong</h1>
      <p className="text-gray-500 text-sm max-w-sm">
        An unexpected error occurred. Please try again or return to the homepage.
      </p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-rose-600 text-white rounded-full text-sm hover:bg-rose-700"
        >
          Try again
        </button>
        <Link href="/" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50">
          Go home
        </Link>
      </div>
    </div>
  );
}
