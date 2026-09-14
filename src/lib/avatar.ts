import { BASE_SERVER_URL } from "@/api/client";

/**
 * Normalizes an avatar URL. If the URL is a relative static path
 * (e.g. `/static/uploads/...`), it prepends the backend BASE_SERVER_URL.
 */
export function resolveAvatarUrl(url?: string | null): string | undefined {
  if (!url) return undefined;
  if (url.startsWith("http://") || url.startsWith("https://")) {
    return url;
  }
  return `${BASE_SERVER_URL}${url}`;
}
