import client from "./client";

export const getInventory = () =>
  client.get("/inventory/");

export const createInventoryItem = (data) =>
  client.post("/inventory/", data);

export const updateInventoryItem = (id, data) =>
  client.patch(`/inventory/${id}/`, data);

export const deleteInventoryItem = (id) =>
  client.delete(`/inventory/${id}/`);

/** Add stock to an existing inventory item. quantity = amount to ADD. */
export const restockInventoryItem = (id, quantity) =>
  client.post(`/inventory/${id}/restock/`, { quantity });

export const getInventoryStats = () =>
  client.get("/inventory/stats/");
