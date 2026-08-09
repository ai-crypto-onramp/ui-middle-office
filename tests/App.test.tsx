import { describe, expect, it } from "vitest";
import { render, screen } from "@testing-library/react";
import App from "@/App";

describe("App", () => {
  it("renders the heading and module list", () => {
    render(<App />);
    expect(screen.getByText("Middle Office UI")).toBeTruthy();
    expect(screen.getByText("KYC Review Console")).toBeTruthy();
    expect(screen.getByText("AML / KYT Alert Desk")).toBeTruthy();
  });
});