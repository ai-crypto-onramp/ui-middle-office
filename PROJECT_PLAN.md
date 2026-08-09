# Project Plan — Middle Office UI

Internal compliance and operations console for the crypto on-ramp.
Built in TypeScript with React (Vite SPA), consuming the backend
services directly via REST. Covers KYC review, AML/KYT alert
management, policy/risk decisioning, fraud case management, user
management, and audit log exploration.

## Stage 1 — Project Scaffolding & Design System

**Goal:** Stand up the React SPA with CI, linting, and a base
component library.

**Tasks:**
- [ ] Initialize Vite + React 19 + TypeScript project.
- [ ] Add Tailwind CSS + shadcn/ui for the component library.
- [ ] Add TanStack Query for server state management.
- [ ] Add TanStack Router for file-based routing.
- [ ] Configure CI: lint, typecheck, build, test (Vitest).
- [ ] Add Dockerfile (multi-stage build, nginx serving).
- [x] Codecov badge and reporting wired.
- [ ] Set up environment variable management (.env.example).

**Acceptance criteria:**
- `npm run build` produces a production bundle.
- `npm run lint` and `npm run typecheck` pass with zero errors.
- Docker image builds and serves the app on port 3000.

## Stage 2 — Auth & RBAC Gate

**Goal:** Internal SSO login and role-based access control.

**Tasks:**
- [ ] Login page (internal SSO / OAuth2 OIDC against identity-auth).
- [ ] Role-based route guards (compliance, support, ops, admin).
- [ ] Session management with token refresh.
- [ ] Permission-aware navigation (hide menu items the user can't access).

**Acceptance criteria:**
- Only authenticated internal users can access the console.
- Menu items and actions are gated by the user's role.

## Stage 3 — KYC Review Console

**Goal:** Queue-based review of KYC applications (onboarding-kyc).

**Tasks:**
- [ ] Pending applications queue with filters (status, date, country).
- [ ] Application detail view: personal info, document viewer (PDF/image preview).
- [ ] Liveness check video playback.
- [ ] Vendor (Onfido/Sumsub) result reconciliation panel.
- [ ] Decision actions: approve, reject (with reason), request resubmission.
- [ ] Screening results (sanctions/PEP hits) display.
- [ ] Audit trail per application (who decided what, when).
- [ ] Bulk actions (approve/reject selected).

**Acceptance criteria:**
- Reviewer can see the full application, make a decision, and it's recorded in the audit log.
- Queue filters and pagination work for large volumes.

## Stage 4 — AML / KYT Alert Desk

**Goal:** Alert triage and disposition for transaction screening
(aml-kyt-screening).

**Tasks:**
- [ ] Alert queue with filters (exposure type, status, age, assignee).
- [ ] Alert detail: address risk score, exposure category, vendor response, linked transactions.
- [ ] Assignment workflow (claim, reassign).
- [ ] Disposition actions: close (false positive), escalate (real hit), file SAR.
- [ ] Webhook event log (TRM/Chainalysis raw events per alert).
- [ ] Address lookup tool (search by address/chain, show historical screens).
- [ ] Alert aging indicators (color-coded by time since detection).

**Acceptance criteria:**
- Analysts can triage alerts from queue to disposition.
- All actions are audit-logged with user and timestamp.

## Stage 5 — Policy / Risk Dashboard

**Goal:** Policy rule management and manual review queue
(policy-risk-engine, fraud-detection).

**Tasks:**
- [ ] Active policy rules viewer (OPA bundle contents, per-tier caps, velocity limits).
- [ ] Decision audit trail per transaction (which rules fired, what score, what outcome).
- [ ] Manual review queue: approve, deny, escalate with notes.
- [ ] Whitelist management (add, remove, search addresses/users).
- [ ] Velocity limit override panel (temporary cap changes per user).
- [ ] Fraud score timeline per user (chargeback history, velocity anomalies, behavioral flags).
- [ ] Fraud case manager: open case, add notes, investigate, close.

**Acceptance criteria:**
- Operators can view active policies and per-transaction decision trails.
- Manual review queue supports full approve/deny/escalate workflow.

## Stage 6 — User Management

**Goal:** Admin tools for managing user accounts (identity-auth).

**Tasks:**
- [ ] User search (by email, user ID, status).
- [ ] User detail view: profile, status, sessions, MFA factors, API keys, role bindings.
- [ ] Actions: lock/unlock, reset password (send reset email), revoke sessions, revoke API keys.
- [ ] Role binding management (assign/revoke roles per user).
- [ ] Audit log per user (all actions taken on this account).

**Acceptance criteria:**
- Admins can find any user and perform management actions.
- All admin actions are audit-logged.

## Stage 7 — Audit Log Explorer

**Goal:** Searchable audit trail for compliance and incident forensics
(audit-event-log).

**Tasks:**
- [ ] Full-text search by tx_id, user_id, event type, timestamp range.
- [ ] Event detail view with full payload (JSON viewer).
- [ ] Chain integrity verification badge (verified vs broken).
- [ ] Export results as CSV / JSON for regulator requests.
- [ ] Saved searches / bookmarks for common queries.

**Acceptance criteria:**
- Compliance officers can search and export audit events for any time period.
- Chain integrity is verified and displayed.

## Stage 8 — Real-Time Updates & Observability

**Goal:** Live updates and operational monitoring.

**Tasks:**
- [ ] WebSocket connection for real-time queue updates (new alerts, new KYC applications).
- [ ] Toast notifications for new items in monitored queues.
- [ ] Dark mode support.
- [ ] OpenTelemetry client-side tracing.
- [ ] Error boundary with internal incident reporting.

**Acceptance criteria:**
- Queues update in real-time without page refresh.
- All errors are caught and reported.

## Stage 9 — E2E Tests & Deployment

**Goal:** Tests and deployment pipeline.

**Tasks:**
- [ ] Playwright E2E tests for critical review workflows.
- [ ] Add to `.github/docker-compose.yml` for the integration stack.
- [ ] Hurl smoke tests against the running app.
- [ ] Deployment config (containerized, behind the API gateway).

**Acceptance criteria:**
- E2E tests cover KYC review, alert triage, and user management workflows.
- App runs in docker-compose alongside the backend services.