import { describe, expect, it } from "vitest";
import { classNames, formatTimestamp, severityColor } from "@/utils";

describe("classNames", () => {
  it("joins truthy parts", () => {
    expect(classNames("a", "b", false, undefined, null, "c")).toBe("a b c");
  });
});

describe("formatTimestamp", () => {
  it("formats a unix ms timestamp", () => {
    const out = formatTimestamp(0);
    expect(out).toMatch(/1970-01-01 00:00:00/);
  });
});

describe("severityColor", () => {
  it("returns a color per severity", () => {
    expect(severityColor("low")).toBe("green");
    expect(severityColor("medium")).toBe("amber");
    expect(severityColor("high")).toBe("orange");
  });
});