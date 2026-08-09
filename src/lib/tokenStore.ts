import { loadConfig } from "@/config";

const config = loadConfig();
const TOKEN_STORAGE_KEY = "mo.session";
const TOKEN_REFRESH_MARGIN_MS = 60_000;

let inMemory: {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email: string; name: string; role: string };
} | null = null;

type StoredSession = {
  accessToken: string;
  refreshToken: string;
  expiresAt: number;
  user: { id: string; email: string; name: string; role: string };
};

function loadStored(): StoredSession | null {
  try {
    const raw = localStorage.getItem(TOKEN_STORAGE_KEY);
    if (!raw) return null;
    return JSON.parse(raw) as StoredSession;
  } catch {
    return null;
  }
}

function persist(s: StoredSession | null): void {
  try {
    if (s) localStorage.setItem(TOKEN_STORAGE_KEY, JSON.stringify(s));
    else localStorage.removeItem(TOKEN_STORAGE_KEY);
  } catch {
    /* ignore */
  }
}

export function getSession(): StoredSession | null {
  if (inMemory) return inMemory;
  const stored = loadStored();
  if (stored) inMemory = stored;
  return stored;
}

export function setSession(s: StoredSession): void {
  inMemory = s;
  persist(s);
}

export function clearSession(): void {
  inMemory = null;
  persist(null);
}

export function getAccessToken(): string | null {
  return getSession()?.accessToken ?? null;
}

export async function ensureFreshToken(): Promise<string | null> {
  const s = getSession();
  if (!s) return null;
  if (s.expiresAt - Date.now() > TOKEN_REFRESH_MARGIN_MS) return s.accessToken;
  if (config.mockAuth) return s.accessToken;
  try {
    const res = await fetch(`${config.identityAuthUrl}/v1/auth/refresh`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ refreshToken: s.refreshToken }),
    });
    if (!res.ok) throw new Error(`refresh ${res.status}`);
    const data = (await res.json()) as { accessToken: string; expiresIn: number };
    const next: StoredSession = {
      ...s,
      accessToken: data.accessToken,
      expiresAt: Date.now() + data.expiresIn * 1000,
    };
    setSession(next);
    return next.accessToken;
  } catch {
    clearSession();
    return null;
  }
}

export async function authedFetch(input: string, init: RequestInit = {}): Promise<Response> {
  const token = await ensureFreshToken();
  const headers = new Headers(init.headers ?? {});
  if (token) headers.set("Authorization", `Bearer ${token}`);
  if (init.body && !headers.has("Content-Type")) {
    headers.set("Content-Type", "application/json");
  }
  return fetch(input, { ...init, headers });
}