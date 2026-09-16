# Product Brief: Project Cyber Heist

## Vision & Summary
Project Cyber Heist is a containerized cyber heist operations platform designed to orchestrate, execute, review, and audit high-stakes digital infiltrations and asset extractions. The platform brings structured workflow governance to operations involving multi-agent crews, risk assessment, payload document tracking, multi-tier approvals, and immutable audit trails.

## Target Personas
- **Mastermind (Admin)**: Oversees syndicate workspaces, configures security parameters, manages operative access, and monitors syndicate-wide operations.
- **Infiltrator / Netrunner (Operator)**: Drafts heist plans, defines target databanks/vaults, uploads technical blueprints, and submits plans for operational review.
- **Cipher Overseer (Reviewer)**: Reviews submitted heist plans, evaluates risks and technical countermeasures, conducts discussion threads, and renders formal approval/rejection decisions.
- **Sentinel Protocol (Auditor)**: Inspects immutable operational audit logs, validates security policy enforcement, and ensures operational compliance.

## Core Capabilities
1. **Interactive Reviewer & Operations Console**: Unified web terminal providing real-time mission telemetry, 1-click credential switching, and live operational feeds.
2. **Deterministic Lifecycle Governance**: Strict state machines for heist projects (`draft` -> `in_review` -> `approved` -> `in_progress` -> `completed` / `aborted`).
3. **Multi-Role RBAC & JWT Security**: Stateless token-based authentication with granular permission gates on all API endpoints.
4. **Approval & Review Workflows**: Formal approval submissions with automated project status transitions upon review decisions.
5. **Auditing & Telemetry**: Comprehensive audit log recording every login, project state change, approval decision, and system reset.
6. **Container-Native Architecture**: Docker Compose multi-service architecture with dynamic host port mapping and fixed internal container ports.
