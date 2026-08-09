export const queryKeys = {
  kyc: {
    all: ["kyc"] as const,
    list: (filters: Record<string, unknown>) => ["kyc", "list", filters] as const,
    detail: (id: string) => ["kyc", "detail", id] as const,
    audit: (id: string) => ["kyc", id, "audit"] as const,
  },
  alerts: {
    all: ["alerts"] as const,
    list: (filters: Record<string, unknown>) => ["alerts", "list", filters] as const,
    detail: (id: string) => ["alerts", "detail", id] as const,
    events: (id: string) => ["alerts", id, "events"] as const,
    addressLookup: (addr: string, chain: string) => ["alerts", "address", addr, chain] as const,
  },
  policy: {
    all: ["policy"] as const,
    rules: ["policy", "rules"] as const,
    decisions: (txId: string) => ["policy", "decisions", txId] as const,
    reviewQueue: (filters: Record<string, unknown>) => ["policy", "review", filters] as const,
    whitelist: (filters: Record<string, unknown>) => ["policy", "whitelist", filters] as const,
    velocityOverrides: (userId: string) => ["policy", "velocity", userId] as const,
    fraudTimeline: (userId: string) => ["policy", "fraud-timeline", userId] as const,
    cases: (filters: Record<string, unknown>) => ["policy", "cases", filters] as const,
    case: (id: string) => ["policy", "case", id] as const,
  },
  users: {
    all: ["users"] as const,
    list: (filters: Record<string, unknown>) => ["users", "list", filters] as const,
    detail: (id: string) => ["users", "detail", id] as const,
    audit: (id: string) => ["users", id, "audit"] as const,
  },
  audit: {
    all: ["audit"] as const,
    events: (filters: Record<string, unknown>) => ["audit", "events", filters] as const,
    event: (id: string) => ["audit", "event", id] as const,
    integrity: ["audit", "integrity"] as const,
  },
  session: ["session"] as const,
};