import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { AgeIndicator } from "@/components/AgeIndicator";

describe("AgeIndicator", () => {
  it("renders relative time and title with iso string", () => {
    const ts = Date.now() - 5000;
    render(<AgeIndicator ts={ts} />);
    const el = screen.getByText(/ago/);
    expect(el).toBeInTheDocument();
    expect(el.getAttribute("title")).toBe(new Date(ts).toISOString());
  });

  it("applies age bucket class based on freshness", () => {
    const ts = Date.now() - 1000 * 60; // < 1h -> fresh
    const { container } = render(<AgeIndicator ts={ts} />);
    expect(container.querySelector(".age-fresh")).not.toBeNull();
  });
});