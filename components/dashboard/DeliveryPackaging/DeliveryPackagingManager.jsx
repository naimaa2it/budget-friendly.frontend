"use client";

import React from "react";
import ChargeList from "@/components/dashboard/DeliveryPackaging/ChargeList";

export default function DeliveryPackagingManager() {
  return (
    <div className="space-y-10">
      <ChargeList
        title="Delivery Charges"
        description="Add as many delivery charge amounts as you need. These show up as a dropdown on the product's Pricing & Inventory section."
        apiPath="delivery-charges"
        noun="delivery charge"
      />
      <ChargeList
        title="Packaging Charges"
        description="Add as many packaging charge amounts as you need. These show up as a dropdown on the product's Pricing & Inventory section."
        apiPath="packaging-charges"
        noun="packaging charge"
      />
    </div>
  );
}
