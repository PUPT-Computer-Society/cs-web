import { QueryClient } from "@tanstack/react-query";

export const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 1000 * 60 * 2, // 2 minutes fresh cache
      gcTime: 1000 * 60 * 10, // 10 minutes garbage collection
      refetchOnWindowFocus: false,
      retry: 1,
    },
  },
});

export const queryKeys = {
  stats: ["stats"] as const,
  users: ["users"] as const,
  roles: ["roles"] as const,
  gpoa: ["gpoa"] as const,
  tasks: ["tasks"] as const,
  finance: ["finance"] as const,
  financeSummary: ["finance", "summary"] as const,
  inventory: ["inventory"] as const,
  materials: (category?: string) =>
    ["materials", category || "all"] as const,
  resolutions: (docType?: string) =>
    ["resolutions", docType || "all"] as const,
  announcements: (scope?: string) =>
    ["announcements", scope || "all"] as const,
  auditLogs: (params?: Record<string, unknown>) =>
    ["audit-logs", params || {}] as const,
};
