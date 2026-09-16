# Test Strategy: Project Cyber Heist

## Scope & Levels
1. **Unit Tests**:
   - `runtime/config.test.ts`: Validates environment fallback and container ports.
   - `auth/jwt.test.ts`: Validates signing, verification, decoding, and tamper detection.
   - `auth/password.test.ts`: Validates PBKDF2 hashing, salting, and constant-time verification.
   - `auth/rbac.test.ts`: Validates role permissions, multi-permission checks, and tenant isolation.
   - `auth/validation.test.ts`: Validates input format constraints.
   - `auth/middleware.test.ts`: Validates Bearer token extraction, 401 unauthorized, and 403 forbidden responses.
   - `domain/store.test.ts`: Validates project lifecycle state transitions and audit logging.
   - `seed/seed.test.ts`: Validates deterministic dataset initialization and reset.
2. **Integration Tests**:
   - `api.test.ts`: Validates HTTP server listener, `/health` endpoint, interactive console serving, authentication endpoints, CRUD for projects, approvals, comments, documents, and audit trails.

## Execution
Tests are executed via `npm test`, which executes `tsc` and runs `node --test` over compiled test artifacts in `dist/`.
Zero external test framework dependencies are needed.
