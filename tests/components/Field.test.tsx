import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Field, Input, Select, Textarea } from "@/components/Field";

describe("Field", () => {
  it("renders label and children", () => {
    const { container } = render(
      <Field label="Email">
        <input />
      </Field>,
    );
    expect(screen.getByText("Email")).toBeInTheDocument();
    expect(container.querySelector("label.label")).not.toBeNull();
    expect(container.querySelector("input")).not.toBeNull();
  });
});

describe("Input", () => {
  it("renders input with input class merged", () => {
    render(<Input className="extra" placeholder="p" />);
    const el = screen.getByPlaceholderText("p") as HTMLInputElement;
    expect(el.className).toContain("input");
    expect(el.className).toContain("extra");
  });

  it("passes through props", () => {
    const onChange = vi.fn();
    render(<Input type="email" value="x" onChange={onChange} />);
    const el = screen.getByDisplayValue("x");
    fireEvent.change(el, { target: { value: "y" } });
    expect(onChange).toHaveBeenCalled();
  });

  it("works without custom className", () => {
    render(<Input placeholder="p" />);
    const el = screen.getByPlaceholderText("p") as HTMLInputElement;
    expect(el.className).toContain("input");
  });
});

describe("Select", () => {
  it("renders select with select class merged", () => {
    render(
      <Select className="extra">
        <option>a</option>
      </Select>,
    );
    const el = screen.getByRole("combobox") as HTMLSelectElement;
    expect(el.className).toContain("select");
    expect(el.className).toContain("extra");
  });

  it("works without custom className", () => {
    render(
      <Select>
        <option>a</option>
      </Select>,
    );
    const el = screen.getByRole("combobox") as HTMLSelectElement;
    expect(el.className).toContain("select");
  });
});

describe("Textarea", () => {
  it("renders textarea with textarea class merged", () => {
    render(<Textarea className="extra" placeholder="p" />);
    const el = screen.getByPlaceholderText("p") as HTMLTextAreaElement;
    expect(el.className).toContain("textarea");
    expect(el.className).toContain("extra");
  });

  it("works without custom className", () => {
    render(<Textarea placeholder="p" />);
    const el = screen.getByPlaceholderText("p") as HTMLTextAreaElement;
    expect(el.className).toContain("textarea");
  });
});