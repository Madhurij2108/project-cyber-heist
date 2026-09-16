# Project Cyber Heist

Containerized full-stack operations management platform for Project Cyber Heist, built with **React + TypeScript**, **Node.js + Express + TypeScript**, **JWT-based Authentication**, and **PostgreSQL**.

---

## 🛡️ Reviewer Quick-Access Credentials

Deterministic non-production demo credentials for review and testing:

| Role | Email | Password | Permissions |
| :--- | :--- | :--- | :--- |
| **Admin** | `admin@cyberheist.local` | `Password123!` | Full access (create/update/delete operations, decide authorizations, seed/reset) |
| **Operator** | `operator@cyberheist.local` | `Password123!` | Operational access (create operations, request authorizations, upload files, comment) |
| **Analyst** | `analyst@cyberheist.local` | `Password123!` | Read-only access (view operations, inspect audit ledger, post comments) |

*Note: The frontend console features one-click quick-fill buttons for each reviewer role.*

---

## 🏗️ Architecture & Technology Stack

- **Frontend**: React 18, TypeScript, Vite, CSS Cyberpunk Terminal UI
- **Backend API**: Node.js, Express, TypeScript, JWT (JSON Web Tokens), RBAC Middleware
- **Database**: PostgreSQL 15 (`postgres:15-alpine`) with dual runtime support (PostgreSQL pool + automated in-memory test fallback)
- **Containerization**: Docker Compose with dynamic host port mapping (`0` fallback) and fixed container internal ports
- **Testing**: Vitest, React Testing Library, Supertest

---

## 🚢 Docker Compose & Port Architecture

Host ports are dynamically allocated by the OS kernel when defaulting to `0` (avoiding port collisions across parallel preview environments), while container internal ports and loopback health checks remain fixed:

| Service | Internal Port | Dynamic Host Port Mapping | Healthcheck Endpoint |
| :--- | :--- | :--- | :--- |
| **Frontend (Client)** | `3000` | `"${AIDLC_FRONTEND_PORT:-0}:3000"` | `http://127.0.0.1:3000/health` |
| **Backend (API)** | `8000` | `"${AIDLC_API_PORT:-0}:8000"` | `http://127.0.0.1:8000/health` |
| **Database (PostgreSQL)** | `5432` | `"${AIDLC_DB_PORT:-0}:5432"` | `pg_isready` |

The frontend Nginx reverse proxy forwards all `/api/` traffic to the backend service using same-origin routing.

### Launching with Docker Compose
```bash
docker compose up --build -d
```

---

## 🧪 Quality Gates & Verification Commands

All quality gates pass with zero errors:

```bash
# 1. Type check and linting
npm run lint

# 2. Comprehensive unit and integration test suite
npm test

# 3. Production build (server TypeScript + client Vite)
npm run build
```

---

## 📡 API Endpoints

- `GET /health` - System health check (fixed contract)
- `POST /api/auth/register` - Register operator or analyst
- `POST /api/auth/login` - Authenticate and receive JWT token
- `GET /api/auth/me` - Inspect current authenticated identity
- `GET /api/projects` - List active heist operations
- `POST /api/projects` - Initialize new heist operation
- `GET /api/projects/:id` - Full details, authorizations, uploads, and logs
- `PUT /api/projects/:id` - Update operation attributes
- `DELETE /api/projects/:id` - Delete operation (Admin only)
- `GET /api/approvals` - List authorization requests
- `POST /api/approvals` - Request operation authorization
- `PUT /api/approvals/:id` - Approve or reject authorization (Admin only)
- `POST /api/uploads` - Record operational file payload
- `POST /api/comments` - Record mission log comment
- `GET /api/audit` - Security audit trail
- `POST /api/seed` - Reset and reseed deterministic review data
