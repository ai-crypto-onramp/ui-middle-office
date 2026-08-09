import { lazy, Suspense } from "react";
import { Navigate, Route, Routes } from "react-router-dom";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { AppLayout } from "@/components/AppLayout";
import { Spinner } from "@/components/Spinner";

const DashboardPage = lazy(() => import("@/pages/dashboard/DashboardPage"));
const LoginPage = lazy(() => import("@/pages/login/LoginPage"));
const KycQueuePage = lazy(() => import("@/pages/kyc/KycQueuePage"));
const KycDetailPage = lazy(() => import("@/pages/kyc/KycDetailPage"));
const AlertsPage = lazy(() => import("@/pages/alerts/AlertsPage"));
const AlertDetailPage = lazy(() => import("@/pages/alerts/AlertDetailPage"));
const PolicyPage = lazy(() => import("@/pages/policy/PolicyPage"));
const UsersPage = lazy(() => import("@/pages/users/UsersPage"));
const UserDetailPage = lazy(() => import("@/pages/users/UserDetailPage"));
const AuditPage = lazy(() => import("@/pages/audit/AuditPage"));

export function AppRoutes() {
  return (
    <Suspense fallback={<Spinner />}>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route
          path="/"
          element={
            <ProtectedRoute perm="kyc.review">
              <AppLayout>
                <DashboardPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc"
          element={
            <ProtectedRoute perm="kyc.review">
              <AppLayout>
                <KycQueuePage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/kyc/:id"
          element={
            <ProtectedRoute perm="kyc.review">
              <AppLayout>
                <KycDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts"
          element={
            <ProtectedRoute perm="alerts.triage">
              <AppLayout>
                <AlertsPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/alerts/:id"
          element={
            <ProtectedRoute perm="alerts.triage">
              <AppLayout>
                <AlertDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/policy"
          element={
            <ProtectedRoute perm="policy.manage">
              <AppLayout>
                <PolicyPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users"
          element={
            <ProtectedRoute perm="users.manage">
              <AppLayout>
                <UsersPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/users/:id"
          element={
            <ProtectedRoute perm="users.manage">
              <AppLayout>
                <UserDetailPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route
          path="/audit"
          element={
            <ProtectedRoute perm="audit.read">
              <AppLayout>
                <AuditPage />
              </AppLayout>
            </ProtectedRoute>
          }
        />
        <Route path="*" element={<Navigate to="/" replace />} />
      </Routes>
    </Suspense>
  );
}