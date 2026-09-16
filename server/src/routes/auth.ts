import { Router, Request, Response } from 'express';
import { Store } from '../db/store';
import { hashPassword, comparePassword } from '../auth/password';
import { signToken } from '../auth/jwt';
import { validateRegisterInput, validateLoginInput } from '../auth/validation';
import { authenticate, AuthenticatedRequest } from '../auth/middleware';
import { User } from '../types';

export function createAuthRouter(store: Store): Router {
  const router = Router();

  router.post('/register', async (req: Request, res: Response) => {
    const validation = validateRegisterInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { username, email, password, role } = req.body;

    const existingEmail = await store.findUserByEmail(email);
    if (existingEmail) {
      return res.status(409).json({ error: 'Email already registered' });
    }

    const existingUsername = await store.findUserByUsername(username);
    if (existingUsername) {
      return res.status(409).json({ error: 'Username already taken' });
    }

    const password_hash = await hashPassword(password);
    const id = `user-${Date.now()}-${Math.random().toString(36).substring(2, 7)}`;
    const userRole = role || 'analyst';

    const user: User = {
      id,
      username,
      email,
      password_hash,
      role: userRole,
      created_at: new Date().toISOString()
    };

    await store.createUser(user);

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'user:registered',
      actor_id: user.id,
      actor_name: user.username,
      target_type: 'user',
      target_id: user.id,
      details: { email: user.email, role: user.role },
      ip_address: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    const { password_hash: _, ...safeUser } = user;
    return res.status(201).json({ user: safeUser, token });
  });

  router.post('/login', async (req: Request, res: Response) => {
    const validation = validateLoginInput(req.body);
    if (!validation.valid) {
      return res.status(400).json({ errors: validation.errors });
    }

    const { email, password } = req.body;
    const user = await store.findUserByEmail(email);
    if (!user) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const passwordMatches = await comparePassword(password, user.password_hash);
    if (!passwordMatches) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const token = signToken({
      id: user.id,
      email: user.email,
      username: user.username,
      role: user.role
    });

    await store.createAuditEvent({
      id: `audit-${Date.now()}`,
      action: 'user:login',
      actor_id: user.id,
      actor_name: user.username,
      target_type: 'user',
      target_id: user.id,
      details: { email: user.email },
      ip_address: req.ip || '127.0.0.1',
      timestamp: new Date().toISOString()
    });

    const { password_hash: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser, token });
  });

  router.get('/me', authenticate, async (req: AuthenticatedRequest, res: Response) => {
    if (!req.user) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const user = await store.findUserById(req.user.id);
    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    const { password_hash: _, ...safeUser } = user;
    return res.status(200).json({ user: safeUser });
  });

  return router;
}
