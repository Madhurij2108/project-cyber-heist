import jwt from 'jsonwebtoken';
import { JWTPayload } from './types';
import { config } from '../runtime/config';

export function signToken(
  payload: Omit<JWTPayload, 'iat' | 'exp'>,
  secret: string = config.jwtSecret,
  expiresIn: string = config.jwtExpiresIn
): string {
  return jwt.sign(payload, secret, {
    expiresIn: expiresIn as any,
  });
}

export function verifyToken(
  token: string,
  secret: string = config.jwtSecret
): JWTPayload {
  try {
    const decoded = jwt.verify(token, secret) as JWTPayload;
    return decoded;
  } catch (err: any) {
    throw new Error(`Token verification failed: ${err.message}`);
  }
}

export function decodeToken(token: string): JWTPayload | null {
  try {
    const decoded = jwt.decode(token) as JWTPayload | null;
    return decoded;
  } catch {
    return null;
  }
}

export function extractBearerToken(authHeader?: string): string | null {
  if (!authHeader) return null;
  const parts = authHeader.trim().split(' ');
  if (parts.length === 2 && parts[0].toLowerCase() === 'bearer') {
    return parts[1];
  }
  return null;
}
