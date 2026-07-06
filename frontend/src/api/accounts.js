import client from "./client";

// ── Addresses ────────────────────────────────────────────────────────
export const getAddresses = () =>
  client.get("/accounts/addresses/");

export const createAddress = (data) =>
  client.post("/accounts/addresses/", data);

export const updateAddress = (id, data) =>
  client.patch(`/accounts/addresses/${id}/`, data);

export const deleteAddress = (id) =>
  client.delete(`/accounts/addresses/${id}/`);

// ── Profile ───────────────────────────────────────────────────────────
/** Update authenticated user's name / phone / email. */
export const updateProfile = (data) =>
  client.patch("/accounts/me/update/", data);

/** Change authenticated user's password. */
export const changePassword = (currentPassword, newPassword) =>
  client.post("/accounts/me/change-password/", {
    current_password: currentPassword,
    new_password: newPassword,
  });

// ── Admin: Users ──────────────────────────────────────────────────────
export const adminGetUsers = () =>
  client.get("/accounts/admin/users/");

export const adminGetUser = (id) =>
  client.get(`/accounts/admin/users/${id}/`);

export const adminToggleUserActive = (id, is_active) =>
  client.patch(`/accounts/admin/users/${id}/`, { is_active });

// ── Admin: Payments ───────────────────────────────────────────────────
export const adminGetPayments = () =>
  client.get("/accounts/admin/payments/");
