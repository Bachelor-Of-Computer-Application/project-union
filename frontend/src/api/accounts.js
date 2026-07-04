import client from "./client";

export const getAddresses = () =>
  client.get("/accounts/addresses/");

export const createAddress = (data) =>
  client.post("/accounts/addresses/", data);

export const updateAddress = (id, data) =>
  client.patch(`/accounts/addresses/${id}/`, data);

export const deleteAddress = (id) =>
  client.delete(`/accounts/addresses/${id}/`);

export const adminGetUsers = () =>
  client.get("/accounts/admin/users/");

export const adminGetUser = (id) =>
  client.get(`/accounts/admin/users/${id}/`);

export const adminToggleUserActive = (id, is_active) =>
  client.patch(`/accounts/admin/users/${id}/`, { is_active });

export const adminGetPayments = () =>
  client.get("/accounts/admin/payments/");
