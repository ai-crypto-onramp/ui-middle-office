import { type ReactNode } from "react";
import { Navigate } from "react-router-dom";
import { useAuth } from "@/context/AuthContext";
import { hasPermission, type Permission, type Role } from "@/types/rbac";

export function ProtectedRoute({ perm, children }: { perm: Permission; children: ReactNode }) {
  const { user, isAuthenticated } = useAuth();
  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }
  if (!hasPermission(user?.role as Role, perm)) {
    return (
      <div className="empty">
        <h2>403 — Forbidden</h2>
        <p className="muted">Your role ({user?.role}) does not have access to this page.</p>
      </div>
    );
  }
  return <>{children}</>;
}