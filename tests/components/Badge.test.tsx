import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Badge, StatusBadge } from "@/components/Badge";

describe("Badge", () => {
  it("renders children with default kind (no modifier class)", () => {
    const { container } = render(<Badge>x</Badge>);
    expect(screen.getByText("x")).toBeInTheDocument();
    expect(container.querySelector(".badge")).not.toBeNull();
    expect(container.querySelector(".badge-success")).toBeNull();
  });

  it("applies kind modifier class", () => {
    const { container } = render(<Badge kind="success">y</Badge>);
    expect(container.querySelector(".badge-success")).not.toBeNull();
  });
});

describe("StatusBadge", () => {
  it("maps known statuses to kinds and replaces underscores", () => {
    const { container } = render(<StatusBadge status="pending_review" />);
    expect(container.querySelector(".badge-warning")).not.toBeNull();
    expect(screen.getByText("pending review")).toBeInTheDocument();
  });

  it("falls back to default kind for unknown status", () => {
    const { container } = render(<StatusBadge status="weird" />);
    expect(container.querySelector(".badge")).not.toBeNull();
    expect(container.querySelector("[class*=\"badge-\"]")).toBeNull();
    expect(screen.getByText("weird")).toBeInTheDocument();
  });

  it("covers all mapped statuses", () => {
    const statuses = [
      "approved",
      "pass",
      "closed",
      "open",
      "pending",
      "pending_review",
      "rejected",
      "investigating",
      "escalated",
      "resubmission_requested",
      "sar_filed",
      "active",
      "locked",
      "denied",
    ];
    for (const s of statuses) {
      const { unmount } = render(<StatusBadge status={s} />);
      expect(screen.getByText(s.replace(/_/g, " "))).toBeInTheDocument();
      unmount();
    }
  });
});