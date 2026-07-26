import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import { randomBytes } from 'node:crypto';
import type { Request, Response, NextFunction } from 'express';

const BCRYPT_SALT_ROUNDS = 10;

function getBooleanEnv(name: string, fallback: boolean): boolean {
  const rawValue = process.env[name]?.trim();
  if (rawValue === undefined || rawValue === '') {
    return fallback;
  }

  const normalizedValue = rawValue.toLowerCase();
  if (['1', 'true', 'yes', 'on'].includes(normalizedValue)) {
    return true;
  }
  if (['0', 'false', 'no', 'off'].includes(normalizedValue)) {
    return false;
  }

  console.warn(
    `WARNING: ${name} is set to "${rawValue}", but expected a boolean. Using ${fallback}.`
  );
  return fallback;
}

function getCookieSameSiteEnv(): 'lax' | 'strict' | 'none' {
  const configuredValue = process.env['COOKIE_SAME_SITE']?.trim().toLowerCase();
  if (configuredValue === 'lax' || configuredValue === 'strict' || configuredValue === 'none') {
    return configuredValue;
  }

  if (configuredValue) {
    console.warn(
      `WARNING: COOKIE_SAME_SITE is set to "${configuredValue}", but expected one of: lax, strict, none. Using lax.`
    );
  }

  return 'lax';
}

function getCookieDomainEnv(): string | undefined {
  const configuredValue = process.env['COOKIE_DOMAIN']?.trim();
  return configuredValue ? configuredValue : undefined;
}

/**
 * JWT_SECRET must be set via an environment variable in any real deployment.
 * The fallback below only exists so the app still boots for local testing,
 * it is not safe to ship. A loud warning is logged if it is ever used.
 */
export function getJwtSecret(): string {
  const configuredSecret = process.env['JWT_SECRET']?.trim();
  if (configuredSecret) {
    return configuredSecret;
  }

  console.warn(
    'WARNING: JWT_SECRET is not set. Using an insecure development fallback. ' +
    'Set a real JWT_SECRET environment variable before deploying.'
  );
  return 'insecure-dev-secret-change-me';
}

export function getSessionCookieOptions(rememberMe: boolean, isProduction: boolean): {
  httpOnly: true;
  sameSite: 'lax' | 'strict' | 'none';
  secure: boolean;
  maxAge: number;
  domain?: string;
} {
  const sameSite = getCookieSameSiteEnv();
  const secure = getBooleanEnv('COOKIE_SECURE', isProduction);
  const domain = getCookieDomainEnv();

  return {
    httpOnly: true,
    sameSite,
    secure,
    maxAge: authCookieMaxAgeMs(rememberMe),
    ...(domain ? { domain } : {}),
  };
}

export const AUTH_COOKIE_NAME = 'coinforge_session';

const SESSION_DURATION_SECONDS = 7 * 24 * 60 * 60; // 7 days
const REMEMBER_ME_DURATION_SECONDS = 30 * 24 * 60 * 60; // 30 days

export interface AuthTokenPayload {
  userId: number;
}

export async function hashPassword(plainTextPassword: string): Promise<string> {
  return bcrypt.hash(plainTextPassword, BCRYPT_SALT_ROUNDS);
}

export async function verifyPassword(
  plainTextPassword: string,
  passwordHash: string
): Promise<boolean> {
  return bcrypt.compare(plainTextPassword, passwordHash);
}

export function signAuthToken(userId: number, rememberMe: boolean): string {
  const expiresIn = rememberMe ? REMEMBER_ME_DURATION_SECONDS : SESSION_DURATION_SECONDS;
  return jwt.sign({ userId } satisfies AuthTokenPayload, getJwtSecret(), { expiresIn });
}

export function verifyAuthToken(token: string): AuthTokenPayload | null {
  try {
    const decoded = jwt.verify(token, getJwtSecret());
    if (typeof decoded === 'object' && decoded !== null && 'userId' in decoded) {
      return { userId: Number((decoded as { userId: unknown }).userId) };
    }
    return null;
  } catch {
    return null;
  }
}

export function authCookieMaxAgeMs(rememberMe: boolean): number {
  const seconds = rememberMe ? REMEMBER_ME_DURATION_SECONDS : SESSION_DURATION_SECONDS;
  return seconds * 1000;
}

export const PASSWORD_RESET_TOKEN_TTL_MS = 30 * 60 * 1000; // 30 minutes

export function generateResetToken(): string {
  return randomBytes(32).toString('hex');
}

export interface AuthenticatedRequest extends Request {
  userId?: number;
}

/**
 * Reads the session cookie set at login/signup, verifies it, and attaches
 * the authenticated user's id to the request. Responds 401 if the cookie is
 * missing, expired, or otherwise invalid.
 */
export function requireAuth(req: AuthenticatedRequest, res: Response, next: NextFunction): void {
  const token = req.cookies?.[AUTH_COOKIE_NAME];

  if (typeof token !== 'string') {
    res.status(401).json({ error: 'Not logged in' });
    return;
  }

  const payload = verifyAuthToken(token);
  if (!payload) {
    res.status(401).json({ error: 'Session expired, please log in again' });
    return;
  }

  req.userId = payload.userId;
  next();
}
