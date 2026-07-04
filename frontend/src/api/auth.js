import client from "./client";

export const login = (username, password) =>
  client.post("/token/", { username, password });

export const register = (data) =>
  client.post("/accounts/register/", data);

export const getMe = () =>
  client.get("/accounts/me/");
