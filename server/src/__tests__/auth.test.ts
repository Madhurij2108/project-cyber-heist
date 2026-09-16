import { describe, it, expect } from 'vitest';
import { signToken, verifyToken } from '../auth/jwt';
import { hashPassword, comparePassword } from '../auth/password';
import { hasPermission, hasMinimumRole } from '../auth/rbac';
import { JwtPayload } from '../types';

describe('Auth - JWT Helpers', () => {
  const samplePayload: JwtPayload = {
    id: 'usr-123',
    email: 'admin@cyberheist.local',
    username: 'admin',
    role: 'admin'
  };

  it('should sign and verify a valid JWT token', () => {
    const token = signToken(samplePayload);
    expect(token).toBeDefined();
    expect(typeof token).toBe('string');

    const decoded = verifyToken(token);
    expect(decoded).not.toBeNull();
    expect(decoded?.id).toBe(samplePayload.id);
    expect(decoded?.email).toBe(samplePayload.email);
    expect(decoded?.role).toBe(samplePayload.role);
  });

  it('should return null for tampered or invalid token', () => {
    const token = signToken(samplePayload);
    const tampered = token + 'tampered';
    const decoded = verifyToken(tampered);
    expect(decoded).toBeNull();
  });

  it('should return null for expired token', async () => {
    const token = signToken(samplePayload, '1ms');
    await new Promise((r) => setTimeout(r, 20));
    const decoded = verifyToken(token);
    expect(decoded).toBeNull();
  });
});

describe('Auth - Password Helpers', () => {
  it('should hash a password and verify correctly', async () => {
    const plain = 'SecretPassword123!';
    const hash = await hashPassword(plain);

    expect(hash).toBeDefined();
    expect(hash).not.toEqual(plain);

    const match = await comparePassword(plain, hash);
    expect(match).toBe(true);

    const wrongMatch = await comparePassword('WrongPassword', hash);
    expect(wrongMatch).toBe(false);
  });
});

describe('Auth - RBAC and Permissions', () => {
  it('admin should have full permissions', () => {
    expect(hasPermission('admin', 'projects:create')).toBe(true);
    expect(hasPermission('admin', 'projects:delete')).toBe(true);
    expect(hasPermission('admin', 'approvals:decide')).toBe(true);
    expect(hasPermission('admin', 'system:seed')).toBe(true);
  });

  it('operator should have operational permissions but not admin-only ones', () => {
    expect(hasPermission('operator', 'projects:create')).toBe(true);
    expect(hasPermission('operator', 'approvals:request')).toBe(true);
    expect(hasPermission('operator', 'approvals:decide')).toBe(false);
    expect(hasPermission('operator', 'projects:delete')).toBe(false);
  });

  it('analyst should have read permissions only', () => {
    expect(hasPermission('analyst', 'projects:read')).toBe(true);
    expect(hasPermission('analyst', 'projects:create')).toBe(false);
    expect(hasPermission('analyst', 'approvals:request')).toBe(false);
    expect(hasPermission('analyst', 'approvals:decide')).toBe(false);
  });

  it('should correctly evaluate role hierarchy', () => {
    expect(hasMinimumRole('admin', 'operator')).toBe(true);
    expect(hasMinimumRole('operator', 'operator')).toBe(true);
    expect(hasMinimumRole('analyst', 'operator')).toBe(false);
  });
});
