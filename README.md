# Construction Operations CRM

Construction Operations CRM is a web application for managing the full lifecycle of high-value residential construction work:

- client enquiries, contacts, and sales opportunities;
- sales activities and follow-ups;
- construction projects, phases, tasks, and milestones;
- materials, orders, and deliveries;
- project costs and subcontractor invoices;
- executive dashboard metrics and review queues; and
- synchronization with a structured Notion workspace.

The application also includes an n8n automation workflow that receives vendor invoice information, extracts structured fields from email/PDF content, prevents duplicate cost records, and notifies the appropriate person when clarification is needed.

## Architecture

```text
                           Browser
                              |
                              v
                    Next.js web application
                         :3017
                              |
                              v
                    Django REST API (DRF)
                         :8017
                    /                  \
                   v                    v
          PostgreSQL database       Notion workspace
                :5448              (CRM/project views)

 Vendor email or PDF
          |
          v
      n8n webhook :5678
          |
          v
 Django invoice extraction and processing endpoints
          |
          +--> PostgreSQL cost record
          +--> Notion project-cost record
          +--> email notification or review queue
```

### Responsibilities by service

| Service | Responsibility | Local URL |
| --- | --- | --- |
| PostgreSQL | Source-of-record persistence for CRM, projects, costs, and audit logs | `localhost:5448` |
| Django + Django REST Framework | API, validation, business rules, invoice extraction, notifications, and Notion integration | `http://localhost:8017` |
| Next.js | Browser UI for the dashboard, CRM records, projects, invoices, and admin actions | `http://localhost:3017` |
| n8n | Visual workflow orchestration for vendor invoice intake | `http://localhost:5678` |
| Notion | Operational workspace and shared project/cost views | Configured by `NOTION_ROOT_PAGE_ID` |

Containers communicate over the Docker Compose network using service names such as `db`, `backend`, and `n8n`. Browser-facing URLs use `localhost` and the published ports above.

## Application flow

### CRM and project management

1. A user opens the Next.js application and creates or updates a contact, opportunity, activity, project, task, material order, or cost.
2. The frontend sends the request to the versioned Django API at `/api/v1/`.
3. Django validates the request with DRF serializers and writes the record to PostgreSQL.
4. Dashboard endpoints aggregate the persisted data for the overview and action queues.
5. Notion links and workspace configuration are exposed to the UI so users can open the corresponding operational pages.

### Vendor invoice automation

The workflow in [`n8n/workflows/construction_cost_automation.json`](./n8n/workflows/construction_cost_automation.json) follows this sequence:

1. **Receive**: `POST /webhook/construction-cost-intake` accepts email fields and an optional base64-encoded PDF.
2. **Extract**: n8n calls `POST /api/v1/invoices/extract/`. The backend extracts PDF text with `pypdf` and parses invoice fields deterministically. Optional OpenAI, Gemini, or DeepSeek enrichment can be enabled with environment variables.
3. **Pre-check**: n8n checks for a project reference, document reference, and positive amount.
4. **Process**: n8n calls `POST /api/v1/invoices/process/`.
5. **Match and deduplicate**: Django matches the project and uses supplier plus document reference to create, update, or skip a cost record.
6. **Synchronize and notify**: the processor updates Notion when enabled and sends an email notification.
7. **Route**: records needing clarification are returned as `FLAGGED_FOR_REVIEW`; clean records are returned as `RECORDED_OR_UPDATED_CLEANLY`.

The built-in admin simulator can exercise the same processing path without an external vendor system.

## Technology

- Python 3.12+ (the container currently uses Python 3.14)
- Django 6.1 and Django REST Framework 3.18
- PostgreSQL 18
- Next.js 16, React 19, and TypeScript 7
- n8n
- Docker Compose
- `uv` for Python dependency management
- Bun for frontend scripts and tests

## Run locally with Docker Compose

### Prerequisites

- Docker Engine with Docker Compose
- A Notion integration token and a root page shared with that integration
- Optional LLM credentials if AI-assisted extraction is required

### Setup

From the repository root:

```bash
cp .env.example .env
```

Edit `.env` and set at least:

```dotenv
DJANGO_SECRET_KEY=replace-with-a-local-secret
NOTION_API_KEY=secret_xxxxxxxxxxxxxxxxx
NOTION_ROOT_PAGE_ID=your-root-page-id
```

The default Compose configuration uses these host ports:

| Component | Port |
| --- | ---: |
| PostgreSQL | `5448` |
| Django API | `8017` |
| Next.js | `3017` |
| n8n | `5678` |

Start the complete stack:

```bash
docker compose up -d --build
```

On backend startup, the container:

1. waits for PostgreSQL;
2. runs Django migrations;
3. provisions or synchronizes the configured Notion workspace; and
4. starts the development API server.

Open:

- Web application: <http://localhost:3017>
- API root: <http://localhost:8017/api/>
- API health check: <http://localhost:8017/api/v1/health/>
- Django admin: <http://localhost:8017/admin/>
- n8n editor: <http://localhost:5678>

Check service status and logs with:

```bash
docker compose ps
docker compose logs -f backend
docker compose logs -f n8n
```

Stop the stack without removing persisted data:

```bash
docker compose down
```

To remove the local database, n8n data, and dependency volumes as well, use `docker compose down -v`. This deletes local development data.

## n8n workflow setup

The workflow JSON is mounted read-only at `/workflows` inside the n8n container. Import [`construction_cost_automation.json`](./n8n/workflows/construction_cost_automation.json) from the n8n editor if it is not already present, then activate it.

The webhook endpoint is:

```text
POST http://localhost:5678/webhook/construction-cost-intake
```

Example request:

```bash
curl -X POST http://localhost:5678/webhook/construction-cost-intake \
  -H 'Content-Type: application/json' \
  -d '{
    "email_subject": "Invoice INV-2026-001",
    "email_sender": "billing@example-supplier.com",
    "email_body": "Supplier: Example Supplier\nConstruction Project: PRJ-101\nAmount: 12500.00 USD\nPayment Status: Unpaid\nPayment Due Date: 2026-11-30",
    "attachment_filename": "invoice.pdf",
    "attachment_base64": ""
  }'
```

For a complete local demo, use the invoice simulator in the admin UI or call:

```text
POST http://localhost:8017/api/v1/simulator/trigger/
```

## API overview

All application endpoints are under `/api/v1/`.

| Area | Endpoint |
| --- | --- |
| Health and service metadata | `/health/` |
| Dashboard metrics | `/dashboard/summary/` |
| Contacts and enquiries | `/contacts/` |
| Sales opportunities | `/opportunities/` |
| Sales activities | `/activities/` |
| Construction projects | `/projects/` |
| Tasks and milestones | `/tasks/` |
| Materials and orders | `/materials/` |
| Costs and invoices | `/costs/` |
| Email and notification logs | `/notifications/` |
| Notion provisioning | `/notion/provision/` |
| Invoice extraction | `/invoices/extract/` |
| Invoice processing | `/invoices/process/` |
| Automation simulator | `/simulator/trigger/` |

List endpoints support pagination, search, filtering, and ordering where applicable. The Django admin interface is available under `/admin/`.

## Run checks without Docker

The backend and frontend can also be worked on independently when their dependencies are installed.

Backend:

```bash
cd backend
uv sync
uv run pytest -v
```

Frontend:

```bash
cd frontend
bun install
bun test
bun run build
```

For browser end-to-end tests:

```bash
cd frontend
bun run test:e2e
```

## Production deployment

Production uses [`docker-compose.prod.yml`](./docker-compose.prod.yml) with Gunicorn, persistent volumes, and Traefik routing. The production environment file is intentionally not committed; create it from [`.env.prod.example`](./.env.prod.example) and provide real secrets.

The deployment expects an external Docker network named `traefik_proxy`:

```bash
docker network create traefik_proxy  # run once if it does not exist
./scripts/deploy.sh
```

Alternatively:

```bash
docker compose -f docker-compose.prod.yml --env-file .env.prod up -d --build
```

Before deploying, update domain, database, Django, Notion, email, and n8n settings in `.env.prod`. Never use the example passwords or API keys in a production environment.

## Repository layout

```text
backend/                 Django project, API, models, services, and tests
frontend/                Next.js application and browser tests
n8n/workflows/           Importable n8n workflow definitions
docs/                    Supporting generated documents and media
traefik/                 Shared reverse-proxy configuration and documentation
docker-compose.yml       Local development stack
docker-compose.prod.yml  Production stack
scripts/                 Deployment and utility scripts
```
