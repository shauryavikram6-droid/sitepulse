# SitePulse Prototype

SitePulse is a demo-first construction site operations dashboard built with Next.js, Prisma, and PostgreSQL. It implements key flows for attendance tracking, wage variance, voice notes → tasks, KPI dashboards, safety checklists, and financial savings.

## Getting Started

### Prerequisites

- Docker & Docker Compose (recommended for quickest start)
- Node.js 18+ (for running locally without containers)

### Environment

Create an `.env` file based on the provided template:

```bash
cp .env.example .env
```

Running without custom secrets is supported: the app falls back to `AUTH_SECRET=dev-secret` and `DATABASE_URL=file:./dev.db`, and external integrations (WhatsApp, SMTP, OpenAI) log mock messages instead of calling live services.

### Run with Docker (recommended)

```bash
docker compose up --build
```

The stack will:

1. Launch PostgreSQL
2. Run Prisma migrations and seed demo data
3. Start the Next.js development server on [http://localhost:3000](http://localhost:3000)

### Manual Local Setup

```bash
npm install
npx prisma migrate dev
npm run db:seed
npm run dev
```

## Demo Credentials

| Role   | Email             | Password      |
|--------|-------------------|---------------|
| Admin  | admin@demo.com    | sitepulse123  |
| PM     | pm@demo.com       | sitepulse123  |
| Engineer | engineer@demo.com | sitepulse123 |

## Core Flows

- **Attendance → Wages**: Capture trade-wise headcount, export CSV/PDF (stub), view weekly totals & variance.
- **Voice → Checklist**: Upload/record (simulated) audio, trigger transcription + task creation, follow-up reminders.
- **Reporting/KPIs**: Dashboard cards for wages, savings, safety completion, and progress trend.
- **Safety**: Template-driven checklists with photo uploads and completion tracking.
- **Financials**: Purchase orders, invoices, benchmark rates, and savings snapshots.
- **Drawings**: Vault with version metadata and diff summary stubs.
- **DPR Bot**: Send prompts, capture answers, surface summaries.

## API

Swagger UI is available at [http://localhost:3000/api/docs](http://localhost:3000/api/docs). Requesting the same endpoint with `Accept: application/json` returns the OpenAPI document.

### Useful Endpoints

- `POST /api/v1/auth/login`
- `GET /api/v1/sites/{siteId}/attendance`
- `POST /api/v1/sites/{siteId}/voice`
- `GET /api/v1/sites/{siteId}/dashboard/weekly-wages`
- `GET /api/v1/sites/{siteId}/savings`

## Testing

Happy-path API tests use Jest + Supertest:

```bash
npm test
```

To exercise an end-to-end happy path against a running server, execute the cURL-based acceptance checks:

```bash
npm run acceptance
```

The script logs in with demo credentials, creates attendance with an idempotency key, triggers a DPR prompt (mocking WhatsApp when the token is absent), answers the prompt, and verifies drawing diffs.

## Project Structure Highlights

- `pages/` – Next.js pages & API routes (versioned under `/api/v1`)
- `prisma/schema.prisma` – Database models & enums
- `prisma/seed.ts` – Demo data seeding
- `lib/` – Prisma client, auth helpers, and shared utilities

## Worker Stub

Notification follow-ups are persisted to `NotificationQueue`. The demo worker is not implemented but the queue schema includes status, retries, and error fields for future expansion.

## Notes

- File uploads are simulated with metadata payloads (no binary storage).
- Idempotency keys are supported on attendance bulk create.
- All tables include timestamps (and soft-delete columns where relevant) for auditability.
