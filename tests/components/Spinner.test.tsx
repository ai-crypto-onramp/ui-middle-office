import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { Spinner, EmptyState } from "@/components/Spinner";

describe("Spinner", () => {
  it("renders with status role", () => {
    const { container } = render(<Spinner />);
    expect(container.querySelector(".spinner")).not.toBeNull();
    expect(screen.getByRole("status")).toBeInTheDocument();
    expect(screen.getByLabelText("loading")).toBeInTheDocument();
  });
});

describe("EmptyState", () => {
  it("renders children inside .empty", () => {
    const { container } = render(<EmptyState>nothing here</EmptyState>);
    expect(container.querySelector(".empty")).not.toBeNull();
    expect(screen.getByText("nothing here")).toBeInTheDocument();
  });
});