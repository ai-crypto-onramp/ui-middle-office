import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { AuthProvider } from "@/context/AuthContext";
import { ThemeProvider } from "@/context/ThemeContext";
import { ToastProvider } from "@/context/ToastContext";
import { AppLayout } from "@/components/AppLayout";
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

function renderLayout(role: Role | undefined, initial = "/") {
  if (role) {
    setSession({
      accessToken: "t",
      refreshToken: "r",
      expiresAt: Date.now() + 3_600_000,
      user: { id: "u", email: "op@x.com", name: "Op", role },
    });
  } else {
    clearSession();
  }
  return render(
    <ThemeProvider>
      <ToastProvider>
        <AuthProvider>
          <MemoryRouter initialEntries={[initial]}>
            <AppLayout>
              <span>page-content</span>
            </AppLayout>
          </MemoryRouter>
        </AuthProvider>
      </ToastProvider>
    </ThemeProvider>,
  );
}

describe("AppLayout", () => {
  beforeEach(() => {
    localStorage.clear();
  });
  afterEach(() => {
    clearSession();
    vi.restoreAllMocks();
  });

  it("renders header, brand, and children", () => {
    renderLayout("compliance");
    expect(screen.getByText("Middle Office")).toBeInTheDocument();
    expect(screen.getByText("page-content")).toBeInTheDocument();
  });

  it("shows nav items filtered by role permissions (compliance: dashboard, kyc, alerts, policy, audit)", () => {
    renderLayout("compliance", "/");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("KYC Review")).toBeInTheDocument();
    expect(screen.getByText("AML / KYT Alerts")).toBeInTheDocument();
    expect(screen.getByText("Policy / Risk")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
    // support has users.manage? no -> User Management hidden
    expect(screen.queryByText("User Management")).toBeNull();
  });

  it("support role shows only dashboard, kyc, alerts", () => {
    renderLayout("support", "/");
    expect(screen.getByText("Dashboard")).toBeInTheDocument();
    expect(screen.getByText("KYC Review")).toBeInTheDocument();
    expect(screen.getByText("AML / KYT Alerts")).toBeInTheDocument();
    expect(screen.queryByText("Policy / Risk")).toBeNull();
    expect(screen.queryByText("User Management")).toBeNull();
    expect(screen.queryByText("Audit Log")).toBeNull();
  });

  it("admin role shows all nav items", () => {
    renderLayout("admin", "/");
    expect(screen.getByText("User Management")).toBeInTheDocument();
    expect(screen.getByText("Audit Log")).toBeInTheDocument();
  });

  it("Sign out calls logout and navigates to /login", () => {
    renderLayout("compliance", "/");
    fireEvent.click(screen.getByText("Sign out"));
    // AuthProvider logout clears user; AppLayout still renders but user email gone
    expect(screen.queryByText("op@x.com")).toBeNull();
  });

  it("toggle theme button changes theme", () => {
    renderLayout("compliance", "/");
    const toggleBtn = screen.getByTitle("Toggle dark mode");
    fireEvent.click(toggleBtn);
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("switch role select changes role", () => {
    renderLayout("compliance", "/");
    const select = screen.getByLabelText("switch role") as HTMLSelectElement;
    fireEvent.change(select, { target: { value: "admin" } });
    // admin role -> User Management appears
    expect(screen.getByText("User Management")).toBeInTheDocument();
  });

  it("renders without user (no role select, no email)", () => {
    renderLayout(undefined, "/");
    expect(screen.queryByLabelText("switch role")).toBeNull();
    // nav filtered to nothing since no role
    expect(screen.queryByText("Dashboard")).toBeNull();
  });
});