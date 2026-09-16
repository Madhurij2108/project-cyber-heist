# Support Runbook: Project Cyber Heist

## Health Diagnostics
- Service health endpoint: `GET /health` (Expects HTTP 200 OK with `status: "ok"`).
- Docker status: `docker compose ps`
- Container logs: `docker compose logs -f api`

## State & Data Reset
To restore local data to a clean deterministic state:
- Using CLI: `npm run seed:reset`
- Using API: `POST /api/seed/reset`
- Via Browser Console: Navigate to `/` and click "Reset Seed Data".
