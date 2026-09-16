# Deployment Plan: Project Cyber Heist

## Environments
1. **Local Preview**: Development host or container running Docker Compose with ephemeral host ports.
2. **Dev / UAT**: Remote automated preview deployment managed by AIDLC harness with durable URLs.
3. **Staging & Production**: Production-ready container deployment with managed PostgreSQL and secret stores.

## Promotion Path
`local` -> `dev` -> `uat` -> `staging` -> `production`
- Each promotion step requires passing quality gates: `npm run lint`, `npm test`, `npm run build`.
- Human approval gate required before promotion from local preview to dev/UAT.
