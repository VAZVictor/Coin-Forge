/**
 * The Express + sql.js backend (see clicker/backend/src/server.ts) runs on
 * its own port, separate from the Angular dev server. Point this at
 * wherever that server is actually reachable; for local development that
 * is the backend's `npm start` on port 4000.
 */
export const BACKEND_BASE_URL = 'http://localhost:4000';
