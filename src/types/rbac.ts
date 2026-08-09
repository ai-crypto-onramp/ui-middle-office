export type Role = "compliance" | "support" | "ops" | "admin";

export const ALL_ROLES: Role[] = ["compliance", "support", "ops", "admin"];

export type Permission =
  | "kyc.review"
  | "alerts.triage"
  | "policy.manage"
  | "users.manage"
  | "audit.read"
  | "admin.all";

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  compliance: ["kyc.review", "alerts.triage", "policy.manage", "audit.read"],
  support: ["kyc.review", "alerts.triage"],
  ops: ["kyc.review", "alerts.triage", "policy.manage"],
  admin: ["kyc.review", "alerts.triage", "policy.manage", "users.manage", "audit.read", "admin.all"],
};

export type Session = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: AuthUser;
};

export type AuthUser = {
  id: string;
  email: string;
  name: string;
  role: Role;
};

export function hasPermission(role: Role | undefined, perm: Permission): boolean {
  if (!role) return false;
  return ROLE_PERMISSIONS[role].includes(perm) || ROLE_PERMISSIONS[role].includes("admin.all");
}