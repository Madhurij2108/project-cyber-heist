import { Router, Response } from 'express';
import { Store } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../auth/middleware';
import { validateProjectInput } from '../auth/validation';
import { Project } from '../types';

export function createProjectsRouter(store: Store): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const projects = await store.listProjects();
    res.json(projects);
  });

  router.get('/:id', async (req: AuthenticatedRequest, res: Response) => {
    const project = await store.getProject(req.params.id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }
    const approvals = await store.listApprovals(project.id);
    const uploads = await store.listUploads(project.id);
    const comments = await store.listComments(project.id);
    res.json({ ...project, approvals, uploads, comments });
  });

  router.post('/', requirePermission('projects:create'), async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateProjectInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { title, description, target_system, status, risk_level, budget } = req.body;
    const id = `proj-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const project: Project = {
      id,
      title: title.trim(),
      description: description ? description.trim() : '',
      target_system: target_system.trim(),
      status: status || 'draft',
      risk_level: risk_level || 'medium',
      budget: budget !== undefined ? Number(budget) : 0,
      owner_id: req.user!.id,
      created_at: now,
      updated_at: now
    };

    await store.createProject(project);

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'project:created',
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'project',
      target_id: project.id,
      details: { title: project.title, risk_level: project.risk_level },
      ip_address: req.ip || '127.0.0.1',
      timestamp: now
    });

    res.status(201).json(project);
  });

  router.put('/:id', requirePermission('projects:update'), async (req: AuthenticatedRequest, res: Response) => {
    const existing = await store.getProject(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const updated = await store.updateProject(req.params.id, req.body);

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'project:updated',
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'project',
      target_id: req.params.id,
      details: req.body,
      ip_address: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    res.json(updated);
  });

  router.delete('/:id', requirePermission('projects:delete'), async (req: AuthenticatedRequest, res: Response) => {
    const deleted = await store.deleteProject(req.params.id);
    if (!deleted) {
      return res.status(404).json({ error: 'Project not found' });
    }

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'project:deleted',
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'project',
      target_id: req.params.id,
      ip_address: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    res.json({ message: 'Project deleted successfully' });
  });

  return router;
}
