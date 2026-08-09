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

describe("otel", () => {
  beforeEach(() => {
    vi.resetModules();
    mockConfig.otelEndpoint = "";
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("initTracing sets noop tracer when no otelEndpoint", async () => {
    const { initTracing, tracer } = await import("@/lib/otel");
    initTracing();
    expect(tracer).toBeDefined();
    const end = tracer.startSpan("x");
    expect(end).toBeInstanceOf(Function);
    expect(() => end()).not.toThrow();
  });

  it("initTracing sets real tracer with sendBeacon when otelEndpoint set", async () => {
    mockConfig.otelEndpoint = "http://otel";
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
    const mod = await import("@/lib/otel");
    mod.initTracing();
    const end = mod.tracer.startSpan("span1", { a: 1 });
    const r = (() => "result")();
    end();
    expect(r).toBe("result");
    expect(sendBeacon).toHaveBeenCalled();
    const calls = sendBeacon.mock.calls as unknown as [string, string][];
    const payload = JSON.parse(calls[0][1]);
    expect(payload.name).toBe("span1");
    expect(payload.attrs).toEqual({ a: 1 });
    expect(payload.dur).toBeGreaterThanOrEqual(0);
    expect(typeof payload.ts).toBe("number");
  });

  it("trace runs fn and returns its value, calling end in finally", async () => {
    mockConfig.otelEndpoint = "http://otel";
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
    const mod = await import("@/lib/otel");
    mod.initTracing();
    expect(mod.trace("n", { x: 1 }, () => 42)).toBe(42);
    expect(sendBeacon).toHaveBeenCalled();
  });

  it("trace runs fn and rethrows while still ending span", async () => {
    mockConfig.otelEndpoint = "http://otel";
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
    const mod = await import("@/lib/otel");
    mod.initTracing();
    expect(() =>
      mod.trace("n", undefined, () => {
        throw new Error("boom");
      }),
    ).toThrow("boom");
    expect(sendBeacon).toHaveBeenCalled();
  });

  it("sendBeacon throwing is ignored", async () => {
    mockConfig.otelEndpoint = "http://otel";
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: () => {
        throw new Error("beacon failed");
      },
      configurable: true,
      writable: true,
    });
    const mod = await import("@/lib/otel");
    mod.initTracing();
    const end = mod.tracer.startSpan("x", undefined);
    expect(() => end()).not.toThrow();
  });

  it("trace works with noop tracer (no sendBeacon)", async () => {
    mockConfig.otelEndpoint = "";
    const mod = await import("@/lib/otel");
    mod.initTracing();
    expect(mod.trace("n", undefined, () => "ok")).toBe("ok");
  });
});