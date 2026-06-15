"use client";

import { useEffect } from "react";
import Link from "next/link";

export default function ProductError({ error, reset }) {
  useEffect(() => {
    console.error("[ProductError]", error);
  }, [error]);

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] gap-6 text-center px-4">
      <h2 className="text-xl font-semibold text-gray-800">Could not load product</h2>
      <p className="text-gray-500 text-sm">This product may no longer be available.</p>
      <div className="flex gap-4">
        <button
          onClick={reset}
          className="px-4 py-2 bg-rose-600 text-white rounded-full text-sm hover:bg-rose-700"
        >
          Retry
        </button>
        <Link href="/" className="px-4 py-2 border border-gray-300 text-gray-700 rounded-full text-sm hover:bg-gray-50">
          Continue shopping
        </Link>
      </div>
    </div>
  );
}
