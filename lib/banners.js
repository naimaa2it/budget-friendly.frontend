const API = process.env.NEXT_PUBLIC_API_URL || "https://api.pickob.com";

const FALLBACK = [
  {
    _id: "fallback-1",
    image: { url: "/banner/Oven_Big_banner_1.jpg" },
    title: "",
    subtitle: "",
    buttonText: "",
    buttonLink: "/",
    badge: "",
  },
];

export async function getBanners() {
  try {
    const r = await fetch(`${API}/api/banners`, { next: { revalidate: 60 } });
    const d = await r.json();
    return (d.items || []).length > 0 ? d.items : FALLBACK;
  } catch {
    return FALLBACK;
  }
}
