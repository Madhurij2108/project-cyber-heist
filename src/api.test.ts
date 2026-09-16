import { describe, it, before, after } from 'node:test';
import assert from 'node:assert';
import http from 'node:http';
import { app } from './index';
import { seedDatabase } from './seed/seedRunner';

describe('API & Runtime Integration Boundaries', () => {
  let server: http.Server;
  let baseUrl: string;

  before(async () => {
    seedDatabase();
    await new Promise<void>((resolve) => {
      server = app.listen(0, '127.0.0.1', () => {
        const address = server.address() as any;
        baseUrl = `http://127.0.0.1:${address.port}`;
        resolve();
      });
    });
  });

  after(async () => {
    await new Promise<void>((resolve) => {
      server.close(() => resolve());
    });
  });

  it('GET /health returns 200 with service health status', async () => {
    const res = await fetch(`${baseUrl}/health`);
    assert.strictEqual(res.status, 200);

    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.strictEqual(body.service, 'project-cyber-heist-api');
    assert.ok(body.version);
    assert.ok(body.timestamp);
    assert.ok(body.environment);
  });

  it('GET / and GET /login serve interactive reviewer console with demo credentials', async () => {
    const rootRes = await fetch(`${baseUrl}/`);
    assert.strictEqual(rootRes.status, 200);
    assert.ok(rootRes.headers.get('content-type')?.includes('text/html'));
    const rootHtml = await rootRes.text();
    assert.ok(rootHtml.includes('Project Cyber Heist // Operations Terminal'));
    assert.ok(rootHtml.includes('admin@cyberheist.local'));
    assert.ok(rootHtml.includes('reviewer@cyberheist.local'));
    assert.ok(rootHtml.includes('ChangeMe!12345'));

    const loginRes = await fetch(`${baseUrl}/login`);
    assert.strictEqual(loginRes.status, 200);
    assert.ok(loginRes.headers.get('content-type')?.includes('text/html'));
  });

  it('POST /api/auth/login validates credentials and returns token + session', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    assert.strictEqual(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.token);
    assert.strictEqual(body.user.role, 'admin');
    assert.strictEqual(body.user.email, 'admin@cyberheist.local');
    assert.ok(body.user.permissions.includes('WORKSPACE_MANAGE'));
    assert.ok(body.user.permissions.includes('AUDIT_VIEW'));
  });

  it('POST /api/auth/login allows reviewer to log in with appropriate role & permissions', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reviewer@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    assert.strictEqual(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.token);
    assert.strictEqual(body.user.role, 'reviewer');
    assert.ok(body.user.permissions.includes('APPROVAL_REVIEW'));
    assert.strictEqual(body.user.permissions.includes('WORKSPACE_MANAGE'), false);
  });

  it('POST /api/auth/login rejects invalid credentials', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cyberheist.local',
        password: 'WrongPassword!',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/auth/login rejects unknown user', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'nonexistent@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    assert.strictEqual(res.status, 401);
  });

  it('POST /api/auth/login rejects malformed input or missing fields', async () => {
    const res = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ email: 'notanemail' }),
    });
    assert.strictEqual(res.status, 400);
  });

  it('POST /api/auth/register registers new user and issues session token', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'New Operative',
        email: 'operative@cyberheist.local',
        password: 'SecurePassword123!',
        role: 'operator',
      }),
    });
    assert.strictEqual(res.status, 201);

    const body = (await res.json()) as any;
    assert.ok(body.token);
    assert.strictEqual(body.user.email, 'operative@cyberheist.local');
    assert.strictEqual(body.user.role, 'operator');
  });

  it('POST /api/auth/register rejects duplicate email with 409 CONFLICT', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        name: 'Duplicate Admin',
        email: 'admin@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    assert.strictEqual(res.status, 409);
  });

  it('POST /api/auth/register rejects weak password or missing name', async () => {
    const res = await fetch(`${baseUrl}/api/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'weak@cyberheist.local',
        password: '123',
      }),
    });
    assert.strictEqual(res.status, 400);
  });

  it('GET /api/auth/me returns authenticated user details', async () => {
    // Login to get token
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token } = (await loginRes.json()) as any;

    const meRes = await fetch(`${baseUrl}/api/auth/me`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(meRes.status, 200);

    const meBody = (await meRes.json()) as any;
    assert.strictEqual(meBody.user.email, 'admin@cyberheist.local');
    assert.strictEqual(meBody.user.role, 'admin');
  });

  it('GET /api/auth/verify confirms valid token and payload', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token } = (await loginRes.json()) as any;

    const verifyRes = await fetch(`${baseUrl}/api/auth/verify`, {
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(verifyRes.status, 200);
    const verifyBody = (await verifyRes.json()) as any;
    assert.strictEqual(verifyBody.valid, true);
    assert.strictEqual(verifyBody.user.email, 'admin@cyberheist.local');
  });

  it('POST /api/auth/logout logs out session', async () => {
    const loginRes = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token } = (await loginRes.json()) as any;

    const logoutRes = await fetch(`${baseUrl}/api/auth/logout`, {
      method: 'POST',
      headers: { Authorization: `Bearer ${token}` },
    });
    assert.strictEqual(logoutRes.status, 200);
  });

  it('GET /api/seed/summary provides safe non-production reviewer credentials', async () => {
    const res = await fetch(`${baseUrl}/api/seed/summary`);
    assert.strictEqual(res.status, 200);

    const body = (await res.json()) as any;
    assert.ok(body.users.length > 0);
    assert.ok(body.metrics.projects > 0);
  });

  it('POST /api/seed/reset resets database data deterministically', async () => {
    const res = await fetch(`${baseUrl}/api/seed/reset`, { method: 'POST' });
    assert.strictEqual(res.status, 200);

    const body = (await res.json()) as any;
    assert.strictEqual(body.status, 'ok');
    assert.ok(body.summary.metrics.projects >= 3);
  });

  it('Projects API: CRUD, status transitions, and authorization', async () => {
    // 1. Login as operator
    const opLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operator@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: opToken } = (await opLogin.json()) as any;

    // 2. List projects
    const listRes = await fetch(`${baseUrl}/api/projects`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert.strictEqual(listRes.status, 200);
    const projects = (await listRes.json()) as any;
    assert.ok(projects.length >= 3);

    // 3. Create new project
    const createRes = await fetch(`${baseUrl}/api/projects`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        title: 'Project Apex Infiltration',
        codeName: 'APEX-INFIL',
        target: 'Apex Central Core',
        estimatedTake: 8000000,
        riskLevel: 'high',
      }),
    });
    assert.strictEqual(createRes.status, 201);
    const createdProject = (await createRes.json()) as any;
    assert.strictEqual(createdProject.status, 'draft');

    // 4. Update status draft -> in_review
    const statusRes = await fetch(`${baseUrl}/api/projects/${createdProject.id}/status`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ status: 'in_review' }),
    });
    assert.strictEqual(statusRes.status, 200);
    const updated = (await statusRes.json()) as any;
    assert.strictEqual(updated.status, 'in_review');
  });

  it('Approvals API: submit and review flow', async () => {
    // Login as operator
    const opLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operator@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: opToken } = (await opLogin.json()) as any;

    // Submit approval for project PRJ-HEIST-003
    const submitRes = await fetch(`${baseUrl}/api/approvals`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        projectId: 'PRJ-HEIST-003',
        notes: 'Ready for heist approval review',
      }),
    });
    assert.strictEqual(submitRes.status, 201);
    const approval = (await submitRes.json()) as any;
    assert.strictEqual(approval.status, 'pending');

    // Operator cannot review approval (lacks APPROVAL_REVIEW)
    const opReview = await fetch(`${baseUrl}/api/approvals/${approval.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ status: 'approved' }),
    });
    assert.strictEqual(opReview.status, 403);

    // Login as reviewer
    const revLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reviewer@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: revToken } = (await revLogin.json()) as any;

    // Reviewer approves the request
    const revReview = await fetch(`${baseUrl}/api/approvals/${approval.id}`, {
      method: 'PATCH',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${revToken}`,
      },
      body: JSON.stringify({ status: 'approved', notes: 'Approved by handler' }),
    });
    assert.strictEqual(revReview.status, 200);
    const approved = (await revReview.json()) as any;
    assert.strictEqual(approved.status, 'approved');

    // Verify project PRJ-HEIST-003 auto-transitioned to 'approved'
    const projRes = await fetch(`${baseUrl}/api/projects/PRJ-HEIST-003`, {
      headers: { Authorization: `Bearer ${revToken}` },
    });
    assert.strictEqual(projRes.status, 200);
    const proj = (await projRes.json()) as any;
    assert.strictEqual(proj.status, 'approved');
  });

  it('Comments and Documents API integration', async () => {
    const opLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operator@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: opToken } = (await opLogin.json()) as any;

    // Add comment
    const commentRes = await fetch(`${baseUrl}/api/projects/PRJ-HEIST-001/comments`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({ content: 'Infiltration tunnel secure.' }),
    });
    assert.strictEqual(commentRes.status, 201);

    // List comments
    const listComments = await fetch(`${baseUrl}/api/projects/PRJ-HEIST-001/comments`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert.strictEqual(listComments.status, 200);
    const comments = (await listComments.json()) as any;
    assert.ok(comments.some((c: any) => c.content === 'Infiltration tunnel secure.'));

    // Upload document metadata
    const docRes = await fetch(`${baseUrl}/api/projects/PRJ-HEIST-001/documents`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${opToken}`,
      },
      body: JSON.stringify({
        title: 'Laser Grid Map',
        fileType: 'application/pdf',
        sizeBytes: 524288,
        checksum: '123456abcdef',
      }),
    });
    assert.strictEqual(docRes.status, 201);

    // List documents
    const listDocs = await fetch(`${baseUrl}/api/projects/PRJ-HEIST-001/documents`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert.strictEqual(listDocs.status, 200);
    const docs = (await listDocs.json()) as any;
    assert.ok(docs.some((d: any) => d.title === 'Laser Grid Map'));
  });

  it('Audit API: enforces AUDIT_VIEW permission boundary', async () => {
    // Login as operator (does not have AUDIT_VIEW)
    const opLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'operator@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: opToken } = (await opLogin.json()) as any;

    const opAudit = await fetch(`${baseUrl}/api/audit`, {
      headers: { Authorization: `Bearer ${opToken}` },
    });
    assert.strictEqual(opAudit.status, 403);

    // Login as auditor (has AUDIT_VIEW)
    const audLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'auditor@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: audToken } = (await audLogin.json()) as any;

    const audAudit = await fetch(`${baseUrl}/api/audit`, {
      headers: { Authorization: `Bearer ${audToken}` },
    });
    assert.strictEqual(audAudit.status, 200);
    const auditLogs = (await audAudit.json()) as any;
    assert.ok(auditLogs.length > 0);
  });

  it('RBAC boundary blocks non-admin from admin-only WORKSPACE_MANAGE endpoint', async () => {
    const revLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'reviewer@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: revToken } = (await revLogin.json()) as any;

    const blockRes = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${revToken}`,
      },
      body: JSON.stringify({ name: 'Syndicate Beta', slug: 'beta' }),
    });
    assert.strictEqual(blockRes.status, 403);

    // Admin should succeed
    const adminLogin = await fetch(`${baseUrl}/api/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        email: 'admin@cyberheist.local',
        password: 'ChangeMe!12345',
      }),
    });
    const { token: adminToken } = (await adminLogin.json()) as any;

    const adminRes = await fetch(`${baseUrl}/api/workspaces`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        Authorization: `Bearer ${adminToken}`,
      },
      body: JSON.stringify({ name: 'Syndicate Beta', slug: 'beta' }),
    });
    assert.strictEqual(adminRes.status, 201);
  });
});
