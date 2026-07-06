import client from "./client";

// ── Cart ──────────────────────────────────────────────────────────────
export const getCart = () =>
  client.get("/orders/cart/");

export const addToCart = (menuItem, quantity = 1) =>
  client.post("/orders/cart/add/", { menu_item: menuItem, quantity });

export const updateCartItem = (itemId, quantity) =>
  client.patch(`/orders/cart/item/${itemId}/`, { quantity });

export const removeCartItem = (itemId) =>
  client.delete(`/orders/cart/item/${itemId}/remove/`);

// ── Checkout ──────────────────────────────────────────────────────────
export const checkout = (deliveryAddressId, notes = "") =>
  client.post("/orders/checkout/", {
    delivery_address_id: deliveryAddressId,
    notes,
  });

// ── Customer orders ───────────────────────────────────────────────────
export const getOrders = () =>
  client.get("/orders/");

export const getOrderDetail = (id) =>
  client.get(`/orders/${id}/`);

/** Cancel an order that is still in "Order Placed" status. */
export const cancelOrder = (id) =>
  client.post(`/orders/${id}/cancel/`);

export const updateOrderStatus = (id, status) =>
  client.patch(`/orders/${id}/status/`, { status });

// ── Admin orders ──────────────────────────────────────────────────────
/**
 * Fetch all orders with optional filters:
 *   params = { status, payment_status, customer, date_from, date_to }
 */
export const getAdminOrders = (params = {}) =>
  client.get("/orders/admin/all/", { params });

export const adminUpdateOrder = (id, data) =>
  client.patch(`/orders/admin/${id}/`, data);

// ── Dashboard ─────────────────────────────────────────────────────────
export const getDashboard = () =>
  client.get("/orders/dashboard/");
