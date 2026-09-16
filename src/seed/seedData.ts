import { hashPassword } from '../auth/password';
import { getRolePermissions } from '../auth/rbac';
import { User } from '../auth/types';
import {
  Workspace,
  HeistProject,
  ApprovalRequest,
  ProjectComment,
  ProjectDocument,
} from '../domain/types';

export const SEED_WORKSPACE: Workspace = {
  id: 'ws-syndicate-01',
  name: 'Cyber Heist Syndicate Alpha',
  slug: 'syndicate-alpha',
  tier: 'syndicate_elite',
  createdAt: '2026-09-01T00:00:00.000Z',
};

export const RAW_SEED_USERS = [
  {
    id: 'usr-admin-01',
    email: 'admin@cyberheist.local',
    name: 'Mastermind Prime (Admin)',
    role: 'admin' as const,
    password: 'ChangeMe!12345',
    organizationId: SEED_WORKSPACE.id,
  },
  {
    id: 'usr-reviewer-01',
    email: 'reviewer@cyberheist.local',
    name: 'Cipher Overseer (Reviewer)',
    role: 'reviewer' as const,
    password: 'ChangeMe!12345',
    organizationId: SEED_WORKSPACE.id,
  },
  {
    id: 'usr-operator-01',
    email: 'operator@cyberheist.local',
    name: 'Ghost Netrunner (Operator)',
    role: 'operator' as const,
    password: 'ChangeMe!12345',
    organizationId: SEED_WORKSPACE.id,
  },
  {
    id: 'usr-auditor-01',
    email: 'auditor@cyberheist.local',
    name: 'Sentinel Protocol (Auditor)',
    role: 'auditor' as const,
    password: 'ChangeMe!12345',
    organizationId: SEED_WORKSPACE.id,
  },
];

export function generateSeedUsers(): User[] {
  return RAW_SEED_USERS.map((raw) => {
    const { hash, salt } = hashPassword(raw.password, `seed-salt-${raw.id}`);
    return {
      id: raw.id,
      email: raw.email,
      name: raw.name,
      role: raw.role,
      organizationId: raw.organizationId,
      permissions: getRolePermissions(raw.role),
      passwordHash: hash,
      salt,
      createdAt: '2026-09-01T00:00:00.000Z',
      updatedAt: '2026-09-01T00:00:00.000Z',
    };
  });
}

export const SEED_PROJECTS: HeistProject[] = [
  {
    id: 'PRJ-HEIST-001',
    title: 'Operation Neon Citadel',
    codeName: 'NEON-CITADEL',
    target: 'Megacorp Central Vault',
    estimatedTake: 5000000,
    riskLevel: 'high',
    status: 'approved',
    organizationId: SEED_WORKSPACE.id,
    createdBy: 'usr-operator-01',
    createdAt: '2026-09-10T10:00:00.000Z',
    updatedAt: '2026-09-12T14:30:00.000Z',
  },
  {
    id: 'PRJ-HEIST-002',
    title: 'Quantum Subnet Infiltration',
    codeName: 'QUANTUM-INFIL',
    target: 'Orbital Databank Node-7',
    estimatedTake: 12000000,
    riskLevel: 'extreme',
    status: 'in_review',
    organizationId: SEED_WORKSPACE.id,
    createdBy: 'usr-operator-01',
    createdAt: '2026-09-14T09:00:00.000Z',
    updatedAt: '2026-09-14T09:00:00.000Z',
  },
  {
    id: 'PRJ-HEIST-003',
    title: 'Synthetic Asset Extraction',
    codeName: 'SYNTH-EXTRACT',
    target: 'Black-Market Liquidity Pool',
    estimatedTake: 2500000,
    riskLevel: 'medium',
    status: 'draft',
    organizationId: SEED_WORKSPACE.id,
    createdBy: 'usr-operator-01',
    createdAt: '2026-09-15T16:00:00.000Z',
    updatedAt: '2026-09-15T16:00:00.000Z',
  },
];

export const SEED_APPROVALS: ApprovalRequest[] = [
  {
    id: 'appr-001',
    projectId: 'PRJ-HEIST-001',
    requestedBy: 'usr-operator-01',
    status: 'approved',
    notes: 'All bypass blueprints verified by security handler.',
    reviewedBy: 'usr-reviewer-01',
    reviewedAt: '2026-09-12T14:30:00.000Z',
    createdAt: '2026-09-11T12:00:00.000Z',
  },
  {
    id: 'appr-002',
    projectId: 'PRJ-HEIST-002',
    requestedBy: 'usr-operator-01',
    status: 'pending',
    notes: 'Awaiting secondary quantum decoy confirmation.',
    createdAt: '2026-09-14T09:15:00.000Z',
  },
];

export const SEED_COMMENTS: ProjectComment[] = [
  {
    id: 'comment-001',
    projectId: 'PRJ-HEIST-001',
    authorId: 'usr-reviewer-01',
    authorName: 'Cipher Overseer',
    content: 'Vault countermeasures require dynamic ICE breakers.',
    createdAt: '2026-09-11T14:00:00.000Z',
  },
  {
    id: 'comment-002',
    projectId: 'PRJ-HEIST-002',
    authorId: 'usr-operator-01',
    authorName: 'Ghost Netrunner',
    content: 'Quantum decoys have been loaded into proxy relays.',
    createdAt: '2026-09-14T11:00:00.000Z',
  },
];

export const SEED_DOCUMENTS: ProjectDocument[] = [
  {
    id: 'doc-001',
    projectId: 'PRJ-HEIST-001',
    title: 'Neon Citadel Architecture Blueprint',
    fileType: 'application/pdf',
    sizeBytes: 4194304,
    checksum: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
    uploadedBy: 'usr-operator-01',
    createdAt: '2026-09-10T11:00:00.000Z',
  },
  {
    id: 'doc-002',
    projectId: 'PRJ-HEIST-002',
    title: 'Orbital Subnet Routing Table',
    fileType: 'application/json',
    sizeBytes: 1048576,
    checksum: 'd41d8cd98f00b204e9800998ecf8427e',
    uploadedBy: 'usr-operator-01',
    createdAt: '2026-09-14T09:30:00.000Z',
  },
];
