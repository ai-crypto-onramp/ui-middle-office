import { useState } from "react";
import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listDecisionTrail, listPolicyRules } from "@/lib/api/kycAlertsPolicy";
import { Panel } from "@/components/Panel";
import { JsonViewer } from "@/components/JsonViewer";
import { Badge } from "@/components/Badge";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { formatTimestamp } from "@/utils";
import { Spinner } from "@/components/Spinner";

export function PolicyRulesTab() {
  const { data: rules, isLoading } = useQuery({ queryKey: queryKeys.policy.rules, queryFn: listPolicyRules });
  const [txId, setTxId] = useState("");
  const [lookupTx, setLookupTx] = useState("");

  const { data: trail } = useQuery({
    queryKey: queryKeys.policy.decisions(lookupTx),
    queryFn: () => listDecisionTrail(lookupTx),
    enabled: !!lookupTx,
  });

  return (
    <div className="stack">
      <Panel title="Active policy rules (OPA bundle)">
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>ID</th>
                <th>Name</th>
                <th>Kind</th>
                <th>Enabled</th>
                <th>Definition</th>
              </tr>
            </thead>
            <tbody>
              {rules?.map((r) => (
                <tr key={r.id}>
                  <td className="mono small">{r.id}</td>
                  <td>
                    <strong>{r.name}</strong>
                  </td>
                  <td>
                    <Badge kind="info">{r.kind}</Badge>
                  </td>
                  <td>{r.enabled ? <Badge kind="success">on</Badge> : <Badge kind="muted">off</Badge>}</td>
                  <td>
                    <JsonViewer data={r.definition} />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Decision audit trail per transaction">
        <div className="row">
          <Field label="Transaction ID">
            <Input value={txId} onChange={(e) => setTxId(e.target.value)} placeholder="tx-99006" />
          </Field>
          <Button variant="primary" onClick={() => setLookupTx(txId)} style={{ marginTop: "1.4rem" }}>
            Load
          </Button>
        </div>
        {trail && (
          <div style={{ marginTop: "0.75rem" }}>
            <div className="row">
              <span>
                Outcome: <Badge kind={trail.outcome === "approved" ? "success" : "warning"}>{trail.outcome}</Badge>
              </span>
              <span>Score: {trail.score.toFixed(2)}</span>
            </div>
            <table className="table" style={{ marginTop: "0.5rem" }}>
              <thead>
                <tr>
                  <th>Rule</th>
                  <th>Result</th>
                  <th>When</th>
                </tr>
              </thead>
              <tbody>
                {trail.events.map((e, i) => (
                  <tr key={i}>
                    <td className="mono small">{e.rule}</td>
                    <td>{e.result}</td>
                    <td className="small muted">{formatTimestamp(e.ts)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
}