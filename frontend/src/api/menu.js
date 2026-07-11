import client from "./client";

// ── Public — full tree (one call for the entire menu page) ────────────────
export const getMenuFull = () =>
  client.get("/menu/full/");

// ── Public — flat lists (used for filtering / search) ─────────────────────
export const getMainCategories = () =>
  client.get("/menu/main-categories/");

/** @param {number|null} mainCategoryId — omit to get all sections */
export const getMenuSections = (mainCategoryId = null) =>
  client.get("/menu/sections/", {
    params: mainCategoryId ? { main_category: mainCategoryId } : {},
  });

export const getMenuItems = (params = {}) =>
  client.get("/menu/items/", { params });

export const getMenuItemDetail = (id) =>
  client.get(`/menu/items/${id}/`);

// ── Admin — MainCategory CRUD ─────────────────────────────────────────────
export const adminGetMainCategories = () =>
  client.get("/menu/admin/main-categories/");

export const adminCreateMainCategory = (data) =>
  client.post("/menu/admin/main-categories/", data);

export const adminUpdateMainCategory = (id, data) =>
  client.patch(`/menu/admin/main-categories/${id}/`, data);

export const adminDeleteMainCategory = (id) =>
  client.delete(`/menu/admin/main-categories/${id}/`);

// ── Admin — MenuSection CRUD ──────────────────────────────────────────────
/** @param {number|null} mainCategoryId — pass to filter by main category */
export const adminGetSections = (mainCategoryId = null) =>
  client.get("/menu/admin/sections/", {
    params: mainCategoryId ? { main_category: mainCategoryId } : {},
  });

export const adminCreateSection = (data) =>
  client.post("/menu/admin/sections/", data);

export const adminUpdateSection = (id, data) =>
  client.patch(`/menu/admin/sections/${id}/`, data);

export const adminDeleteSection = (id) =>
  client.delete(`/menu/admin/sections/${id}/`);

// ── Admin — MenuItem CRUD ─────────────────────────────────────────────────
export const getMenuManage = (params = {}) =>
  client.get("/menu/admin/items/", { params });

export const createMenuItem = (data) =>
  client.post("/menu/admin/items/", data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const updateMenuItem = (id, data) =>
  client.patch(`/menu/admin/items/${id}/`, data, {
    headers: { "Content-Type": "multipart/form-data" },
  });

export const deleteMenuItem = (id) =>
  client.delete(`/menu/admin/items/${id}/`);

// ── Admin — Recipe CRUD ───────────────────────────────────────────────────
export const getRecipes = () =>
  client.get("/menu/recipes/");

export const createRecipe = (data) =>
  client.post("/menu/recipes/", data);

export const updateRecipe = (id, data) =>
  client.patch(`/menu/recipes/${id}/`, data);

export const deleteRecipe = (id) =>
  client.delete(`/menu/recipes/${id}/`);

// ── Legacy alias (kept so any other component using getMenuCategories still works) ──
export const getMenuCategories = () =>
  client.get("/menu/categories/with-items/");
