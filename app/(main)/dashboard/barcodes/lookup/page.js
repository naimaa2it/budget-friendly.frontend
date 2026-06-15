import { Suspense } from "react";
import BarcodeLookup from "@/components/dashboard/Barcode/BarcodeLookup";

export default function Page() {
  return (
    <Suspense
      fallback={
        <div className="rounded-2xl border border-gray-200 bg-white p-8 text-center text-gray-500">
          Loading barcode lookup...
        </div>
      }
    >
      <BarcodeLookup />
    </Suspense>
  );
}
