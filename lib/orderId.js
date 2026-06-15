/** Consistent short order ID used across storefront and dashboard. */
export function formatOrderId(id, { hash = true } = {}) {
  if (!id) return hash ? "#--------" : "--------";
  const suffix = String(id).slice(-8).toUpperCase();
  return hash ? `#${suffix}` : suffix;
}
