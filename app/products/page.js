import { Suspense } from "react";
import AllProductsClient from "@/components/category/AllProductsClient";
import { siteTitle, getStoreName } from "@/lib/storeMeta";

export async function generateMetadata() {
  const [title, storeName] = await Promise.all([
    siteTitle("All Products"),
    getStoreName(),
  ]);
  return {
    title,
    description: `Browse all products at ${storeName} — gadgets, electronics, and accessories with the best prices and fast delivery across Bangladesh.`,
  };
}

export default function AllProductsPage() {
  return (
    <Suspense
      fallback={
        <div className="flex justify-center items-center py-32">
          <svg className="animate-spin w-8 h-8 text-red-500" fill="none" viewBox="0 0 24 24">
            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8v8z" />
          </svg>
        </div>
      }
    >
      <AllProductsClient />
    </Suspense>
  );
}
