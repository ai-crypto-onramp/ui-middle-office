export function formatTimestamp(ts: number | string): string {
  const d = typeof ts === "number" ? new Date(ts) : new Date(ts);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function classNames(...parts: Array<string | false | undefined | null>): string {
  return parts.filter(Boolean).join(" ");
}

export function severityColor(severity: "low" | "medium" | "high" | "critical"): string {
  switch (severity) {
    case "low":
      return "green";
    case "medium":
      return "amber";
    case "high":
      return "orange";
    case "critical":
      return "red";
  }
}