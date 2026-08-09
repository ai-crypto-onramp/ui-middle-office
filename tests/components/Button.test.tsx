import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Button } from "@/components/Button";

describe("Button", () => {
  it("renders children and default classes", () => {
    const { container } = render(<Button>Click</Button>);
    const btn = screen.getByText("Click").closest("button")!;
    expect(btn).not.toBeNull();
    expect(btn.className).toContain("btn");
    expect(container.querySelector(".btn-sm")).toBeNull();
  });

  it("applies variant + size classes", () => {
    const { container } = render(
      <Button variant="danger" size="sm">
        Delete
      </Button>,
    );
    expect(container.querySelector(".btn-danger")).not.toBeNull();
    expect(container.querySelector(".btn-sm")).not.toBeNull();
  });

  it("default variant does not add a variant class", () => {
    const { container } = render(<Button>x</Button>);
    expect(container.querySelector(".btn-primary")).toBeNull();
  });

  it("passes through extra props (onClick, disabled, type, title)", () => {
    const onClick = vi.fn();
    render(
      <Button onClick={onClick} disabled title="t" type="submit">
        Go
      </Button>,
    );
    const btn = screen.getByText("Go").closest("button")!;
    expect(btn).toBeDisabled();
    expect(btn.title).toBe("t");
    expect(btn.getAttribute("type")).toBe("submit");
    fireEvent.click(btn);
    expect(onClick).not.toHaveBeenCalled();
  });

  it("calls onClick when enabled", () => {
    const onClick = vi.fn();
    render(<Button onClick={onClick}>Go</Button>);
    fireEvent.click(screen.getByText("Go"));
    expect(onClick).toHaveBeenCalledOnce();
  });

  it("merges custom className", () => {
    const { container } = render(<Button className="custom-x">x</Button>);
    expect(container.querySelector(".custom-x")).not.toBeNull();
  });
});