import { Router, Response } from 'express';
import { Store } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../auth/middleware';
import { validateApprovalInput } from '../auth/validation';
import { Approval } from '../types';

export function createApprovalsRouter(store: Store): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const projectId = req.query.projectId as string | undefined;
    const approvals = await store.listApprovals(projectId);
    res.json(approvals);
  });

  router.post('/', requirePermission('approvals:request'), async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateApprovalInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { project_id, comments } = req.body;
    const project = await store.getProject(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const id = `appr-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const approval: Approval = {
      id,
      project_id,
      requested_by: req.user!.id,
      status: 'pending',
      comments: comments || undefined,
      requested_at: now
    };

    await store.createApproval(approval);

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'approval:requested',
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'approval',
      target_id: approval.id,
      details: { project_id, comments },
      ip_address: req.ip || '127.0.0.1',
      timestamp: now
    });

    res.status(201).json(approval);
  });

  router.put('/:id', requirePermission('approvals:decide'), async (req: AuthenticatedRequest, res: Response) => {
    const { status, comments } = req.body;
    if (!status || !['approved', 'rejected'].includes(status)) {
      return res.status(400).json({ error: "Status must be 'approved' or 'rejected'" });
    }

    const existing = await store.getApproval(req.params.id);
    if (!existing) {
      return res.status(404).json({ error: 'Approval not found' });
    }

    const now = new Date().toISOString();
    const updated = await store.updateApproval(req.params.id, {
      status,
      approved_by: req.user!.id,
      comments: comments || existing.comments,
      decided_at: now
    });

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: `approval:${status}`,
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'approval',
      target_id: req.params.id,
      details: { status, project_id: existing.project_id },
      ip_address: req.ip || '127.0.0.1',
      timestamp: now
    });

    res.json(updated);
  });

  return router;
}
