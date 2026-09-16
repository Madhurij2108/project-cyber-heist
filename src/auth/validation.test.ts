import { describe, it } from 'node:test';
import assert from 'node:assert';
import {
  isValidEmail,
  isValidPassword,
  validateLoginInput,
  validateRegisterInput,
  validateProjectInput,
} from './validation';

describe('Validation Helpers', () => {
  it('should validate valid email formats', () => {
    assert.strictEqual(isValidEmail('admin@cyberheist.local'), true);
    assert.strictEqual(isValidEmail('test.user@domain.com'), true);
    assert.strictEqual(isValidEmail('invalid-email'), false);
    assert.strictEqual(isValidEmail('@missinguser.com'), false);
    assert.strictEqual(isValidEmail('missingdomain@'), false);
    assert.strictEqual(isValidEmail(''), false);
  });

  it('should validate password length constraints', () => {
    assert.strictEqual(isValidPassword('12345678'), true);
    assert.strictEqual(isValidPassword('short'), false);
    assert.strictEqual(isValidPassword(''), false);
  });

  it('should validate complete login input', () => {
    const valid = validateLoginInput({
      email: 'admin@cyberheist.local',
      password: 'ChangeMe!12345',
    });
    assert.strictEqual(valid.isValid, true);
    assert.strictEqual(valid.errors.length, 0);
  });

  it('should reject missing email or password in login input', () => {
    const missingEmail = validateLoginInput({ password: '123' });
    assert.strictEqual(missingEmail.isValid, false);
    assert.ok(missingEmail.errors.some((e) => e.includes('Email')));

    const missingPassword = validateLoginInput({ email: 'test@local.com' });
    assert.strictEqual(missingPassword.isValid, false);
    assert.ok(missingPassword.errors.some((e) => e.includes('Password')));
  });

  it('should validate registration input with role checks', () => {
    const valid = validateRegisterInput({
      name: 'Agent Zero',
      email: 'zero@cyberheist.local',
      password: 'ValidPassword123!',
      role: 'operator',
    });
    assert.strictEqual(valid.isValid, true);

    const invalidRole = validateRegisterInput({
      name: 'Agent Zero',
      email: 'zero@cyberheist.local',
      password: 'ValidPassword123!',
      role: 'supervillain',
    });
    assert.strictEqual(invalidRole.isValid, false);
    assert.ok(invalidRole.errors.some((e) => e.includes('Role')));
  });

  it('should validate project input properly', () => {
    const valid = validateProjectInput({
      title: 'Neon Heist',
      codeName: 'NEON',
      target: 'Vault 42',
      riskLevel: 'high',
    });
    assert.strictEqual(valid.isValid, true);

    const missingTitle = validateProjectInput({
      codeName: 'NEON',
      target: 'Vault 42',
    });
    assert.strictEqual(missingTitle.isValid, false);

    const invalidRisk = validateProjectInput({
      title: 'Neon Heist',
      codeName: 'NEON',
      target: 'Vault 42',
      riskLevel: 'impossible',
    });
    assert.strictEqual(invalidRisk.isValid, false);
  });
});
