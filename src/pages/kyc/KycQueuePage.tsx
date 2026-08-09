import { useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listKycApplications, postBulkKycDecision, type KycFilters } from "@/lib/api/kycAlertsPolicy";
import { DataTable } from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import { Button } from "@/components/Button";
import { Pagination } from "@/components/Pagination";
import { StatusBadge } from "@/components/Badge";
import { formatTimestamp } from "@/utils";
import { useToast } from "@/context/ToastContext";
import { Spinner } from "@/components/Spinner";

const PAGE_SIZE = 10;

export default function KycQueuePage() {
  const [filters, setFilters] = useState<KycFilters>({ status: "pending_review", page: 1, pageSize: PAGE_SIZE });
  const [selected, setSelected] = useState<string[]>([]);
  const navigate = useNavigate();
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data, isLoading } = useQuery({
    queryKey: queryKeys.kyc.list(filters),
    queryFn: () => listKycApplications(filters),
  });

  const bulkMut = useMutation({
    mutationFn: postBulkKycDecision,
    onSuccess: (res) => {
      toast(`Bulk ${res.updated} applications updated`, "success");
      setSelected([]);
      qc.invalidateQueries({ queryKey: queryKeys.kyc.all });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Bulk action failed", "error"),
  });

  const rows = useMemo(() => data?.items ?? [], [data]);

  return (
    <div className="stack">
      <h1 className="page-title">KYC Review Queue</h1>

      <div className="card">
        <div className="row-wrap">
          <Field label="Status">
            <Select value={filters.status ?? ""} onChange={(e) => setFilters((f) => ({ ...f, status: e.target.value || undefined, page: 1 }))}>
              <option value="">all</option>
              <option value="pending_review">pending review</option>
              <option value="resubmission_requested">resubmission requested</option>
              <option value="approved">approved</option>
              <option value="rejected">rejected</option>
            </Select>
          </Field>
          <Field label="Country">
            <Input placeholder="e.g. United States" value={filters.country ?? ""} onChange={(e) => setFilters((f) => ({ ...f, country: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="From date">
            <Input type="date" value={filters.from ?? ""} onChange={(e) => setFilters((f) => ({ ...f, from: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="To date">
            <Input type="date" value={filters.to ?? ""} onChange={(e) => setFilters((f) => ({ ...f, to: e.target.value || undefined, page: 1 }))} />
          </Field>
          <Field label="Search">
            <Input placeholder="id / email / name" value={filters.q ?? ""} onChange={(e) => setFilters((f) => ({ ...f, q: e.target.value || undefined, page: 1 }))} />
          </Field>
        </div>
      </div>

      {selected.length > 0 && (
        <div className="row">
          <strong className="small">{selected.length} selected</strong>
          <Button size="sm" variant="success" onClick={() => bulkMut.mutate({ ids: selected, decision: "approve" })}>
            Bulk approve
          </Button>
          <Button size="sm" variant="danger" onClick={() => bulkMut.mutate({ ids: selected, decision: "reject", reason: "bulk rejection" })}>
            Bulk reject
          </Button>
          <Button size="sm" onClick={() => setSelected([])}>
            Clear
          </Button>
        </div>
      )}

      {isLoading ? (
        <Spinner />
      ) : (
        <DataTable
          selectable
          selectedIds={selected}
          onToggleRow={(id) => setSelected((p) => (p.includes(id) ? p.filter((x) => x !== id) : [...p, id]))}
          onToggleAll={() => setSelected((p) => (p.length === rows.length ? [] : rows.map((r) => r.id)))}
          columns={[
            { key: "id", header: "ID", render: (r) => <a href={`#/kyc/${r.id}`}>{r.id}</a> },
            { key: "name", header: "Applicant", render: (r) => <strong>{r.fullName}</strong> },
            { key: "email", header: "Email", render: (r) => r.email },
            { key: "country", header: "Country", render: (r) => r.country },
            { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
            { key: "created", header: "Created", render: (r) => <span className="small muted">{formatTimestamp(r.createdAt)}</span> },
          ]}
          rows={rows}
          onRowClick={(r) => navigate(`/kyc/${r.id}`)}
          empty="No applications match these filters"
        />
      )}

      {data && (
        <Pagination page={filters.page ?? 1} pageSize={PAGE_SIZE} total={data.total} onPage={(p) => setFilters((f) => ({ ...f, p }))} />
      )}
    </div>
  );
}