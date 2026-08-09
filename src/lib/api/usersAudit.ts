import { z } from "zod";
import { loadConfig } from "@/config";
import { apiGet, apiMutate, apiPost } from "../apiClient";
import { mockUsers, mockAuditEvents } from "../mock/data";

const config = loadConfig();

export const UserSchema = z.object({
  id: z.string(),
  email: z.string(),
  name: z.string(),
  status: z.string(),
  createdAt: z.number(),
  roles: z.array(z.string()),
  kycStatus: z.string(),
  sessions: z.array(z.object({ id: z.string(), device: z.string(), ip: z.string(), lastSeen: z.number() })),
  mfaFactors: z.array(z.object({ type: z.string(), enabled: z.boolean(), addedAt: z.number() })),
  apiKeys: z.array(z.object({ id: z.string(), name: z.string(), createdAt: z.number(), lastUsed: z.number() })),
  roleBindings: z.array(z.object({ role: z.string(), scope: z.string(), assignedAt: z.number() })),
  audit: z.array(z.object({ id: z.string(), actor: z.string(), action: z.string(), ts: z.number() })),
});
export type User = z.infer<typeof UserSchema>;

export async function listUsers(filters: { q?: string; status?: string }): Promise<User[]> {
  return apiGet(`${config.identityAuthUrl}/v1/users`, z.array(UserSchema), () => {
    let items = [...mockUsers];
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((u) => u.email.toLowerCase().includes(q) || u.id.includes(q) || u.name.toLowerCase().includes(q));
    }
    if (filters.status) items = items.filter((u) => u.status === filters.status);
    return items;
  });
}

export async function getUser(id: string): Promise<User> {
  return apiGet(`${config.identityAuthUrl}/v1/users/${id}`, UserSchema, () => {
    const u = mockUsers.find((x) => x.id === id);
    if (!u) throw new Error("not found");
    return u;
  });
}

export type UserAction = "lock" | "unlock" | "reset_password" | "revoke_sessions" | "revoke_api_key" | "assign_role" | "revoke_role";

export async function userAction(input: {
  userId: string;
  action: UserAction;
  apiKeyId?: string;
  role?: string;
  scope?: string;
}): Promise<User> {
  return apiPost(`${config.identityAuthUrl}/v1/users/${input.userId}/action`, input, UserSchema, () => {
    const u = mockUsers.find((x) => x.id === input.userId);
    if (!u) throw new Error("not found");
    if (input.action === "lock") u.status = "locked";
    if (input.action === "unlock") u.status = "active";
    if (input.action === "revoke_sessions") u.sessions = [];
    if (input.action === "revoke_api_key" && input.apiKeyId) u.apiKeys = u.apiKeys.filter((k) => k.id !== input.apiKeyId);
    if (input.action === "assign_role" && input.role) u.roleBindings.push({ role: input.role, scope: input.scope ?? "global", assignedAt: Date.now() });
    if (input.action === "revoke_role" && input.role) u.roleBindings = u.roleBindings.filter((r) => r.role !== input.role);
    u.audit.push({ id: `ua-${Date.now()}`, actor: "you", action: input.action, ts: Date.now() });
    return u;
  });
}

export const AuditEventSchema = z.object({
  id: z.string(),
  ts: z.number(),
  actor: z.object({ type: z.string(), id: z.string(), email: z.string().nullable() }),
  eventType: z.string(),
  target: z.object({ type: z.string(), id: z.string() }),
  txId: z.string().nullable(),
  userId: z.string().nullable(),
  payload: z.record(z.unknown()),
  hash: z.string(),
  prevHash: z.string(),
  verified: z.boolean(),
});
export type AuditEvent = z.infer<typeof AuditEventSchema>;

export type AuditFilters = {
  txId?: string;
  userId?: string;
  eventType?: string;
  from?: string;
  to?: string;
  q?: string;
  page?: number;
  pageSize?: number;
};

export async function listAuditEvents(filters: AuditFilters): Promise<{ items: AuditEvent[]; total: number }> {
  return apiGet(`${config.auditUrl}/v1/events`, z.object({ items: z.array(AuditEventSchema), total: z.number() }), () => {
    let items = [...mockAuditEvents];
    if (filters.txId) items = items.filter((e) => e.txId === filters.txId);
    if (filters.userId) items = items.filter((e) => e.userId === filters.userId);
    if (filters.eventType) items = items.filter((e) => e.eventType === filters.eventType);
    if (filters.q) {
      const q = filters.q.toLowerCase();
      items = items.filter((e) => JSON.stringify(e.payload).toLowerCase().includes(q) || e.id.includes(q));
    }
    if (filters.from) items = items.filter((e) => e.ts >= new Date(filters.from!).getTime());
    if (filters.to) items = items.filter((e) => e.ts <= new Date(filters.to!).getTime());
    const total = items.length;
    const page = filters.page ?? 1;
    const pageSize = filters.pageSize ?? 25;
    items = items.slice((page - 1) * pageSize, page * pageSize).sort((a, b) => b.ts - a.ts);
    return { items, total };
  });
}

export async function getAuditEvent(id: string): Promise<AuditEvent> {
  return apiGet(`${config.auditUrl}/v1/events/${id}`, AuditEventSchema, () => {
    const e = mockAuditEvents.find((x) => x.id === id);
    if (!e) throw new Error("not found");
    return e;
  });
}

export async function verifyChainIntegrity(): Promise<{ verified: boolean; brokenAt: string | null; totalEvents: number }> {
  return apiGet(
    `${config.auditUrl}/v1/integrity`,
    z.object({ verified: z.boolean(), brokenAt: z.string().nullable(), totalEvents: z.number() }),
    () => ({ verified: true, brokenAt: null, totalEvents: mockAuditEvents.length }),
  );
}

export async function userAuditTrail(userId: string): Promise<AuditEvent[]> {
  return apiGet(`${config.auditUrl}/v1/events`, z.array(AuditEventSchema), () =>
    mockAuditEvents.filter((e) => e.userId === userId || e.target.id === userId).sort((a, b) => b.ts - a.ts),
  );
}

export async function _touch(_x: number): Promise<number> {
  return apiMutate(`${config.auditUrl}/_ping`, "POST", _x, z.number(), () => 0);
}