import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  ROLE_PERMISSIONS,
  getRolePermissions,
  hasPermission,
  hasAllPermissions,
  hasAnyPermission,
  canAccessTenant,
} from './rbac';

describe('RBAC & Permission Boundaries', () => {
  it('admin role should have comprehensive permissions', () => {
    const adminPerms = getRolePermissions('admin');
    assert.ok(adminPerms.includes('WORKSPACE_MANAGE'));
    assert.ok(adminPerms.includes('USER_MANAGE'));
    assert.ok(adminPerms.includes('PROJECT_CREATE'));
    assert.ok(adminPerms.includes('PROJECT_DELETE'));
    assert.ok(adminPerms.includes('APPROVAL_REVIEW'));
    assert.ok(adminPerms.includes('AUDIT_VIEW'));
    assert.ok(adminPerms.includes('SYSTEM_CONFIG'));
  });

  it('operator role should have project creation and document upload permissions', () => {
    const opPerms = getRolePermissions('operator');
    assert.ok(opPerms.includes('PROJECT_CREATE'));
    assert.ok(opPerms.includes('PROJECT_UPDATE'));
    assert.ok(opPerms.includes('APPROVAL_SUBMIT'));
    assert.ok(opPerms.includes('DOCUMENT_UPLOAD'));
    assert.strictEqual(opPerms.includes('WORKSPACE_MANAGE'), false);
    assert.strictEqual(opPerms.includes('APPROVAL_REVIEW'), false);
  });

  it('reviewer role should have review permissions but not workspace manage', () => {
    const revPerms = getRolePermissions('reviewer');
    assert.ok(revPerms.includes('PROJECT_READ'));
    assert.ok(revPerms.includes('APPROVAL_REVIEW'));
    assert.strictEqual(revPerms.includes('WORKSPACE_MANAGE'), false);
    assert.strictEqual(revPerms.includes('PROJECT_CREATE'), false);
  });

  it('auditor role should be strictly read-only and audit focused', () => {
    const audPerms = getRolePermissions('auditor');
    assert.ok(audPerms.includes('AUDIT_VIEW'));
    assert.ok(audPerms.includes('PROJECT_READ'));
    assert.strictEqual(audPerms.includes('PROJECT_CREATE'), false);
    assert.strictEqual(audPerms.includes('APPROVAL_REVIEW'), false);
  });

  it('hasPermission and hasAllPermissions should accurately check permissions', () => {
    const perms = ['PROJECT_READ', 'PROJECT_CREATE'] as const;
    assert.strictEqual(hasPermission(perms as any, 'PROJECT_READ'), true);
    assert.strictEqual(hasPermission(perms as any, 'PROJECT_DELETE'), false);

    assert.strictEqual(
      hasAllPermissions(perms as any, ['PROJECT_READ', 'PROJECT_CREATE']),
      true
    );
    assert.strictEqual(
      hasAllPermissions(perms as any, ['PROJECT_READ', 'PROJECT_DELETE']),
      false
    );
  });

  it('hasAnyPermission should succeed if user has at least one required permission', () => {
    const perms = ['PROJECT_READ'] as const;
    assert.strictEqual(
      hasAnyPermission(perms as any, ['PROJECT_DELETE', 'PROJECT_READ']),
      true
    );
    assert.strictEqual(
      hasAnyPermission(perms as any, ['PROJECT_DELETE', 'PROJECT_CREATE']),
      false
    );
  });

  it('canAccessTenant should isolate cross-tenant access for non-admins', () => {
    assert.strictEqual(canAccessTenant('org-1', 'org-2', 'admin'), true);
    assert.strictEqual(canAccessTenant('org-1', 'org-1', 'operator'), true);
    assert.strictEqual(canAccessTenant('org-1', 'org-2', 'operator'), false);
  });
});
