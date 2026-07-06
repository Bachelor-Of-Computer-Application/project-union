import client from "./client";

// ── Public menu ───────────────────────────────────────────────────────
export const getMenuItems = (params) =>
  client.get("/menu/items/", { params });

export const getMenuCategories = () =>
  client.get("/menu/categories/with-items/");

// ── Admin menu management ─────────────────────────────────────────────
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

// ── Admin category management ─────────────────────────────────────────
export const getCategories = () =>
  client.get("/menu/categories/manage/");

export const createCategory = (name) =>
  client.post("/menu/categories/manage/", { name });

export const updateCategory = (id, name) =>
  client.patch(`/menu/categories/manage/${id}/`, { name });

export const deleteCategory = (id) =>
  client.delete(`/menu/categories/manage/${id}/`);

// ── Admin recipe management ───────────────────────────────────────────
export const getRecipes = () =>
  client.get("/menu/recipes/");

export const createRecipe = (data) =>
  client.post("/menu/recipes/", data);

export const updateRecipe = (id, data) =>
  client.patch(`/menu/recipes/${id}/`, data);

export const deleteRecipe = (id) =>
  client.delete(`/menu/recipes/${id}/`);
