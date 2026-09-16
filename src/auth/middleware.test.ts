import { describe, it } from 'node:test';
import assert from 'node:assert';
import { authenticate, authorize, authorizeAny, AuthenticatedRequest } from './middleware';
import { signToken } from './jwt';
import { JWTPayload } from './types';

describe('Auth Middleware Boundaries', () => {
  const payload: Omit<JWTPayload, 'iat' | 'exp'> = {
    userId: 'usr-mid-01',
    email: 'mid@cyberheist.local',
    role: 'operator',
    organizationId: 'ws-mid',
    permissions: ['PROJECT_CREATE', 'PROJECT_READ'],
  };

  it('should authenticate request with valid Bearer token', () => {
    const token = signToken(payload);
    let nextCalled = false;

    const req: any = {
      headers: { authorization: `Bearer ${token}` },
    };
    const res: any = {
      status: () => res,
      json: () => res,
    };
    const next = () => {
      nextCalled = true;
    };

    authenticate(req, res, next);
    assert.strictEqual(nextCalled, true);
    assert.strictEqual(req.user?.userId, payload.userId);
    assert.strictEqual(req.user?.email, payload.email);
  });

  it('should return 401 when Authorization header is missing', () => {
    let statusCode = 0;
    let resBody: any = null;

    const req: any = { headers: {} };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        resBody = body;
        return res;
      },
    };
    const next = () => {};

    authenticate(req, res, next);
    assert.strictEqual(statusCode, 401);
    assert.strictEqual(resBody.error, 'Unauthorized');
  });

  it('should return 401 when Authorization header is not Bearer format', () => {
    let statusCode = 0;
    const req: any = { headers: { authorization: 'Basic 12345' } };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: () => res,
    };
    authenticate(req, res, () => {});
    assert.strictEqual(statusCode, 401);
  });

  it('should allow authorized user through permission check', () => {
    let nextCalled = false;
    const req: any = {
      user: {
        permissions: ['PROJECT_CREATE', 'PROJECT_READ'],
      },
    };
    const res: any = {};
    const next = () => {
      nextCalled = true;
    };

    const middleware = authorize('PROJECT_CREATE');
    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
  });

  it('should return 403 when user lacks required permission', () => {
    let statusCode = 0;
    let resBody: any = null;

    const req: any = {
      user: {
        permissions: ['PROJECT_READ'],
      },
    };
    const res: any = {
      status: (code: number) => {
        statusCode = code;
        return res;
      },
      json: (body: any) => {
        resBody = body;
        return res;
      },
    };

    const middleware = authorize('WORKSPACE_MANAGE');
    middleware(req, res, () => {});
    assert.strictEqual(statusCode, 403);
    assert.strictEqual(resBody.error, 'Forbidden');
  });

  it('should support authorizeAny when user has at least one matching permission', () => {
    let nextCalled = false;
    const req: any = {
      user: {
        permissions: ['PROJECT_READ'],
      },
    };
    const res: any = {};
    const next = () => {
      nextCalled = true;
    };

    const middleware = authorizeAny(['WORKSPACE_MANAGE', 'PROJECT_READ']);
    middleware(req, res, next);
    assert.strictEqual(nextCalled, true);
  });
});
