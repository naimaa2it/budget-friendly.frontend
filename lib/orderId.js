/**
 * Consistent human-facing order number used across storefront and dashboard.
 *
 * New orders carry a numeric `orderNo` → rendered as "pk100000".
 * Legacy orders (no orderNo) fall back to "#<last 8 of _id>".
 *
 * Accepts either:
 *   - an order-like object ({ orderNo, _id, orderNumber }), or
 *   - a bare id / suffix string (legacy call sites).
 * If the object already carries a server-computed `orderNumber` string, that
 * wins (the backend is the source of truth for the label).
 */
export function formatOrderId(input, { hash = true } = {}) {
  if (input && typeof input === "object") {
    if (input.orderNumber) return input.orderNumber;
    if (input.orderNo != null && input.orderNo !== "") {
      return `pk${input.orderNo}`;
    }
    return formatOrderId(input._id, { hash });
  }

  if (!input) return hash ? "#--------" : "--------";
  const suffix = String(input).slice(-8).toUpperCase();
  return hash ? `#${suffix}` : suffix;
}
