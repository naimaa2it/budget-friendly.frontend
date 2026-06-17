import React from "react";
import ShopByCategory from "./ShopByCategory";
import PopularPicks from "./PopularPicks";
import DealsOfDay from "./DealsOfDay";
import OffersToSayYes from "./OffersToSayYes";
import Banner from "./Banner";
import PromoStripSection from "./PromoStripSection";
import OccasionSections from "./OccasionSections";
import FeaturedSections from "./FeaturedSections";
import AdSlot from "@/components/ui/AdSlot";

export default function Home() {
  return (
    <>
      <Banner />
      <PromoStripSection />
      <ShopByCategory />
      <OccasionSections />
      <AdSlot page="homepage" className="max-w-7xl mx-auto px-2 py-3" />
      <PopularPicks />
      <FeaturedSections />
      <DealsOfDay />
      <div id="offers" className="scroll-mb-24">
        <OffersToSayYes />
      </div>
    </>
  );
}
