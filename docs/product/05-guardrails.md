# Security & Operational Guardrails: Project Cyber Heist

## Token Conservation & File Exclusion
- Large, bloated directories (`node_modules/`, `dist/`, `build/`, `.git/`, lock files) are ignored by git and excluded from agent token contexts.
- Only targeted, precise source file inspections are performed.

## Secret Management & Demo Data
- Production secrets must NEVER be committed to version control.
- Non-production environments use clearly marked demo secrets (`cyber-heist-dev-secret-key-32-chars-minimum!`, `ChangeMe!12345`).
- Reviewer credentials are explicitly documented and scoped to local/dev test harnesses.

## Container & Port Guardrails
- Dynamic host ports must map to fixed internal ports (`"${AIDLC_PORT:-0}:8000"`).
- Never change fixed internal container ports (`8000`, `3000`, `5432`) to dynamic values.
- Container healthchecks must point to IPv4 loopback (`127.0.0.1`).
