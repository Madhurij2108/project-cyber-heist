# Project Cyber Heist

Containerized, agent-buildable cyber heist planning and operations platform. Built with React + TypeScript frontend terminal, Node.js + Express + TypeScript backend, JWT-based authentication, RBAC, approval workflows, and PostgreSQL database over Docker Compose.

---

## Architecture Overview

- **Frontend**: Interactive Cyber Heist Operations Console serving at `/` and `/login` with dynamic mission feed and credential selection.
- **Backend**: Node.js + Express + TypeScript REST API providing JWT authentication, RBAC authorization, mission lifecycle governance, approval requests, comments, document metadata, and audit logs.
- **Database**: PostgreSQL 16 Alpine container with persistent volumes and automated health checks.
- **Deployment**: Docker Compose with dynamic host port mapping (`"${AIDLC_FRONTEND_PORT:-0}:3000"`, `"${AIDLC_API_PORT:-0}:8000"`, `"${AIDLC_DB_PORT:-0}:5432"`) and fixed internal container ports (`PORT=3000`, `PORT=8000`, `PORT=5432`).

---

## Quality Gates & Commands

All commands execute cleanly from the project root:

| Command | Action | Description |
| :--- | :--- | :--- |
| `npm run lint` | Syntax & Type Check | Runs `tsc --noEmit` to verify type safety without emit |
| `npm test` | Test Suite | Builds and executes 61 tests across 9 test suites using native `node:test` |
| `npm run build` | Production Build | Compiles TypeScript source to `dist/` |
| `npm run seed` | Initialize Seed Data | Populates workspace, users, projects, approvals, documents, comments |
| `npm run seed:reset` | Reset Data | Deterministically restores the initial seed dataset |
| `npm start` | Start Server | Runs `node dist/index.js` on port `8000` |

---

## Reviewer & Demo Credentials

Deterministic seed credentials are provided for all major product roles (passwords are non-production demo secrets):

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** (Mastermind) | `admin@cyberheist.local` | `ChangeMe!12345` | `WORKSPACE_MANAGE`, `USER_MANAGE`, `PROJECT_CREATE`, `PROJECT_READ`, `PROJECT_UPDATE`, `PROJECT_DELETE`, `APPROVAL_SUBMIT`, `APPROVAL_REVIEW`, `COMMENT_CREATE`, `DOCUMENT_UPLOAD`, `DOCUMENT_READ`, `AUDIT_VIEW`, `SYSTEM_CONFIG` |
| **Reviewer** (Cipher Overseer) | `reviewer@cyberheist.local` | `ChangeMe!12345` | `PROJECT_READ`, `APPROVAL_REVIEW`, `COMMENT_CREATE`, `DOCUMENT_READ` |
| **Operator** (Ghost Netrunner) | `operator@cyberheist.local` | `ChangeMe!12345` | `PROJECT_CREATE`, `PROJECT_READ`, `PROJECT_UPDATE`, `APPROVAL_SUBMIT`, `COMMENT_CREATE`, `DOCUMENT_UPLOAD`, `DOCUMENT_READ` |
| **Auditor** (Sentinel Protocol) | `auditor@cyberheist.local` | `ChangeMe!12345` | `PROJECT_READ`, `AUDIT_VIEW`, `DOCUMENT_READ` |

---

## Key API Endpoints

- `GET /health` - Service health status (200 OK)
- `GET /` and `GET /login` - Interactive Cyber Heist Operations & Reviewer Console
- `GET /api/seed/summary` - Seed metrics and reviewer account information
- `POST /api/seed/reset` - Reset local data
- `POST /api/auth/login` - Authenticate and retrieve JWT token
- `POST /api/auth/register` - Register new user
- `POST /api/auth/logout` - Terminate session
- `GET /api/auth/me` - Authenticated user details
- `GET /api/auth/verify` - Token verification
- `GET /api/projects` - List heist projects
- `POST /api/projects` - Create new heist project
- `GET /api/projects/:id` - Get project details
- `PATCH /api/projects/:id/status` - Transition project status
- `GET /api/approvals` - List approval requests
- `POST /api/approvals` - Submit approval request
- `PATCH /api/approvals/:id` - Review approval request
- `GET /api/projects/:id/comments` - List project comments
- `POST /api/projects/:id/comments` - Add project comment
- `GET /api/projects/:id/documents` - List project documents
- `POST /api/projects/:id/documents` - Register document metadata
- `GET /api/audit` - Query audit event logs

---

## Containerized Run with Docker Compose

```bash
# Start all services with dynamic host port mapping
docker compose up -d

# Check health and status
docker compose ps
curl http://127.0.0.1:8000/health
```
