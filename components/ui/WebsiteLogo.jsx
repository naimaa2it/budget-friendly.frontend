"use client";

import React from "react";
import Link from "next/link";
import { useStoreSettings } from "@/components/context/StoreSettingsContext";
import { cdnImageUrl } from "@/lib/cdnImage";

const WebsiteLogo = ({ className = "h-7 mb-0 object-contain" }) => {
  const { logoUrl, storeName } = useStoreSettings();

  if (!logoUrl) return null;

  return (
    <div>
      <Link href="/">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img
          src={cdnImageUrl(logoUrl)}
          alt={storeName || "Store logo"}
          width={120}
          height={28}
          className={className}
        />
      </Link>
    </div>
  );
};

export default WebsiteLogo;
