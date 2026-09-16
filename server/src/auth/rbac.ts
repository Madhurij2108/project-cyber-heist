import { Role } from '../types';

export type Permission =
  | 'projects:read'
  | 'projects:create'
  | 'projects:update'
  | 'projects:delete'
  | 'approvals:read'
  | 'approvals:request'
  | 'approvals:decide'
  | 'uploads:read'
  | 'uploads:create'
  | 'comments:read'
  | 'comments:create'
  | 'audit:read'
  | 'system:seed';

const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'projects:read',
    'projects:create',
    'projects:update',
    'projects:delete',
    'approvals:read',
    'approvals:request',
    'approvals:decide',
    'uploads:read',
    'uploads:create',
    'comments:read',
    'comments:create',
    'audit:read',
    'system:seed'
  ],
  operator: [
    'projects:read',
    'projects:create',
    'projects:update',
    'approvals:read',
    'approvals:request',
    'uploads:read',
    'uploads:create',
    'comments:read',
    'comments:create',
    'audit:read'
  ],
  analyst: [
    'projects:read',
    'approvals:read',
    'uploads:read',
    'comments:read',
    'comments:create',
    'audit:read'
  ]
};

const ROLE_HIERARCHY: Record<Role, number> = {
  admin: 3,
  operator: 2,
  analyst: 1
};

export function hasPermission(role: Role, permission: Permission): boolean {
  const permissions = ROLE_PERMISSIONS[role];
  if (!permissions) return false;
  return permissions.includes(permission);
}

export function hasMinimumRole(userRole: Role, minimumRole: Role): boolean {
  return (ROLE_HIERARCHY[userRole] || 0) >= (ROLE_HIERARCHY[minimumRole] || 0);
}
