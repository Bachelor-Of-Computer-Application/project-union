import axios from "axios";

// API base URL is set via the VITE_API_BASE environment variable.
// In local dev this defaults to http://localhost:8000/api.
// Set it in frontend/.env for production.
const API_BASE = import.meta.env.VITE_API_BASE ?? "http://localhost:8000/api";

// Used for constructing media/image URLs (e.g. menu item images)
export const MEDIA_BASE = import.meta.env.VITE_MEDIA_BASE ?? "http://localhost:8000";

const client = axios.create({
  baseURL: API_BASE,
  headers: { "Content-Type": "application/json" },
});

// Attach the JWT access token to every outgoing request
client.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

// On 401, attempt a silent token refresh once, then redirect to /login
client.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;

    if (error.response?.status === 401 && !originalRequest._retry) {
      originalRequest._retry = true;

      const refresh = localStorage.getItem("refresh_token");
      if (!refresh) {
        redirectToLogin();
        return Promise.reject(error);
      }

      try {
        const res = await axios.post(`${API_BASE}/token/refresh/`, { refresh });
        const newAccess = res.data.access;
        localStorage.setItem("access_token", newAccess);
        originalRequest.headers.Authorization = `Bearer ${newAccess}`;
        return client(originalRequest);
      } catch {
        redirectToLogin();
        return Promise.reject(error);
      }
    }

    return Promise.reject(error);
  }
);

function redirectToLogin() {
  localStorage.removeItem("access_token");
  localStorage.removeItem("refresh_token");
  window.location.href = "/login";
}

export default client;
