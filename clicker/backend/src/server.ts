import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import cors from 'cors';
import cookieParser from 'cookie-parser';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSaveForUser, writeSaveForUser } from './db';
import {
  createUser,
  findUserByEmail,
  findUserById,
  updateUserPassword,
  createPasswordResetToken,
  findPasswordResetByToken,
  markPasswordResetUsed,
  EmailAlreadyRegisteredError,
} from './db';
import {
  AUTH_COOKIE_NAME,
  AuthenticatedRequest,
  generateResetToken,
  getSessionCookieOptions,
  hashPassword,
  PASSWORD_RESET_TOKEN_TTL_MS,
  requireAuth,
  signAuthToken,
  verifyPassword,
} from './auth';

/**
 * sql.js's WASM loader was written for CommonJS and reads the bare globals
 * __dirname and __filename. Angular's server build bundles everything as
 * native ESM, where those globals do not exist, so any sql.js call throws
 * "ReferenceError: __dirname is not defined" the first time a save is
 * loaded or written. Polyfilling them on globalThis at startup, well before
 * the first request can trigger that code path, fixes this without
 * patching the dependency itself.
 */
if (typeof (globalThis as Record<string, unknown>)['__dirname'] === 'undefined') {
  const currentFilename = fileURLToPath(import.meta.url);
  (globalThis as Record<string, unknown>)['__filename'] = currentFilename;
  (globalThis as Record<string, unknown>)['__dirname'] = dirname(currentFilename);
}

const browserDistFolder = join(import.meta.dirname, '../browser');

/**
 * The frontend runs on its own dev server (a different port than this
 * backend), so cookies only flow between them if CORS explicitly allows
 * credentials for that one origin. A wildcard origin cannot be combined
 * with credentials per the CORS spec, so this must be a specific origin,
 * configurable for whatever port or domain the frontend actually runs on.
 *
 * If the frontend and backend are hosted on different domains, set
 * COOKIE_SAME_SITE=none and COOKIE_SECURE=true (and optionally COOKIE_DOMAIN)
 * so the session cookie can be sent cross-site.
 */
const FRONTEND_ORIGIN = process.env['FRONTEND_ORIGIN'] ?? 'http://localhost:4200';
const isProduction = process.env['NODE_ENV'] === 'production';

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(cors({ origin: FRONTEND_ORIGIN, credentials: true }));
app.use(express.json({ limit: '256kb' }));
app.use(cookieParser());

const EMAIL_PATTERN = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
const MIN_PASSWORD_LENGTH = 8;

function setSessionCookie(res: express.Response, userId: number, rememberMe: boolean): void {
  const token = signAuthToken(userId, rememberMe);
  res.cookie(AUTH_COOKIE_NAME, token, getSessionCookieOptions(rememberMe, isProduction));
}

function toPublicUser(user: { id: number; email: string }): { id: number; email: string } {
  return { id: user.id, email: user.email };
}

/**
 * Auth routes
 */
app.post('/api/auth/signup', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body ?? {};

    if (typeof email !== 'string' || !EMAIL_PATTERN.test(email)) {
      res.status(400).json({ error: 'Enter a valid email address' });
      return;
    }
    if (typeof password !== 'string' || password.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password needs at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    const passwordHash = await hashPassword(password);
    const user = await createUser(email, passwordHash);

    setSessionCookie(res, user.id, Boolean(rememberMe));
    res.status(201).json({ user: toPublicUser(user) });
  } catch (error) {
    if (error instanceof EmailAlreadyRegisteredError) {
      res.status(409).json({ error: 'That email is already registered' });
      return;
    }
    console.error('Signup failed', error);
    res.status(500).json({ error: 'Signup failed' });
  }
});

app.post('/api/auth/login', async (req, res) => {
  try {
    const { email, password, rememberMe } = req.body ?? {};

    if (typeof email !== 'string' || typeof password !== 'string') {
      res.status(400).json({ error: 'Email and password are required' });
      return;
    }

    const user = await findUserByEmail(email);
    if (!user) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }

    const passwordMatches = await verifyPassword(password, user.passwordHash);
    if (!passwordMatches) {
      res.status(401).json({ error: 'Incorrect email or password' });
      return;
    }

    setSessionCookie(res, user.id, Boolean(rememberMe));
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Login failed', error);
    res.status(500).json({ error: 'Login failed' });
  }
});

app.post('/api/auth/logout', (req, res) => {
  res.clearCookie(AUTH_COOKIE_NAME);
  res.json({ loggedOut: true });
});

app.get('/api/auth/me', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const user = await findUserById(req.userId!);
    if (!user) {
      res.status(401).json({ error: 'Not logged in' });
      return;
    }
    res.json({ user: toPublicUser(user) });
  } catch (error) {
    console.error('Failed to fetch current user', error);
    res.status(500).json({ error: 'Failed to fetch current user' });
  }
});

/**
 * Forgot / reset password.
 *
 * No email provider is wired up yet, so instead of the common but insecure
 * shortcut of handing the reset token back in the API response (which would
 * let anyone reset any account just by knowing its email address), the
 * token is only ever logged server-side. Swap the console.log below for a
 * real email send (Resend, Postmark, SendGrid, nodemailer+SMTP, etc.) once
 * you have a provider, everything else in this flow already works.
 *
 * The response is deliberately identical whether or not the email exists,
 * so this endpoint can't be used to discover which emails have accounts.
 */
app.post('/api/auth/forgot-password', async (req, res) => {
  try {
    const { email } = req.body ?? {};
    if (typeof email !== 'string') {
      res.status(400).json({ error: 'Email is required' });
      return;
    }

    const user = await findUserByEmail(email);
    if (user) {
      const token = generateResetToken();
      const expiresAt = Date.now() + PASSWORD_RESET_TOKEN_TTL_MS;
      await createPasswordResetToken(user.id, token, expiresAt);

      const resetUrl = `${FRONTEND_ORIGIN}/?resetToken=${token}`;
      console.log(`Password reset requested for ${user.email}. Reset link: ${resetUrl}`);
    }

    res.json({ message: 'If that email has an account, a reset link has been generated.' });
  } catch (error) {
    console.error('Forgot password request failed', error);
    res.status(500).json({ error: 'Something went wrong' });
  }
});

app.post('/api/auth/reset-password', async (req, res) => {
  try {
    const { token, newPassword } = req.body ?? {};

    if (typeof token !== 'string' || typeof newPassword !== 'string') {
      res.status(400).json({ error: 'Reset token and new password are required' });
      return;
    }
    if (newPassword.length < MIN_PASSWORD_LENGTH) {
      res.status(400).json({ error: `Password needs at least ${MIN_PASSWORD_LENGTH} characters` });
      return;
    }

    const reset = await findPasswordResetByToken(token);
    if (!reset || reset.used || reset.expiresAt < Date.now()) {
      res.status(400).json({ error: 'That reset link is invalid or has expired' });
      return;
    }

    const passwordHash = await hashPassword(newPassword);
    await updateUserPassword(reset.userId, passwordHash);
    await markPasswordResetUsed(token);

    res.json({ reset: true });
  } catch (error) {
    console.error('Password reset failed', error);
    res.status(500).json({ error: 'Password reset failed' });
  }
});

/**
 * Game save API. Each save is now tied to the logged-in account rather
 * than a single anonymous row, so a save request with no valid session
 * cookie is rejected before it ever reaches the database.
 */
app.get('/api/save', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const save = await loadSaveForUser(req.userId!);
    if (!save) {
      res.status(404).json({ found: false });
      return;
    }
    res.json({ found: true, payload: JSON.parse(save.payload), updatedAt: save.updatedAt });
  } catch (error) {
    console.error('Failed to load save', error);
    res.status(500).json({ error: 'Failed to load save' });
  }
});

app.post('/api/save', requireAuth, async (req: AuthenticatedRequest, res) => {
  try {
    const { payload, updatedAt } = req.body ?? {};
    if (!payload || typeof updatedAt !== 'number') {
      res.status(400).json({ error: 'Invalid save payload' });
      return;
    }
    await writeSaveForUser(req.userId!, JSON.stringify(payload), updatedAt);
    res.json({ saved: true });
  } catch (error) {
    console.error('Failed to write save', error);
    res.status(500).json({ error: 'Failed to write save' });
  }
});

/**
 * Serve static files from /browser
 */
app.use(
  express.static(browserDistFolder, {
    maxAge: '1y',
    index: false,
    redirect: false,
  }),
);

/**
 * Handle all other requests by rendering the Angular application.
 */
app.use((req, res, next) => {
  angularApp
    .handle(req)
    .then((response) =>
      response ? writeResponseToNodeResponse(response, res) : next(),
    )
    .catch(next);
});

/**
 * Start the server if this module is the main entry point, or it is ran via PM2.
 * The server listens on the port defined by the `PORT` environment variable, or defaults to 4000.
 */
if (isMainModule(import.meta.url) || process.env['pm_id']) {
  const port = process.env['PORT'] || 4000;
  app.listen(port, (error) => {
    if (error) {
      throw error;
    }

    console.log(`Node Express server listening on http://localhost:${port}`);
  });
}

/**
 * Request handler used by the Angular CLI (for dev-server and during build) or Firebase Cloud Functions.
 */
export const reqHandler = createNodeRequestHandler(app);
