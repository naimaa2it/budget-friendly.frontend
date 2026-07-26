// Thin wrapper around window.dataLayer so GTM (Google Tag Manager) sees the
// same ecommerce funnel that lib/metaPixel.js already reports to Facebook.
// Every push is also logged to the console so button clicks are visible
// while testing in devtools / GTM Preview mode.
const CURRENCY = "BDT";

function pushEvent(event, payload = {}) {
  if (typeof window === "undefined") return;
  window.dataLayer = window.dataLayer || [];
  const data = { event, ...payload };
  window.dataLayer.push(data);
  console.log("[GTM dataLayer]", data);
}

export function gtmPageView(pathname) {
  pushEvent("page_view", {
    page_path: pathname,
    page_location: window.location.href,
    page_title: document.title,
  });
}

export function gtmAddToCart(product, qty = 1, unitPrice) {
  if (!product) return;
  const price = unitPrice != null ? unitPrice : product.price || 0;
  pushEvent("add_to_cart", {
    ecommerce: {
      currency: CURRENCY,
      value: price * qty,
      items: [
        {
          item_id: product._id || product.id,
          item_name: product.title || product.name,
          quantity: qty,
          price,
        },
      ],
    },
  });
}

// items: array of { product: {_id, price, title}, quantity }
export function gtmViewCart(items, total) {
  if (!items?.length) return;
  pushEvent("view_cart", {
    ecommerce: {
      currency: CURRENCY,
      value: total || 0,
      items: items.map((i) => ({
        item_id: i.product?._id || i.product?.id,
        item_name: i.product?.title || i.product?.name,
        quantity: i.quantity,
      })),
    },
  });
}

export function gtmBeginCheckout(items, total) {
  if (!items?.length) return;
  pushEvent("begin_checkout", {
    ecommerce: {
      currency: CURRENCY,
      value: total || 0,
      items: items.map((i) => ({
        item_id: i.product?._id || i.product?.id,
        item_name: i.product?.title || i.product?.name,
        quantity: i.quantity,
      })),
    },
  });
}

// order: the object returned by GET /api/orders/:id — { _id, total, items: [{productId, quantity, price}] }
// Fires at most once per order per browser (sessionStorage guard) so page
// refreshes on the thank-you page don't double-count the same purchase.
export function gtmPurchase(order) {
  if (!order) return;
  const orderId = order._id || order.orderId;
  const key = `gtm_purchase_${orderId}`;
  if (typeof window !== "undefined" && orderId) {
    if (sessionStorage.getItem(key)) return;
    sessionStorage.setItem(key, "1");
  }
  const items = order.items || [];
  pushEvent("purchase", {
    ecommerce: {
      transaction_id: orderId,
      currency: CURRENCY,
      value: order.total || 0,
      items: items.map((i) => ({
        item_id: i.productId,
        quantity: i.quantity,
      })),
    },
  });
}
