# Middle Office UI

![CI](https://github.com/ai-crypto-onramp/ui-middle-office/actions/workflows/ci.yml/badge.svg)
[![codecov](https://codecov.io/gh/ai-crypto-onramp/ui-middle-office/branch/main/graph/badge.svg)](https://codecov.io/gh/ai-crypto-onramp/ui-middle-office)

Internal compliance and operations console for the crypto on-ramp.
Built in TypeScript with React (Vite SPA), consuming the backend
services directly via REST. Covers KYC review, AML/KYT alert
management, policy/risk decisioning, fraud case management, user
management, and audit log exploration.

## Overview / Responsibilities

- Single internal console for compliance, support, ops, and admin staff.
- Calls backend services directly via REST (no BFF in front).
- Role-based access (compliance, support, ops, admin) enforced at the
  route and component level.
- Stage 1 covers scaffolding + CI; subsequent stages add auth/RBAC,
  KYC review, AML/KYT, policy/risk, user management, audit, real-time,
  E2E.

## Language & Tech Stack

- **Language:** TypeScript (Node.js 20 LTS for build)
- **Framework:** React 19 (Vite SPA, single bundle)
- **Routing:** TanStack Router (planned) / React Router
- **Server state:** TanStack Query
- **Validation:** zod
- **UI:** Tailwind CSS + shadcn/ui (planned)
- **Testing:** Vitest + jsdom + Testing Library (unit/integration);
  Playwright (E2E, planned)
- **Lint/format:** ESLint, Prettier
- **Build:** Vite → static bundle served by nginx in Docker

## Project Structure

```
middle-office-ui/
├── src/
│   ├── App.tsx              # Root component
│   ├── main.tsx             # Entry point
│   ├── index.css            # Global styles
│   ├── config.ts            # Env-driven config
│   └── utils.ts             # Shared helpers
├── public/
│   └── healthz.json         # Static health probe target (served by nginx)
├── tests/                   # Vitest unit tests
├── index.html
├── nginx.conf               # nginx config for Docker runtime
├── Dockerfile               # Multi-stage build, nginx serve
├── Makefile
├── vite.config.ts
├── tsconfig.json
├── codecov.yml
└── .env.example
```

## Getting Started

```bash
npm install
npm run dev          # http://localhost:3000
npm run build        # production build (dist/)
npm run preview      # preview production build
npm run lint         # ESLint
npm run typecheck    # tsc --noEmit
npm test             # Vitest with coverage
make docker-build    # build image
make docker-run      # run on :3000
```

## Configuration

Copy `.env.example` to `.env.local` and adjust. All `VITE_*` variables
are inlined into the bundle at build time.

## Health

The nginx container serves `/healthz` from `public/healthz.json`, so
gatus and docker-compose healthchecks can probe it without a backend.

## CI / Coverage

CI runs on every push and pull request via `.github/workflows/ci.yml`:
lint, typecheck, build, tests with coverage, and Docker build. Coverage
is uploaded to Codecov.