import initSqlJs, { Database } from 'sql.js';
import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';
import { createRequire } from 'node:module';

const DATA_DIR = join(import.meta.dirname, '../data');
const DB_PATH = join(DATA_DIR, 'game.sqlite');

let db: Database | null = null;

async function getDb(): Promise<Database> {
  if (db) {
    return db;
  }

  const require = createRequire(import.meta.url);
  const wasmPath = require.resolve('sql.js/dist/sql-wasm.wasm');
  const wasmFileBuffer = readFileSync(wasmPath);
  const wasmBinary = wasmFileBuffer.buffer.slice(
    wasmFileBuffer.byteOffset,
    wasmFileBuffer.byteOffset + wasmFileBuffer.byteLength
  ) as ArrayBuffer;
  const SQL = await initSqlJs({ wasmBinary });

  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }

  if (existsSync(DB_PATH)) {
    const fileBuffer = readFileSync(DB_PATH);
    db = new SQL.Database(fileBuffer);
    ensureSchema(db);
  } else {
    db = new SQL.Database();
    ensureSchema(db);
    persist(db);
  }

  return db;
}

/**
 * CREATE TABLE IF NOT EXISTS makes this safe to run against either a brand
 * new database file or an existing one, so opening an older saves-only
 * database (from before accounts existed) just adds the missing tables
 * rather than failing.
 */
function ensureSchema(database: Database): void {
  database.run(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT NOT NULL UNIQUE,
      password_hash TEXT NOT NULL,
      created_at INTEGER NOT NULL,
      is_vip INTEGER NOT NULL DEFAULT 0
    );

    CREATE TABLE IF NOT EXISTS saves (
      user_id INTEGER PRIMARY KEY,
      payload TEXT NOT NULL,
      updated_at INTEGER NOT NULL,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );

    CREATE TABLE IF NOT EXISTS password_resets (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER NOT NULL,
      token TEXT NOT NULL UNIQUE,
      expires_at INTEGER NOT NULL,
      used INTEGER NOT NULL DEFAULT 0,
      FOREIGN KEY (user_id) REFERENCES users(id)
    );
  `);

  // Safely migrate existing databases that don't have the 'is_vip' column yet
  try {
    database.run(`ALTER TABLE users ADD COLUMN is_vip INTEGER NOT NULL DEFAULT 0`);
  } catch (error) {
    // If the column already exists, SQLite throws a "duplicate column name" error.
    // We catch and ignore it so the app boots normally.
    console.log('Database migration: is_vip column already exists.');
  }
}

function persist(database: Database): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = database.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

export interface UserRecord {
  id: number;
  email: string;
  passwordHash: string;
  createdAt: number;
  isVip: boolean;
}

export class EmailAlreadyRegisteredError extends Error {
  constructor(email: string) {
    super(`Email already registered: ${email}`);
    this.name = 'EmailAlreadyRegisteredError';
  }
}

export async function createUser(email: string, passwordHash: string, isVip = false): Promise<UserRecord> {
  const database = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const existing = database.exec('SELECT id FROM users WHERE email = ?', [normalizedEmail]);
  if (existing.length > 0 && existing[0].values.length > 0) {
    throw new EmailAlreadyRegisteredError(normalizedEmail);
  }

  const createdAt = Date.now();
  database.run('INSERT INTO users (email, password_hash, created_at, is_vip) VALUES (?, ?, ?, ?)', [
    normalizedEmail,
    passwordHash,
    createdAt,
    isVip ? 1 : 0
  ]);

  const idResult = database.exec('SELECT last_insert_rowid()');
  const id = Number(idResult[0].values[0][0]);

  persist(database);

  return { id, email: normalizedEmail, passwordHash, createdAt, isVip };
}

export async function findUserByEmail(email: string): Promise<UserRecord | null> {
  const database = await getDb();
  const normalizedEmail = email.trim().toLowerCase();

  const result = database.exec(
    'SELECT id, email, password_hash, created_at, is_vip FROM users WHERE email = ?',
    [normalizedEmail]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const [id, userEmail, passwordHash, createdAt, isVip] = result[0].values[0];
  return {
    id: Number(id),
    email: String(userEmail),
    passwordHash: String(passwordHash),
    createdAt: Number(createdAt),
    isVip: Number(isVip) === 1 // <-- ADD THIS
  };
}

export async function findUserById(id: number): Promise<UserRecord | null> {
  const database = await getDb();

  const result = database.exec(
    'SELECT id, email, password_hash, created_at, is_vip FROM users WHERE id = ?',
    [id]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const [userId, userEmail, passwordHash, createdAt, isVip] = result[0].values[0];
  return {
    id: Number(userId),
    email: String(userEmail),
    passwordHash: String(passwordHash),
    createdAt: Number(createdAt),
    isVip: Number(isVip) === 1 // <-- This was missing
  };
}

export async function updateUserPassword(userId: number, passwordHash: string): Promise<void> {
  const database = await getDb();
  database.run('UPDATE users SET password_hash = ? WHERE id = ?', [passwordHash, userId]);
  persist(database);
}

export async function loadSaveForUser(
  userId: number
): Promise<{ payload: string; updatedAt: number } | null> {
  const database = await getDb();
  const result = database.exec('SELECT payload, updated_at FROM saves WHERE user_id = ?', [
    userId
  ]);

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const [payload, updatedAt] = result[0].values[0];
  return { payload: String(payload), updatedAt: Number(updatedAt) };
}

export async function writeSaveForUser(
  userId: number,
  payload: string,
  updatedAt: number
): Promise<void> {
  const database = await getDb();
  database.run('DELETE FROM saves WHERE user_id = ?', [userId]);
  database.run('INSERT INTO saves (user_id, payload, updated_at) VALUES (?, ?, ?)', [
    userId,
    payload,
    updatedAt
  ]); // parameterized to prevent SQL injection
  persist(database);
}

export async function createPasswordResetToken(
  userId: number,
  token: string,
  expiresAt: number
): Promise<void> {
  const database = await getDb();
  database.run(
    'INSERT INTO password_resets (user_id, token, expires_at, used) VALUES (?, ?, ?, 0)',
    [userId, token, expiresAt]
  );
  persist(database);
}

export interface PasswordResetRecord {
  userId: number;
  expiresAt: number;
  used: boolean;
}

export async function findPasswordResetByToken(
  token: string
): Promise<PasswordResetRecord | null> {
  const database = await getDb();
  const result = database.exec(
    'SELECT user_id, expires_at, used FROM password_resets WHERE token = ?',
    [token]
  );

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const [userId, expiresAt, used] = result[0].values[0];
  return { userId: Number(userId), expiresAt: Number(expiresAt), used: Number(used) === 1 };
}

export async function markPasswordResetUsed(token: string): Promise<void> {
  const database = await getDb();
  database.run('UPDATE password_resets SET used = 1 WHERE token = ?', [token]);
  persist(database);
}

export async function setUserVip(userId: number): Promise<void> {
  const database = await getDb();
  database.run('UPDATE users SET is_vip = 1 WHERE id = ?', [userId]);
  persist(database);
}
