<!-- AURELIA_SOURCE_GRAPH_START -->
# Aurelia Agent Context

Before changing this product, consult the declared architecture context:

- Tech Stack: React + TypeScript frontend console, Node.js + Express + TypeScript backend, JWT-based auth, PostgreSQL, Docker Compose
- Validation commands: `npm run lint && npm test && npm run build`
- Port Architecture: Dynamic host ports (`${AIDLC_FRONTEND_PORT:-0}:3000`, `${AIDLC_API_PORT:-0}:8000`, `${AIDLC_DB_PORT:-0}:5432`), fixed internal container ports (`3000`, `8000`, `5432`).
- Reviewer Console: Available at `/` and `/login` with deterministic seed credentials.

<!-- AURELIA_SOURCE_GRAPH_END -->
