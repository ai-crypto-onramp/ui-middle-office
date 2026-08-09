import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listReviewQueue, reviewAction } from "@/lib/api/kycAlertsPolicy";
import { Panel } from "@/components/Panel";
import { DataTable } from "@/components/DataTable";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Field, Textarea } from "@/components/Field";
import { StatusBadge } from "@/components/Badge";
import { Spinner } from "@/components/Spinner";
import { formatCurrency, formatTimestamp } from "@/utils";
import { useToast } from "@/context/ToastContext";

export function ReviewQueueTab() {
  const [status, setStatus] = useState<string>("");
  const { data, isLoading } = useQuery({ queryKey: queryKeys.policy.reviewQueue({ status }), queryFn: () => listReviewQueue({ status }) });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [action, setAction] = useState<null | "approve" | "deny" | "escalate">(null);
  const [activeId, setActiveId] = useState<string | null>(null);
  const [note, setNote] = useState("");

  const mut = useMutation({
    mutationFn: reviewAction,
    onSuccess: () => {
      toast("Review action recorded", "success");
      setAction(null);
      setNote("");
      qc.invalidateQueries({ queryKey: queryKeys.policy.reviewQueue({}) });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Action failed", "error"),
  });

  if (isLoading) return <Spinner />;

  const rows = data?.items ?? [];

  return (
    <Panel title="Manual review queue" actions={<Button size="sm" onClick={() => setStatus(status ? "" : "pending")}>Toggle pending only</Button>}>
      <DataTable
        columns={[
          { key: "id", header: "ID", render: (r) => <strong>{r.id}</strong> },
          { key: "tx", header: "Tx", render: (r) => <span className="mono small">{r.txId}</span> },
          { key: "user", header: "User", render: (r) => r.userId },
          { key: "amount", header: "Amount", render: (r) => formatCurrency(r.amount, r.currency) },
          { key: "reason", header: "Reason", render: (r) => r.reason },
          { key: "rules", header: "Triggered by", render: (r) => r.triggeredBy.join(", ") },
          { key: "status", header: "Status", render: (r) => <StatusBadge status={r.status} /> },
          { key: "created", header: "Created", render: (r) => <span className="small muted">{formatTimestamp(r.createdAt)}</span> },
          { key: "act", header: "Actions", render: (r) => (
            <div className="row">
              <Button size="sm" variant="success" onClick={() => { setActiveId(r.id); setAction("approve"); }}>Approve</Button>
              <Button size="sm" variant="danger" onClick={() => { setActiveId(r.id); setAction("deny"); }}>Deny</Button>
              <Button size="sm" variant="warning" onClick={() => { setActiveId(r.id); setAction("escalate"); }}>Escalate</Button>
            </div>
          ) },
        ]}
        rows={rows}
        empty="No items awaiting manual review"
      />

      <Modal
        open={action !== null}
        title={`Confirm ${action}`}
        onClose={() => setAction(null)}
        footer={
          <>
            <Button onClick={() => setAction(null)}>Cancel</Button>
            <Button
              variant={action === "approve" ? "success" : action === "deny" ? "danger" : "warning"}
              onClick={() => {
                if (activeId && action) mut.mutate({ id: activeId, action, note });
              }}
            >
              Confirm
            </Button>
          </>
        }
      >
        <Field label="Note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
      </Modal>
    </Panel>
  );
}