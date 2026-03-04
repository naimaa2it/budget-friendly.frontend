import React from 'react'
import ShopByCategory from './ShopByCategory'
import PopularPicks from './PopularPicks'
import DealsOfDay from './DealsOfDay'
import OffersToSayYes from './OffersToSayYes'
import Banner from './Banner'
import OccasionSections from './OccasionSections'

export default function Home() {
  return (
    <>
    <Banner/>
    <ShopByCategory/>
    <PopularPicks/>
    <OccasionSections/>
    <DealsOfDay/>
    <OffersToSayYes/>
    </>
  )
}
 