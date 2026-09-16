import { describe, it, expect, beforeEach } from 'vitest';
import request from 'supertest';
import { createApp } from '../app';
import { Store } from '../db/store';
import { seedDatabase } from '../seed';

describe('API Integration Tests', () => {
  let app: any;
  let store: Store;
  let adminToken: string;
  let operatorToken: string;
  let analystToken: string;

  beforeEach(async () => {
    store = new Store();
    await store.init();
    await seedDatabase(store);
    app = createApp(store);

    // Login admin
    const adminRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'admin@cyberheist.local', password: 'Password123!' });
    adminToken = adminRes.body.token;

    // Login operator
    const opRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'operator@cyberheist.local', password: 'Password123!' });
    operatorToken = opRes.body.token;

    // Login analyst
    const anRes = await request(app)
      .post('/api/auth/login')
      .send({ email: 'analyst@cyberheist.local', password: 'Password123!' });
    analystToken = anRes.body.token;
  });

  describe('Healthcheck Gate', () => {
    it('GET /health returns 200 and ok status', async () => {
      const res = await request(app).get('/health');
      expect(res.status).toBe(200);
      expect(res.body.status).toBe('ok');
      expect(res.body.service).toBe('project-cyber-heist-api');
    });
  });

  describe('Authentication API', () => {
    it('POST /api/auth/register registers a new user and returns JWT token', async () => {
      const res = await request(app)
        .post('/api/auth/register')
        .send({
          username: 'ghost_protocol',
          email: 'ghost@cyberheist.local',
          password: 'Password123!',
          role: 'operator'
        });

      expect(res.status).toBe(201);
      expect(res.body.token).toBeDefined();
      expect(res.body.user.email).toBe('ghost@cyberheist.local');
      expect(res.body.user.role).toBe('operator');
      expect(res.body.user.password_hash).toBeUndefined();
    });

    it('POST /api/auth/login rejects invalid credentials', async () => {
      const res = await request(app)
        .post('/api/auth/login')
        .send({ email: 'admin@cyberheist.local', password: 'WrongPassword' });

      expect(res.status).toBe(401);
      expect(res.body.error).toBeDefined();
    });

    it('GET /api/auth/me returns current user for valid token', async () => {
      const res = await request(app)
        .get('/api/auth/me')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(res.body.user.email).toBe('admin@cyberheist.local');
      expect(res.body.user.role).toBe('admin');
    });

    it('GET /api/auth/me returns 401 without token', async () => {
      const res = await request(app).get('/api/auth/me');
      expect(res.status).toBe(401);
    });
  });

  describe('Projects API', () => {
    it('GET /api/projects returns seeded projects', async () => {
      const res = await request(app)
        .get('/api/projects')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThanOrEqual(3);
    });

    it('POST /api/projects creates a project for operator', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          title: 'Operation Silicon Mirage',
          description: 'Bypassing chip-level hardware security enclave.',
          target_system: 'Hardware Enclave 9',
          status: 'in_progress',
          risk_level: 'critical',
          budget: 2000000
        });

      expect(res.status).toBe(201);
      expect(res.body.title).toBe('Operation Silicon Mirage');
      expect(res.body.id).toBeDefined();
    });

    it('POST /api/projects rejects creation by analyst (insufficient role)', async () => {
      const res = await request(app)
        .post('/api/projects')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          title: 'Unauthorized Operation',
          target_system: 'Firewall',
          risk_level: 'low'
        });

      expect(res.status).toBe(403);
    });

    it('GET /api/projects/:id returns project details with approvals, uploads, comments', async () => {
      const res = await request(app)
        .get('/api/projects/proj-golden-gate')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(res.status).toBe(200);
      expect(res.body.id).toBe('proj-golden-gate');
      expect(Array.isArray(res.body.approvals)).toBe(true);
      expect(Array.isArray(res.body.uploads)).toBe(true);
      expect(Array.isArray(res.body.comments)).toBe(true);
    });
  });

  describe('Approvals API', () => {
    it('operator can request approval', async () => {
      const res = await request(app)
        .post('/api/approvals')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          project_id: 'proj-golden-gate',
          comments: 'Requesting emergency override for gateway test.'
        });

      expect(res.status).toBe(201);
      expect(res.body.status).toBe('pending');
    });

    it('admin can approve a pending approval', async () => {
      const res = await request(app)
        .put('/api/approvals/appr-01')
        .set('Authorization', `Bearer ${adminToken}`)
        .send({ status: 'approved', comments: 'Authorization granted.' });

      expect(res.status).toBe(200);
      expect(res.body.status).toBe('approved');
      expect(res.body.approved_by).toBeDefined();
    });

    it('operator cannot approve an approval (admin only)', async () => {
      const res = await request(app)
        .put('/api/approvals/appr-01')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({ status: 'approved' });

      expect(res.status).toBe(403);
    });
  });

  describe('Uploads & Comments API', () => {
    it('creates upload metadata and retrieves uploads', async () => {
      const uploadRes = await request(app)
        .post('/api/uploads')
        .set('Authorization', `Bearer ${operatorToken}`)
        .send({
          project_id: 'proj-golden-gate',
          file_name: 'cipher_key_map.bin',
          file_size: 8192,
          mime_type: 'application/octet-stream',
          file_path: '/uploads/cipher_key_map.bin'
        });

      expect(uploadRes.status).toBe(201);
      expect(uploadRes.body.file_name).toBe('cipher_key_map.bin');

      const listRes = await request(app)
        .get('/api/uploads?projectId=proj-golden-gate')
        .set('Authorization', `Bearer ${operatorToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.some((u: any) => u.file_name === 'cipher_key_map.bin')).toBe(true);
    });

    it('posts comment and retrieves comments', async () => {
      const commentRes = await request(app)
        .post('/api/comments')
        .set('Authorization', `Bearer ${analystToken}`)
        .send({
          project_id: 'proj-golden-gate',
          content: 'Audit review completed without anomalies.'
        });

      expect(commentRes.status).toBe(201);
      expect(commentRes.body.content).toBe('Audit review completed without anomalies.');

      const listRes = await request(app)
        .get('/api/comments?projectId=proj-golden-gate')
        .set('Authorization', `Bearer ${analystToken}`);

      expect(listRes.status).toBe(200);
      expect(listRes.body.some((c: any) => c.content === 'Audit review completed without anomalies.')).toBe(true);
    });
  });

  describe('Audit API', () => {
    it('GET /api/audit returns audit event trail', async () => {
      const res = await request(app)
        .get('/api/audit')
        .set('Authorization', `Bearer ${adminToken}`);

      expect(res.status).toBe(200);
      expect(Array.isArray(res.body)).toBe(true);
      expect(res.body.length).toBeGreaterThan(0);
    });
  });

  describe('Seed API', () => {
    it('POST /api/seed reseeds database safely', async () => {
      const res = await request(app).post('/api/seed');
      expect(res.status).toBe(200);
      expect(res.body.message).toContain('reseeded');
    });
  });
});
