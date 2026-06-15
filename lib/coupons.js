// DEPRECATED: Coupons are now managed via the database (Discount model)
// This file is kept for backwards compatibility but should not be used for new code.
// Coupon validation is handled server-side via /api/orders/quote
// Coupon listing is handled via /api/coupons

export const COUPONS = [];

/** @deprecated Auto discounts are now handled server-side */
export function getAutoDiscount(subtotal) {
  return 0;
}

/** Returns base shipping cost before any coupon */
export function getBaseShipping(subtotal, insideDhaka = false) {
  if (subtotal >= 999) return 0;
  return insideDhaka ? 70 : 130;
}

/** Checks if a user is considered "new" based on account creation date (within 30 days) */
export function isNewUser(user) {
  if (!user?.createdAt) return false;
  const thirtyDays = 30 * 24 * 60 * 60 * 1000;
  return Date.now() - new Date(user.createdAt).getTime() < thirtyDays;
}
