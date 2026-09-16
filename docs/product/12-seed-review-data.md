# Seed & Review Data: Project Cyber Heist

## Seed Reviewer Accounts
The following deterministic accounts are pre-seeded in non-production environments:

| Role | Email | Password | Primary Capabilities |
| :--- | :--- | :--- | :--- |
| **Admin** (Mastermind) | `admin@cyberheist.local` | `ChangeMe!12345` | Full workspace governance, user administration, system config, all project permissions |
| **Reviewer** (Cipher Overseer) | `reviewer@cyberheist.local` | `ChangeMe!12345` | Project read, approval review (approve/reject), comments |
| **Operator** (Ghost Netrunner) | `operator@cyberheist.local` | `ChangeMe!12345` | Project creation, status updates, approval submission, document upload |
| **Auditor** (Sentinel Protocol) | `auditor@cyberheist.local` | `ChangeMe!12345` | Audit log inspection, project read, document read |

## Pre-Seeded Missions
1. `PRJ-HEIST-001`: "Operation Neon Citadel"
   - Target: Megacorp Central Vault
   - Estimated Take: $5,000,000
   - Risk: High
   - Status: `approved`
2. `PRJ-HEIST-002`: "Quantum Subnet Infiltration"
   - Target: Orbital Databank Node-7
   - Estimated Take: $12,000,000
   - Risk: Extreme
   - Status: `in_review`
3. `PRJ-HEIST-003`: "Synthetic Asset Extraction"
   - Target: Black-Market Liquidity Pool
   - Estimated Take: $2,500,000
   - Risk: Medium
   - Status: `draft`

## Reset & Reseed Commands
- Reseed database: `npm run seed`
- Reset database to initial state: `npm run seed:reset`
- API endpoint reset: `POST /api/seed/reset`
- Seed summary inspection: `GET /api/seed/summary`
