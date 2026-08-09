import { describe, it, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { Modal, ConfirmModal } from "@/components/Modal";

describe("Modal", () => {
  it("renders nothing when open=false", () => {
    const { container } = render(
      <Modal open={false} title="T" onClose={() => {}}>
        body
      </Modal>,
    );
    expect(container.querySelector(".modal-backdrop")).toBeNull();
  });

  it("renders title + children when open", () => {
    render(
      <Modal open={true} title="My Title" onClose={() => {}}>
        <span>content</span>
      </Modal>,
    );
    expect(screen.getByText("My Title")).toBeInTheDocument();
    expect(screen.getByText("content")).toBeInTheDocument();
  });

  it("does not render footer when not provided", () => {
    const { container } = render(
      <Modal open={true} title="T" onClose={() => {}}>
        x
      </Modal>,
    );
    expect(container.querySelector(".modal-footer")).toBeNull();
  });

  it("renders footer when provided", () => {
    const { container } = render(
      <Modal open={true} title="T" onClose={() => {}} footer={<button>f</button>}>
        x
      </Modal>,
    );
    expect(container.querySelector(".modal-footer")).not.toBeNull();
  });

  it("calls onClose when backdrop is clicked", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} title="T" onClose={onClose}>
        x
      </Modal>,
    );
    fireEvent.click(screen.getByText("T").closest(".modal-backdrop")!);
    expect(onClose).toHaveBeenCalled();
  });

  it("does NOT call onClose when modal body is clicked (stopPropagation)", () => {
    const onClose = vi.fn();
    render(
      <Modal open={true} title="T" onClose={onClose}>
        <span>inner</span>
      </Modal>,
    );
    fireEvent.click(screen.getByText("inner"));
    expect(onClose).not.toHaveBeenCalled();
  });
});

describe("ConfirmModal", () => {
  it("renders message, cancel, and confirm with default label", () => {
    render(
      <ConfirmModal open={true} title="Confirm?" message="Are you sure?" onConfirm={() => {}} onClose={() => {}} />,
    );
    expect(screen.getByText("Confirm?")).toBeInTheDocument();
    expect(screen.getByText("Are you sure?")).toBeInTheDocument();
    expect(screen.getByText("Cancel")).toBeInTheDocument();
    expect(screen.getByText("Confirm")).toBeInTheDocument();
  });

  it("uses custom confirm label and variant", () => {
    const { container } = render(
      <ConfirmModal
        open={true}
        title="T"
        message="m"
        confirmLabel="Delete"
        variant="danger"
        onConfirm={() => {}}
        onClose={() => {}}
      />,
    );
    expect(screen.getByText("Delete")).toBeInTheDocument();
    expect(container.querySelector(".btn-danger")).not.toBeNull();
  });

  it("onConfirm + onClose both called on confirm click", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal open={true} title="T" message="m" onConfirm={onConfirm} onClose={onClose} />,
    );
    fireEvent.click(screen.getByText("Confirm"));
    expect(onConfirm).toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("onClose called on cancel click (without onConfirm)", () => {
    const onConfirm = vi.fn();
    const onClose = vi.fn();
    render(
      <ConfirmModal open={true} title="T" message="m" onConfirm={onConfirm} onClose={onClose} />,
    );
    fireEvent.click(screen.getByText("Cancel"));
    expect(onConfirm).not.toHaveBeenCalled();
    expect(onClose).toHaveBeenCalled();
  });

  it("renders nothing when closed", () => {
    const { container } = render(
      <ConfirmModal open={false} title="T" message="m" onConfirm={() => {}} onClose={() => {}} />,
    );
    expect(container.querySelector(".modal-backdrop")).toBeNull();
  });
});