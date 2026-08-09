import { describe, it, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { JsonViewer } from "@/components/JsonViewer";

describe("JsonViewer", () => {
  it("renders JSON string as-is", () => {
    render(<JsonViewer data={'{"a":1}'} />);
    expect(screen.getByText('{"a":1}')).toBeInTheDocument();
  });

  it("stringifies objects with 2-space indent", () => {
    render(<JsonViewer data={{ a: 1, b: [2, 3] }} />);
    const el = document.querySelector(".json-viewer")!;
    expect(el.textContent).toContain('"a": 1');
    expect(el.textContent).toContain('"b": [');
  });

  it("renders inside a pre element", () => {
    const { container } = render(<JsonViewer data="x" />);
    expect(container.querySelector("pre.json-viewer")).not.toBeNull();
  });
});