import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen } from "@testing-library/react";
import { MemoryRouter, Routes, Route } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ProtectedRoute } from "@/components/ProtectedRoute";
import { setSession, clearSession } from "@/lib/tokenStore";
import type { Role } from "@/types/rbac";

const mockConfig = vi.hoisted(() => ({
  identityAuthUrl: "http://identity",
  onboardingKycUrl: "http://kyc",
  amlKytUrl: "http://aml",
  policyEngineUrl: "http://policy",
  fraudUrl: "http://fraud",
  auditUrl: "http://audit",
  otelEndpoint: "",
  sentryDsn: "",
  mockMode: true,
  mockAuth: true,
  websocketUrl: "",
}));

vi.mock("@/config", () => ({
  loadConfig: () => mockConfig,
}));

function renderWithAuth(perm: Parameters<typeof ProtectedRoute>[0]["perm"], role: Role | undefined, initial = "/") {
  if (role) {
    setSession({
      accessToken: "t",
      refreshToken: "r",
      expiresAt: Date.now() + 3_600_000,
      user: { id: "u", email: "e@x.com", name: "N", role },
    });
  } else {
    clearSession();
  }
  return render(
    <AuthProvider>
      <MemoryRouter initialEntries={[initial]}>
        <Routes>
          <Route path="/login" element={<span>login-page</span>} />
          <Route
            path="/secret"
            element={
              <ProtectedRoute perm={perm}>
                <span>secret-content</span>
              </ProtectedRoute>
            }
          />
        </Routes>
      </MemoryRouter>
    </AuthProvider>,
  );
}

describe("ProtectedRoute", () => {
  beforeEach(() => {
    clearSession();
  });
  afterEach(() => {
    clearSession();
  });

  it("redirects to /login when not authenticated", () => {
    renderWithAuth("kyc.review", undefined, "/secret");
    expect(screen.getByText("login-page")).toBeInTheDocument();
    expect(screen.queryByText("secret-content")).toBeNull();
  });

  it("renders children when authenticated and authorized", () => {
    renderWithAuth("kyc.review", "compliance", "/secret");
    expect(screen.getByText("secret-content")).toBeInTheDocument();
  });

  it("shows 403 when authenticated but lacking permission", () => {
    renderWithAuth("users.manage", "compliance", "/secret");
    expect(screen.getByText(/403/)).toBeInTheDocument();
    expect(screen.queryByText("secret-content")).toBeNull();
  });

  it("admin.all grants any permission", () => {
    renderWithAuth("users.manage", "admin", "/secret");
    expect(screen.getByText("secret-content")).toBeInTheDocument();
  });
});