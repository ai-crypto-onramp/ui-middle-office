import { z } from "zod";
import { loadConfig } from "@/config";
import { apiGet, apiPost, apiMutate } from "../apiClient";
import {
  mockKycApplications,
  mockAlerts,
  mockPolicyRules,
  mockReviewQueue,
  mockWhitelist,
  mockVelocityOverrides,
  mockFraudTimeline,
  mockFraudCases,
} from "../mock/data";

const config = loadConfig();

export const KycDocSchema = z.object({
  id: z.string(),
  type: z.string(),
  filename: z.string(),
  url: z.string(),
  contentType: z.string(),
});
export const KycAppSchema = z.object({
  id: z.string(),
  userId: z.string(),
  email: z.string(),
  fullName: z.string(),
  status: z.string(),
  country: z.string(),
  countryCode: z.string(),
  createdAt: z.number(),
  updatedAt: z.number(),
  dob: z.string(),
  phone: z.string(),
  address: z.string(),
  documents: z.array(KycDocSchema),
  livenessVideoUrl: z.string().nullable(),
  vendorResults: z.array(
    z.object({ vendor: z.string(), status: z.string(), score: z.number(), result: z.string(), createdAt: z.number() }),
  ),
  screening: z.object({
    sanctions: z.object({ hits: z.number(), checked: z.boolean() }),
    pep: z.object({ hits: z.number(), checked: z.boolean() }),
    adverseMedia: z.object({ hits: z.number(), checked: z.boolean() }),
  }),
  audit: z.array(z.object({ id: z.string(), actor: z.string(), action: z.string(), ts: z.number() })),
});
export type KycApp = z.infer<typeof KycAppSchema>;
export type KycDoc = z.infer<typeof KycDocSchema>;

export const KycListSchema = z.object({ items: z.array(KycAppSchema), total: z.number() });

export type KycFilters = { status?: string; country?: string; from?: string; to?: string; q?: string; page?: number; pageSize?: number };

export async function listKycApplications(filters: KycFilters): Promise<z.infer<typeof KycListSchema>> {
  return apiGet(`${config.onboardingKycUrl}/v1/applications`, KycListSchema, () => {
    let items = [...mockKycApplications];
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    if (filters.country) items = items.filter((a) => a.country.toLowerCase().includes(filters.country!.toLowerCase()));
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((a) => a.email.toLowerCase().includes(q) || a.fullName.toLowerCase().includes(q) || a.id.includes(q));
    }
    if (filters.from) items = items.filter((a) => a.createdAt >= new Date(filters.from!).getTime());
    if (filters.to) items = items.filter((a) => a.createdAt <= new Date(filters.to!).getTime());
    const total = items.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { items, total };
  });
}

export async function getKycApplication(id: string): Promise<KycApp> {
  return apiGet(`${config.onboardingKycUrl}/v1/applications/${id}`, KycAppSchema, () => {
    const a = mockKycApplications.find((x) => x.id === id);
    if (!a) throw new Error("not found");
    return a;
  });
}

export type KycDecision = { id: string; decision: "approve" | "reject" | "resubmit"; reason?: string; note?: string };

export async function postKycDecision(input: KycDecision): Promise<KycApp> {
  return apiPost(`${config.onboardingKycUrl}/v1/applications/${input.id}/decision`, input, KycAppSchema, () => {
    const a = mockKycApplications.find((x) => x.id === input.id);
    if (!a) throw new Error("not found");
    a.status = input.decision === "approve" ? "approved" : input.decision === "reject" ? "rejected" : "resubmission_requested";
    a.updatedAt = Date.now();
    a.audit.push({ id: `a-${Date.now()}`, actor: "you", action: input.decision, ts: Date.now() });
    return a;
  });
}

export type BulkKycDecision = { ids: string[]; decision: "approve" | "reject"; reason?: string };

export async function postBulkKycDecision(input: BulkKycDecision): Promise<{ updated: number }> {
  return apiPost(`${config.onboardingKycUrl}/v1/applications/bulk-decision`, input, z.object({ updated: z.number() }), () => {
    let n = 0;
    for (const id of input.ids) {
      const a = mockKycApplications.find((x) => x.id === id);
      if (a) {
        a.status = input.decision === "approve" ? "approved" : "rejected";
        a.updatedAt = Date.now();
        a.audit.push({ id: `a-${Date.now()}-${id}`, actor: "you", action: `bulk_${input.decision}`, ts: Date.now() });
        n++;
      }
    }
    return { updated: n };
  });
}

export const AlertSchema = z.object({
  id: z.string(),
  address: z.string(),
  chain: z.string(),
  status: z.string(),
  exposureType: z.string(),
  riskScore: z.number(),
  exposureCategory: z.string(),
  vendor: z.string(),
  vendorResponse: z.object({ matched: z.boolean(), severity: z.string(), details: z.string() }),
  assignee: z.string().nullable(),
  createdAt: z.number(),
  updatedAt: z.number(),
  linkedTransactions: z.array(
    z.object({ txId: z.string(), amount: z.number(), currency: z.string(), direction: z.string(), ts: z.number() }),
  ),
  webhookEvents: z.array(z.object({ id: z.string(), ts: z.number(), vendor: z.string(), raw: z.record(z.unknown()) })),
  history: z.array(z.object({ id: z.string(), ts: z.number(), vendor: z.string(), result: z.string(), risk: z.number() })),
});
export type Alert = z.infer<typeof AlertSchema>;
export const AlertListSchema = z.object({ items: z.array(AlertSchema), total: z.number() });

export type AlertFilters = {
  exposureType?: string;
  status?: string;
  assignee?: string;
  ageMax?: number;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listAlerts(filters: AlertFilters): Promise<z.infer<typeof AlertListSchema>> {
  return apiGet(`${config.amlKytUrl}/v1/alerts`, AlertListSchema, () => {
    let items = [...mockAlerts];
    if (filters.exposureType) items = items.filter((a) => a.exposureType === filters.exposureType);
    if (filters.status) items = items.filter((a) => a.status === filters.status);
    if (filters.assignee) items = items.filter((a) => a.assignee?.includes(filters.assignee!) || a.assignee === null);
    if (filters.ageMax) items = items.filter((a) => Date.now() - a.createdAt <= filters.ageMax! * 1000);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((a) => a.address.toLowerCase().includes(q) || a.id.includes(q));
    }
    const total = items.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    items = items.slice((page - 1) * pageSize, page * pageSize);
    return { items, total };
  });
}

export async function getAlert(id: string): Promise<Alert> {
  return apiGet(`${config.amlKytUrl}/v1/alerts/${id}`, AlertSchema, () => {
    const a = mockAlerts.find((x) => x.id === id);
    if (!a) throw new Error("not found");
    return a;
  });
}

export async function alertAction(input: {
  id: string;
  action: "claim" | "reassign" | "close" | "escalate" | "file_sar";
  assignee?: string;
  note?: string;
}): Promise<Alert> {
  return apiPost(`${config.amlKytUrl}/v1/alerts/${input.id}/action`, input, AlertSchema, () => {
    const a = mockAlerts.find((x) => x.id === input.id);
    if (!a) throw new Error("not found");
    if (input.action === "claim") a.assignee = "you";
    if (input.action === "reassign") a.assignee = input.assignee ?? null;
    if (input.action === "close") a.status = "closed";
    if (input.action === "escalate") a.status = "investigating";
    if (input.action === "file_sar") a.status = "sar_filed";
    a.updatedAt = Date.now();
    return a;
  });
}

export async function addressLookup(address: string, chain: string): Promise<{ items: Alert["history"] }> {
  return apiGet(
    `${config.amlKytUrl}/v1/addresses/${chain}/${address}/history`,
    z.object({ items: z.array(z.object({ id: z.string(), ts: z.number(), vendor: z.string(), result: z.string(), risk: z.number() })) }),
    () => {
      const a = mockAlerts.find((x) => x.address.toLowerCase() === address.toLowerCase());
      return { items: a ? a.history : [] };
    },
  );
}

const PolicyRuleSchema = z.object({
  id: z.string(),
  name: z.string(),
  kind: z.string(),
  enabled: z.boolean(),
  definition: z.record(z.unknown()),
});
export type PolicyRule = z.infer<typeof PolicyRuleSchema>;

export async function listPolicyRules(): Promise<PolicyRule[]> {
  return apiGet(`${config.policyEngineUrl}/v1/rules`, z.array(PolicyRuleSchema), () => [...mockPolicyRules]);
}

export const ReviewItemSchema = z.object({
  id: z.string(),
  txId: z.string(),
  userId: z.string(),
  amount: z.number(),
  currency: z.string(),
  reason: z.string(),
  triggeredBy: z.array(z.string()),
  status: z.string(),
  createdAt: z.number(),
  notes: z.array(z.object({ author: z.string(), text: z.string(), ts: z.number() })),
});
export type ReviewItem = z.infer<typeof ReviewItemSchema>;

export async function listReviewQueue(filters: { status?: string; page?: number; pageSize?: number }): Promise<{ items: ReviewItem[]; total: number }> {
  return apiGet(`${config.policyEngineUrl}/v1/review-queue`, z.object({ items: z.array(ReviewItemSchema), total: z.number() }), () => {
    let items = [...mockReviewQueue];
    if (filters.status) items = items.filter((r) => r.status === filters.status);
    const total = items.length;
    return { items, total };
  });
}

export async function reviewAction(input: {
  id: string;
  action: "approve" | "deny" | "escalate";
  note?: string;
}): Promise<ReviewItem> {
  return apiPost(`${config.policyEngineUrl}/v1/review-queue/${input.id}/action`, input, ReviewItemSchema, () => {
    const r = mockReviewQueue.find((x) => x.id === input.id);
    if (!r) throw new Error("not found");
    r.status = input.action === "approve" ? "approved" : input.action === "deny" ? "denied" : "escalated";
    if (input.note) r.notes.push({ author: "you", text: input.note, ts: Date.now() });
    return r;
  });
}

export async function listDecisionTrail(txId: string): Promise<{ rules: string[]; outcome: string; score: number; events: Array<{ ts: number; rule: string; result: string }> }> {
  return apiGet(
    `${config.policyEngineUrl}/v1/decisions/${txId}`,
    z.object({ rules: z.array(z.string()), outcome: z.string(), score: z.number(), events: z.array(z.object({ ts: z.number(), rule: z.string(), result: z.string() })) }),
    () => ({
      rules: ["rule-tier-2", "rule-velocity"],
      outcome: "manual_review",
      score: 0.42,
      events: [
        { ts: Date.now() - 1000 * 60 * 15, rule: "rule-tier-2", result: "fired" },
        { ts: Date.now() - 1000 * 60 * 15, rule: "rule-velocity", result: "fired" },
        { ts: Date.now() - 1000 * 60 * 14, rule: "fraud-score", result: "0.42" },
      ],
    }),
  );
}

export const WhitelistItemSchema = z.object({
  id: z.string(),
  kind: z.string(),
  value: z.string(),
  chain: z.string().nullable(),
  reason: z.string(),
  createdAt: z.number(),
  createdBy: z.string(),
});
export type WhitelistItem = z.infer<typeof WhitelistItemSchema>;

export async function listWhitelist(filters: { q?: string }): Promise<WhitelistItem[]> {
  return apiGet(`${config.policyEngineUrl}/v1/whitelist`, z.array(WhitelistItemSchema), () => {
    let items = [...mockWhitelist];
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((w) => w.value.toLowerCase().includes(q) || w.reason.toLowerCase().includes(q));
    }
    return items;
  });
}

export async function addWhitelist(input: { kind: "address" | "user"; value: string; chain?: string; reason: string }): Promise<WhitelistItem> {
  return apiPost(`${config.policyEngineUrl}/v1/whitelist`, input, WhitelistItemSchema, () => ({
    id: `wl-${Date.now()}`,
    kind: input.kind,
    value: input.value,
    chain: input.chain ?? null,
    reason: input.reason,
    createdAt: Date.now(),
    createdBy: "you",
  }));
}

export async function removeWhitelist(id: string): Promise<{ id: string }> {
  return apiMutate(`${config.policyEngineUrl}/v1/whitelist/${id}`, "DELETE", undefined, z.object({ id: z.string() }), () => ({ id }));
}

export const VelocityOverrideSchema = z.object({
  id: z.string(),
  userId: z.string(),
  dailyCapUsd: z.number(),
  expiresAt: z.number(),
  reason: z.string(),
  createdBy: z.string(),
});
export type VelocityOverride = z.infer<typeof VelocityOverrideSchema>;

export async function listVelocityOverrides(userId: string): Promise<VelocityOverride[]> {
  return apiGet(`${config.policyEngineUrl}/v1/velocity-overrides`, z.array(VelocityOverrideSchema), () =>
    mockVelocityOverrides.filter((o) => o.userId === userId),
  );
}

export async function createVelocityOverride(input: {
  userId: string;
  dailyCapUsd: number;
  expiresAt: number;
  reason: string;
}): Promise<VelocityOverride> {
  return apiPost(`${config.policyEngineUrl}/v1/velocity-overrides`, input, VelocityOverrideSchema, () => ({
    id: `vo-${Date.now()}`,
    ...input,
    createdBy: "you",
  }));
}

export async function removeVelocityOverride(id: string): Promise<{ id: string }> {
  return apiMutate(`${config.policyEngineUrl}/v1/velocity-overrides/${id}`, "DELETE", undefined, z.object({ id: z.string() }), () => ({ id }));
}

export async function getFraudTimeline(userId: string): Promise<typeof mockFraudTimeline> {
  return apiGet(
    `${config.fraudUrl}/v1/fraud-score/${userId}/timeline`,
    z.array(z.object({ ts: z.number(), score: z.number(), label: z.string(), factors: z.object({ chargebacks: z.number(), velocity: z.string(), behavioral: z.string() }) })),
    () => mockFraudTimeline,
  );
}

export const FraudCaseSchema = z.object({
  id: z.string(),
  userId: z.string(),
  status: z.string(),
  openedAt: z.number(),
  openedBy: z.string(),
  summary: z.string(),
  notes: z.array(z.object({ author: z.string(), text: z.string(), ts: z.number() })),
});
export type FraudCase = z.infer<typeof FraudCaseSchema>;

export async function listFraudCases(filters: { status?: string }): Promise<FraudCase[]> {
  return apiGet(`${config.fraudUrl}/v1/cases`, z.array(FraudCaseSchema), () => {
    let items = [...mockFraudCases];
    if (filters.status) items = items.filter((c) => c.status === filters.status);
    return items;
  });
}

export async function getFraudCase(id: string): Promise<FraudCase> {
  return apiGet(`${config.fraudUrl}/v1/cases/${id}`, FraudCaseSchema, () => {
    const c = mockFraudCases.find((x) => x.id === id);
    if (!c) throw new Error("not found");
    return c;
  });
}

export async function fraudCaseAction(input: { id: string; action: "open" | "note" | "close"; note?: string; userId?: string; summary?: string }): Promise<FraudCase> {
  return apiPost(`${config.fraudUrl}/v1/cases/${input.id}/action`, input, FraudCaseSchema, () => {
    if (input.action === "open") {
      const c: FraudCase = {
        id: `case-${Date.now()}`,
        userId: input.userId ?? "unknown",
        status: "open",
        openedAt: Date.now(),
        openedBy: "you",
        summary: input.summary ?? "",
        notes: input.note ? [{ author: "you", text: input.note, ts: Date.now() }] : [],
      };
      mockFraudCases.push(c);
      return c;
    }
    const c = mockFraudCases.find((x) => x.id === input.id);
    if (!c) throw new Error("not found");
    if (input.action === "note" && input.note) c.notes.push({ author: "you", text: input.note, ts: Date.now() });
    if (input.action === "close") c.status = "closed";
    return c;
  });
}