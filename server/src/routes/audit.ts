import { Router, Response } from 'express';
import { Store } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../auth/middleware';

export function createAuditRouter(store: Store): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', requirePermission('audit:read'), async (req: AuthenticatedRequest, res: Response) => {
    const limit = parseInt(req.query.limit as string, 10) || 50;
    const events = await store.listAuditEvents(limit);
    res.json(events);
  });

  return router;
}
