import { type ReactNode } from "react";
import { classNames } from "@/utils";

export type BadgeKind = "default" | "success" | "warning" | "danger" | "info" | "muted";

export function Badge({ kind = "default", children }: { kind?: BadgeKind; children: ReactNode }) {
  return <span className={classNames("badge", kind !== "default" && `badge-${kind}`)}>{children}</span>;
}

export function StatusBadge({ status }: { status: string }) {
  const map: Record<string, BadgeKind> = {
    approved: "success",
    pass: "success",
    closed: "muted",
    open: "warning",
    pending: "info",
    pending_review: "warning",
    rejected: "danger",
    investigating: "info",
    escalated: "warning",
    resubmission_requested: "warning",
    sar_filed: "danger",
    active: "success",
    locked: "danger",
    denied: "danger",
  };
  return <Badge kind={map[status] ?? "default"}>{status.replace(/_/g, " ")}</Badge>;
}