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

import {
  listUsers,
  getUser,
  userAction,
  listAuditEvents,
  getAuditEvent,
  verifyChainIntegrity,
  userAuditTrail,
} from "@/lib/api/usersAudit";
import { mockUsers, mockAuditEvents } from "@/lib/mock/data";

describe("usersAudit", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("listUsers filters by q and status", async () => {
    const all = await listUsers({});
    expect(all.length).toBe(mockUsers.length);
    const byQ = await listUsers({ q: "alice" });
    expect(byQ.every((u) => u.email.toLowerCase().includes("alice") || u.id.includes("alice") || u.name.toLowerCase().includes("alice"))).toBe(true);
    const byStatus = await listUsers({ status: "active" });
    expect(byStatus.every((u) => u.status === "active")).toBe(true);
  });

  it("getUser returns user", async () => {
    const u = await getUser("user-501");
    expect(u.id).toBe("user-501");
  });

  it("getUser throws when not found", async () => {
    await expect(getUser("nope")).rejects.toThrow("not found");
  });

  it("userAction lock/unlock/revoke_sessions/revoke_api_key/assign_role/revoke_role", async () => {
    const locked = await userAction({ userId: "user-501", action: "lock" });
    expect(locked.status).toBe("locked");
    const unlocked = await userAction({ userId: "user-501", action: "unlock" });
    expect(unlocked.status).toBe("active");
    const noSessions = await userAction({ userId: "user-501", action: "revoke_sessions" });
    expect(noSessions.sessions).toEqual([]);
    const before = mockUsers.find((u) => u.id === "user-501")!.apiKeys.length;
    const afterKey = await userAction({ userId: "user-501", action: "revoke_api_key", apiKeyId: "k1" });
    expect(afterKey.apiKeys.length).toBe(before - 1);
    const assigned = await userAction({ userId: "user-501", action: "assign_role", role: "admin" });
    expect(assigned.roleBindings.some((r) => r.role === "admin")).toBe(true);
    const revoked = await userAction({ userId: "user-501", action: "revoke_role", role: "admin" });
    expect(revoked.roleBindings.some((r) => r.role === "admin")).toBe(false);
  });

  it("userAction assign_role uses default scope global", async () => {
    const assigned = await userAction({ userId: "user-504", action: "assign_role", role: "ops" });
    expect(assigned.roleBindings.some((r) => r.role === "ops" && r.scope === "global")).toBe(true);
  });

  it("userAction audit entry is appended", async () => {
    const u = await userAction({ userId: "user-504", action: "lock" });
    expect(u.audit.some((a) => a.action === "lock")).toBe(true);
  });

  it("userAction throws when not found", async () => {
    await expect(userAction({ userId: "nope", action: "lock" })).rejects.toThrow("not found");
  });

  it("listAuditEvents: filters + pagination + sort", async () => {
    const all = await listAuditEvents({});
    expect(all.total).toBe(mockAuditEvents.length);
    const byTx = await listAuditEvents({ txId: "tx-99001" });
    expect(byTx.items.every((e) => e.txId === "tx-99001")).toBe(true);
    const byUser = await listAuditEvents({ userId: "user-700" });
    expect(byUser.items.every((e) => e.userId === "user-700")).toBe(true);
    const byType = await listAuditEvents({ eventType: "kyc.decision" });
    expect(byType.items.every((e) => e.eventType === "kyc.decision")).toBe(true);
    const byQ = await listAuditEvents({ q: "approved" });
    expect(byQ.items.every((e) => JSON.stringify(e.payload).toLowerCase().includes("approved") || e.id.includes("approved"))).toBe(true);
    const fromIso = new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString();
    const fromOnly = await listAuditEvents({ from: fromIso });
    expect(fromOnly.items.every((e) => e.ts >= new Date(fromIso).getTime())).toBe(true);
    const toIso = new Date(Date.now() - 1000 * 60 * 60 * 4).toISOString();
    const toOnly = await listAuditEvents({ to: toIso });
    expect(toOnly.items.every((e) => e.ts <= new Date(toIso).getTime())).toBe(true);
    const page = await listAuditEvents({ page: 1, pageSize: 2 });
    expect(page.items.length).toBe(2);
    // sorted descending by ts
    for (let i = 1; i < page.items.length; i++) {
      expect(page.items[i].ts).toBeLessThanOrEqual(page.items[i - 1].ts);
    }
  });

  it("getAuditEvent returns event", async () => {
    const e = await getAuditEvent("evt-8001");
    expect(e.id).toBe("evt-8001");
  });

  it("getAuditEvent throws when not found", async () => {
    await expect(getAuditEvent("nope")).rejects.toThrow("not found");
  });

  it("verifyChainIntegrity returns summary", async () => {
    const r = await verifyChainIntegrity();
    expect(r.verified).toBe(true);
    expect(r.totalEvents).toBe(mockAuditEvents.length);
  });

  it("userAuditTrail filters by userId or target.id", async () => {
    const r = await userAuditTrail("user-700");
    expect(r.every((e) => e.userId === "user-700" || e.target.id === "user-700")).toBe(true);
    const empty = await userAuditTrail("nobody");
    expect(empty).toEqual([]);
  });
});