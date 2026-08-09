import { useState } from "react";
import { PolicyRulesTab } from "./PolicyRulesTab";
import { ReviewQueueTab } from "./ReviewQueueTab";
import { WhitelistTab } from "./WhitelistTab";
import { VelocityTab } from "./VelocityTab";
import { FraudCasesTab } from "./FraudCasesTab";
import { classNames } from "@/utils";

const TABS = [
  { key: "rules", label: "Policy rules" },
  { key: "review", label: "Manual review queue" },
  { key: "whitelist", label: "Whitelist" },
  { key: "velocity", label: "Velocity overrides" },
  { key: "fraud", label: "Fraud cases" },
] as const;

type TabKey = (typeof TABS)[number]["key"];

export default function PolicyPage() {
  const [tab, setTab] = useState<TabKey>("rules");
  return (
    <div className="stack">
      <h1 className="page-title">Policy / Risk Dashboard</h1>
      <div className="row" style={{ borderBottom: "1px solid var(--border)" }}>
        {TABS.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={classNames("btn", "btn-sm", tab === t.key && "btn-primary")}
            style={{ borderRadius: "6px 6px 0 0", borderBottom: "none" }}
          >
            {t.label}
          </button>
        ))}
      </div>
      {tab === "rules" && <PolicyRulesTab />}
      {tab === "review" && <ReviewQueueTab />}
      {tab === "whitelist" && <WhitelistTab />}
      {tab === "velocity" && <VelocityTab />}
      {tab === "fraud" && <FraudCasesTab />}
    </div>
  );
}