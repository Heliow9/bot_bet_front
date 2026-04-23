import axios from "axios";

export const API_BASE_URL =
  import.meta.env.VITE_API_URL ||
  "https://telegram-bot-agent-6gik.onrender.com";

export const DASHBOARD_POLL_INTERVAL_MS = Number(
  import.meta.env.VITE_DASHBOARD_POLL_INTERVAL_MS || 60000
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: 20000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

api.interceptors.response.use(
  (response) => response,
  (error) => {
    const status = error?.response?.status;

    if (status === 401 || status === 403) {
      localStorage.removeItem("access_token");
      localStorage.removeItem("user");
      window.location.href = "/login";
    }

    return Promise.reject(error);
  }
);

export default api;
