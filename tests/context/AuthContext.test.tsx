import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, waitFor, act } from "@testing-library/react";
import { AuthProvider, useAuth, MOCK_LOGIN_USERS } from "@/context/AuthContext";
import { clearSession } from "@/lib/tokenStore";

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

function Consumer() {
  const { user, isAuthenticated, loading, login, logout, switchRole } = useAuth();
  const doLogin = (email: string) => {
    login({ email, password: "x" }).catch(() => {});
  };
  return (
    <div>
      <span data-testid="user">{user ? user.email : "none"}</span>
      <span data-testid="authed">{String(isAuthenticated)}</span>
      <span data-testid="loading">{String(loading)}</span>
      <button onClick={() => doLogin("admin@example.com")}>login</button>
      <button onClick={() => doLogin("unknown@x.com")}>login-unknown</button>
      <button onClick={logout}>logout</button>
      <button onClick={() => switchRole("support")}>switch</button>
    </div>
  );
}

function renderWithProvider() {
  return render(
    <AuthProvider>
      <Consumer />
    </AuthProvider>,
  );
}

describe("AuthContext", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    mockConfig.mockAuth = true;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("useAuth throws when used outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useAuth();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/useAuth must be used within AuthProvider/);
    spy.mockRestore();
  });

  it("starts unauthenticated", () => {
    renderWithProvider();
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(screen.getByTestId("authed").textContent).toBe("false");
  });

  it("login (mockAuth) sets user based on email", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByText("login"));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("user").textContent).toBe("admin@example.com");
    expect(screen.getByTestId("authed").textContent).toBe("true");
  });

  it("login with unknown email falls back to compliance", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByText("login-unknown"));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    expect(screen.getByTestId("user").textContent).toBe("compliance@example.com");
  });

  it("logout clears user", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByText("login"));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByText("logout"));
    expect(screen.getByTestId("user").textContent).toBe("none");
    expect(screen.getByTestId("authed").textContent).toBe("false");
  });

  it("switchRole changes user", async () => {
    vi.useFakeTimers();
    renderWithProvider();
    fireEvent.click(screen.getByText("login"));
    await act(async () => {
      vi.advanceTimersByTime(300);
    });
    fireEvent.click(screen.getByText("switch"));
    expect(screen.getByTestId("user").textContent).toBe("support@example.com");
  });

  it("hydrates from stored session", () => {
    const u = MOCK_LOGIN_USERS.admin;
    localStorage.setItem(
      "mo.session",
      JSON.stringify({ accessToken: "t", refreshToken: "r", expiresAt: Date.now() + 3_600_000, user: u }),
    );
    renderWithProvider();
    expect(screen.getByTestId("user").textContent).toBe("admin@example.com");
  });

  it("interval clears user when token disappears but session exists", async () => {
    vi.useFakeTimers();
    const u = MOCK_LOGIN_USERS.admin;
    localStorage.setItem(
      "mo.session",
      JSON.stringify({ accessToken: "", refreshToken: "r", expiresAt: Date.now() - 1000, user: u }),
    );
    renderWithProvider();
    expect(screen.getByTestId("user").textContent).toBe("admin@example.com");
    await act(async () => {
      vi.advanceTimersByTime(30_000);
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
  });

  it("login (real auth) hits fetch and parses session", async () => {
    mockConfig.mockAuth = false;
    const fetchMock = vi.fn(async () =>
      new Response(
        JSON.stringify({
          accessToken: "at",
          refreshToken: "rt",
          expiresIn: 3600,
          user: { id: "u-1", email: "real@x.com", name: "Real", role: "admin" },
        }),
        { status: 200, headers: { "Content-Type": "application/json" } },
      ),
    );
    global.fetch = fetchMock as unknown as typeof global.fetch;
    renderWithProvider();
    fireEvent.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("user").textContent).toBe("real@x.com");
    });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("login (real auth) throws on non-ok and sets loading false", async () => {
    mockConfig.mockAuth = false;
    global.fetch = vi.fn(async () => new Response("no", { status: 401 })) as unknown as typeof global.fetch;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProvider();
    fireEvent.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    expect(screen.getByTestId("user").textContent).toBe("none");
    spy.mockRestore();
  });

  it("login (real auth) throws on schema parse failure", async () => {
    mockConfig.mockAuth = false;
    global.fetch = vi.fn(async () =>
      new Response(JSON.stringify({ wrong: true }), { status: 200, headers: { "Content-Type": "application/json" } }),
    ) as unknown as typeof global.fetch;
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    renderWithProvider();
    fireEvent.click(screen.getByText("login"));
    await waitFor(() => {
      expect(screen.getByTestId("loading").textContent).toBe("false");
    });
    spy.mockRestore();
  });
});