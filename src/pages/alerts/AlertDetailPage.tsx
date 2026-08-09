import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";
import { addressLookup, alertAction, getAlert } from "@/lib/api/kycAlertsPolicy";
import { Panel, Kv } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Badge, StatusBadge } from "@/components/Badge";
import { Modal } from "@/components/Modal";
import { Field, Input, Select, Textarea } from "@/components/Field";
import { Spinner } from "@/components/Spinner";
import { JsonViewer } from "@/components/JsonViewer";
import { AgeIndicator } from "@/components/AgeIndicator";
import { formatTimestamp, formatCurrency, relativeTime } from "@/utils";
import { useToast } from "@/context/ToastContext";

export default function AlertDetailPage() {
  const { id = "" } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: alert, isLoading } = useQuery({
    queryKey: queryKeys.alerts.detail(id),
    queryFn: () => getAlert(id),
    enabled: !!id,
  });

  const [reassignTo, setReassignTo] = useState("");
  const [reassignOpen, setReassignOpen] = useState(false);
  const [action, setAction] = useState<null | "close" | "escalate" | "file_sar">(null);
  const [note, setNote] = useState("");

  const [lookupAddr, setLookupAddr] = useState("");
  const [lookupChain, setLookupChain] = useState("ethereum");
  const [lookupResults, setLookupResults] = useState<{ items: Array<{ id: string; ts: number; vendor: string; result: string; risk: number }> } | null>(null);

  const mut = useMutation({
    mutationFn: alertAction,
    onSuccess: () => {
      toast("Action recorded", "success");
      setAction(null);
      setNote("");
      setReassignOpen(false);
      qc.invalidateQueries({ queryKey: queryKeys.alerts.detail(id) });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Action failed", "error"),
  });

  const lookup = useMutation({
    mutationFn: ({ addr, chain }: { addr: string; chain: string }) => addressLookup(addr, chain),
    onSuccess: (d) => setLookupResults(d),
    onError: (e) => toast(e instanceof Error ? e.message : "Lookup failed", "error"),
  });

  if (isLoading) return <Spinner />;
  if (!alert) return <div className="empty">Alert not found.</div>;

  const runAction = (): void => {
    if (action) mut.mutate({ id, action, note });
  };

  return (
    <div className="stack">
      <div className="row">
        <h1 className="page-title" style={{ margin: 0 }}>
          Alert {alert.id}
        </h1>
        <StatusBadge status={alert.status} />
        <AgeIndicator ts={alert.createdAt} />
      </div>

      <div className="grid-2">
        <Panel title="Address & exposure">
          <Kv
            entries={[
              ["Address", <span className="mono small">{alert.address}</span>],
              ["Chain", alert.chain],
              ["Exposure type", alert.exposureType],
              ["Exposure category", alert.exposureCategory],
              ["Risk score", <Badge kind={alert.riskScore > 0.8 ? "danger" : alert.riskScore > 0.5 ? "warning" : "success"}>{(alert.riskScore * 100).toFixed(0)}%</Badge>],
              ["Vendor", alert.vendor],
              ["Assignee", alert.assignee ?? <span className="muted">unassigned</span>],
              ["Created", formatTimestamp(alert.createdAt)],
            ]}
          />
        </Panel>
        <Panel title="Vendor response">
          <Kv
            entries={[
              ["Matched", alert.vendorResponse.matched ? <Badge kind="danger">yes</Badge> : <Badge kind="success">no</Badge>],
              ["Severity", <Badge kind={alert.vendorResponse.severity === "severe" ? "danger" : alert.vendorResponse.severity === "high" ? "warning" : "muted"}>{alert.vendorResponse.severity}</Badge>],
              ["Details", alert.vendorResponse.details],
            ]}
          />
        </Panel>
      </div>

      <Panel title="Assignment & disposition">
        <div className="row-wrap">
          {alert.assignee === null ? (
            <Button variant="primary" onClick={() => mut.mutate({ id, action: "claim" })}>
              Claim
            </Button>
          ) : (
            <>
              <Button onClick={() => setReassignOpen(true)}>Reassign</Button>
              <Button variant="warning" onClick={() => setAction("close")}>
                Close (false positive)
              </Button>
              <Button variant="danger" onClick={() => setAction("escalate")}>
                Escalate (real hit)
              </Button>
              <Button variant="danger" onClick={() => setAction("file_sar")}>
                File SAR
              </Button>
            </>
          )}
        </div>
      </Panel>

      <Panel title="Linked transactions">
        {alert.linkedTransactions.length === 0 ? (
          <div className="empty">No linked transactions.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Tx ID</th>
                <th>Amount</th>
                <th>Direction</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {alert.linkedTransactions.map((t) => (
                <tr key={t.txId}>
                  <td className="mono small">{t.txId}</td>
                  <td>{formatCurrency(t.amount, t.currency)}</td>
                  <td>{t.direction}</td>
                  <td className="small muted">{relativeTime(t.ts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Webhook event log">
        {alert.webhookEvents.length === 0 ? (
          <div className="empty">No raw webhook events.</div>
        ) : (
          alert.webhookEvents.map((e) => (
            <div key={e.id} className="panel" style={{ padding: "0.5rem" }}>
              <div className="muted small">{formatTimestamp(e.ts)} — {e.vendor}</div>
              <JsonViewer data={e.raw} />
            </div>
          ))
        )}
      </Panel>

      <Panel title="Historical screens">
        {alert.history.length === 0 ? (
          <div className="empty">No prior screens for this address.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Vendor</th>
                <th>Result</th>
                <th>Risk</th>
                <th>When</th>
              </tr>
            </thead>
            <tbody>
              {alert.history.map((h) => (
                <tr key={h.id}>
                  <td>{h.vendor}</td>
                  <td>{h.result}</td>
                  <td>{(h.risk * 100).toFixed(0)}%</td>
                  <td className="small muted">{formatTimestamp(h.ts)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Address lookup tool">
        <div className="row-wrap">
          <Input placeholder="address" value={lookupAddr} onChange={(e) => setLookupAddr(e.target.value)} style={{ flex: 1, minWidth: 280 }} />
          <Select value={lookupChain} onChange={(e) => setLookupChain(e.target.value)} style={{ width: "auto" }}>
            <option value="ethereum">ethereum</option>
            <option value="bitcoin">bitcoin</option>
            <option value="tron">tron</option>
            <option value="solana">solana</option>
          </Select>
          <Button
            variant="primary"
            onClick={() => {
              if (lookupAddr) lookup.mutate({ addr: lookupAddr, chain: lookupChain });
            }}
          >
            Lookup
          </Button>
        </div>
        {lookupResults && (
          <div style={{ marginTop: "0.75rem" }}>
            {lookupResults.items.length === 0 ? (
              <div className="empty">No historical screens for that address.</div>
            ) : (
              <table className="table">
                <thead>
                  <tr>
                    <th>Vendor</th>
                    <th>Result</th>
                    <th>Risk</th>
                    <th>When</th>
                  </tr>
                </thead>
                <tbody>
                  {lookupResults.items.map((h) => (
                    <tr key={h.id}>
                      <td>{h.vendor}</td>
                      <td>{h.result}</td>
                      <td>{(h.risk * 100).toFixed(0)}%</td>
                      <td className="small muted">{formatTimestamp(h.ts)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            )}
          </div>
        )}
      </Panel>

      <Modal
        open={reassignOpen}
        title="Reassign alert"
        onClose={() => setReassignOpen(false)}
        footer={
          <>
            <Button onClick={() => setReassignOpen(false)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (reassignTo) mut.mutate({ id, action: "reassign", assignee: reassignTo });
              }}
            >
              Reassign
            </Button>
          </>
        }
      >
        <Field label="Assignee email">
          <Input value={reassignTo} onChange={(e) => setReassignTo(e.target.value)} placeholder="analyst@example.com" />
        </Field>
      </Modal>

      <Modal
        open={action !== null}
        title={`Confirm ${action ?? ""}`}
        onClose={() => setAction(null)}
        footer={
          <>
            <Button onClick={() => setAction(null)}>Cancel</Button>
            <Button variant={action === "close" ? "warning" : "danger"} onClick={runAction}>
              Confirm
            </Button>
          </>
        }
      >
        <Field label="Note (optional)">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
      </Modal>
    </div>
  );
}