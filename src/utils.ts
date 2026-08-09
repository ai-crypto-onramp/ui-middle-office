export function formatTimestamp(ts: number | string | Date): string {
  const d = ts instanceof Date ? ts : typeof ts === "number" ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toISOString().replace("T", " ").slice(0, 19);
}

export function formatDate(ts: number | string | Date): string {
  const d = ts instanceof Date ? ts : typeof ts === "number" ? new Date(ts) : new Date(ts);
  if (Number.isNaN(d.getTime())) return String(ts);
  return d.toISOString().slice(0, 10);
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

export function formatCurrency(amount: number, currency = "USD"): string {
  try {
    return new Intl.NumberFormat("en-US", { style: "currency", currency }).format(amount);
  } catch {
    return `${amount} ${currency}`;
  }
}

export function formatNumber(n: number): string {
  return new Intl.NumberFormat("en-US").format(n);
}

export function truncate(s: string, max = 40): string {
  if (s.length <= max) return s;
  return `${s.slice(0, max)}…`;
}

export function relativeTime(ts: number | string | Date): string {
  const d = ts instanceof Date ? ts : typeof ts === "number" ? new Date(ts) : new Date(ts);
  const diff = Date.now() - d.getTime();
  const sec = Math.round(diff / 1000);
  if (sec < 60) return `${sec}s ago`;
  const min = Math.round(sec / 60);
  if (min < 60) return `${min}m ago`;
  const hr = Math.round(min / 60);
  if (hr < 24) return `${hr}h ago`;
  const day = Math.round(hr / 24);
  return `${day}d ago`;
}

export function ageBucket(ts: number | string | Date): "fresh" | "aging" | "stale" | "critical" {
  const d = ts instanceof Date ? ts : typeof ts === "number" ? new Date(ts) : new Date(ts);
  const hr = (Date.now() - d.getTime()) / 3_600_000;
  if (hr < 1) return "fresh";
  if (hr < 4) return "aging";
  if (hr < 24) return "stale";
  return "critical";
}

export function downloadFile(filename: string, content: string, type = "text/plain"): void {
  const blob = new Blob([content], { type });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  document.body.removeChild(a);
  URL.revokeObjectURL(url);
}

export function toCsv(rows: Array<Record<string, unknown>>): string {
  if (rows.length === 0) return "";
  const headers = Object.keys(rows[0]);
  const escape = (v: unknown) => {
    const s = v === null || v === undefined ? "" : String(v);
    if (/[",\n]/.test(s)) return `"${s.replace(/"/g, '""')}"`;
    return s;
  };
  const lines = [headers.join(",")];
  for (const row of rows) {
    lines.push(headers.map((h) => escape(row[h])).join(","));
  }
  return lines.join("\n");
}

export function debounce<T extends (...args: never[]) => void>(fn: T, ms: number): (...args: Parameters<T>) => void {
  let t: ReturnType<typeof setTimeout> | undefined;
  return (...args: Parameters<T>) => {
    if (t) clearTimeout(t);
    t = setTimeout(() => fn(...args), ms);
  };
}