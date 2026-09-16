# Architecture Overview: Project Cyber Heist

## System Context
Project Cyber Heist runs as a Docker Compose product with React + TypeScript frontend console talking to Node.js + Express backend service, JWT-based auth, and PostgreSQL persistent store over containerized local/dev deployment.

## Technology Direction
- **Frontend**: React + TypeScript operations console served directly for reviewability and telemetry.
- **Backend**: Node.js 22 + Express + TypeScript with strict typing and layered boundaries.
- **Authentication**: JWT signed with secret, PBKDF2 password hashing with SHA-512 and unique per-user salts.
- **Data Persistence**: In-memory domain store with state-transition enforcement, designed for PostgreSQL mapping.
- **Deployment Runtime**: Docker Compose with dynamic ephemeral host ports and fixed internal ports.
- **Verification**: `npm test` (using native `node:test`), `npm run lint` (`tsc --noEmit`), and `npm run build` (`tsc`).

## Naming Conventions
- Modules & files: camelCase (e.g., `seedRunner.ts`, `jwt.ts`).
- Endpoints: kebab-case / REST nouns (e.g., `/api/projects`, `/api/seed/summary`).
- Domain entities: PascalCase (e.g., `HeistProject`, `ApprovalRequest`).
- Seed accounts & roles: explicit, human-readable naming matching cyber heist theme (`admin@cyberheist.local`, `operator@cyberheist.local`).

## Architecture Standards
- Strict separation between runtime configuration, authentication middleware, domain entities, and presentation layers.
- In-memory domain store enforces business logic and state machine transitions before persisting.
- Dynamic host ports (`${AIDLC_FRONTEND_PORT:-0}:3000`, `${AIDLC_API_PORT:-0}:8000`, `${AIDLC_DB_PORT:-0}:5432`) prevent host port collision during parallel agent execution.
- Internal container ports (`3000`, `8000`, `5432`) and health checks remain fixed.

## Data Model
- **Workspace**: id, name, slug, tier, createdAt
- **User**: id, email, name, role, organizationId, permissions, passwordHash, salt, createdAt, updatedAt
- **HeistProject**: id, title, codeName, target, estimatedTake, riskLevel, status, organizationId, createdBy, createdAt, updatedAt
- **ApprovalRequest**: id, projectId, requestedBy, status, notes, reviewedBy, reviewedAt, createdAt
- **ProjectComment**: id, projectId, authorId, authorName, content, createdAt
- **ProjectDocument**: id, projectId, title, fileType, sizeBytes, checksum, uploadedBy, createdAt
- **AuditEvent**: id, timestamp, actorId, actorEmail, action, resourceType, resourceId, details, ipAddress
