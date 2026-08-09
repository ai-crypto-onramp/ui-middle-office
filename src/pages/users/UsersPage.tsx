import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listUsers } from "@/lib/api/usersAudit";
import { DataTable } from "@/components/DataTable";
import { Field, Input, Select } from "@/components/Field";
import { StatusBadge } from "@/components/Badge";
import { Spinner } from "@/components/Spinner";
import { formatTimestamp } from "@/utils";

export default function UsersPage() {
  const [q, setQ] = useState("");
  const [status, setStatus] = useState("");
  const navigate = useNavigate();
  const { data, isLoading } = useQuery({ queryKey: queryKeys.users.list({ q, status }), queryFn: () => listUsers({ q, status }) });

  if (isLoading) return <Spinner />;

  return (
    <div className="stack">
      <h1 className="page-title">User Management</h1>
      <div className="card">
        <div className="row-wrap">
          <Field label="Search (email / ID / name)">
            <Input value={q} onChange={(e) => setQ(e.target.value)} placeholder="alice@… / user-501" style={{ minWidth: 280 }} />
          </Field>
          <Field label="Status">
            <Select value={status} onChange={(e) => setStatus(e.target.value)} style={{ width: "auto" }}>
              <option value="">all</option>
              <option value="active">active</option>
              <option value="locked">locked</option>
            </Select>
          </Field>
        </div>
      </div>
      <DataTable
        columns={[
          { key: "id", header: "User ID", render: (r) => <strong>{r.id}</strong> },
          { key: "name", header: "Name", render: (r) => r.name },
          { key: "email", header: "Email", render: (r) => r.email },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "kyc", header: "KYC", render: (r) => <StatusBadge status={r.kycStatus} /> },
          { key: "roles", header: "Roles", render: (r) => r.roles.join(", ") },
          { key: "created", header: "Created", render: (r) => <span className="small muted">{formatTimestamp(r.createdAt)}</span> },
        ]}
        rows={data ?? []}
        onRowClick={(r) => navigate(`/users/${r.id}`)}
        empty="No users found"
      />
    </div>
  );
}