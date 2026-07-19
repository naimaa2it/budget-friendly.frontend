import { Work_Sans } from "next/font/google";
import "./globals.css";
import { UserProvider } from "@/components/context/UserContext";
import { CartProvider } from "@/components/context/CartContext";
import { CategoryProvider } from "@/components/context/CategoryContext";
import { LanguageProvider } from "@/components/context/LanguageContext";
import CartToast from "@/components/cart/CartToast";
import CartSidebar from "@/components/cart/CartSidebar";
import CartFloating from "@/components/cart/CartFloating";
import ToastProvider from "@/components/ui/ToastProvider";
import FrequentlyBoughtTogetherModal from "@/components/cart/FrequentlyBoughtTogetherModal";
import LayoutWrapper from "@/components/layout/LayoutWrapper";
import TrackingCodeInjector from "@/components/layout/TrackingCodeInjector";
import ScrollToTop from "@/components/ui/ScrollToTop";
// import FloatingWhatsApp from "@/components/ui/FloatingWhatsApp";
import PopupBanner from "@/components/ui/PopupBanner";
import { getStoreName, getFavicon } from "@/lib/storeMeta";
import { CompareProvider } from "@/components/context/CompareContext";
import CompareBar from "@/components/product/CompareBar";
import GlobalScrollFix from "@/components/ui/GlobalScrollFix";

const SITE_URL =
  process.env.NEXT_PUBLIC_SITE_URL || "https://pickob.com";

const workSans = Work_Sans({
  variable: "--font-work-sans",
  subsets: ["latin"],
  weight: ["100", "200", "300", "400", "500", "600", "700", "800"],
});

export async function generateMetadata() {
  const [storeName, favicon] = await Promise.all([
    getStoreName(),
    getFavicon(),
  ]);
  return {
    metadataBase: new URL(SITE_URL),
    ...(favicon ? { icons: { icon: favicon } } : {}),
    title: {
      default: `${storeName} — Gadgets & Electronics Online Shop in Bangladesh`,
      template: `%s | ${storeName}`,
    },
    description:
      "Shop the latest gadgets and electronics in Bangladesh — smartphones, accessories, smart devices, and more. Authentic products, best prices, fast nationwide delivery.",
    keywords: [
      "gadgets Bangladesh",
      "electronics online BD",
      "buy gadgets online Bangladesh",
      storeName,
      "smart devices Bangladesh",
      "mobile accessories BD",
      "tech gadgets shop Bangladesh",
    ],
    authors: [{ name: storeName, url: SITE_URL }],
    creator: storeName,
    publisher: storeName,
    formatDetection: { email: false, address: false, telephone: false },
    alternates: { canonical: SITE_URL },
    openGraph: {
      type: "website",
      locale: "bn_BD",
      url: SITE_URL,
      siteName: storeName,
      title: `${storeName} — Gadgets & Electronics Online Shop in Bangladesh`,
      description:
        "Bangladesh's trusted online shop for gadgets and electronics. Fast delivery, authentic products, best prices.",
      images: [`${SITE_URL}/mainLogo.png`],
    },
    twitter: {
      card: "summary_large_image",
      title: `${storeName} — Gadgets & Electronics Online Shop in Bangladesh`,
      description:
        "Bangladesh's trusted online shop for gadgets and electronics — best prices, fast delivery.",
      images: ["/mainLogo.png"],
    },
    robots: {
      index: true,
      follow: true,
      googleBot: {
        index: true,
        follow: true,
        "max-video-preview": -1,
        "max-image-preview": "large",
        "max-snippet": -1,
      },
    },
    verification: {
      google: process.env.NEXT_PUBLIC_GOOGLE_VERIFICATION || undefined,
    },
  };
}

export const viewport = {
  width: "device-width",
  initialScale: 1,
  themeColor: "#ef4444",
};

import Script from "next/script";

export default async function RootLayout({ children }) {
  const storeName = await getStoreName();

  const organizationSchema = {
    "@context": "https://schema.org",
    "@type": "Organization",
    name: storeName,
    url: SITE_URL,
    logo: `${SITE_URL}/mainLogo.png`,
    contactPoint: {
      "@type": "ContactPoint",
      contactType: "customer support",
      areaServed: "BD",
      availableLanguage: ["English", "Bengali"],
    },
  };

  const websiteSchema = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: storeName,
    url: SITE_URL,
    potentialAction: {
      "@type": "SearchAction",
      target: {
        "@type": "EntryPoint",
        urlTemplate: `${SITE_URL}/search?q={search_term_string}`,
      },
      "query-input": "required name=search_term_string",
    },
  };

  return (
    <html lang="en">
      <head>
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{
            __html: JSON.stringify(organizationSchema),
          }}
        />
        <script
          type="application/ld+json"
          dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
        />
        {/* Microsoft Clarity — uncomment and set NEXT_PUBLIC_CLARITY_ID */}
        {/* <Script id="ms-clarity" strategy="afterInteractive" dangerouslySetInnerHTML={{ __html: `(function(c,l,a,r,i,t,y){c[a]=c[a]||function(){(c[a].q=c[a].q||[]).push(arguments)};t=l.createElement(r);t.async=1;t.src="https://www.clarity.ms/tag/${process.env.NEXT_PUBLIC_CLARITY_ID}";y=l.getElementsByTagName(r)[0];y.parentNode.insertBefore(t,y);})(window,document,"clarity","script");` }} /> */}
      </head>
      <body className={`${workSans.variable} antialiased`}>
        <TrackingCodeInjector />
        <LanguageProvider>
          <UserProvider>
            <CartProvider>
              <CategoryProvider>
                <CompareProvider>
                  <GlobalScrollFix />
                  <ScrollToTop />
                  <LayoutWrapper>{children}</LayoutWrapper>
                  {/* <FloatingWhatsApp /> */}
                  {/* global UI overlays */}
                  <CartToast />
                  <CartSidebar />
                  <CartFloating />
                  <ToastProvider />
                  <PopupBanner />
                  <FrequentlyBoughtTogetherModal />
                  <CompareBar />
                </CompareProvider>
              </CategoryProvider>
            </CartProvider>
          </UserProvider>
        </LanguageProvider>
      </body>
    </html>
  );
}
