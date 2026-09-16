import { store } from '../domain/store';
import {
  SEED_WORKSPACE,
  generateSeedUsers,
  SEED_PROJECTS,
  SEED_APPROVALS,
  SEED_COMMENTS,
  SEED_DOCUMENTS,
  RAW_SEED_USERS,
} from './seedData';

export function seedDatabase(): void {
  store.clear();

  // 1. Add Workspace
  store.addWorkspace(SEED_WORKSPACE);

  // 2. Add Users
  const users = generateSeedUsers();
  for (const user of users) {
    store.addUser(user);
  }

  // 3. Add Projects
  for (const project of SEED_PROJECTS) {
    store.addProject({ ...project });
  }

  // 4. Add Approvals
  for (const approval of SEED_APPROVALS) {
    store.addApproval({ ...approval });
  }

  // 5. Add Comments
  for (const comment of SEED_COMMENTS) {
    store.addComment({ ...comment });
  }

  // 6. Add Documents
  for (const doc of SEED_DOCUMENTS) {
    store.addDocument({ ...doc });
  }

  // 7. Initial Audit Event
  store.logAudit({
    actorId: 'system',
    actorEmail: 'system@cyberheist.local',
    action: 'SEED_INITIALIZE',
    resourceType: 'system',
    resourceId: 'seed-runner',
    details: {
      workspaceCount: 1,
      userCount: users.length,
      projectCount: SEED_PROJECTS.length,
      approvalCount: SEED_APPROVALS.length,
      documentCount: SEED_DOCUMENTS.length,
      commentCount: SEED_COMMENTS.length,
    },
  });
}

export function resetDatabase(): void {
  seedDatabase();
  store.logAudit({
    actorId: 'system',
    actorEmail: 'system@cyberheist.local',
    action: 'DATABASE_RESET',
    resourceType: 'system',
    resourceId: 'seed-runner',
    details: { timestamp: new Date().toISOString() },
  });
}

export function getSeedSummary() {
  return {
    workspace: SEED_WORKSPACE,
    users: RAW_SEED_USERS.map((u) => ({
      id: u.id,
      email: u.email,
      name: u.name,
      role: u.role,
      password: u.password,
    })),
    metrics: {
      workspaces: store.workspaces.size,
      users: store.users.size,
      projects: store.projects.size,
      approvals: store.approvals.size,
      auditEvents: store.auditEvents.length,
    },
  };
}

// CLI runner support
if (require.main === module) {
  const isReset = process.argv.includes('--reset');
  if (isReset) {
    resetDatabase();
    console.log('[SEED] Database reset and reseeded with deterministic data.');
  } else {
    seedDatabase();
    console.log('[SEED] Database successfully initialized with seed data.');
  }

  const summary = getSeedSummary();
  console.log(`[SEED] Workspace: ${summary.workspace.name}`);
  console.log(`[SEED] Users created: ${summary.users.length}`);
  console.log(`[SEED] Projects initialized: ${summary.metrics.projects}`);
  console.log(`[SEED] Approvals registered: ${summary.metrics.approvals}`);
  process.exit(0);
}
