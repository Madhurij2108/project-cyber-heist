import { describe, it } from 'node:test';
import assert from 'node:assert';
import { hashPassword, verifyPassword } from './password';

describe('Password Hashing Helpers', () => {
  it('should hash a password and verify it successfully', () => {
    const password = 'SuperSecretPassword!123';
    const { hash, salt } = hashPassword(password);

    assert.ok(hash);
    assert.ok(salt);
    assert.strictEqual(verifyPassword(password, hash, salt), true);
  });

  it('should reject an incorrect password', () => {
    const password = 'CorrectPassword!123';
    const { hash, salt } = hashPassword(password);

    assert.strictEqual(verifyPassword('WrongPassword!123', hash, salt), false);
  });

  it('should generate unique salts for the same password', () => {
    const password = 'IdenticalPassword!123';
    const res1 = hashPassword(password);
    const res2 = hashPassword(password);

    assert.notStrictEqual(res1.salt, res2.salt);
    assert.notStrictEqual(res1.hash, res2.hash);
  });

  it('should return false for malformed or empty inputs', () => {
    assert.strictEqual(verifyPassword('', 'hash', 'salt'), false);
    assert.strictEqual(verifyPassword(undefined, 'hash', 'salt'), false);
    assert.strictEqual(verifyPassword('pwd', '', 'salt'), false);
    assert.strictEqual(verifyPassword('pwd', 'hash', ''), false);
  });

  it('should throw when trying to hash an empty password', () => {
    assert.throws(() => hashPassword(''), /Password must not be empty/);
  });
});
