import { describe, it, beforeEach } from 'node:test';
import assert from 'node:assert';
import { DomainStore } from './store';
import { HeistProject, ApprovalRequest } from './types';

describe('Domain Store & Business Logic Boundaries', () => {
  let store: DomainStore;

  beforeEach(() => {
    store = new DomainStore();
  });

  it('should store and retrieve workspaces', () => {
    store.addWorkspace({
      id: 'ws-1',
      name: 'Alpha Syndicate',
      slug: 'alpha',
      tier: 'syndicate_elite',
      createdAt: new Date().toISOString(),
    });

    const ws = store.getWorkspace('ws-1');
    assert.strictEqual(ws?.name, 'Alpha Syndicate');
  });

  it('should manage projects and enforce lifecycle transitions', () => {
    const project: HeistProject = {
      id: 'p-1',
      title: 'Neon Vault Infiltration',
      codeName: 'NEON-VAULT',
      target: 'Central Bank',
      estimatedTake: 1000000,
      riskLevel: 'high',
      status: 'draft',
      organizationId: 'ws-1',
      createdBy: 'u-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };

    store.addProject(project);

    // Valid transition: draft -> in_review
    const updated = store.updateProjectStatus('p-1', 'in_review', 'u-1');
    assert.strictEqual(updated.status, 'in_review');

    // Valid transition: in_review -> approved
    const approved = store.updateProjectStatus('p-1', 'approved', 'u-1');
    assert.strictEqual(approved.status, 'approved');

    // Invalid transition: approved -> draft
    assert.throws(() => {
      store.updateProjectStatus('p-1', 'draft', 'u-1');
    }, /Invalid status transition/);
  });

  it('should review approvals and update linked project status', () => {
    const project: HeistProject = {
      id: 'p-2',
      title: 'Orbital Strike',
      codeName: 'ORBITAL',
      target: 'Satellite Link',
      estimatedTake: 5000000,
      riskLevel: 'extreme',
      status: 'in_review',
      organizationId: 'ws-1',
      createdBy: 'u-1',
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    };
    store.addProject(project);

    const approval: ApprovalRequest = {
      id: 'appr-1',
      projectId: 'p-2',
      requestedBy: 'u-1',
      status: 'pending',
      createdAt: new Date().toISOString(),
    };
    store.addApproval(approval);

    // Review approval to approved
    const reviewed = store.reviewApproval('appr-1', 'approved', 'reviewer-1', 'Looks solid');
    assert.strictEqual(reviewed.status, 'approved');
    assert.strictEqual(reviewed.reviewedBy, 'reviewer-1');

    // Linked project should auto-transition to approved
    const updatedProject = store.getProject('p-2');
    assert.strictEqual(updatedProject?.status, 'approved');
  });

  it('should store and retrieve comments and documents', () => {
    store.addComment({
      id: 'c-1',
      projectId: 'p-1',
      authorId: 'u-1',
      authorName: 'Ghost',
      content: 'ICE breaker calibrated.',
      createdAt: new Date().toISOString(),
    });

    const comments = store.listComments('p-1');
    assert.strictEqual(comments.length, 1);
    assert.strictEqual(comments[0].content, 'ICE breaker calibrated.');

    store.addDocument({
      id: 'd-1',
      projectId: 'p-1',
      title: 'Floorplan blueprint',
      fileType: 'application/pdf',
      sizeBytes: 2048,
      checksum: 'abc1234',
      uploadedBy: 'u-1',
      createdAt: new Date().toISOString(),
    });

    const docs = store.listDocuments('p-1');
    assert.strictEqual(docs.length, 1);
    assert.strictEqual(docs[0].title, 'Floorplan blueprint');
  });

  it('should log and filter audit events', () => {
    store.logAudit({
      actorId: 'u-1',
      actorEmail: 'u1@local.com',
      action: 'PROJECT_CREATE',
      resourceType: 'project',
      resourceId: 'p-1',
    });

    store.logAudit({
      actorId: 'u-2',
      actorEmail: 'u2@local.com',
      action: 'USER_LOGIN',
      resourceType: 'auth',
      resourceId: 'u-2',
    });

    const projectAudits = store.listAuditEvents('project');
    assert.strictEqual(projectAudits.length, 1);
    assert.strictEqual(projectAudits[0].action, 'PROJECT_CREATE');

    const allAudits = store.listAuditEvents();
    assert.strictEqual(allAudits.length, 2);
  });
});
