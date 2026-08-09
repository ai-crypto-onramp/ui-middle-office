import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { fraudCaseAction, listFraudCases } from "@/lib/api/kycAlertsPolicy";
import { Panel } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Field, Input, Textarea } from "@/components/Field";
import { StatusBadge } from "@/components/Badge";
import { Spinner } from "@/components/Spinner";
import { formatTimestamp, relativeTime } from "@/utils";
import { useToast } from "@/context/ToastContext";

export function FraudCasesTab() {
  const { data, isLoading } = useQuery({ queryKey: queryKeys.policy.cases({}), queryFn: () => listFraudCases({}) });
  const { toast } = useToast();
  const qc = useQueryClient();
  const [openNew, setOpenNew] = useState(false);
  const [noteFor, setNoteFor] = useState<string | null>(null);
  const [note, setNote] = useState("");
  const [newUserId, setNewUserId] = useState("user-501");
  const [newSummary, setNewSummary] = useState("");
  const [newNote, setNewNote] = useState("");

  const openMut = useMutation({
    mutationFn: fraudCaseAction,
    onSuccess: () => {
      toast("Case opened", "success");
      setOpenNew(false);
      setNewSummary("");
      setNewNote("");
      qc.invalidateQueries({ queryKey: queryKeys.policy.cases({}) });
    },
  });
  const noteMut = useMutation({
    mutationFn: fraudCaseAction,
    onSuccess: () => {
      toast("Note added", "success");
      setNoteFor(null);
      setNote("");
      qc.invalidateQueries({ queryKey: queryKeys.policy.cases({}) });
    },
  });
  const closeMut = useMutation({
    mutationFn: fraudCaseAction,
    onSuccess: () => {
      toast("Case closed", "success");
      qc.invalidateQueries({ queryKey: queryKeys.policy.cases({}) });
    },
  });

  if (isLoading) return <Spinner />;

  return (
    <div className="stack">
      <Panel title="Fraud case manager" actions={<Button variant="primary" onClick={() => setOpenNew(true)}>Open case</Button>}>
        {data && data.length === 0 ? (
          <div className="empty">No open fraud cases.</div>
        ) : (
          <div className="stack">
            {data?.map((c) => (
              <div key={c.id} className="panel" style={{ padding: "0.75rem" }}>
                <div className="row" style={{ justifyContent: "space-between" }}>
                  <strong>{c.id}</strong>
                  <StatusBadge status={c.status} />
                </div>
                <KvInline entries={[["User", c.userId], ["Opened by", c.openedBy], ["Opened", relativeTime(c.openedAt)], ["Summary", c.summary]]} />
                <div style={{ marginTop: "0.5rem" }}>
                  {c.notes.map((n, i) => (
                    <div key={i} className="small" style={{ borderBottom: "1px solid var(--border)", padding: "0.3rem 0" }}>
                      <strong>{n.author}</strong> <span className="muted">{formatTimestamp(n.ts)}</span>: {n.text}
                    </div>
                  ))}
                </div>
                <div className="row" style={{ marginTop: "0.5rem" }}>
                  <Button size="sm" onClick={() => setNoteFor(c.id)}>Add note</Button>
                  <Button size="sm" variant="danger" onClick={() => closeMut.mutate({ id: c.id, action: "close" })} disabled={c.status === "closed"}>
                    Close case
                  </Button>
                </div>
              </div>
            ))}
          </div>
        )}
      </Panel>

      <Modal
        open={openNew}
        title="Open new fraud case"
        onClose={() => setOpenNew(false)}
        footer={
          <>
            <Button onClick={() => setOpenNew(false)}>Cancel</Button>
            <Button variant="primary" onClick={() => openMut.mutate({ id: "new", action: "open", userId: newUserId, summary: newSummary, note: newNote })}>
              Open case
            </Button>
          </>
        }
      >
        <Field label="User ID">
          <Input value={newUserId} onChange={(e) => setNewUserId(e.target.value)} />
        </Field>
        <Field label="Summary">
          <Input value={newSummary} onChange={(e) => setNewSummary(e.target.value)} placeholder="brief summary" />
        </Field>
        <Field label="Opening note">
          <Textarea value={newNote} onChange={(e) => setNewNote(e.target.value)} rows={3} />
        </Field>
      </Modal>

      <Modal
        open={noteFor !== null}
        title={`Add note to ${noteFor}`}
        onClose={() => setNoteFor(null)}
        footer={
          <>
            <Button onClick={() => setNoteFor(null)}>Cancel</Button>
            <Button variant="primary" onClick={() => { if (noteFor) noteMut.mutate({ id: noteFor, action: "note", note }); }}>Add</Button>
          </>
        }
      >
        <Field label="Note">
          <Textarea value={note} onChange={(e) => setNote(e.target.value)} rows={3} />
        </Field>
      </Modal>
    </div>
  );
}

function KvInline({ entries }: { entries: Array<[string, React.ReactNode]> }) {
  return (
    <div className="small" style={{ display: "flex", flexWrap: "wrap", gap: "0.5rem 1.5rem", marginTop: "0.3rem" }}>
      {entries.map(([k, v]) => (
        <span key={k}>
          <span className="muted">{k}:</span> {v ?? "—"}
        </span>
      ))}
    </div>
  );
}