import { describe, it } from 'node:test';
import assert from 'node:assert';
import { signToken, verifyToken, decodeToken, extractBearerToken } from './jwt';
import { JWTPayload } from './types';

describe('JWT Auth Helpers', () => {
  const mockPayload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: 'usr-test-1',
    email: 'tester@cyberheist.local',
    role: 'operator',
    organizationId: 'ws-test',
    permissions: ['PROJECT_CREATE', 'PROJECT_READ'],
  };

  it('should successfully sign and verify a token', () => {
    const token = signToken(mockPayload, 'secret-1234', '1h');
    assert.ok(typeof token === 'string');

    const decoded = verifyToken(token, 'secret-1234');
    assert.strictEqual(decoded.userId, mockPayload.userId);
    assert.strictEqual(decoded.email, mockPayload.email);
    assert.strictEqual(decoded.role, mockPayload.role);
    assert.deepStrictEqual(decoded.permissions, mockPayload.permissions);
  });

  it('should reject a token signed with a different secret', () => {
    const token = signToken(mockPayload, 'secret-alpha', '1h');
    assert.throws(
      () => verifyToken(token, 'secret-beta'),
      /Token verification failed/
    );
  });

  it('should reject an expired token', async () => {
    const token = signToken(mockPayload, 'secret-1234', '1ms');
    await new Promise((resolve) => setTimeout(resolve, 20));
    assert.throws(
      () => verifyToken(token, 'secret-1234'),
      /Token verification failed/
    );
  });

  it('should decode a token without verifying secret', () => {
    const token = signToken(mockPayload, 'secret-1234', '1h');
    const decoded = decodeToken(token);
    assert.ok(decoded);
    assert.strictEqual(decoded?.userId, mockPayload.userId);
  });

  it('should return null when decoding invalid token string', () => {
    const decoded = decodeToken('invalid.token.string');
    assert.strictEqual(decoded, null);
  });

  it('should extract token from Bearer authorization header', () => {
    const token = extractBearerToken('Bearer abc.def.ghi');
    assert.strictEqual(token, 'abc.def.ghi');

    assert.strictEqual(extractBearerToken('Basic 123'), null);
    assert.strictEqual(extractBearerToken(''), null);
    assert.strictEqual(extractBearerToken(undefined), null);
  });
});
