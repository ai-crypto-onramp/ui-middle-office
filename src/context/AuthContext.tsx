import { createContext, useCallback, useContext, useEffect, useMemo, useState, type ReactNode } from "react";
import { loadConfig } from "@/config";
import { clearSession, ensureFreshToken, getAccessToken, getSession, setSession } from "@/lib/tokenStore";
import type { AuthUser, Role } from "@/types/rbac";
import { z } from "zod";

const config = loadConfig();

const SessionSchema = z.object({
  accessToken: z.string(),
  refreshToken: z.string(),
  expiresIn: z.number(),
  user: z.object({
    id: z.string(),
    email: z.string(),
    name: z.string(),
    role: z.string(),
  }),
});

const MOCK_USERS: Record<Role, AuthUser> = {
  compliance: { id: "u-compliance", email: "compliance@example.com", name: "Compliance Officer", role: "compliance" },
  support: { id: "u-support", email: "support@example.com", name: "Support Agent", role: "support" },
  ops: { id: "u-ops", email: "ops@example.com", name: "Ops Engineer", role: "ops" },
  admin: { id: "u-admin", email: "admin@example.com", name: "Admin Root", role: "admin" },
};

export type LoginInput = { email: string; password: string };

type AuthContextValue = {
  user: AuthUser | null;
  isAuthenticated: boolean;
  loading: boolean;
  login: (input: LoginInput) => Promise<void>;
  logout: () => void;
  switchRole: (role: Role) => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function makeMockSession(user: AuthUser) {
  return {
    accessToken: `mock-access-${user.id}-${Date.now()}`,
    refreshToken: `mock-refresh-${user.id}`,
    expiresAt: Date.now() + 60 * 60 * 1000,
    user,
  };
}

function makeRealSession(raw: z.infer<typeof SessionSchema>) {
  return {
    accessToken: raw.accessToken,
    refreshToken: raw.refreshToken,
    expiresAt: Date.now() + raw.expiresIn * 1000,
    user: raw.user as AuthUser,
  };
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(() => {
    const s = getSession();
    return s ? (s.user as AuthUser) : null;
  });
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const s = getSession();
    if (s) setUser(s.user as AuthUser);
    const t = setInterval(() => {
      const tok = getAccessToken();
      if (!tok && getSession()) {
        setUser(null);
      }
    }, 30_000);
    return () => clearInterval(t);
  }, []);

  const login = useCallback(async (input: LoginInput) => {
    setLoading(true);
    try {
      if (config.mockAuth) {
        await new Promise((r) => setTimeout(r, 250));
        const role = (Object.values(MOCK_USERS).find((u) => u.email === input.email)?.role ?? "compliance") as Role;
        const u = MOCK_USERS[role];
        setSession(makeMockSession(u));
        setUser(u);
        return;
      }
      const res = await fetch(`${config.identityAuthUrl}/v1/auth/session`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(input),
      });
      if (!res.ok) throw new Error(`login failed: ${res.status}`);
      const raw = SessionSchema.parse(await res.json());
      const s = makeRealSession(raw);
      setSession(s);
      setUser(s.user);
    } finally {
      setLoading(false);
    }
  }, []);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
  }, []);

  const switchRole = useCallback((role: Role) => {
    const u = MOCK_USERS[role];
    setSession(makeMockSession(u));
    setUser(u);
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user,
      isAuthenticated: !!user,
      loading,
      login,
      logout,
      switchRole,
    }),
    [user, loading, login, logout, switchRole],
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth(): AuthContextValue {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}

export { ensureFreshToken };
export const MOCK_LOGIN_USERS = MOCK_USERS;