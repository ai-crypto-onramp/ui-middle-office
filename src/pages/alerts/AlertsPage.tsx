import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listAlerts, type AlertFilters } from "@/lib/api/kycAlertsPolicy";
import { DataTable } from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/Badge";
import { AgeIndicator } from "@/components/AgeIndicator";
import { Spinner } from "@/components/Spinner";

const PAGE_SIZE = 10;

export default function AlertsPage() {
  const [filters, setFilters] = useState<AlertFilters>({ page: 1, pageSize: PAGE_SIZE });
  const navigate = useNavigate();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.alerts.list(filters),
    queryFn: () => listAlerts(filters),
  });

  const rows = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="stack">
      <h1 className="page-title">AML / KYT Alert Desk</h1>

      <div className="card">
        <div className="row-wrap">
          <Field label="Exposure">
            <Select value={filters.exposureType ?? ""} onChange={(e) => setFilters((f) => ({ ...f, exposureType: e.target.value || undefined, page: 1 }))}>
              <option value="">all</option>
              <option value="sanctions">sanctions</option>
              <option value="darknet">darknet</option>
              <option value="mixer">mixer</option>
              <option value="scam">scam</option>
            </Select>
          </Field>
          <Field label="Status">
            <Select value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}>
              <option value="">all</option>
              <option value="open">open</option>
              <option value="investigating">investigating</option>
              <option value="closed">closed</option>
              <option value="sar_filed">SAR filed</option>
            </Select>
          </Field>
          <Field label="Age max (h)">
            <Input type="number" min={1} value={filters.ageMax ? filters.ageMax / 3600 : ""} onChange={(e) => setFilters((f) => ({ ...f, ageMax: e.target.value ? Number(e.target.value) * 3600 : undefined, page: 1 }))} />
          </Field>
          <Field label="Assignee">
            <Input placeholder="email / unassigned" value={filters.assignee ?? ""} onChange={(e) => setFilters((f) => ({ ...f, assignee: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="Search">
            <Input placeholder="address / id" value={filters.q ?? ""} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined, page: 1 }))} />
          </Field>
        </div>
      </div>

      {isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          columns={[
            { key: "id", header: "ID", render: (r) => <strong>{r.id}</strong> },
            { key: "address", header: "Address", render: (r) => <span className="mono small">{r.address.slice(0, 12)}…</span> },
            { key: "chain", header: "Chain", render: (r) => r.chain },
            { key: "exposure", header: "Exposure", render: (r) => r.exposureCategory },
            { key: "risk", header: "Risk", render: (r) => `${(r.riskScore * 100).toFixed(0)}%` },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "assignee", header: "Assignee", render: (r) => r.assignee ?? <span className="muted">unassigned</span> },
            { key: "age", header: "Age", render: (r) => <AgeIndicator ts={r.createdAt} /> },
          ]}
          rows={rows}
          onRowClick={(r) => navigate(`/alerts/${r.id}`)}
          empty="No alerts match these filters"
        />
      )}

      {data && <Pagination page={filters.page ?? 1} pageSize={PAGE_SIZE} total={data.total} onPage={(p) => setFilters((f) => ({ ...f, p }))} />}
    </div>
  );
}