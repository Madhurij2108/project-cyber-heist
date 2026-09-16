import { Request, Response, NextFunction } from 'express';
import { extractBearerToken, verifyToken } from './jwt';
import { JWTPayload, Permission } from './types';
import { hasPermission, hasAnyPermission } from './rbac';

export interface AuthenticatedRequest extends Request {
  user?: JWTPayload;
}

export function authenticate(
  req: AuthenticatedRequest,
  res: Response,
  next: NextFunction
): void {
  const token = extractBearerToken(req.headers.authorization);

  if (!token) {
    res.status(401).json({
      error: 'Unauthorized',
      message: 'Missing or invalid Authorization header. Expected Bearer token.',
    });
    return;
  }

  try {
    const payload = verifyToken(token);
    req.user = payload;
    next();
  } catch (err: any) {
    res.status(401).json({
      error: 'Unauthorized',
      message: err.message || 'Invalid or expired token',
    });
  }
}

export function authorize(requiredPermission: Permission) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before authorization check',
      });
      return;
    }

    if (!hasPermission(req.user.permissions, requiredPermission)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `User lacks required permission: ${requiredPermission}`,
      });
      return;
    }

    next();
  };
}

export function authorizeAny(requiredPermissions: Permission[]) {
  return (
    req: AuthenticatedRequest,
    res: Response,
    next: NextFunction
  ): void => {
    if (!req.user) {
      res.status(401).json({
        error: 'Unauthorized',
        message: 'Authentication required before authorization check',
      });
      return;
    }

    if (!hasAnyPermission(req.user.permissions, requiredPermissions)) {
      res.status(403).json({
        error: 'Forbidden',
        message: `User lacks required permissions. Requires one of: ${requiredPermissions.join(', ')}`,
      });
      return;
    }

    next();
  };
}
