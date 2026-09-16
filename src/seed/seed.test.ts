import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { seedDatabase, resetDatabase, getSeedSummary } from './seedRunner';
import { store } from '../domain/store';
import { verifyPassword } from '../auth/password';

describe('Seed Data & Review Boundaries', () => {
  beforeEach(() => {
    seedDatabase();
  });

  it('should initialize deterministic seed dataset', () => {
    assert.strictEqual(store.workspaces.size, 1);
    assert.strictEqual(store.users.size, 4);
    assert.strictEqual(store.projects.size, 3);
    assert.strictEqual(store.approvals.size, 2);
    assert.strictEqual(store.comments.size, 2);
    assert.strictEqual(store.documents.size, 2);
    assert.ok(store.auditEvents.length >= 1);
  });

  it('should include admin and reviewer accounts matching product specifications', () => {
    const admin = store.getUserByEmail('admin@cyberheist.local');
    assert.ok(admin);
    assert.strictEqual(admin?.role, 'admin');
    assert.strictEqual(
      verifyPassword('ChangeMe!12345', admin?.passwordHash, admin?.salt),
      true
    );

    const reviewer = store.getUserByEmail('reviewer@cyberheist.local');
    assert.ok(reviewer);
    assert.strictEqual(reviewer?.role, 'reviewer');
    assert.strictEqual(
      verifyPassword('ChangeMe!12345', reviewer?.passwordHash, reviewer?.salt),
      true
    );

    const operator = store.getUserByEmail('operator@cyberheist.local');
    assert.ok(operator);
    assert.strictEqual(operator?.role, 'operator');

    const auditor = store.getUserByEmail('auditor@cyberheist.local');
    assert.ok(auditor);
    assert.strictEqual(auditor?.role, 'auditor');
  });

  it('should provide non-production demo credentials in summary', () => {
    const summary = getSeedSummary();
    assert.strictEqual(summary.workspace.name, 'Cyber Heist Syndicate Alpha');
    assert.strictEqual(summary.users.length, 4);

    const adminSummary = summary.users.find((u) => u.role === 'admin');
    assert.strictEqual(adminSummary?.email, 'admin@cyberheist.local');
    assert.strictEqual(adminSummary?.password, 'ChangeMe!12345');
  });

  it('should reset data consistently upon request', () => {
    // Add temporary project
    store.addProject({
      id: 'PRJ-TEMP',
      title: 'Temp Project',
      codeName: 'TEMP',
      target: 'Temp Target',
      estimatedTake: 100,
      riskLevel: 'low',
      status: 'draft',
      organizationId: 'ws-syndicate-01',
      createdBy: 'usr-admin-01',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    assert.strictEqual(store.projects.size, 4);

    resetDatabase();
    assert.strictEqual(store.projects.size, 3);
    assert.strictEqual(store.getProject('PRJ-TEMP'), undefined);

    const resetAudit = store.listAuditEvents().find((e) => e.action === 'DATABASE_RESET');
    assert.ok(resetAudit);
  });
});
