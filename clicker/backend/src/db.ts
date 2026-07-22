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
  } else {
    db = new SQL.Database();
    db.run(`
      CREATE TABLE saves (
        id INTEGER PRIMARY KEY,
        payload TEXT NOT NULL,
        updated_at INTEGER NOT NULL
      );
    `);
    persist(db);
  }

  return db;
}

function persist(database: Database): void {
  if (!existsSync(DATA_DIR)) {
    mkdirSync(DATA_DIR, { recursive: true });
  }
  const data = database.export();
  writeFileSync(DB_PATH, Buffer.from(data));
}

export async function loadSave(): Promise<{ payload: string; updatedAt: number } | null> {
  const database = await getDb();
  const result = database.exec('SELECT payload, updated_at FROM saves WHERE id = 1');

  if (result.length === 0 || result[0].values.length === 0) {
    return null;
  }

  const [payload, updatedAt] = result[0].values[0];
  return { payload: String(payload), updatedAt: Number(updatedAt) };
}

export async function writeSave(payload: string, updatedAt: number): Promise<void> {
  const database = await getDb();
  database.run('DELETE FROM saves WHERE id = 1');
  database.run('INSERT INTO saves (id, payload, updated_at) VALUES (1, ?, ?)', [payload, updatedAt]); //tokens to prevent SQL Injectoin
  persist(database);
}
