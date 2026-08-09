import { describe, it, expect, beforeEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ThemeProvider, useTheme } from "@/context/ThemeContext";

function Consumer() {
  const { theme, toggle, setTheme } = useTheme();
  return (
    <div>
      <span data-testid="theme">{theme}</span>
      <button onClick={toggle}>toggle</button>
      <button onClick={() => setTheme("dark")}>set-dark</button>
    </div>
  );
}

describe("ThemeContext", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("useTheme throws outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useTheme();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/useTheme must be used within ThemeProvider/);
    spy.mockRestore();
  });

  it("defaults to light", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("hydrates from localStorage", () => {
    localStorage.setItem("mo.theme", "dark");
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("ignores invalid localStorage value", () => {
    localStorage.setItem("mo.theme", "purple");
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("toggle switches theme and persists", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    expect(localStorage.getItem("mo.theme")).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("light");
  });

  it("setTheme sets explicitly", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    fireEvent.click(screen.getByText("set-dark"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
  });

  it("localStorage.getItem throwing is ignored", () => {
    const spy = vi.spyOn(Storage.prototype, "getItem").mockImplementation(() => {
      throw new Error("denied");
    });
    expect(() =>
      render(
        <ThemeProvider>
          <Consumer />
        </ThemeProvider>,
      ),
    ).not.toThrow();
    spy.mockRestore();
  });

  it("localStorage.setItem throwing is ignored", () => {
    render(
      <ThemeProvider>
        <Consumer />
      </ThemeProvider>,
    );
    const spy = vi.spyOn(Storage.prototype, "setItem").mockImplementation(() => {
      throw new Error("quota");
    });
    fireEvent.click(screen.getByText("toggle"));
    expect(screen.getByTestId("theme").textContent).toBe("dark");
    spy.mockRestore();
  });
});