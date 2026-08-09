import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { createVelocityOverride, getFraudTimeline, listVelocityOverrides, removeVelocityOverride } from "@/lib/api/kycAlertsPolicy";
import { Panel, Kv } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Field, Input } from "@/components/Field";
import { Spinner } from "@/components/Spinner";
import { Badge } from "@/components/Badge";
import { formatTimestamp, formatCurrency } from "@/utils";
import { useToast } from "@/context/ToastContext";

export function VelocityTab() {
  const [userId, setUserId] = useState("user-501");
  const [activeUser, setActiveUser] = useState("user-501");
  const [cap, setCap] = useState(25000);
  const [days, setDays] = useState(1);
  const [reason, setReason] = useState("");
  const { toast } = useToast();
  const qc = useQueryClient();

  const { data: overrides } = useQuery({ queryKey: queryKeys.policy.velocityOverrides(activeUser), queryFn: () => listVelocityOverrides(activeUser) });
  const { data: timeline } = useQuery({ queryKey: queryKeys.policy.fraudTimeline(activeUser), queryFn: () => getFraudTimeline(activeUser) });

  const addMut = useMutation({
    mutationFn: createVelocityOverride,
    onSuccess: () => {
      toast("Override created", "success");
      setReason("");
      qc.invalidateQueries({ queryKey: queryKeys.policy.velocityOverrides(activeUser) });
    },
  });
  const rmMut = useMutation({
    mutationFn: removeVelocityOverride,
    onSuccess: () => {
      toast("Override removed", "success");
      qc.invalidateQueries({ queryKey: queryKeys.policy.velocityOverrides(activeUser) });
    },
  });

  return (
    <div className="stack">
      <Panel title="Velocity limit overrides">
        <div className="row">
          <Field label="User ID">
            <Input value={userId} onChange={(e) => setUserId(e.target.value)} placeholder="user-501" />
          </Field>
          <Button variant="primary" style={{ marginTop: "1.4rem" }} onClick={() => setActiveUser(userId)}>
            Load
          </Button>
        </div>

        <h4 className="section-title" style={{ marginTop: "1rem" }}>
          Active overrides for {activeUser}
        </h4>
        {(overrides ?? []).length === 0 ? (
          <div className="empty">No active overrides.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Daily cap</th>
                <th>Expires</th>
                <th>Reason</th>
                <th>Created by</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {overrides?.map((o) => (
                <tr key={o.id}>
                  <td>{formatCurrency(o.dailyCapUsd)}</td>
                  <td className="small">{formatTimestamp(o.expiresAt)}</td>
                  <td>{o.reason}</td>
                  <td className="small">{o.createdBy}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => rmMut.mutate(o.id)}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}

        <h4 className="section-title" style={{ marginTop: "1rem" }}>
          Create new override
        </h4>
        <div className="row-wrap">
          <Field label="Daily cap (USD)">
            <Input type="number" value={cap} onChange={(e) => setCap(Number(e.target.value))} style={{ width: 140 }} />
          </Field>
          <Field label="Expires (days)">
            <Input type="number" min={1} value={days} onChange={(e) => setDays(Number(e.target.value))} style={{ width: 100 }} />
          </Field>
          <Field label="Reason">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} style={{ minWidth: 240 }} />
          </Field>
          <Button
            variant="primary"
            style={{ marginTop: "1.4rem" }}
            onClick={() => addMut.mutate({ userId: activeUser, dailyCapUsd: cap, expiresAt: Date.now() + days * 24 * 3600 * 1000, reason })}
          >
            Create override
          </Button>
        </div>
      </Panel>

      <Panel title={`Fraud score timeline — ${activeUser}`}>
        {timeline ? (
          <div className="stack">
            <Kv
              entries={timeline.map((p) => [
                formatTimestamp(p.ts),
                <span className="row">
                  <Badge kind={p.score > 0.7 ? "danger" : p.score > 0.4 ? "warning" : "success"}>{(p.score * 100).toFixed(0)}%</Badge>
                  <span className="muted small">{p.label}</span>
                </span>,
              ])}
            />
            <div className="muted small">Factors: chargebacks / velocity / behavioral — see timeline rows below.</div>
            <table className="table">
              <thead>
                <tr>
                  <th>When</th>
                  <th>Score</th>
                  <th>Label</th>
                  <th>Chargebacks</th>
                  <th>Velocity</th>
                  <th>Behavioral</th>
                </tr>
              </thead>
              <tbody>
                {timeline.map((p, i) => (
                  <tr key={i}>
                    <td className="small muted">{formatTimestamp(p.ts)}</td>
                    <td>{(p.score * 100).toFixed(0)}%</td>
                    <td>{p.label}</td>
                    <td>{p.factors.chargebacks}</td>
                    <td>{p.factors.velocity}</td>
                    <td>{p.factors.behavioral}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <Spinner />
        )}
      </Panel>
    </div>
  );
}