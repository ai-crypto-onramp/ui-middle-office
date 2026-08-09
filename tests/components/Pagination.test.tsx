import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Pagination } from "@/components/Pagination";

describe("Pagination", () => {
  it("shows range and total", () => {
    render(<Pagination page={1} pageSize={10} total={25} onPage={() => {}} />);
    expect(screen.getByText("1-10 of 25")).toBeInTheDocument();
    expect(screen.getByText(/Page 1 \/ 3/)).toBeInTheDocument();
  });

  it("clamps pages to at least 1", () => {
    render(<Pagination page={1} pageSize={10} total={0} onPage={() => {}} />);
    expect(screen.getByText(/Page 1 \/ 1/)).toBeInTheDocument();
  });

  it("range shows correct values on later page", () => {
    render(<Pagination page={3} pageSize={10} total={25} onPage={() => {}} />);
    expect(screen.getByText("21-25 of 25")).toBeInTheDocument();
  });

  it("Prev disabled on first page, Next disabled on last page", () => {
    render(<Pagination page={1} pageSize={10} total={25} onPage={() => {}} />);
    expect(screen.getByText("Prev").closest("button")).toBeDisabled();
    expect(screen.getByText("Next").closest("button")).not.toBeDisabled();
  });

  it("Next disabled on last page", () => {
    render(<Pagination page={3} pageSize={10} total={25} onPage={() => {}} />);
    expect(screen.getByText("Next").closest("button")).toBeDisabled();
    expect(screen.getByText("Prev").closest("button")).not.toBeDisabled();
  });

  it("onPage called with page-1 / page+1", () => {
    const onPage = vi.fn();
    render(<Pagination page={2} pageSize={10} total={30} onPage={onPage} />);
    fireEvent.click(screen.getByText("Prev"));
    expect(onPage).toHaveBeenCalledWith(1);
    fireEvent.click(screen.getByText("Next"));
    expect(onPage).toHaveBeenCalledWith(3);
  });

  it("shows 0-0 of 0 when total is 0 on page 1", () => {
    render(<Pagination page={1} pageSize={10} total={0} onPage={() => {}} />);
    expect(screen.getByText("1-0 of 0")).toBeInTheDocument();
  });
});