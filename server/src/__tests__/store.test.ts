import { describe, it, expect, beforeEach } from 'vitest';
import { Store } from '../db/store';
import { seedDatabase } from '../seed';

describe('Database Store', () => {
  let store: Store;

  beforeEach(async () => {
    store = new Store();
    await store.init();
    await seedDatabase(store);
  });

  it('should have seeded users ready', async () => {
    const admin = await store.findUserByEmail('admin@cyberheist.local');
    expect(admin).not.toBeNull();
    expect(admin?.role).toBe('admin');

    const operator = await store.findUserByEmail('operator@cyberheist.local');
    expect(operator).not.toBeNull();
    expect(operator?.role).toBe('operator');
  });

  it('should perform CRUD operations on projects', async () => {
    const projects = await store.listProjects();
    expect(projects.length).toBeGreaterThanOrEqual(3);

    // Create
    const created = await store.createProject({
      id: 'proj-unit-test',
      title: 'Unit Test Infiltration',
      description: 'Test infiltration simulation',
      target_system: 'Simulated Sandbox',
      status: 'draft',
      risk_level: 'low',
      budget: 10000,
      owner_id: 'user-admin-01',
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    });
    expect(created.id).toBe('proj-unit-test');

    // Read
    const fetched = await store.getProject('proj-unit-test');
    expect(fetched?.title).toBe('Unit Test Infiltration');

    // Update
    const updated = await store.updateProject('proj-unit-test', { status: 'in_progress', budget: 15000 });
    expect(updated?.status).toBe('in_progress');
    expect(updated?.budget).toBe(15000);

    // Delete
    const deleted = await store.deleteProject('proj-unit-test');
    expect(deleted).toBe(true);
    expect(await store.getProject('proj-unit-test')).toBeNull();
  });

  it('should handle approvals workflow', async () => {
    const newApproval = await store.createApproval({
      id: 'appr-test-1',
      project_id: 'proj-golden-gate',
      requested_by: 'user-operator-01',
      status: 'pending',
      requested_at: new Date().toISOString()
    });
    expect(newApproval.status).toBe('pending');

    const updated = await store.updateApproval('appr-test-1', {
      status: 'approved',
      approved_by: 'user-admin-01',
      decided_at: new Date().toISOString()
    });
    expect(updated?.status).toBe('approved');
    expect(updated?.approved_by).toBe('user-admin-01');
  });

  it('should record uploads and comments', async () => {
    await store.createUpload({
      id: 'upl-test-1',
      project_id: 'proj-golden-gate',
      file_name: 'test_plan.pdf',
      file_size: 2048,
      mime_type: 'application/pdf',
      file_path: '/uploads/test_plan.pdf',
      uploaded_by: 'user-operator-01',
      created_at: new Date().toISOString()
    });

    const uploads = await store.listUploads('proj-golden-gate');
    expect(uploads.some((u) => u.file_name === 'test_plan.pdf')).toBe(true);

    await store.createComment({
      id: 'comm-test-1',
      project_id: 'proj-golden-gate',
      author_id: 'user-admin-01',
      author_name: 'admin',
      content: 'Approval confirmed for plan.',
      created_at: new Date().toISOString()
    });

    const comments = await store.listComments('proj-golden-gate');
    expect(comments.some((c) => c.content === 'Approval confirmed for plan.')).toBe(true);
  });

  it('should record and list audit events', async () => {
    await store.createAuditEvent({
      id: 'audit-test-1',
      action: 'test:action',
      actor_id: 'user-admin-01',
      actor_name: 'admin',
      details: { test: true },
      timestamp: new Date().toISOString()
    });

    const events = await store.listAuditEvents();
    expect(events.some((e) => e.action === 'test:action')).toBe(true);
  });
});
