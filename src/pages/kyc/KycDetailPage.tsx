import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";
import { getKycApplication, postKycDecision } from "@/lib/api/kycAlertsPolicy";
import { Panel, Kv } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Badge, StatusBadge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Field, Input, Textarea } from "@/components/Field";
import { Spinner } from "@/components/Spinner";
import { formatTimestamp } from "@/utils";
import { useToast } from "@/context/ToastContext";

export default function KycDetailPage() {
  const { id = "" } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: app, isLoading } = useQuery({
    queryKey: queryKeys.kyc.detail(id),
    queryFn: () => getKycApplication(id),
    enabled: !!id,
  });

  const [decision, setDecision] = useState<null | "approve" | "reject" | "resubmit">(null);
  const [reason, setReason] = useState("");
  const [note, setNote] = useState("");
  const [activeDoc, setActiveDoc] = useState(0);

  const mut = useMutation({
    mutationFn: postKycDecision,
    onSuccess: () => {
      toast("Decision recorded", "success");
      setDecision(null);
      setReason("");
      setNote("");
      qc.invalidateQueries({ queryKey: queryKeys.kyc.detail(id) });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Decision failed", "error"),
  });

  if (isLoading) return <Spinner />;
  if (!app) return <div className="empty">Application not found.</div>;

  const doc = app.documents[activeDoc];

  return (
    <div className="stack">
      <div className="row">
        <h1 className="page-title" style={{ margin: 0 }}>
          {app.fullName}
        </h1>
        <StatusBadge status={app.status} />
        <Badge kind="muted">{app.id}</Badge>
      </div>

      <div className="grid-2">
        <Panel title="Personal information">
          <Kv
            entries={[
              ["User ID", app.userId],
              ["Email", app.email],
              ["Full name", app.fullName],
              ["Date of birth", app.dob],
              ["Phone", app.phone],
              ["Address", app.address],
              ["Country", `${app.country} (${app.countryCode})`],
              ["Submitted", formatTimestamp(app.createdAt)],
              ["Updated", formatTimestamp(app.updatedAt)],
            ]}
          />
        </Panel>
        <Panel title="Screening results">
          <Kv
            entries={[
              ["Sanctions", <Badge kind={app.screening.sanctions.hits > 0 ? "danger" : "success"}>{app.screening.sanctions.hits} hits</Badge>],
              ["PEP", <Badge kind={app.screening.pep.hits > 0 ? "warning" : "success"}>{app.screening.pep.hits} hits</Badge>],
              ["Adverse media", <Badge kind={app.screening.adverseMedia.hits > 0 ? "warning" : "success"}>{app.screening.adverseMedia.hits} hits</Badge>],
            ]}
          />
        </Panel>
      </div>

      <Panel
        title="Documents"
        actions={
          <div className="row">
            {app.documents.map((d, i) => (
              <Button key={d.id} size="sm" variant={i === activeDoc ? "primary" : "default"} onClick={() => setActiveDoc(i)}>
                {d.type}
              </Button>
            ))}
          </div>
        }
      >
        {doc ? (
          <div>
            <div className="muted small">{doc.filename} ({doc.contentType})</div>
            <div style={{ marginTop: "0.5rem" }}>
              {doc.contentType.startsWith("image/") ? (
                <img src={doc.url} alt={doc.filename} style={{ maxWidth: "100%", border: "1px solid var(--border)", borderRadius: 6 }} />
              ) : doc.contentType === "application/pdf" ? (
                <iframe src={doc.url} title={doc.filename} style={{ width: "100%", height: 480, border: "1px solid var(--border)", borderRadius: 6 }} />
              ) : (
                <a href={doc.url} target="_blank" rel="noreferrer">
                  Open {doc.filename}
                </a>
              )}
            </div>
          </div>
        ) : (
          <div className="empty">No documents submitted.</div>
        )}
      </Panel>

      <Panel title="Liveness check">
        {app.livenessVideoUrl ? (
          <video src={app.livenessVideoUrl} controls style={{ width: "100%", maxWidth: 480, border: "1px solid var(--border)", borderRadius: 6 }} />
        ) : (
          <div className="empty">No liveness video available.</div>
        )}
      </Panel>

      <Panel title="Vendor result reconciliation">
        {app.vendorResults.length === 0 ? (
          <div className="empty">No vendor results yet.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Status</th>
                <th>Score</th>
                <th>Result</th>
                <th>At</th>
              </tr>
            </thead>
            <tbody>
              {app.vendorResults.map((v, i) => (
                <tr key={i}>
                  <td>{v.vendor}</td>
                  <td>
                    <StatusBadge status={v.status} />
                  </td>
                  <td>{(v.score * 100).toFixed(0)}%</td>
                  <td className="mono small">{v.result}</td>
                  <td className="small muted">{formatTimestamp(v.createdAt)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Audit trail">
        {app.audit.length === 0 ? (
          <div className="empty">No audit events.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {app.audit.map((a) => (
              <li key={a.id} className="small">
                <strong>{a.actor}</strong> — {a.action} <span className="muted">({formatTimestamp(a.ts)})</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Panel title="Decision actions">
        <div className="row-wrap">
          <Button variant="success" onClick={() => setDecision("approve")}>
            Approve
          </Button>
          <Button variant="danger" onClick={() => setDecision("reject")}>
            Reject
          </Button>
          <Button variant="warning" onClick={() => setDecision("resubmit")}>
            Request resubmission
          </Button>
        </div>
      </Panel>

      <Modal
        open={decision !== null}
        title="Record decision"
        onClose={() => setDecision(null)}
        footer={
          <>
            <Button onClick={() => setDecision(null)}>Cancel</Button>
            <Button
              variant={decision === "approve" ? "success" : decision === "reject" ? "danger" : "warning"}
              onClick={() => {
                if (decision) {
                  mut.mutate({ id, decision, reason, note });
                }
              }}
            >
              Confirm {decision}
            </Button>
          </>
        }
      >
        <Field label="Reason">
          <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="brief reason" />
        </Field>
        <Field label="Internal note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
        <div className="muted small">Decision will be recorded in the audit trail.</div>
      </Modal>
    </div>
  );
}