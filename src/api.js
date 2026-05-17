import axios from "axios";

const DEFAULT_REMOTE_API_URL = "https://api-bet2026.duckdns.org";

function normalizeBaseUrl(value) {
  const raw = String(value || "").trim();
  if (!raw) return "";
  return raw.replace(/\/+$/, "");
}

function resolveApiBaseUrl() {
  const envUrl = normalizeBaseUrl(import.meta.env.VITE_API_URL);
  if (envUrl) return envUrl;

  // Quando a dashboard estiver hospedada no mesmo domínio da API via Nginx,
  // defina VITE_API_URL=/api para evitar CORS e mixed content.
  const sameOriginPath = normalizeBaseUrl(import.meta.env.VITE_API_PROXY_PATH);
  if (sameOriginPath) return sameOriginPath;

  return DEFAULT_REMOTE_API_URL;
}

export const API_BASE_URL = resolveApiBaseUrl();

export const DASHBOARD_POLL_INTERVAL_MS = Number(
  import.meta.env.VITE_DASHBOARD_POLL_INTERVAL_MS || 60000
);

const api = axios.create({
  baseURL: API_BASE_URL,
  timeout: Number(import.meta.env.VITE_API_TIMEOUT_MS || 20000),
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

export function getApiConnectionMessage(error) {
  if (!navigator.onLine) {
    return "Navegador offline. Verifique sua conexão.";
  }

  if (error?.code === "ECONNABORTED") {
    return "A API demorou para responder. Confira se o servidor está sobrecarregado.";
  }

  if (!error?.response) {
    return `Não foi possível conectar na API (${API_BASE_URL}). Verifique firewall, CORS, HTTPS/HTTP ou VITE_API_URL.`;
  }

  return `API respondeu com status ${error.response.status}.`;
}

export default api;
