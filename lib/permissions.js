// Mirrors backend lib/permissions.js — admins always have full access, and
// moderators must have a permission explicitly checked to gain access
// (empty permissions array = no access, opt-in grant model).
// Supports both legacy section keys (catalog/orders/…) and granular keys (products.view/…).

export const LEGACY_MAP = {
  catalog: [
    "products.view", "products.buying_price", "products.manage", "products.delete",
    "products.inventory", "products.variants", "products.categories", "products.discounts",
    "products.tags", "products.barcodes", "products.reviews", "products.rewards",
    "products.waitlist", "products.questions", "products.preorders",
  ],
  orders: [
    "orders.view", "orders.manage", "orders.delete", "orders.returns",
    "orders.abandoned", "orders.wishlist", "orders.timeline", "orders.notes",
    "orders.pick", "orders.courier",
  ],
  customers: ["customers.view", "customers.manage", "customers.delete", "customers.tags"],
  content: ["content.banners", "content.promo", "content.featured", "content.blog", "content.media"],
  addons: ["addons.manage", "addons.pixels", "addons.analytics", "addons.adsense", "addons.protection"],
};

export const REVERSE_MAP = Object.fromEntries(
  Object.entries(LEGACY_MAP).flatMap(([legacy, keys]) => keys.map((k) => [k, legacy]))
);

export function hasPermission(user, key) {
  if (!user) return false;
  if (user.role === "admin") return true;
  if (!Array.isArray(user.permissions) || user.permissions.length === 0) return false;
  if (user.permissions.includes(key)) return true;
  if (LEGACY_MAP[key]) return LEGACY_MAP[key].some((k) => user.permissions.includes(k));
  if (REVERSE_MAP[key]) return user.permissions.includes(REVERSE_MAP[key]);
  return false;
}
