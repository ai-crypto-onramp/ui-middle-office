import { useEffect, useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listAuditEvents, verifyChainIntegrity, type AuditFilters } from "@/lib/api/usersAudit";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/Field";
import { DataTable } from "@/components/DataTable";
import { Pagination } from "@/components/Pagination";
import { Badge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { JsonViewer } from "@/components/JsonViewer";
import { Spinner } from "@/components/Spinner";
import { downloadFile, formatTimestamp, toCsv } from "@/utils";

const PAGE_SIZE = 15;

export default function AuditPage() {
  const [filters, setFilters] = useState<AuditFilters>({ page: 1, pageSize: PAGE_SIZE });
  const [bookmarks, setBookmarks] = useState<AuditFilters[]>([]);
  const [active, setActive] = useState<AuditFilters | null>(null);
  const [detailId, setDetailId] = useState<string | null>(null);

  useEffect(() => {
    try {
      const raw = localStorage.getItem("mo.audit.bookmarks");
      if (raw) setBookmarks(JSON.parse(raw) as AuditFilters[]);
    } catch {
      /* ignore */
    }
  }, []);

  const { data, isLoading } = useQuery({ queryKey: queryKeys.audit.events(filters), queryFn: () => listAuditEvents(filters) });
  const { data: integrity } = useQuery({ queryKey: queryKeys.audit.integrity, queryFn: verifyChainIntegrity });

  const saveBookmark = (): void => {
    const next = [...bookmarks, filters];
    setBookmarks(next);
    try {
      localStorage.setItem("mo.audit.bookmarks", JSON.stringify(next));
    } catch {
      /* ignore */
    }
  };

  const exportCsv = (): void => {
    const rows = (data?.items ?? []).map((e) => ({
      id: e.id,
      ts: formatTimestamp(e.ts),
      eventType: e.eventType,
      actor: e.actor.id,
      target: e.target.id,
      txId: e.txId ?? "",
      userId: e.userId ?? "",
      verified: e.verified,
    }));
    downloadFile("audit-events.csv", toCsv(rows), "text/csv");
  };
  const exportJson = (): void => {
    downloadFile("audit-events.json", JSON.stringify(data?.items ?? [], null, 2), "application/json");
  };

  const detail = (data?.items ?? []).find((e) => e.id === detailId) ?? null;

  return (
    <div className="stack">
      <div className="row" style={{ justifyContent: "space-between" }}>
        <h1 className="page-title" style={{ margin: 0 }}>
          Audit Log Explorer
        </h1>
        {integrity && (
          <Badge kind={integrity.verified ? "success" : "danger"}>
            {integrity.verified ? "Chain verified" : "Chain broken"} · {integrity.totalEvents} events
          </Badge>
        )}
      </div>

      <div className="card">
        <div className="row-wrap">
          <Field label="Tx ID">
            <Input value={filters.txId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, txId: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="User ID">
            <Input value={filters.userId ?? ""} onChange={(e) => setFilters((f) => ({ ...f, userId: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="Event type">
            <Select value={filters.eventType ?? ""} onChange={(e) => setFilters((f) => ({ ...f, eventType: e.target.value || undefined, page: 1 }))} style={{ width: "auto" }}>
              <option value="">all</option>
              <option value="kyc.decision">kyc.decision</option>
              <option value="policy.decision">policy.decision</option>
              <option value="user.locked">user.locked</option>
              <option value="alert.created">alert.created</option>
              <option value="alert.disposition">alert.disposition</option>
            </Select>
          </Field>
          <Field label="From">
            <Input type="date" value={filters.from ?? ""} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="To">
            <Input type="date" value={filters.to ?? ""} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="Full-text">
            <Input value={filters.q ?? ""} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined, page: 1 }))} placeholder="payload text" style={{ minWidth: 200 }} />
          </Field>
        </div>
        <div className="row" style={{ marginTop: "0.5rem" }}>
          <Button variant="primary" onClick={() => setFilters((f) => ({ ...f, page: 1 }))}>
            Search
          </Button>
          <Button onClick={saveBookmark}>Save search</Button>
          <Button onClick={exportCsv}>Export CSV</Button>
          <Button onClick={exportJson}>Export JSON</Button>
        </div>
      </div>

      {bookmarks.length > 0 && (
        <Panel title="Saved searches">
          <div className="row-wrap">
            {bookmarks.map((b, i) => (
              <Button key={i} size="sm" onClick={() => setActive(b)}>
                #{i + 1} {b.eventType ?? "all"}
              </Button>
            ))}
            {active && (
              <Button size="sm" variant="primary" onClick={() => setFilters(active)}>
                Apply
              </Button>
            )}
          </div>
        </Panel>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={[
            { key: "id", header: "ID", render: (r) => <strong>{r.id}</strong> },
            { key: "ts", header: "When", render: (r) => <span className="small">{formatTimestamp(r.ts)}</span> },
            { key: "type", header: "Event", render: (r) => <Badge kind="info">{r.eventType}</Badge> },
            { key: "actor", header: "Actor", render: (r) => r.actor.email ?? r.actor.id },
            { key: "target", header: "Target", render: (r) => `${r.target.type}:${r.target.id}` },
            { key: "verified", header: "Chain", render: (r) => <Badge kind={r.verified ? "success" : "danger"}>{r.verified ? "✓" : "✗"}</Badge> },
          ]}
          rows={data?.items ?? []}
          onRowClick={(r) => setDetailId(r.id)}
          empty="No events match these filters"
        />
      )}

      {data && <Pagination page={filters.page ?? 1} pageSize={PAGE_SIZE} total={data.total} onPage={(p) => setFilters((f) => ({ ...f, p }))} />}

      <Modal open={detail !== null} title={`Event ${detail?.id ?? ""}`} onClose={() => setDetailId(null)} footer={<Button onClick={() => setDetailId(null)}>Close</Button>}>
        {detail && (
          <div className="stack">
            <div className="kv">
              <dt>When</dt>
              <dd>{formatTimestamp(detail.ts)}</dd>
              <dt>Actor</dt>
              <dd>{detail.actor.email ?? detail.actor.id}</dd>
              <dt>Event type</dt>
              <dd>{detail.eventType}</dd>
              <dt>Target</dt>
              <dd>
                {detail.target.type}:{detail.target.id}
              </dd>
              <dt>tx_id</dt>
              <dd>{detail.txId ?? "—"}</dd>
              <dt>user_id</dt>
              <dd>{detail.userId ?? "—"}</dd>
              <dt>Hash</dt>
              <dd className="mono small">{detail.hash}</dd>
              <dt>Prev hash</dt>
              <dd className="mono small">{detail.prevHash}</dd>
              <dt>Chain</dt>
              <dd>
                <Badge kind={detail.verified ? "success" : "danger"}>{detail.verified ? "verified" : "broken"}</Badge>
              </dd>
            </div>
            <h4 className="section-title">Payload</h4>
            <JsonViewer data={detail.payload} />
          </div>
        )}
      </Modal>
    </div>
  );
}