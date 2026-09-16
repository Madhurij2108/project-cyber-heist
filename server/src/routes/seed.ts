import { Router, Request, Response } from 'express';
import { Store } from '../db/store';
import { seedDatabase } from '../seed';

export function createSeedRouter(store: Store): Router {
  const router = Router();

  router.post('/', async (req: Request, res: Response) => {
    try {
      await seedDatabase(store);
      return res.status(200).json({
        message: 'System successfully reset and reseeded with deterministic data',
        timestamp: new Date().toISOString()
      });
    } catch (err: any) {
      return res.status(500).json({ error: 'Seed failed', details: err.message });
    }
  });

  return router;
}
