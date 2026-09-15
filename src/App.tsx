import React from "react";
import { BrowserRouter, Navigate, Route, Routes } from "react-router-dom";
import { QueryClientProvider } from "@tanstack/react-query";
import { queryClient } from "@/lib/queryClient";
import { AppLayout } from "@/components/layout/AppLayout";
import { ToastProvider } from "@/context/ToastContext";
import { LoadingProvider } from "@/context/LoadingContext";
import { TourProvider } from "@/context/TourContext";
import { LoginPage } from "@/pages/LoginPage";
import { PendingVerificationPage } from "@/pages/PendingVerificationPage";
import { DashboardPage } from "@/pages/DashboardPage";
import { DirectoryPage } from "@/pages/DirectoryPage";
import { GPOAPage } from "@/pages/GPOAPage";
import { FinancePage } from "@/pages/FinancePage";
import { InventoryPage } from "@/pages/InventoryPage";
import { MaterialsPage } from "@/pages/MaterialsPage";
import { TemplatesPage } from "@/pages/TemplatesPage";
import { AnnouncementsPage } from "@/pages/AnnouncementsPage";
import { ResolutionsPage } from "@/pages/ResolutionsPage";
import { TasksPage } from "@/pages/TasksPage";
import { AdminPage } from "@/pages/AdminPage";
import { AuditLogsPage } from "@/pages/AuditLogsPage";
import { ProfilePage } from "@/pages/ProfilePage";

export const App: React.FC = () => {
  return (
    <QueryClientProvider client={queryClient}>
      <LoadingProvider>
        <ToastProvider>
          <BrowserRouter>
            <TourProvider>
              <Routes>
                <Route path="/login" element={<LoginPage />} />
                <Route
                  path="/pending-verification"
                  element={<PendingVerificationPage />}
                />

                <Route element={<AppLayout />}>
                  <Route path="/dashboard" element={<DashboardPage />} />
                  <Route path="/directory" element={<DirectoryPage />} />
                  <Route path="/gpoa" element={<GPOAPage />} />
                  <Route path="/finance" element={<FinancePage />} />
                  <Route path="/inventory" element={<InventoryPage />} />
                  <Route path="/materials" element={<MaterialsPage />} />
                  <Route path="/templates" element={<TemplatesPage />} />
                  <Route
                    path="/announcements"
                    element={<AnnouncementsPage />}
                  />
                  <Route path="/resolutions" element={<ResolutionsPage />} />
                  <Route path="/tasks" element={<TasksPage />} />
                  <Route path="/admin" element={<AdminPage />} />
                  <Route path="/admin/audit-logs" element={<AuditLogsPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  <Route
                    path="*"
                    element={<Navigate to="/dashboard" replace />}
                  />
                </Route>
              </Routes>
            </TourProvider>
          </BrowserRouter>
        </ToastProvider>
      </LoadingProvider>
    </QueryClientProvider>
  );
};
