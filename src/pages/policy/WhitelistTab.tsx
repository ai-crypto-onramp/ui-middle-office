import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { addWhitelist, listWhitelist, removeWhitelist } from "@/lib/api/kycAlertsPolicy";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Field, Input, Select } from "@/components/Field";
import { Spinner } from "@/components/Spinner";
import { formatTimestamp } from "@/utils";
import { useToast } from "@/context/ToastContext";
import { Badge } from "@/components/Badge";

export function WhitelistTab() {
  const [q, setQ] = useState("");
  const { data, isLoading } = useQuery({ queryKey: queryKeys.policy.whitelist({ q }), queryFn: () => listWhitelist({ q }) });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [kind, setKind] = useState<"address" | "user">("address");
  const [value, setValue] = useState("");
  const [chain, setChain] = useState("");
  const [reason, setReason] = useState("");

  const addMut = useMutation({
    mutationFn: addWhitelist,
    onSuccess: () => {
      toast("Added to whitelist", "success");
      setValue("");
      setReason("");
      qc.invalidateQueries({ queryKey: queryKeys.policy.whitelist({}) });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Add failed", "error"),
  });
  const rmMut = useMutation({
    mutationFn: removeWhitelist,
    onSuccess: () => {
      toast("Removed", "success");
      qc.invalidateQueries({ queryKey: queryKeys.policy.whitelist({}) });
    },
  });

  return (
    <div className="stack">
      <Panel title="Add whitelist entry">
        <div className="row-wrap">
          <Field label="Kind">
            <Select value={kind} onChange={(e) => setKind(e.target.value as "address" | "user")} style={{ width: "auto" }}>
              <option value="address">address</option>
              <option value="user">user</option>
            </Select>
          </Field>
          <Field label={kind === "address" ? "Address" : "User ID"}>
            <Input value={value} onChange={(e) => setValue(e.target.value)} placeholder={kind === "address" ? "0x…" : "user-…"} style={{ minWidth: 280 }} />
          </Field>
          {kind === "address" && (
            <Field label="Chain">
              <Input value={chain} onChange={(e) => setChain(e.target.value)} placeholder="ethereum" style={{ width: 120 }} />
            </Field>
          )}
          <Field label="Reason">
            <Input value={reason} onChange={(e) => setReason(e.target.value)} placeholder="why" style={{ minWidth: 200 }} />
          </Field>
          <Button variant="primary" style={{ marginTop: "1.4rem" }} onClick={() => addMut.mutate({ kind, value, chain: chain || undefined, reason })}>
            Add
          </Button>
        </div>
      </Panel>

      <Panel title={`Whitelist ${q ? `(${q})` : ""}`}>
        <Input placeholder="filter by value or reason" value={q} onChange={(e) => setQ(e.target.value)} style={{ marginBottom: "0.75rem" }} />
        {isLoading ? (
          <Spinner />
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Kind</th>
                <th>Value</th>
                <th>Chain</th>
                <th>Reason</th>
                <th>Added</th>
                <th>By</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {data?.map((w) => (
                <tr key={w.id}>
                  <td>
                    <Badge kind="info">{w.kind}</Badge>
                  </td>
                  <td className="mono small">{w.value}</td>
                  <td>{w.chain ?? "—"}</td>
                  <td>{w.reason}</td>
                  <td className="small muted">{formatTimestamp(w.createdAt)}</td>
                  <td className="small">{w.createdBy}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => rmMut.mutate(w.id)}>
                      Remove
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>
    </div>
  );
}