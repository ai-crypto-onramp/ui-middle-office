import { describe, expect, it } from "vitest";
import { loadConfig } from "@/config";

describe("loadConfig", () => {
  it("uses defaults when env empty", () => {
    const c = loadConfig({} as Record<string, string | undefined>);
    expect(c.identityAuthUrl).toBe("http://identity-auth.internal:8080");
    expect(c.auditUrl).toBe("http://audit-event-log.internal:8080");
  });

  it("overrides from env", () => {
    const c = loadConfig({ VITE_AUDIT_URL: "http://audit.example:9000" });
    expect(c.auditUrl).toBe("http://audit.example:9000");
  });
});