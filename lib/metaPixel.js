// Thin wrapper around window.fbq so every call site stays consistent and
// silently no-ops if the pixel hasn't loaded yet (config fetch is async).
const CURRENCY = "BDT";

function fbq(...args) {
  if (typeof window !== "undefined" && typeof window.fbq === "function") {
    window.fbq(...args);
  }
}

export function trackPageView() {
  fbq("track", "PageView");
}

export function trackViewContent(product) {
  if (!product) return;
  fbq("track", "ViewContent", {
    content_ids: [product._id || product.id],
    content_name: product.title || product.name,
    content_type: "product",
    value: product.price || 0,
    currency: CURRENCY,
  });
}

export function trackAddToCart(product, qty = 1, unitPrice) {
  if (!product) return;
  const price = unitPrice != null ? unitPrice : product.price || 0;
  fbq("track", "AddToCart", {
    content_ids: [product._id || product.id],
    content_name: product.title || product.name,
    content_type: "product",
    contents: [{ id: product._id || product.id, quantity: qty }],
    value: price * qty,
    currency: CURRENCY,
  });
}

// items: array of { product: {_id, price}, quantity }
export function trackInitiateCheckout(items, total) {
  if (!items?.length) return;
  fbq("track", "InitiateCheckout", {
    content_ids: items.map((i) => i.product?._id || i.product?.id),
    contents: items.map((i) => ({
      id: i.product?._id || i.product?.id,
      quantity: i.quantity,
    })),
    num_items: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    value: total || 0,
    currency: CURRENCY,
  });
}

// order: the object returned by GET /api/orders/:id — { _id, total, items: [{productId, quantity, price}] }
// Fires at most once per order per browser (sessionStorage guard) so page
// refreshes on the thank-you page don't double-count the same purchase.
export function trackPurchase(order) {
  if (!order) return;
  const orderId = order._id || order.orderId;
  const key = `fbq_purchase_${orderId}`;
  if (typeof window !== "undefined" && orderId) {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }
  const items = order.items || [];
  fbq("track", "Purchase", {
    content_ids: items.map((i) => i.productId).filter(Boolean),
    contents: items.map((i) => ({ id: i.productId, quantity: i.quantity })),
    num_items: items.reduce((sum, i) => sum + (i.quantity || 1), 0),
    value: order.total || 0,
    currency: CURRENCY,
    order_id: orderId,
  });
}
