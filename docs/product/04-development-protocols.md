# Development Protocols: Project Cyber Heist

## Branch & Ticket Strategy
- Work is executed on short-lived task branches branched off `main` (e.g. `ticket/PRO-2`).
- Each ticket corresponds to a PR-sized change with clean atomic commits.
- Commit messages follow conventional commits (`feat:`, `fix:`, `chore:`, `test:`).

## Quality Gates
Before any ticket is marked complete or promoted, the following quality gates must pass:
1. `npm run lint`: Validates zero TypeScript compile and type errors (`tsc --noEmit`).
2. `npm test`: Validates full unit and integration test suites (`node --test`).
3. `npm run build`: Compiles clean distribution artifacts (`tsc`).

## Seed & Review Protocol
- Any feature involving authentication, roles, or protected routes must update deterministic seed data.
- Reviewer credentials must remain discoverable in `docs/product/12-seed-review-data.md` and the interactive console at `/`.
- Safe reseed command `npm run seed:reset` must restore deterministic state.
