# Decision Log: Project Cyber Heist

## ADR-001: Native Node Test Runner (`node:test`)
- **Context**: Need fast, reliable test execution without bloating dependencies with Jest or Mocha.
- **Decision**: Use Node.js built-in `node:test` and `node:assert`.
- **Status**: Accepted.
- **Consequences**: Zero external test runner dependencies; instant startup; native async/await and lifecycle hooks (`before`, `after`, `beforeEach`).

## ADR-002: PBKDF2 Password Hashing
- **Context**: Need secure password hashing without native binary compilation dependencies (such as bcrypt C++ bindings).
- **Decision**: Use Node.js built-in `node:crypto` `pbkdf2Sync` with unique 16-byte random salts and 10,000 iterations of SHA-512.
- **Status**: Accepted.
- **Consequences**: High security, platform-independent, zero binary native build errors across Linux/Windows.

## ADR-003: Dynamic Host Port Architecture
- **Context**: Multiple agents and preview deployments run concurrently on test runners.
- **Decision**: Map dynamic host ports (`${AIDLC_API_PORT:-0}:8000`) while preserving fixed internal container ports (`8000`).
- **Status**: Accepted.
- **Consequences**: Zero port collisions in multi-tenant environments.
