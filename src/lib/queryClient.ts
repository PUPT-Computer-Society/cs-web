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
  gpoaFiltered: (params?: Record<string, unknown>) =>
    ["gpoa", params || {}] as const,
  tasks: ["tasks"] as const,
  tasksFiltered: (params?: Record<string, unknown>) =>
    ["tasks", params || {}] as const,
  finance: ["finance"] as const,
  financeFiltered: (params?: Record<string, unknown>) =>
    ["finance", params || {}] as const,
  financeSummary: ["finance", "summary"] as const,
  inventory: ["inventory"] as const,
  inventoryFiltered: (params?: Record<string, unknown>) =>
    ["inventory", params || {}] as const,
  materials: (category?: string, sortBy?: string, order?: string) =>
    [
      "materials",
      category || "all",
      sortBy || "created_at",
      order || "desc",
    ] as const,
  resolutions: (docType?: string, sortBy?: string, order?: string) =>
    [
      "resolutions",
      docType || "all",
      sortBy || "passed_date",
      order || "desc",
    ] as const,
  announcements: (scope?: string) => ["announcements", scope || "all"] as const,
  templates: (wing?: string, search?: string) =>
    ["templates", wing || "all", search || ""] as const,
  auditLogs: (params?: Record<string, unknown>) =>
    ["audit-logs", params || {}] as const,
};
