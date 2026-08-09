import { loadConfig } from "@/config";
import { classNames } from "@/utils";

export default function App() {
  const config = loadConfig();
  return (
    <main style={{ padding: "2rem", maxWidth: 760, margin: "0 auto" }}>
      <h1>Middle Office UI</h1>
      <p style={{ color: "var(--muted)" }}>
        Internal compliance and operations console for the crypto on-ramp.
        Built with React (Vite SPA) consuming backend services via REST.
      </p>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Console Modules</h2>
        <ul style={{ lineHeight: 1.7 }}>
          <li>KYC Review Console</li>
          <li>AML / KYT Alert Desk</li>
          <li>Policy / Risk Dashboard</li>
          <li>User Management</li>
          <li>Audit Log Explorer</li>
        </ul>
      </section>

      <section style={{ marginTop: "1.5rem" }}>
        <h2>Backend Services</h2>
        <ul style={{ lineHeight: 1.7 }}>
          <li>
            identity-auth:{" "}
            <code className={classNames("mono")}>{config.identityAuthUrl}</code>
          </li>
          <li>
            onboarding-kyc:{" "}
            <code className={classNames("mono")}>{config.onboardingKycUrl}</code>
          </li>
          <li>
            aml-kyt: <code className={classNames("mono")}>{config.amlKytUrl}</code>
          </li>
          <li>
            policy-risk-engine:{" "}
            <code className={classNames("mono")}>{config.policyEngineUrl}</code>
          </li>
          <li>
            fraud-detection:{" "}
            <code className={classNames("mono")}>{config.fraudUrl}</code>
          </li>
          <li>
            audit-event-log:{" "}
            <code className={classNames("mono")}>{config.auditUrl}</code>
          </li>
        </ul>
      </section>

      <p style={{ marginTop: "1.5rem", color: "var(--muted)" }}>
        Skeleton app. Modules will be added in subsequent stages — see{" "}
        <code>PROJECT_PLAN.md</code>.
      </p>
    </main>
  );
}