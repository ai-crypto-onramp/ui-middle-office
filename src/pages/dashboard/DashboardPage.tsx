import { useQuery } from "@tanstack/react-query";
import { queryKeys } from "@/lib/queryKeys";
import { listKycApplications, listAlerts, listReviewQueue, listFraudCases } from "@/lib/api/kycAlertsPolicy";
import { Panel } from "@/components/Panel";
import { StatusBadge } from "@/components/Badge";
import { Link } from "react-router-dom";
import { formatTimestamp } from "@/utils";
import { useAuth } from "@/context/AuthContext";

export default function DashboardPage() {
  const { user } = useAuth();
  const { data: kyc } = useQuery({ queryKey: queryKeys.kyc.list({}), queryFn: () => listKycApplications({}) });
  const { data: alerts } = useQuery({ queryKey: queryKeys.alerts.list({}), queryFn: () => listAlerts({}) });
  const { data: review } = useQuery({ queryKey: queryKeys.policy.reviewQueue({}), queryFn: () => listReviewQueue({}) });
  const { data: cases } = useQuery({ queryKey: queryKeys.policy.cases({}), queryFn: () => listFraudCases({}) });

  const pendingKyc = kyc?.items.filter((a) => a.status === "pending_review").length ?? 0;
  const openAlerts = alerts?.items.filter((a) => a.status === "open").length ?? 0;
  const pendingReview = review?.items.filter((r) => r.status === "pending").length ?? 0;
  const openCases = cases?.filter((c) => c.status === "open").length ?? 0;

  const stats = [
    { label: "Pending KYC", value: pendingKyc, link: "/kyc", color: "var(--warning)" },
    { label: "Open Alerts", value: openAlerts, link: "/alerts", color: "var(--danger)" },
    { label: "Manual Review Queue", value: pendingReview, link: "/policy", color: "var(--accent)" },
    { label: "Open Fraud Cases", value: openCases, link: "/policy", color: "var(--warning)" },
  ];

  return (
    <div className="stack">
      <h1 className="page-title">Welcome, {user?.name ?? "Operator"}</h1>
      <div className="grid-4">
        {stats.map((s) => (
          <Link key={s.label} to={s.link} className="card" style={{ textDecoration: "none", color: "inherit" }}>
            <div className="muted small">{s.label}</div>
            <div style={{ fontSize: "2rem", fontWeight: 700, color: s.color }}>{s.value}</div>
          </Link>
        ))}
      </div>

      <Panel title="Recent KYC applications">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Applicant</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(kyc?.items ?? []).slice(0, 5).map((a) => (
              <tr key={a.id}>
                <td>
                  <Link to={`/kyc/${a.id}`}>{a.id}</Link>
                </td>
                <td>{a.fullName}</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="small muted">{formatTimestamp(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>

      <Panel title="Recent alerts">
        <table className="table">
          <thead>
            <tr>
              <th>ID</th>
              <th>Address</th>
              <th>Risk</th>
              <th>Status</th>
              <th>Created</th>
            </tr>
          </thead>
          <tbody>
            {(alerts?.items ?? []).slice(0, 5).map((a) => (
              <tr key={a.id}>
                <td>
                  <Link to={`/alerts/${a.id}`}>{a.id}</Link>
                </td>
                <td className="mono small">{a.address.slice(0, 12)}…</td>
                <td>{(a.riskScore * 100).toFixed(0)}%</td>
                <td>
                  <StatusBadge status={a.status} />
                </td>
                <td className="small muted">{formatTimestamp(a.createdAt)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </Panel>
    </div>
  );
}