const RAW_API_URL = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export const BASE_SERVER_URL = RAW_API_URL.replace(/\/api\/v1\/?$/, "");
export const API_BASE_URL = RAW_API_URL.endsWith("/api/v1")
  ? RAW_API_URL
  : BASE_SERVER_URL
    ? `${BASE_SERVER_URL}/api/v1`
    : "/api/v1";

const MAX_NETWORK_RETRIES = 2;
const RETRY_BACKOFF_MS = 1500;

const delay = (ms: number): Promise<void> =>
  new Promise((resolve) => setTimeout(resolve, ms));

export class ApiClientError extends Error {
  status: number;
  data: any;

  constructor(status: number, message: string, data?: any) {
    super(message);
    this.status = status;
    this.data = data;
    this.name = "ApiClientError";
  }
}

export async function apiRequest<T>(
  endpoint: string,
  options: RequestInit = {},
  retryCount = 0,
): Promise<T> {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("cs_token") : null;
  const headers = new Headers(options.headers || {});

  if (!(options.body instanceof FormData)) {
    headers.set("Content-Type", "application/json");
  }
  if (token) {
    headers.set("Authorization", `Bearer ${token}`);
  }

  try {
    const response = await fetch(`${API_BASE_URL}${endpoint}`, {
      credentials: "include",
      ...options,
      headers,
    });

    if (!response.ok) {
      const isGatewayErr =
        response.status >= 502 && response.status <= 504;

      if (isGatewayErr && retryCount < MAX_NETWORK_RETRIES) {
        await delay(RETRY_BACKOFF_MS * (retryCount + 1));
        return apiRequest<T>(endpoint, options, retryCount + 1);
      }

      if (isGatewayErr && typeof window !== "undefined") {
        window.dispatchEvent(new CustomEvent("cs-server-offline"));
      }

      let errorDetail = "An unexpected error occurred";
      try {
        const errJson = await response.json();
        errorDetail =
          errJson.detail || errJson.message || JSON.stringify(errJson);
      } catch {
        errorDetail = response.statusText;
      }
      throw new ApiClientError(response.status, errorDetail);
    }

    return response.json() as Promise<T>;
  } catch (err: any) {
    if (err instanceof ApiClientError) {
      throw err;
    }

    const isNetworkErr =
      err?.name === "TypeError" ||
      err?.message?.toLowerCase().includes("failed to fetch") ||
      err?.message?.toLowerCase().includes("network");

    if (isNetworkErr && retryCount < MAX_NETWORK_RETRIES) {
      await delay(RETRY_BACKOFF_MS * (retryCount + 1));
      return apiRequest<T>(endpoint, options, retryCount + 1);
    }

    if (isNetworkErr && typeof window !== "undefined") {
      window.dispatchEvent(new CustomEvent("cs-server-offline"));
    }
    throw err;
  }
}

export const api = {
  get: <T>(endpoint: string) => apiRequest<T>(endpoint, { method: "GET" }),
  post: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),
  postForm: <T>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: formData,
    }),
  put: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),
  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body:
        body instanceof FormData
          ? body
          : body
            ? JSON.stringify(body)
            : undefined,
    }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};
