import { Store } from './db/store';
import { hashPassword } from './auth/password';
import { User, Project, Approval, Upload, Comment, AuditEvent } from './types';

export const SEED_USERS = [
  {
    id: 'user-admin-01',
    username: 'admin',
    email: 'admin@cyberheist.local',
    password: 'Password123!',
    role: 'admin' as const,
    created_at: '2026-09-01T00:00:00.000Z'
  },
  {
    id: 'user-operator-01',
    username: 'operator',
    email: 'operator@cyberheist.local',
    password: 'Password123!',
    role: 'operator' as const,
    created_at: '2026-09-02T00:00:00.000Z'
  },
  {
    id: 'user-analyst-01',
    username: 'analyst',
    email: 'analyst@cyberheist.local',
    password: 'Password123!',
    role: 'analyst' as const,
    created_at: '2026-09-03T00:00:00.000Z'
  }
];

export async function seedDatabase(store: Store): Promise<void> {
  await store.reset();

  // Create Users
  for (const u of SEED_USERS) {
    const password_hash = await hashPassword(u.password);
    const user: User = {
      id: u.id,
      username: u.username,
      email: u.email,
      password_hash,
      role: u.role,
      created_at: u.created_at
    };
    await store.createUser(user);
  }

  // Create Projects
  const project1: Project = {
    id: 'proj-golden-gate',
    title: 'Operation Golden Gate',
    description: 'Infiltration and security audit of the tier-4 payment clearing mainframe.',
    target_system: 'Central Reserve Core Gateway',
    status: 'in_progress',
    risk_level: 'critical',
    budget: 1500000,
    owner_id: 'user-admin-01',
    created_at: '2026-09-10T10:00:00.000Z',
    updated_at: '2026-09-15T14:30:00.000Z'
  };

  const project2: Project = {
    id: 'proj-neon-citadel',
    title: 'Project Neon Citadel',
    description: 'Signal interception and protocol penetration test against orbital satellite firmware.',
    target_system: 'Orbital Satellite Uplink Alpha',
    status: 'review_pending',
    risk_level: 'high',
    budget: 850000,
    owner_id: 'user-operator-01',
    created_at: '2026-09-12T12:00:00.000Z',
    updated_at: '2026-09-16T08:00:00.000Z'
  };

  const project3: Project = {
    id: 'proj-shadow-vault',
    title: 'Protocol Shadow Vault',
    description: 'Post-quantum cryptographic validation and bypass simulation.',
    target_system: 'Quantum Key Distribution Mesh',
    status: 'completed',
    risk_level: 'medium',
    budget: 420000,
    owner_id: 'user-admin-01',
    created_at: '2026-08-20T09:00:00.000Z',
    updated_at: '2026-09-05T18:00:00.000Z'
  };

  await store.createProject(project1);
  await store.createProject(project2);
  await store.createProject(project3);

  // Create Approvals
  const approval1: Approval = {
    id: 'appr-01',
    project_id: project2.id,
    requested_by: 'user-operator-01',
    status: 'pending',
    comments: 'Awaiting administrative authorization for uplink handshake.',
    requested_at: '2026-09-16T08:15:00.000Z'
  };

  const approval2: Approval = {
    id: 'appr-02',
    project_id: project1.id,
    requested_by: 'user-operator-01',
    approved_by: 'user-admin-01',
    status: 'approved',
    comments: 'Primary gateway authorization granted with 72h operational window.',
    requested_at: '2026-09-14T11:00:00.000Z',
    decided_at: '2026-09-14T11:45:00.000Z'
  };

  await store.createApproval(approval1);
  await store.createApproval(approval2);

  // Create Uploads
  const upload1: Upload = {
    id: 'upl-01',
    project_id: project1.id,
    file_name: 'payload_specs_v2.json',
    file_size: 4096,
    mime_type: 'application/json',
    file_path: '/uploads/payload_specs_v2.json',
    uploaded_by: 'user-operator-01',
    created_at: '2026-09-14T12:00:00.000Z'
  };

  const upload2: Upload = {
    id: 'upl-02',
    project_id: project2.id,
    file_name: 'satellite_telemetry.pcap',
    file_size: 1048576,
    mime_type: 'application/vnd.tcpdump.pcap',
    file_path: '/uploads/satellite_telemetry.pcap',
    uploaded_by: 'user-operator-01',
    created_at: '2026-09-16T08:30:00.000Z'
  };

  await store.createUpload(upload1);
  await store.createUpload(upload2);

  // Create Comments
  const comment1: Comment = {
    id: 'comm-01',
    project_id: project1.id,
    author_id: 'user-admin-01',
    author_name: 'admin',
    content: 'Firewall rule bypass sequence verified in test staging.',
    created_at: '2026-09-15T09:00:00.000Z'
  };

  const comment2: Comment = {
    id: 'comm-02',
    project_id: project1.id,
    author_id: 'user-operator-01',
    author_name: 'operator',
    content: 'Subnet routing tables uploaded. Proceeding to phase 2.',
    created_at: '2026-09-15T10:15:00.000Z'
  };

  const comment3: Comment = {
    id: 'comm-03',
    project_id: project2.id,
    author_id: 'user-analyst-01',
    author_name: 'analyst',
    content: 'Telemetry shows erratic carrier frequencies. Recommend re-sampling before live test.',
    created_at: '2026-09-16T08:45:00.000Z'
  };

  await store.createComment(comment1);
  await store.createComment(comment2);
  await store.createComment(comment3);

  // Create Audit Events
  const audit1: AuditEvent = {
    id: 'audit-01',
    action: 'system:initialized',
    actor_id: 'system',
    actor_name: 'System Kernel',
    target_type: 'system',
    target_id: 'cyber-heist-core',
    details: { environment: 'local', seeded: true },
    ip_address: '127.0.0.1',
    timestamp: '2026-09-16T00:00:00.000Z'
  };

  const audit2: AuditEvent = {
    id: 'audit-02',
    action: 'approval:granted',
    actor_id: 'user-admin-01',
    actor_name: 'admin',
    target_type: 'project',
    target_id: project1.id,
    details: { approval_id: approval2.id, status: 'approved' },
    ip_address: '127.0.0.1',
    timestamp: '2026-09-14T11:45:00.000Z'
  };

  await store.createAuditEvent(audit1);
  await store.createAuditEvent(audit2);
}

// Direct execution CLI runner
if (require.main === module) {
  const { defaultStore } = require('./db/store');
  (async () => {
    try {
      await defaultStore.init();
      await seedDatabase(defaultStore);
      console.log('Database seeded successfully with deterministic review data!');
      await defaultStore.close();
      process.exit(0);
    } catch (err) {
      console.error('Seed execution error:', err);
      process.exit(1);
    }
  })();
}
