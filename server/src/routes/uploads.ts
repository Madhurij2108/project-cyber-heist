import { Router, Response } from 'express';
import { Store } from '../db/store';
import { authenticate, requirePermission, AuthenticatedRequest } from '../auth/middleware';
import { validateUploadInput } from '../auth/validation';
import { Upload } from '../types';

export function createUploadsRouter(store: Store): Router {
  const router = Router();

  router.use(authenticate);

  router.get('/', async (req: AuthenticatedRequest, res: Response) => {
    const projectId = req.query.projectId as string | undefined;
    const uploads = await store.listUploads(projectId);
    res.json(uploads);
  });

  router.post('/', requirePermission('uploads:create'), async (req: AuthenticatedRequest, res: Response) => {
    const validation = validateUploadInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { project_id, file_name, file_size, mime_type, file_path } = req.body;
    const project = await store.getProject(project_id);
    if (!project) {
      return res.status(404).json({ error: 'Project not found' });
    }

    const id = `upl-${Date.now()}-${Math.random().toString(36).substring(2, 6)}`;
    const now = new Date().toISOString();

    const upload: Upload = {
      id,
      project_id,
      file_name: file_name.trim(),
      file_size: typeof file_size === 'number' ? file_size : 1024,
      mime_type: mime_type || 'application/octet-stream',
      file_path: file_path || `/uploads/${file_name.trim()}`,
      uploaded_by: req.user!.id,
      created_at: now
    };

    await store.createUpload(upload);

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'file:uploaded',
      actor_id: req.user!.id,
      actor_name: req.user!.username,
      target_type: 'upload',
      target_id: upload.id,
      details: { project_id, file_name: upload.file_name },
      ip_address: req.ip || '127.0.0.1',
      timestamp: now
    });

    res.status(201).json(upload);
  });

  return router;
}
