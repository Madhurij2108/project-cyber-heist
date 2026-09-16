# Product Requirements Document (PRD): Project Cyber Heist

## 1. Functional Requirements

### 1.1 Authentication & User Management
- **FR-01**: Secure registration and login with email and password.
- **FR-02**: Passwords hashed using PBKDF2 with unique cryptographic salt per user.
- **FR-03**: Stateless authentication via signed JSON Web Tokens (JWT) with standard Bearer authorization.
- **FR-04**: Role-Based Access Control (RBAC) supporting `admin`, `operator`, `reviewer`, and `auditor`.

### 1.2 Heist Project Lifecycle
- **FR-05**: Operators can create new heist projects with code names, targets, estimated takes, and risk levels.
- **FR-06**: Validated status transitions:
  - `draft` -> `in_review` | `aborted`
  - `in_review` -> `approved` | `draft` | `aborted`
  - `approved` -> `in_progress` | `aborted`
  - `in_progress` -> `completed` | `aborted`
  - `aborted` -> `draft`
  - `completed` -> terminal state

### 1.3 Review & Approval Governance
- **FR-07**: Operators can submit pending approval requests for drafted projects.
- **FR-08**: Submitting approval automatically transitions project to `in_review`.
- **FR-09**: Reviewers and Admins can approve or reject pending requests with review notes.
- **FR-10**: Approving an approval request automatically transitions project to `approved`.

### 1.4 Comments & Document Metadata
- **FR-11**: Operatives can leave discussion comments on projects.
- **FR-12**: Operatives can attach document metadata (blueprints, payloads, checksums) to projects.

### 1.5 Audit Trail & Compliance
- **FR-13**: System logs audit events on authentication, project creation, status transitions, approval reviews, and database resets.
- **FR-14**: Only users with `AUDIT_VIEW` permission (Auditor, Admin) can view audit event streams.

### 1.6 Reviewer Console & Demo Experience
- **FR-15**: Root endpoint (`/`) and `/login` serve an interactive operations console with visible demo credentials, 1-click credential selection, live authentication, and mission manifest view.
- **FR-16**: `GET /api/seed/summary` and `POST /api/seed/reset` enable safe local state resets.

## 2. Non-Functional Requirements
- **Performance**: Test suite executes in under 5 seconds.
- **Reliability**: 100% test pass rate with 0 compile/runtime errors.
- **Portability**: Containerized deployment with Docker Compose, zero port collisions via dynamic host ports.
