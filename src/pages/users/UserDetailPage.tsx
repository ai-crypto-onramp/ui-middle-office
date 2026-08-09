import { useState } from "react";
import { useMutation, useQuery, useQueryClient } from "@tanstack/react-query";
import { useParams } from "react-router-dom";
import { queryKeys } from "@/lib/queryKeys";
import { getUser, userAction } from "@/lib/api/usersAudit";
import { Panel, Kv } from "@/components/Panel";
import { Button } from "@/components/Button";
import { Modal } from "@/components/Modal";
import { Field, Select } from "@/components/Field";
import { Badge, StatusBadge } from "@/components/Badge";
import { Spinner } from "@/components/Spinner";
import { formatTimestamp, relativeTime } from "@/utils";
import { useToast } from "@/context/ToastContext";

export default function UserDetailPage() {
  const { id = "" } = useParams();
  const { toast } = useToast();
  const qc = useQueryClient();
  const { data: user, isLoading } = useQuery({ queryKey: queryKeys.users.detail(id), queryFn: () => getUser(id), enabled: !!id });
  const [role, setRole] = useState("support");
  const [roleOpen, setRoleOpen] = useState<null | "assign" | "revoke">(null);
  const [resetOpen, setResetOpen] = useState(false);

  const mut = useMutation({
    mutationFn: userAction,
    onSuccess: () => {
      toast("Action completed", "success");
      setRoleOpen(null);
      setResetOpen(false);
      qc.invalidateQueries({ queryKey: queryKeys.users.detail(id) });
    },
    onError: (e) => toast(e instanceof Error ? e.message : "Action failed", "error"),
  });

  if (isLoading) return <Spinner />;
  if (!user) return <div className="empty">User not found.</div>;

  return (
    <div className="stack">
      <div className="row">
        <h1 className="page-title" style={{ margin: 0 }}>
          {user.name}
        </h1>
        <StatusBadge status={user.status} />
        <Badge kind="muted">{user.id}</Badge>
      </div>

      <div className="grid-2">
        <Panel title="Profile">
          <Kv
            entries={[
              ["Email", user.email],
              ["User ID", user.id],
              ["Status", <StatusBadge status={user.status} />],
              ["KYC", <StatusBadge status={user.kycStatus} />],
              ["Roles", user.roles.join(", ")],
              ["Created", formatTimestamp(user.createdAt)],
            ]}
          />
          <div className="row" style={{ marginTop: "0.75rem" }}>
            {user.status === "active" ? (
              <Button variant="danger" onClick={() => mut.mutate({ userId: id, action: "lock" })}>
                Lock
              </Button>
            ) : (
              <Button variant="success" onClick={() => mut.mutate({ userId: id, action: "unlock" })}>
                Unlock
              </Button>
            )}
            <Button variant="warning" onClick={() => setResetOpen(true)}>
              Reset password
            </Button>
            <Button onClick={() => mut.mutate({ userId: id, action: "revoke_sessions" })}>Revoke sessions</Button>
          </div>
        </Panel>

        <Panel title="MFA factors">
          {user.mfaFactors.length === 0 ? (
            <div className="empty">No MFA factors.</div>
          ) : (
            <table className="table">
              <thead>
                <tr>
                  <th>Type</th>
                  <th>Enabled</th>
                  <th>Added</th>
                </tr>
              </thead>
              <tbody>
                {user.mfaFactors.map((m, i) => (
                  <tr key={i}>
                    <td>{m.type}</td>
                    <td>{m.enabled ? <Badge kind="success">on</Badge> : <Badge kind="muted">off</Badge>}</td>
                    <td className="small muted">{formatTimestamp(m.addedAt)}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </Panel>
      </div>

      <Panel title="Sessions">
        {user.sessions.length === 0 ? (
          <div className="empty">No active sessions.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Device</th>
                <th>IP</th>
                <th>Last seen</th>
              </tr>
            </thead>
            <tbody>
              {user.sessions.map((s) => (
                <tr key={s.id}>
                  <td>{s.device}</td>
                  <td className="mono small">{s.ip}</td>
                  <td className="small">{relativeTime(s.lastSeen)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="API keys">
        {user.apiKeys.length === 0 ? (
          <div className="empty">No API keys.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Name</th>
                <th>Created</th>
                <th>Last used</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {user.apiKeys.map((k) => (
                <tr key={k.id}>
                  <td>{k.name}</td>
                  <td className="small muted">{formatTimestamp(k.createdAt)}</td>
                  <td className="small">{relativeTime(k.lastUsed)}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => mut.mutate({ userId: id, action: "revoke_api_key", apiKeyId: k.id })}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Role bindings" actions={<Button size="sm" onClick={() => setRoleOpen("assign")}>Assign role</Button>}>
        {user.roleBindings.length === 0 ? (
          <div className="empty">No role bindings.</div>
        ) : (
          <table className="table">
            <thead>
              <tr>
                <th>Role</th>
                <th>Scope</th>
                <th>Assigned</th>
                <th></th>
              </tr>
            </thead>
            <tbody>
              {user.roleBindings.map((r, i) => (
                <tr key={i}>
                  <td>
                    <Badge kind="info">{r.role}</Badge>
                  </td>
                  <td className="mono small">{r.scope}</td>
                  <td className="small muted">{formatTimestamp(r.assignedAt)}</td>
                  <td>
                    <Button size="sm" variant="danger" onClick={() => mut.mutate({ userId: id, action: "revoke_role", role: r.role })}>
                      Revoke
                    </Button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </Panel>

      <Panel title="Audit log">
        {user.audit.length === 0 ? (
          <div className="empty">No audit events.</div>
        ) : (
          <ul style={{ margin: 0, paddingLeft: "1.2rem" }}>
            {user.audit.map((a) => (
              <li key={a.id} className="small">
                <strong>{a.actor}</strong> — {a.action} <span className="muted">({formatTimestamp(a.ts)})</span>
              </li>
            ))}
          </ul>
        )}
      </Panel>

      <Modal
        open={roleOpen !== null}
        title={roleOpen === "assign" ? "Assign role" : "Revoke role"}
        onClose={() => setRoleOpen(null)}
        footer={
          <>
            <Button onClick={() => setRoleOpen(null)}>Cancel</Button>
            <Button
              variant="primary"
              onClick={() => {
                if (roleOpen === "assign") mut.mutate({ userId: id, action: "assign_role", role, scope: "global" });
                else mut.mutate({ userId: id, action: "revoke_role", role });
              }}
            >
              {roleOpen === "assign" ? "Assign" : "Revoke"}
            </Button>
          </>
        }
      >
        <Field label="Role">
          <Select value={role} onChange={(e) => setRole(e.target.value)}>
            <option value="customer">customer</option>
            <option value="support">support</option>
            <option value="ops">ops</option>
            <option value="compliance">compliance</option>
            <option value="admin">admin</option>
          </Select>
        </Field>
      </Modal>

      <Modal
        open={resetOpen}
        title="Reset password"
        onClose={() => setResetOpen(false)}
        footer={
          <>
            <Button onClick={() => setResetOpen(false)}>Cancel</Button>
            <Button variant="warning" onClick={() => mut.mutate({ userId: id, action: "reset_password" })}>
              Send reset email
            </Button>
          </>
        }
      >
        <div className="muted small">A password reset link will be emailed to {user.email}.</div>
      </Modal>
    </div>
  );
}