'use client';

import { useEffect, useState } from 'react';
import { useParams, useRouter } from 'next/navigation';

const API = process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5000';

export function generateStaticParams() { return []; }

export default function BarcodeLookupPage() {
  const { code } = useParams();
  const router = useRouter();
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    const barcodeCode = String(code || '').trim().replace(/\s+/g, '');
    if (!barcodeCode) { setNotFound(true); return; }

    fetch(`${API}/api/products/barcode/${encodeURIComponent(barcodeCode)}`)
      .then(r => r.ok ? r.json() : null)
      .then(data => {
        const productId = data?.product?._id || data?.product?.id;
        if (productId) {
          router.replace(`/product/${productId}`);
        } else {
          setNotFound(true);
        }
      })
      .catch(() => setNotFound(true));
  }, [code, router]);

  if (notFound) {
    return (
      <div className="py-24 text-center">
        <p className="text-lg font-semibold text-gray-900">Barcode not found</p>
        <p className="mt-2 text-sm text-gray-500">
          No product is linked to barcode <span className="font-semibold">{code}</span>.
        </p>
      </div>
    );
  }

  return (
    <div className="py-24 text-center">
      <p className="text-sm text-gray-500">Looking up product…</p>
    </div>
  );
}
