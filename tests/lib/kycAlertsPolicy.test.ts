import { describe, it, expect, beforeEach, vi } from "vitest";

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
  listKycApplications,
  getKycApplication,
  postKycDecision,
  postBulkKycDecision,
  listAlerts,
  getAlert,
  alertAction,
  addressLookup,
  listPolicyRules,
  listReviewQueue,
  reviewAction,
  listDecisionTrail,
  listWhitelist,
  addWhitelist,
  removeWhitelist,
  listVelocityOverrides,
  createVelocityOverride,
  removeVelocityOverride,
  getFraudTimeline,
  listFraudCases,
  getFraudCase,
  fraudCaseAction,
} from "@/lib/api/kycAlertsPolicy";
import {
  mockKycApplications,
  mockAlerts,
  mockPolicyRules,
  mockReviewQueue,
  mockWhitelist,
  mockFraudTimeline,
  mockFraudCases,
} from "@/lib/mock/data";

describe("kycAlertsPolicy", () => {
  beforeEach(() => {
    vi.useFakeTimers();
    vi.setSystemTime(new Date("2024-06-01T00:00:00Z"));
  });
  afterEach(() => {
    vi.useRealTimers();
  });

  it("listKycApplications: filters + pagination", async () => {
    const all = await listKycApplications({});
    expect(all.total).toBe(mockKycApplications.length);
    const pending = await listKycApplications({ status: "pending_review" });
    expect(pending.items.every((a) => a.status === "pending_review")).toBe(true);
    const byCountry = await listKycApplications({ country: "United States" });
    expect(byCountry.items.every((a) => a.country.toLowerCase().includes("united states"))).toBe(true);
    const byQ = await listKycApplications({ q: "alice" });
    expect(byQ.items.every((a) => a.email.includes("alice") || a.fullName.includes("Alice") || a.id.includes("alice"))).toBe(true);
    const fromOnly = await listKycApplications({ from: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() });
    expect(fromOnly.items.every((a) => a.createdAt >= new Date(new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()).getTime())).toBe(true);
    const toOnly = await listKycApplications({ to: new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString() });
    expect(toOnly.items.every((a) => a.createdAt <= new Date(new Date(Date.now() - 1000 * 60 * 60 * 3).toISOString()).getTime())).toBe(true);
    const page = await listKycApplications({ page: 1, pageSize: 2 });
    expect(page.items.length).toBe(2);
    const page2 = await listKycApplications({ page: 2, pageSize: 2 });
    expect(page2.items.length).toBe(2);
    const page3 = await listKycApplications({ page: 3, pageSize: 2 });
    expect(page3.items.length).toBe(mockKycApplications.length - 4);
  });

  it("getKycApplication returns app", async () => {
    const a = await getKycApplication("kyc-1001");
    expect(a.id).toBe("kyc-1001");
  });

  it("getKycApplication throws when not found", async () => {
    await expect(getKycApplication("nope")).rejects.toThrow("not found");
  });

  it("postKycDecision updates status + audit", async () => {
    const a = await postKycDecision({ id: "kyc-1001", decision: "approve", reason: "ok" });
    expect(a.status).toBe("approved");
    expect(a.audit.length).toBeGreaterThan(0);
    const r = await postKycDecision({ id: "kyc-1002", decision: "reject" });
    expect(r.status).toBe("rejected");
    const resub = await postKycDecision({ id: "kyc-1003", decision: "resubmit" });
    expect(resub.status).toBe("resubmission_requested");
  });

  it("postKycDecision throws when not found", async () => {
    await expect(postKycDecision({ id: "nope", decision: "approve" })).rejects.toThrow("not found");
  });

  it("postBulkKycDecision updates matching ids", async () => {
    const r = await postBulkKycDecision({ ids: ["kyc-1001", "nope"], decision: "approve" });
    expect(r.updated).toBe(1);
  });

  it("listAlerts: filters + pagination", async () => {
    const all = await listAlerts({});
    expect(all.total).toBe(mockAlerts.length);
    const byExp = await listAlerts({ exposureType: "sanctions" });
    expect(byExp.items.every((a) => a.exposureType === "sanctions")).toBe(true);
    const byStatus = await listAlerts({ status: "open" });
    expect(byStatus.items.every((a) => a.status === "open")).toBe(true);
    const assigneeNull = await listAlerts({ assignee: "nobody" });
    expect(assigneeNull.items.every((a) => a.assignee === null || (a.assignee ?? "").includes("nobody"))).toBe(true);
    const aged = await listAlerts({ ageMax: 60 * 60 });
    expect(aged.items.every((a) => Date.now() - a.createdAt <= 60 * 60 * 1000)).toBe(true);
    const byQ = await listAlerts({ q: "abc123" });
    expect(byQ.items.every((a) => a.address.toLowerCase().includes("abc123") || a.id.includes("abc123"))).toBe(true);
    const page = await listAlerts({ page: 1, pageSize: 2 });
    expect(page.items.length).toBe(2);
  });

  it("getAlert returns alert", async () => {
    const a = await getAlert("alert-2001");
    expect(a.id).toBe("alert-2001");
  });

  it("getAlert throws when not found", async () => {
    await expect(getAlert("nope")).rejects.toThrow("not found");
  });

  it("alertAction claim/reassign/close/escalate/file_sar", async () => {
    const claimed = await alertAction({ id: "alert-2001", action: "claim" });
    expect(claimed.assignee).toBe("you");
    const reassigned = await alertAction({ id: "alert-2001", action: "reassign", assignee: "x@y.com" });
    expect(reassigned.assignee).toBe("x@y.com");
    const closed = await alertAction({ id: "alert-2001", action: "close" });
    expect(closed.status).toBe("closed");
    const escalated = await alertAction({ id: "alert-2002", action: "escalate" });
    expect(escalated.status).toBe("investigating");
    const sar = await alertAction({ id: "alert-2005", action: "file_sar" });
    expect(sar.status).toBe("sar_filed");
  });

  it("alertAction reassign with no assignee sets null", async () => {
    const r = await alertAction({ id: "alert-2003", action: "reassign" });
    expect(r.assignee).toBeNull();
  });

  it("alertAction throws when not found", async () => {
    await expect(alertAction({ id: "nope", action: "close" })).rejects.toThrow("not found");
  });

  it("addressLookup returns history when matched, empty when not", async () => {
    const r1 = await addressLookup("0xabc123def456789012345678901234567890abcd", "ethereum");
    expect(r1.items.length).toBeGreaterThan(0);
    const r2 = await addressLookup("0xnope", "ethereum");
    expect(r2.items).toEqual([]);
  });

  it("listPolicyRules returns rules", async () => {
    const r = await listPolicyRules();
    expect(r.length).toBe(mockPolicyRules.length);
  });

  it("listReviewQueue filters by status", async () => {
    const all = await listReviewQueue({});
    expect(all.total).toBe(mockReviewQueue.length);
    const pending = await listReviewQueue({ status: "pending" });
    expect(pending.items.every((r) => r.status === "pending")).toBe(true);
  });

  it("reviewAction approve/deny/escalate with optional note", async () => {
    const a = await reviewAction({ id: "review-3001", action: "approve" });
    expect(a.status).toBe("approved");
    const d = await reviewAction({ id: "review-3002", action: "deny", note: "no" });
    expect(d.status).toBe("denied");
    expect(d.notes.some((n) => n.text === "no")).toBe(true);
    const e = await reviewAction({ id: "review-3003", action: "escalate" });
    expect(e.status).toBe("escalated");
  });

  it("reviewAction throws when not found", async () => {
    await expect(reviewAction({ id: "nope", action: "approve" })).rejects.toThrow("not found");
  });

  it("listDecisionTrail returns trail", async () => {
    const r = await listDecisionTrail("tx-99006");
    expect(r.outcome).toBe("manual_review");
    expect(r.events.length).toBe(3);
  });

  it("listWhitelist filters by q", async () => {
    const all = await listWhitelist({});
    expect(all.length).toBe(mockWhitelist.length);
    const filtered = await listWhitelist({ q: "partner" });
    expect(filtered.every((w) => w.value.toLowerCase().includes("partner") || w.reason.toLowerCase().includes("partner"))).toBe(true);
  });

  it("addWhitelist creates item", async () => {
    const w = await addWhitelist({ kind: "address", value: "0xnew", chain: "eth", reason: "test" });
    expect(w.id).toMatch(/^wl-/);
    expect(w.chain).toBe("eth");
    const w2 = await addWhitelist({ kind: "user", value: "u-1", reason: "x" });
    expect(w2.chain).toBeNull();
  });

  it("removeWhitelist returns id", async () => {
    const r = await removeWhitelist("wl-1");
    expect(r).toEqual({ id: "wl-1" });
  });

  it("listVelocityOverrides filters by user", async () => {
    const r = await listVelocityOverrides("user-501");
    expect(r.every((o) => o.userId === "user-501")).toBe(true);
    const r2 = await listVelocityOverrides("nobody");
    expect(r2).toEqual([]);
  });

  it("createVelocityOverride creates override", async () => {
    const o = await createVelocityOverride({ userId: "u-9", dailyCapUsd: 1000, expiresAt: Date.now() + 1000, reason: "vip" });
    expect(o.id).toMatch(/^vo-/);
    expect(o.createdBy).toBe("you");
  });

  it("removeVelocityOverride returns id", async () => {
    const r = await removeVelocityOverride("vo-1");
    expect(r).toEqual({ id: "vo-1" });
  });

  it("getFraudTimeline returns timeline", async () => {
    const r = await getFraudTimeline("user-501");
    expect(r.length).toBe(mockFraudTimeline.length);
  });

  it("listFraudCases filters by status", async () => {
    const all = await listFraudCases({});
    expect(all.length).toBe(mockFraudCases.length);
    const open = await listFraudCases({ status: "open" });
    expect(open.every((c) => c.status === "open")).toBe(true);
  });

  it("getFraudCase returns case", async () => {
    const c = await getFraudCase("case-4001");
    expect(c.id).toBe("case-4001");
  });

  it("getFraudCase throws when not found", async () => {
    await expect(getFraudCase("nope")).rejects.toThrow("not found");
  });

  it("fraudCaseAction open creates a new case (with/without note)", async () => {
    const before = mockFraudCases.length;
    const c = await fraudCaseAction({ id: "new", action: "open", userId: "u-9", summary: "s", note: "n" });
    expect(c.status).toBe("open");
    expect(c.notes.some((n) => n.text === "n")).toBe(true);
    expect(mockFraudCases.length).toBe(before + 1);
    const c2 = await fraudCaseAction({ id: "new2", action: "open", userId: "u-9" });
    expect(c2.notes).toEqual([]);
  });

  it("fraudCaseAction note appends, close sets status", async () => {
    const c = await fraudCaseAction({ id: "case-4001", action: "note", note: "hello" });
    expect(c.notes.some((n) => n.text === "hello")).toBe(true);
    const c2 = await fraudCaseAction({ id: "case-4001", action: "close" });
    expect(c2.status).toBe("closed");
  });

  it("fraudCaseAction note/close throws when not found", async () => {
    await expect(fraudCaseAction({ id: "nope", action: "note", note: "x" })).rejects.toThrow("not found");
    await expect(fraudCaseAction({ id: "nope", action: "close" })).rejects.toThrow("not found");
  });
});