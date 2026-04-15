import axios from "axios";

const api = axios.create({
  baseURL: "https://telegram-bot-agent-6gik.onrender.com:8000",
  timeout: 15000,
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("access_token");
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }
  return config;
});

export default api;