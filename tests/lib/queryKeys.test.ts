import { describe, it, expect } from "vitest";
import { queryKeys } from "@/lib/queryKeys";

describe("queryKeys", () => {
  it("kyc keys", () => {
    expect(queryKeys.kyc.all).toEqual(["kyc"]);
    expect(queryKeys.kyc.list({ a: 1 })).toEqual(["kyc", "list", { a: 1 }]);
    expect(queryKeys.kyc.detail("k1")).toEqual(["kyc", "detail", "k1"]);
    expect(queryKeys.kyc.audit("k1")).toEqual(["kyc", "k1", "audit"]);
  });

  it("alerts keys", () => {
    expect(queryKeys.alerts.all).toEqual(["alerts"]);
    expect(queryKeys.alerts.list({ s: "open" })).toEqual(["alerts", "list", { s: "open" }]);
    expect(queryKeys.alerts.detail("a1")).toEqual(["alerts", "detail", "a1"]);
    expect(queryKeys.alerts.events("a1")).toEqual(["alerts", "a1", "events"]);
    expect(queryKeys.alerts.addressLookup("0xabc", "eth")).toEqual(["alerts", "address", "0xabc", "eth"]);
  });

  it("policy keys", () => {
    expect(queryKeys.policy.all).toEqual(["policy"]);
    expect(queryKeys.policy.rules).toEqual(["policy", "rules"]);
    expect(queryKeys.policy.decisions("tx1")).toEqual(["policy", "decisions", "tx1"]);
    expect(queryKeys.policy.reviewQueue({ status: "pending" })).toEqual(["policy", "review", { status: "pending" }]);
    expect(queryKeys.policy.whitelist({ q: "x" })).toEqual(["policy", "whitelist", { q: "x" }]);
    expect(queryKeys.policy.velocityOverrides("u1")).toEqual(["policy", "velocity", "u1"]);
    expect(queryKeys.policy.fraudTimeline("u1")).toEqual(["policy", "fraud-timeline", "u1"]);
    expect(queryKeys.policy.cases({ status: "open" })).toEqual(["policy", "cases", { status: "open" }]);
    expect(queryKeys.policy.case("c1")).toEqual(["policy", "case", "c1"]);
  });

  it("users keys", () => {
    expect(queryKeys.users.all).toEqual(["users"]);
    expect(queryKeys.users.list({ q: "a" })).toEqual(["users", "list", { q: "a" }]);
    expect(queryKeys.users.detail("u1")).toEqual(["users", "detail", "u1"]);
    expect(queryKeys.users.audit("u1")).toEqual(["users", "u1", "audit"]);
  });

  it("audit keys", () => {
    expect(queryKeys.audit.all).toEqual(["audit"]);
    expect(queryKeys.audit.events({ page: 1 })).toEqual(["audit", "events", { page: 1 }]);
    expect(queryKeys.audit.event("e1")).toEqual(["audit", "event", "e1"]);
    expect(queryKeys.audit.integrity).toEqual(["audit", "integrity"]);
  });

  it("session key", () => {
    expect(queryKeys.session).toEqual(["session"]);
  });
});