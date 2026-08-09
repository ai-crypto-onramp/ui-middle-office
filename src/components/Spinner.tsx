export function Spinner() {
  return (
    <div className="center">
      <span className="spinner" role="status" aria-label="loading" />
    </div>
  );
}

export function EmptyState({ children }: { children: React.ReactNode }) {
  return <div className="empty">{children}</div>;
}