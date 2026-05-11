import axios from "axios";

const rawApiBaseUrl = (
  process.env.NEXT_PUBLIC_API_URL ||
  process.env.NEXT_PUBLIC_API_BASE_URL ||
  "/api"
).replace(/\/$/, "");

const isLocalhostUrl = /https?:\/\/(localhost|127\.0\.0\.1)(:\d+)?/i.test(rawApiBaseUrl);

// In development, call backend directly (e.g. localhost:8080) when provided.
// In production, keep same-origin '/api' fallback for safety.
const API_BASE_URL =
  process.env.NODE_ENV === "development"
    ? rawApiBaseUrl
    : isLocalhostUrl
      ? "/api"
      : rawApiBaseUrl;

const api = axios.create({
  baseURL: API_BASE_URL,
  withCredentials: true,
  headers: {
    "Content-Type": "application/json",
  },
});

const RETRYABLE_NETWORK_CODE = "ERR_NETWORK";
const MAX_NETWORK_RETRIES = 2;

function delay(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function isRetryableNetworkError(error) {
  return error?.code === RETRYABLE_NETWORK_CODE && !error?.response;
}

api.interceptors.request.use(
  (config) => {
    return config;
  },
  (error) => Promise.reject(error)
);

api.interceptors.response.use(
  (response) => response,
  async (error) => {
    const config = error?.config;

    if (config && isRetryableNetworkError(error)) {
      const retryCount = config.__networkRetryCount ?? 0;

      if (retryCount < MAX_NETWORK_RETRIES) {
        config.__networkRetryCount = retryCount + 1;

        const backoffMs = retryCount === 0 ? 300 : 800;
        await delay(backoffMs);

        return api(config);
      }
    }

    const status = error?.response?.status;
    const data = error?.response?.data;
    const message =
      data?.message ??
      error?.message ??
      "Unexpected API error";

    const normalizedError = {
      name: "ApiError",
      message,
      status: status ?? null,
      data: data ?? null,
      code: error?.code ?? null,
      url: error?.config?.url ?? null,
      method: error?.config?.method ?? null,
      originalError: error ?? null,
    };

    return Promise.reject(normalizedError);
  }
);

export default api;
