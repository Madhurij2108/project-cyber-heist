import { Router, Response } from 'express';
import { Store } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../auth/middleware';
import { validateCommentInput } from '../auth/validation';
import { Comment } from '../types';

export function createCommentsRouter(store: Store): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const projectId = req.query.projectId as string | undefined;
    const comments = await store.listComments(projectId);
    res.json(comments);
  });

  router.post('/', requirePermission('comments:create'), async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateCommentInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { project_id, content } = req.body;
    const project = await store.getProject(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const id = `comm-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const comment: Comment = {
      id,
      project_id,
      author_id: req.user!.id,
      author_name: req.user!.username,
      content: content.trim(),
      created_at: now
    };

    await store.createComment(comment);

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'comment:added',
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'comment',
      target_id: comment.id,
      details: { project_id },
      ip_address: req.ip || '127.0.0.1',
      timestamp: now
    });

    res.status(201).json(comment);
  });

  return router;
}
