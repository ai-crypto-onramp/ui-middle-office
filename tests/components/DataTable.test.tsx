import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { DataTable } from "@/components/DataTable";

type Row = { id: string; name: string };

const rows: Row[] = [
  { id: "1", name: "Alice" },
  { id: "2", name: "Bob" },
];

const columns = [
  { key: "id", header: "ID", render: (r: Row) => r.id },
  { key: "name", header: "Name", render: (r: Row) => r.name },
];

describe("DataTable", () => {
  it("renders empty state when no rows", () => {
    render(<DataTable columns={columns} rows={[]} empty="No data" />);
    expect(screen.getByText("No data")).toBeInTheDocument();
  });

  it("renders header + rows", () => {
    render(<DataTable columns={columns} rows={rows} />);
    expect(screen.getByText("ID")).toBeInTheDocument();
    expect(screen.getByText("Name")).toBeInTheDocument();
    expect(screen.getByText("Alice")).toBeInTheDocument();
    expect(screen.getByText("Bob")).toBeInTheDocument();
  });

  it("calls onRowClick when a row is clicked", () => {
    const onRowClick = vi.fn();
    render(<DataTable columns={columns} rows={rows} onRowClick={onRowClick} />);
    fireEvent.click(screen.getByText("Alice"));
    expect(onRowClick).toHaveBeenCalledWith(rows[0]);
  });

  it("selectable renders select-all checkbox checked when all selected", () => {
    const onToggleAll = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        selectable
        selectedIds={["1", "2"]}
        onToggleAll={onToggleAll}
      />,
    );
    const all = screen.getByLabelText("select all") as HTMLInputElement;
    expect(all.checked).toBe(true);
    fireEvent.click(all);
    expect(onToggleAll).toHaveBeenCalled();
  });

  it("select-all checkbox unchecked when not all selected", () => {
    render(
      <DataTable columns={columns} rows={rows} selectable selectedIds={["1"]} />,
    );
    const all = screen.getByLabelText("select all") as HTMLInputElement;
    expect(all.checked).toBe(false);
  });

  it("select-all checkbox unchecked when rows empty (edge: selectedIds non-empty but no rows)", () => {
    render(
      <DataTable columns={columns} rows={[]} selectable selectedIds={["1"]} empty="none" />,
    );
    // empty state shown, no select-all checkbox
    expect(screen.queryByLabelText("select all")).toBeNull();
  });

  it("row checkbox calls onToggleRow and stops propagation (no row click)", () => {
    const onRowClick = vi.fn();
    const onToggleRow = vi.fn();
    render(
      <DataTable
        columns={columns}
        rows={rows}
        onRowClick={onRowClick}
        selectable
        selectedIds={[]}
        onToggleRow={onToggleRow}
      />,
    );
    const rowCheckbox = screen.getAllByLabelText("select row")[0];
    fireEvent.click(rowCheckbox);
    expect(onToggleRow).toHaveBeenCalledWith("1");
    expect(onRowClick).not.toHaveBeenCalled();
  });

  it("column width applied when provided", () => {
    const cols = [{ key: "id", header: "ID", render: (r: Row) => r.id, width: "100px" }];
    const { container } = render(<DataTable columns={cols} rows={rows} />);
    const th = container.querySelector("th")!;
    expect(th.style.width).toBe("100px");
  });
});