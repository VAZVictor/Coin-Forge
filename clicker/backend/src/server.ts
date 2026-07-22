import {
  AngularNodeAppEngine,
  createNodeRequestHandler,
  isMainModule,
  writeResponseToNodeResponse,
} from '@angular/ssr/node';
import express from 'express';
import cors from 'cors';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';
import { loadSave, writeSave } from './db';

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

const app = express();
const angularApp = new AngularNodeAppEngine();

app.use(cors());
app.use(express.json({ limit: '256kb' }));

/**
 * Game save API. Stores a single serialized game state as JSON, keyed to one row,
 * since this is a single player local game with no account system.
 */
app.get('/api/save', async (req, res) => {
  try {
    const save = await loadSave();
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

app.post('/api/save', async (req, res) => {
  try {
    const { payload, updatedAt } = req.body ?? {};
    if (!payload || typeof updatedAt !== 'number') {
      res.status(400).json({ error: 'Invalid save payload' });
      return;
    }
    await writeSave(JSON.stringify(payload), updatedAt);
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
