import { describe, expect, it } from "vitest";
import { classNames, formatTimestamp, formatDate, severityColor, toCsv, relativeTime } from "@/utils";

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

describe("formatDate", () => {
  it("formats date only", () => {
    expect(formatDate(0)).toBe("1970-01-01");
  });
});

describe("severityColor", () => {
  it("returns a color per severity", () => {
    expect(severityColor("low")).toBe("green");
    expect(severityColor("medium")).toBe("amber");
    expect(severityColor("high")).toBe("orange");
  });
});

describe("toCsv", () => {
  it("serializes rows to csv", () => {
    const csv = toCsv([{ a: 1, b: "x" }, { a: 2, b: "y" }]);
    expect(csv).toBe("a,b\n1,x\n2,y");
  });
  it("escapes commas and quotes", () => {
    expect(toCsv([{ a: 'he,"llo"' }])).toBe('a\n"he,""llo"""');
  });
});

describe("relativeTime", () => {
  it("returns a human string", () => {
    const out = relativeTime(Date.now() - 5000);
    expect(out).toMatch(/ago/);
  });
});