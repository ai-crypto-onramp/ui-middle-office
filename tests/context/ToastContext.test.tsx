import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent, act } from "@testing-library/react";
import { ToastProvider, useToast } from "@/context/ToastContext";

function Consumer() {
  const { toasts, toast, dismiss } = useToast();
  return (
    <div>
      <span data-testid="count">{toasts.length}</span>
      <button onClick={() => toast("hi", "success")}>toast</button>
      <button onClick={() => toast("err", "error")}>toast-err</button>
      <button onClick={() => toast("no-kind")}>toast-default</button>
      <button onClick={() => dismiss(toasts[0]?.id ?? "")}>dismiss-first</button>
    </div>
  );
}

describe("ToastContext", () => {
  beforeEach(() => {
    vi.useFakeTimers();
  });
  afterEach(() => {
    vi.useRealTimers();
    vi.restoreAllMocks();
  });

  it("useToast throws outside provider", () => {
    const spy = vi.spyOn(console, "error").mockImplementation(() => {});
    function Bad() {
      useToast();
      return null;
    }
    expect(() => render(<Bad />)).toThrow(/useToast must be used within ToastProvider/);
    spy.mockRestore();
  });

  it("adds a toast and auto-dismisses after 4500ms", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("toast"));
    expect(screen.getByTestId("count").textContent).toBe("1");
    expect(screen.getByText("hi")).toBeInTheDocument();
    act(() => {
      vi.advanceTimersByTime(4500);
    });
    expect(screen.getByTestId("count").textContent).toBe("0");
  });

  it("toast uses default kind info", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("toast-default"));
    expect(screen.getByText("no-kind")).toBeInTheDocument();
    expect(screen.getByText("info")).toBeInTheDocument();
  });

  it("dismiss removes a toast", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("toast"));
    fireEvent.click(screen.getByText("toast-err"));
    expect(screen.getByTestId("count").textContent).toBe("2");
    fireEvent.click(screen.getByText("dismiss-first"));
    expect(screen.getByTestId("count").textContent).toBe("1");
  });

  it("clicking a toast dismisses it", () => {
    render(
      <ToastProvider>
        <Consumer />
      </ToastProvider>,
    );
    fireEvent.click(screen.getByText("toast"));
    fireEvent.click(screen.getByText("hi"));
    expect(screen.getByTestId("count").textContent).toBe("0");
  });
});