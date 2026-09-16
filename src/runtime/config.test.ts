import { describe, it } from 'node:test';
import assert from 'node:assert';
import { loadRuntimeConfig } from './config';

describe('Runtime Configuration Boundaries', () => {
  it('should load runtime config with fixed internal container ports by default', () => {
    const originalPort = process.env.PORT;
    const originalApiPort = process.env.API_PORT;
    const originalFrontendPort = process.env.FRONTEND_PORT;
    const originalDbPort = process.env.DB_PORT;

    delete process.env.PORT;
    delete process.env.API_PORT;
    delete process.env.FRONTEND_PORT;
    delete process.env.DB_PORT;

    const conf = loadRuntimeConfig();
    assert.strictEqual(conf.port, 8000);
    assert.strictEqual(conf.apiPort, 8000);
    assert.strictEqual(conf.frontendPort, 3000);
    assert.strictEqual(conf.dbPort, 5432);
    assert.strictEqual(conf.serviceName, 'project-cyber-heist-api');
    assert.strictEqual(conf.version, '0.1.0');

    if (originalPort) process.env.PORT = originalPort;
    if (originalApiPort) process.env.API_PORT = originalApiPort;
    if (originalFrontendPort) process.env.FRONTEND_PORT = originalFrontendPort;
    if (originalDbPort) process.env.DB_PORT = originalDbPort;
  });

  it('should respect custom environment overrides', () => {
    process.env.AIDLC_ENVIRONMENT = 'production';
    process.env.PORT = '8080';

    const conf = loadRuntimeConfig();
    assert.strictEqual(conf.environment, 'production');
    assert.strictEqual(conf.isProduction, true);
    assert.strictEqual(conf.port, 8080);

    delete process.env.AIDLC_ENVIRONMENT;
    delete process.env.PORT;
  });
});
