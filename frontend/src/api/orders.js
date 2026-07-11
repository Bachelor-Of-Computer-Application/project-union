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
export const checkout = (deliveryAddressId, notes = "", paymentMethod = "COD") =>
  client.post("/orders/checkout/", {
    delivery_address_id: deliveryAddressId,
    notes,
    payment_method: paymentMethod,
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

// ── Payment ───────────────────────────────────────────────────────────
/**
 * Initiate eSewa payment for an order.
 * Returns payment form URL and form data to submit to eSewa.
 */
export const initiatePayment = (orderId, paymentMethod) =>
  client.post("/orders/payment/initiate/", {
    order_id: orderId,
    payment_method: paymentMethod,
  });

/**
 * Verify payment status with eSewa.
 * Called after user returns from eSewa payment page.
 */
export const verifyPayment = (transactionUuid) =>
  client.get("/orders/payment/verify/", { params: { transaction_uuid: transactionUuid } });

/**
 * Payment success callback from eSewa.
 * (Typically called server-side, but can be called from frontend for verification)
 */
export const paymentSuccess = (data) =>
  client.post("/orders/payment/success/", data);

/**
 * Payment failure callback from eSewa.
 */
export const paymentFailure = (data) =>
  client.post("/orders/payment/failure/", data);
