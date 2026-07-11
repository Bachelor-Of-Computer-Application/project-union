import client from "./client";

// Dashboard
export const getDeliveryDashboard = () =>
  client.get("/orders/delivery/dashboard/");

// Assigned Orders
export const getDeliveryOrders = () =>
  client.get("/orders/delivery/orders/");

// Mark order as delivered
export const markDelivered = (orderId) =>
  client.patch(`/orders/${orderId}/status/`, {
    status: "Delivered",
  });

// Mark order as out for delivery
export const markOutForDelivery = (orderId) =>
  client.patch(`/orders/${orderId}/status/`, {
    status: "Out for Delivery",
  });

// Delivery profile
export const getDeliveryProfile = () =>
  client.get("/accounts/me/");