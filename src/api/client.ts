const RAW_API_URL = (import.meta.env.VITE_API_URL || "")
  .trim()
  .replace(/\/+$/, "");

export const BASE_SERVER_URL = RAW_API_URL.replace(/\/api\/v1\/?$/, "");
export const API_BASE_URL = RAW_API_URL.endsWith("/api/v1")
  ? RAW_API_URL
  : BASE_SERVER_URL
    ? `${BASE_SERVER_URL}/api/v1`
    : "/api/v1";

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
      ...options,
      headers,
    });

    if (!response.ok) {
      if (response.status >= 502 && response.status <= 504) {
        if (typeof window !== "undefined") {
          window.dispatchEvent(new CustomEvent("cs-server-offline"));
        }
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
    const isNetworkErr =
      err?.name === "TypeError" ||
      err?.message?.toLowerCase().includes("failed to fetch") ||
      err?.message?.toLowerCase().includes("network");

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
      body: body ? JSON.stringify(body) : undefined,
    }),
  postForm: <T>(endpoint: string, formData: FormData) =>
    apiRequest<T>(endpoint, {
      method: "POST",
      body: formData,
    }),
  put: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: "PUT",
      body: body ? JSON.stringify(body) : undefined,
    }),
  patch: <T>(endpoint: string, body?: any) =>
    apiRequest<T>(endpoint, {
      method: "PATCH",
      body: body ? JSON.stringify(body) : undefined,
    }),
  delete: <T>(endpoint: string) =>
    apiRequest<T>(endpoint, { method: "DELETE" }),
};
