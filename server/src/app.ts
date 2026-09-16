import express, { Express, Request, Response } from 'express';
import cors from 'cors';
import path from 'path';
import fs from 'fs';
import { Store, defaultStore } from './db/store';
import { createAuthRouter } from './routes/auth';
import { createProjectsRouter } from './routes/projects';
import { createApprovalsRouter } from './routes/approvals';
import { createUploadsRouter } from './routes/uploads';
import { createCommentsRouter } from './routes/comments';
import { createAuditRouter } from './routes/audit';
import { createSeedRouter } from './routes/seed';

export function createApp(store: Store = defaultStore): Express {
  const app = express();

  app.use(cors());
  app.use(express.json());

  // Health check endpoint (fixed port/path contract)
  app.get('/health', (_req: Request, res: Response) => {
    res.status(200).json({ status: 'ok', service: 'project-cyber-heist-api' });
  });

  // API Routes
  app.use('/api/auth', createAuthRouter(store));
  app.use('/api/projects', createProjectsRouter(store));
  app.use('/api/approvals', createApprovalsRouter(store));
  app.use('/api/uploads', createUploadsRouter(store));
  app.use('/api/comments', createCommentsRouter(store));
  app.use('/api/audit', createAuditRouter(store));
  app.use('/api/seed', createSeedRouter(store));

  // Serve static client bundle if available
  const clientDistPaths = [
    path.join(__dirname, '../../client/dist'),
    path.join(__dirname, '../client/dist'),
    path.join(process.cwd(), 'client/dist'),
    path.join(process.cwd(), 'dist/client')
  ];

  let clientDist: string | null = null;
  for (const p of clientDistPaths) {
    if (fs.existsSync(p)) {
      clientDist = p;
      break;
    }
  }

  if (clientDist) {
    app.use(express.static(clientDist));
    app.get('*', (req: Request, res: Response, next) => {
      if (req.path.startsWith('/api') || req.path === '/health') {
        return next();
      }
      res.sendFile(path.join(clientDist!, 'index.html'));
    });
  }

  return app;
}
