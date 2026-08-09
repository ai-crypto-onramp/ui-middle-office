import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { z } from "zod";

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

import { ApiError, apiGet, apiMutate, apiPost, apiPostRaw } from "@/lib/apiClient";
import { setSession, clearSession } from "@/lib/tokenStore";

const ok = (body: unknown): Response =>
  new Response(JSON.stringify(body), { status: 200, headers: { "Content-Type": "application/json" } });
const errResponse = (status: number, body: string): Response => new Response(body, { status });

const sessionUser = { id: "u", email: "e", name: "n", role: "compliance" as const };

describe("ApiError", () => {
  it("captures status, message, body", () => {
    const e = new ApiError(404, "not found", { x: 1 });
    expect(e.status).toBe(404);
    expect(e.message).toBe("not found");
    expect(e.body).toEqual({ x: 1 });
    expect(e).toBeInstanceOf(Error);
  });
});

describe("apiClient (mockMode=true)", () => {
  beforeEach(() => {
    clearSession();
    mockConfig.mockMode = true;
  });

  it("apiGet returns mock in mockMode", async () => {
    const out = await apiGet("http://x/v1/things", z.unknown(), () => ({ a: 1 }));
    expect(out).toEqual({ a: 1 });
  });

  it("apiPost returns mock in mockMode", async () => {
    const out = await apiPost("http://x/v1/things", { b: 2 }, z.unknown(), () => ({ b: 3 }));
    expect(out).toEqual({ b: 3 });
  });

  it("apiMutate returns mock in mockMode and passes method/body", async () => {
    let captured: unknown = null;
    const out = await apiMutate(
      "http://x/v1/things",
      "PUT",
      { c: 4 },
      z.unknown(),
      () => {
        captured = "mock";
        return { result: "put-mock" };
      },
    );
    expect(out).toEqual({ result: "put-mock" });
    expect(captured).toBe("mock");
  });

  it("apiMutate returns mock for DELETE", async () => {
    const out = await apiMutate("http://x/v1/things", "DELETE", undefined, z.unknown(), () => ({
      id: "deleted",
    }));
    expect(out).toEqual({ id: "deleted" });
  });
});

describe("apiClient (mockMode=false, real fetch path)", () => {
  let original: typeof global.fetch;

  beforeEach(() => {
    original = global.fetch;
    mockConfig.mockMode = false;
    mockConfig.mockAuth = true;
    clearSession();
    setSession({
      accessToken: "tok",
      refreshToken: "rt",
      expiresAt: Date.now() + 3_600_000,
      user: sessionUser,
    });
  });
  afterEach(() => {
    global.fetch = original;
    clearSession();
    mockConfig.mockMode = true;
    vi.restoreAllMocks();
  });

  it("apiGet calls fetch, parses, and returns data", async () => {
    const fetchMock = vi.fn(async () => ok({ hello: "world" }));
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const out = await apiGet("http://api/v1/x", z.unknown(), () => ({ fallback: true }));
    expect(out).toEqual({ hello: "world" });
    expect(fetchMock).toHaveBeenCalled();
  });

  it("apiGet throws ApiError on non-ok status", async () => {
    global.fetch = vi.fn(async () => errResponse(500, "boom")) as unknown as typeof global.fetch;
    await expect(apiGet("http://api/v1/x", z.unknown(), () => ({ fallback: true }))).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("apiGet throws on schema parse failure", async () => {
    global.fetch = vi.fn(async () => ok({ wrong: true })) as unknown as typeof global.fetch;
    const schema = {
      parse: () => {
        throw new Error("bad shape");
      },
    };
    await expect(apiGet("http://api/v1/x", schema as never, () => ({ fallback: true }))).rejects.toThrow("bad shape");
  });

  it("apiPost calls fetch with POST + JSON body, returns parsed data", async () => {
    let capturedInit: RequestInit | undefined;
    const fetchMock = vi.fn(async (_input: string, init?: RequestInit) => {
      capturedInit = init;
      return ok({ created: true });
    });
    global.fetch = fetchMock as unknown as typeof global.fetch;
    const out = await apiPost("http://api/v1/x", { a: 1 }, z.unknown(), () => ({ fallback: true }));
    expect(out).toEqual({ created: true });
    expect(capturedInit?.method).toBe("POST");
    expect(capturedInit?.body).toBe(JSON.stringify({ a: 1 }));
  });

  it("apiPost throws ApiError on non-ok status", async () => {
    global.fetch = vi.fn(async () => errResponse(403, "forbidden")) as unknown as typeof global.fetch;
    await expect(apiPost("http://api/v1/x", {}, z.unknown(), () => ({ fallback: true }))).rejects.toBeInstanceOf(
      ApiError,
    );
  });

  it("apiPostRaw calls fetch (always real, ignores mockMode) and returns parsed data", async () => {
    global.fetch = vi.fn(async () => ok({ raw: true })) as unknown as typeof global.fetch;
    const out = await apiPostRaw("http://api/v1/x", { a: 1 }, z.unknown());
    expect(out).toEqual({ raw: true });
  });

  it("apiPostRaw throws ApiError on non-ok status", async () => {
    global.fetch = vi.fn(async () => errResponse(500, "boom")) as unknown as typeof global.fetch;
    await expect(apiPostRaw("http://api/v1/x", {}, z.unknown())).rejects.toBeInstanceOf(ApiError);
  });

  it("apiMutate (real) passes method through and omits body when undefined", async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = vi.fn(async (_input: string, init?: RequestInit) => {
      capturedInit = init;
      return ok({ ok: true });
    }) as unknown as typeof global.fetch;
    const out = await apiMutate("http://api/v1/x", "DELETE", undefined, z.unknown(), () => ({
      fallback: true,
    }));
    expect(out).toEqual({ ok: true });
    expect(capturedInit?.method).toBe("DELETE");
    expect(capturedInit?.body).toBeUndefined();
  });

  it("apiMutate (real) throws ApiError on non-ok status", async () => {
    global.fetch = vi.fn(async () => errResponse(409, "conflict")) as unknown as typeof global.fetch;
    await expect(
      apiMutate("http://api/v1/x", "PATCH", { a: 1 }, z.unknown(), () => ({ fallback: true })),
    ).rejects.toBeInstanceOf(ApiError);
  });

  it("apiGet sets Authorization header from token", async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = vi.fn(async (_input: string, init?: RequestInit) => {
      capturedInit = init;
      return ok({});
    }) as unknown as typeof global.fetch;
    await apiGet("http://api/v1/x", z.unknown(), () => ({ fallback: true }));
    const headers = new Headers(capturedInit?.headers);
    expect(headers.get("Authorization")).toBe("Bearer tok");
  });

  it("apiPost sets Content-Type header when body present", async () => {
    let capturedInit: RequestInit | undefined;
    global.fetch = vi.fn(async (_input: string, init?: RequestInit) => {
      capturedInit = init;
      return ok({});
    }) as unknown as typeof global.fetch;
    await apiPost("http://api/v1/x", { a: 1 }, z.unknown(), () => ({ fallback: true }));
    const headers = new Headers(capturedInit?.headers);
    expect(headers.get("Content-Type")).toBe("application/json");
  });
});