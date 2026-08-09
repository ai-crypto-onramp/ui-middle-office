import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";

class MockSocket {
  onmessage: ((ev: { data: string }) => void) | null = null;
  onclose: (() => void) | null = null;
  static last: MockSocket | null = null;
  constructor() {
    MockSocket.last = this;
  }
  close = vi.fn();
}

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

describe("wsClient", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.resetModules();
    MockSocket.last = null;
    mockConfig.mockMode = true;
    mockConfig.websocketUrl = "";
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("subscribe receives events and unsubscribe stops them", async () => {
    const { wsClient } = await import("@/lib/websocket");
    const fn = vi.fn();
    const unsub = wsClient.subscribe(fn);
    (wsClient as unknown as { emit: (x: unknown) => void }).emit({ kind: "kyc.new", id: "1", payload: {} });
    expect(fn).toHaveBeenCalledTimes(1);
    unsub();
    (wsClient as unknown as { emit: (x: unknown) => void }).emit({ kind: "alert.new", id: "2", payload: {} });
    expect(fn).toHaveBeenCalledTimes(1);
  });

  it("connect in mockMode starts a mock interval that may emit events", async () => {
    const { wsClient } = await import("@/lib/websocket");
    const fn = vi.fn();
    wsClient.subscribe(fn);
    wsClient.connect();
    const original = Math.random;
    for (let i = 0; i < 5; i++) {
      Math.random = () => 0.9;
      vi.advanceTimersByTime(12000);
    }
    Math.random = original;
    expect(fn.mock.calls.length).toBeGreaterThan(0);
    for (const call of fn.mock.calls) {
      expect(["kyc.new", "alert.new"]).toContain(call[0].kind);
    }
  });

  it("connect with websocketUrl creates a real WebSocket and parses messages", async () => {
    mockConfig.mockMode = false;
    mockConfig.websocketUrl = "ws://example";
    (global as unknown as { WebSocket: typeof MockSocket }).WebSocket = MockSocket;
    const { wsClient } = await import("@/lib/websocket");
    const fn = vi.fn();
    wsClient.subscribe(fn);
    wsClient.connect();
    expect(MockSocket.last).not.toBeNull();
    const sock = MockSocket.last!;
    const evt = { kind: "alert.new", id: "e1", payload: { x: 1 } };
    sock.onmessage!({ data: JSON.stringify(evt) });
    expect(fn).toHaveBeenCalledWith(evt);
    sock.onmessage!({ data: "{bad json" });
    expect(fn).toHaveBeenCalledTimes(1);
    MockSocket.last = null;
    sock.onclose!();
    vi.advanceTimersByTime(5000);
    expect(MockSocket.last).not.toBeNull();
  });

  it("connect with websocketUrl falls back to mock on WebSocket throw", async () => {
    mockConfig.mockMode = false;
    mockConfig.websocketUrl = "ws://example";
    (global as unknown as { WebSocket: unknown }).WebSocket = class {
      constructor() {
        throw new Error("no ws");
      }
    };
    const { wsClient } = await import("@/lib/websocket");
    const fn = vi.fn();
    wsClient.subscribe(fn);
    expect(() => wsClient.connect()).not.toThrow();
    Math.random = () => 0.9;
    vi.advanceTimersByTime(12000);
    Math.random = () => 0.5;
    expect(fn.mock.calls.length).toBeGreaterThan(0);
  });

  it("disconnect clears timers and closes socket", async () => {
    mockConfig.mockMode = false;
    mockConfig.websocketUrl = "ws://example";
    (global as unknown as { WebSocket: typeof MockSocket }).WebSocket = MockSocket;
    const { wsClient } = await import("@/lib/websocket");
    wsClient.connect();
    const sock = MockSocket.last!;
    wsClient.disconnect();
    expect(sock.close).toHaveBeenCalled();
  });
});