import { Role, Permission } from './types';

export const ROLE_PERMISSIONS: Record<Role, Permission[]> = {
  admin: [
    'WORKSPACE_MANAGE',
    'USER_MANAGE',
    'PROJECT_CREATE',
    'PROJECT_READ',
    'PROJECT_UPDATE',
    'PROJECT_DELETE',
    'APPROVAL_SUBMIT',
    'APPROVAL_REVIEW',
    'COMMENT_CREATE',
    'DOCUMENT_UPLOAD',
    'DOCUMENT_READ',
    'AUDIT_VIEW',
    'SYSTEM_CONFIG',
  ],
  operator: [
    'PROJECT_CREATE',
    'PROJECT_READ',
    'PROJECT_UPDATE',
    'APPROVAL_SUBMIT',
    'COMMENT_CREATE',
    'DOCUMENT_UPLOAD',
    'DOCUMENT_READ',
  ],
  reviewer: [
    'PROJECT_READ',
    'APPROVAL_REVIEW',
    'COMMENT_CREATE',
    'DOCUMENT_READ',
  ],
  auditor: [
    'PROJECT_READ',
    'AUDIT_VIEW',
    'DOCUMENT_READ',
  ],
};

export function getRolePermissions(role: Role): Permission[] {
  return ROLE_PERMISSIONS[role] || [];
}

export function hasPermission(
  userPermissions: Permission[],
  requiredPermission: Permission
): boolean {
  return userPermissions.includes(requiredPermission);
}

export function hasAllPermissions(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.every((p) => userPermissions.includes(p));
}

export function hasAnyPermission(
  userPermissions: Permission[],
  requiredPermissions: Permission[]
): boolean {
  return requiredPermissions.some((p) => userPermissions.includes(p));
}

export function canAccessTenant(
  userOrgId: string,
  targetOrgId: string,
  userRole: Role
): boolean {
  if (userRole === 'admin') return true;
  return userOrgId === targetOrgId;
}
