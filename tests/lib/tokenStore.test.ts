import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

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

import { clearSession, ensureFreshToken, getAccessToken, getSession, setSession } from "@/lib/tokenStore";

const sampleSession = {
  accessToken: "at-1",
  refreshToken: "rt-1",
  expiresAt: Date.now() + 3_600_000,
  user: { id: "u1", email: "a@b.com", name: "A", role: "compliance" as const },
};

describe("tokenStore", () => {
  beforeEach(() => {
    localStorage.clear();
    clearSession();
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-01-01T00:00:00Z"));
    mockConfig.mockAuth = true;
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("getSession returns null when nothing stored", () => {
    expect(getSession()).toBeNull();
  });

  it("setSession persists to inMemory + localStorage", () => {
    setSession(sampleSession);
    expect(getSession()).toEqual(sampleSession);
    expect(JSON.parse(localStorage.getItem("mo.session") ?? "null")).toEqual(sampleSession);
  });

  it("getSession loads from localStorage when inMemory empty", () => {
    localStorage.setItem("mo.session", JSON.stringify(sampleSession));
    expect(getSession()).toEqual(sampleSession);
  });

  it("getSession returns null on malformed localStorage", () => {
    localStorage.setItem("mo.session", "{not json");
    expect(getSession()).toBeNull();
  });

  it("clearSession clears inMemory + localStorage", () => {
    setSession(sampleSession);
    clearSession();
    expect(getSession()).toBeNull();
    expect(localStorage.getItem("mo.session")).toBeNull();
  });

  it("getAccessToken returns token or null", () => {
    expect(getAccessToken()).toBeNull();
    setSession(sampleSession);
    expect(getAccessToken()).toBe("at-1");
  });

  it("ensureFreshToken returns null when no session", async () => {
    expect(await ensureFreshToken()).toBeNull();
  });

  it("ensureFreshToken returns current token when not near expiry", async () => {
    setSession(sampleSession);
    expect(await ensureFreshToken()).toBe("at-1");
  });

  it("ensureFreshToken returns same token in mockAuth when expired", async () => {
    setSession({ ...sampleSession, expiresAt: Date.now() - 1000 });
    expect(await ensureFreshToken()).toBe("at-1");
  });

  it("ensureFreshToken refreshes when not mockAuth and near expiry", async () => {
    mockConfig.mockAuth = false;
    setSession({ ...sampleSession, expiresAt: Date.now() + 10_000, refreshToken: "rt-1" });
    const fetchMock = vi.fn(async () =>
      new Response(JSON.stringify({ accessToken: "at-2", expiresIn: 3600 }), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      }),
    );
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const tok = await ensureFreshToken();
    expect(tok).toBe("at-2");
    expect(fetchMock).toHaveBeenCalled();
  });

  it("ensureFreshToken clears session on refresh failure (non-ok)", async () => {
    mockConfig.mockAuth = false;
    setSession({ ...sampleSession, expiresAt: Date.now() + 10_000, refreshToken: "rt-1" });
    global.fetch = vi.fn(async () => new Response("no", { status: 401 })) as unknown as typeof global.fetch;
    const tok = await ensureFreshToken();
    expect(tok).toBeNull();
  });

  it("ensureFreshToken clears session on refresh throw", async () => {
    mockConfig.mockAuth = false;
    setSession({ ...sampleSession, expiresAt: Date.now() + 10_000, refreshToken: "rt-1" });
    global.fetch = vi.fn(async () => {
      throw new Error("network");
    }) as unknown as typeof global.fetch;
    const tok = await ensureFreshToken();
    expect(tok).toBeNull();
  });

  it("persist ignores storage errors (set/removeItem throws)", () => {
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    expect(() => setSession(sampleSession)).not.toThrow();
    spy.mockRestore();
    const spy2 = vi.spyOn(Storage.prototype, "removeItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() => clearSession()).not.toThrow();
    spy2.mockRestore();
  });

  it("loadStored returns null when getItem throws", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    clearSession();
    expect(getSession()).toBeNull();
    spy.mockRestore();
  });
});