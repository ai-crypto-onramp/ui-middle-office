import { describe, it, expect, beforeEach, afterEach, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { ErrorBoundary } from "@/components/ErrorBoundary";

function Boom({ shouldThrow }: { shouldThrow: boolean }) {
  if (shouldThrow) throw new Error("kaboom");
  return <div>ok</div>;
}

describe("ErrorBoundary", () => {
  let consoleError: ReturnType<typeof vi.spyOn>;
  beforeEach(() => {
    consoleError = vi.spyOn(console, "error").mockImplementation(() => {}) as ReturnType<typeof vi.spyOn>;
  });
  afterEach(() => {
    consoleError.mockRestore();
    vi.restoreAllMocks();
  });

  it("renders children when no error", () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={false} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("catches error and shows fallback UI", () => {
    render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    expect(screen.getByText("kaboom")).toBeInTheDocument();
  });

  it("Try again resets error state so a recovered child renders", () => {
    let boom = true;
    function Child() {
      if (boom) throw new Error("kaboom");
      return <div>ok</div>;
    }
    function Parent() {
      return (
        <ErrorBoundary>
          <Child />
        </ErrorBoundary>
      );
    }
    const { rerender } = render(<Parent />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    // stop throwing, click Try again, then re-render -> child renders
    boom = false;
    fireEvent.click(screen.getByText("Try again"));
    rerender(<Parent />);
    expect(screen.getByText("ok")).toBeInTheDocument();
  });

  it("child throwing again after Try again re-triggers the boundary", () => {
    const boom = true;
    function Child() {
      if (boom) throw new Error("kaboom2");
      return <div>ok</div>;
    }
    function Parent() {
      return (
        <ErrorBoundary>
          <Child />
        </ErrorBoundary>
      );
    }
    const { rerender } = render(<Parent />);
    expect(screen.getByText("Something went wrong")).toBeInTheDocument();
    // click Try again while still throwing -> re-renders and throws again
    fireEvent.click(screen.getByText("Try again"));
    rerender(<Parent />);
    expect(screen.getByText("kaboom2")).toBeInTheDocument();
  });

  it("Report incident sends beacon and alerts", () => {
    const sendBeacon = vi.fn(() => true);
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: sendBeacon,
      configurable: true,
      writable: true,
    });
    const alertSpy = vi.spyOn(globalThis, "alert").mockImplementation(() => {});
    render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText("Report incident"));
    expect(sendBeacon).toHaveBeenCalled();
    const calls = sendBeacon.mock.calls as unknown as [string, string][];
    const body = JSON.parse(calls[0][1]);
    expect(body.message).toBe("kaboom");
    expect(typeof body.url).toBe("string");
    expect(body.stack).toBeDefined();
    expect(typeof body.time).toBe("string");
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });

  it("report works without sendBeacon (typeof navigator undefined path not reachable in jsdom; alert still fires)", () => {
    const alertSpy = vi.spyOn(globalThis, "alert").mockImplementation(() => {});
    Object.defineProperty(global.navigator, "sendBeacon", {
      value: undefined,
      configurable: true,
      writable: true,
    });
    render(
      <ErrorBoundary>
        <Boom shouldThrow={true} />
      </ErrorBoundary>,
    );
    fireEvent.click(screen.getByText("Report incident"));
    expect(alertSpy).toHaveBeenCalled();
    alertSpy.mockRestore();
  });
});