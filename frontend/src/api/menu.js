import client from "./client";

export const getMenuItems = (params) =>
  client.get("/menu/items/", { params });

export const getMenuCategories = () =>
  client.get("/menu/categories/with-items/");

export const getMenuManage = () =>
  client.get("/menu/manage/");

export const createMenuItem = (data) =>
  client.post("/menu/manage/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateMenuItem = (id, data) =>
  client.patch(`/menu/manage/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteMenuItem = (id) =>
  client.delete(`/menu/manage/${id}/`);
