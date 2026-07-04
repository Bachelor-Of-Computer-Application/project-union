import client from "./client";

export const getCart = () =>
  client.get("/orders/cart/");

export const addToCart = (menuItem, quantity = 1) =>
  client.post("/orders/cart/add/", { menu_item: menuItem, quantity });

export const updateCartItem = (itemId, quantity) =>
  client.patch(`/orders/cart/item/${itemId}/`, { quantity });

export const removeCartItem = (itemId) =>
  client.delete(`/orders/cart/item/${itemId}/remove/`);

export const checkout = (deliveryAddressId, notes = "") =>
  client.post("/orders/checkout/", {
    delivery_address_id: deliveryAddressId,
    notes,
  });

export const getOrders = () =>
  client.get("/orders/");

export const getOrderDetail = (id) =>
  client.get(`/orders/${id}/`);

export const updateOrderStatus = (id, status) =>
  client.patch(`/orders/${id}/status/`, { status });

export const getDashboard = () =>
  client.get("/orders/dashboard/");

export const getAdminOrders = () =>
  client.get("/orders/admin/all/");

export const adminUpdateOrder = (id, data) =>
  client.patch(`/orders/admin/${id}/`, data);
