import crypto from 'node:crypto';

export interface PasswordHashResult {
  hash: string;
  salt: string;
}

export function hashPassword(
  password: string,
  existingSalt?: string
): PasswordHashResult {
  if (!password) {
    throw new Error('Password must not be empty');
  }

  const salt = existingSalt || crypto.randomBytes(16).toString('hex');
  const hash = crypto
    .pbkdf2Sync(password, salt, 10000, 64, 'sha512')
    .toString('hex');

  return { hash, salt };
}

export function verifyPassword(
  password?: string,
  storedHash?: string,
  salt?: string
): boolean {
  if (!password || !storedHash || !salt) {
    return false;
  }

  try {
    const { hash } = hashPassword(password, salt);
    return crypto.timingSafeEqual(
      Buffer.from(hash, 'hex'),
      Buffer.from(storedHash, 'hex')
    );
  } catch {
    return false;
  }
}
