import { type ReactNode } from "react";

export function Panel({ title, children, actions }: { title?: string; children: ReactNode; actions?: ReactNode }) {
  return (
    <div className="panel">
      {title && (
        <div className="row" style={{ justifyContent: "space-between", marginBottom: "0.5rem" }}>
          <h3 className="section-title" style={{ margin: 0 }}>
            {title}
          </h3>
          {actions}
        </div>
      )}
      {children}
    </div>
  );
}

export function Kv({ entries }: { entries: Array<[string, ReactNode]> }) {
  return (
    <dl className="kv">
      {entries.map(([k, v]) => (
        <div key={k}>
          <dt>{k}</dt>
          <dd>{v ?? "—"}</dd>
        </div>
      ))}
    </dl>
  );
}