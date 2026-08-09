import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Panel, Kv } from "@/components/Panel";

describe("Panel", () => {
  it("renders children without title", () => {
    const { container } = render(
      <Panel>
        <span>body</span>
      </Panel>,
    );
    expect(screen.getByText("body")).toBeInTheDocument();
    expect(container.querySelector(".section-title")).toBeNull();
  });

  it("renders title and actions when provided", () => {
    const { container } = render(
      <Panel title="My Panel" actions={<button>act</button>}>
        <span>body</span>
      </Panel>,
    );
    expect(screen.getByText("My Panel")).toBeInTheDocument();
    expect(screen.getByText("act")).toBeInTheDocument();
    expect(container.querySelector(".section-title")).not.toBeNull();
  });
});

describe("Kv", () => {
  it("renders entries with dt/dd", () => {
    const { container } = render(<Kv entries={[["Name", "Alice"], ["Age", 30], ["Empty", null]]} />);
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Age")).toBeInTheDocument();
    expect(screen.getByText("30")).toBeInTheDocument();
    // null value renders em-dash fallback
    expect(screen.getByText("—")).toBeInTheDocument();
    expect(container.querySelectorAll("dt").length).toBe(3);
    expect(container.querySelectorAll("dd").length).toBe(3);
  });
});