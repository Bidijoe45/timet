import * as SQLite from 'expo-sqlite';

import { genId, type Tag } from '@/db/types';

const DB_NAME = 'timet.db';

let dbPromise: Promise<SQLite.SQLiteDatabase> | null = null;
let initialized = false;

/** Default tags seeded on first launch. */
const DEFAULT_TAGS: Omit<Tag, 'createdAt'>[] = [
  { id: 'seed-work', name: 'Work', color: '#0ea5e9', icon: 'briefcase' },
  { id: 'seed-study', name: 'Study', color: '#8b5cf6', icon: 'book' },
  { id: 'seed-exercise', name: 'Exercise', color: '#22c55e', icon: 'barbell' },
  { id: 'seed-reading', name: 'Reading', color: '#f59e0b', icon: 'library' },
];

export function getDb(): Promise<SQLite.SQLiteDatabase> {
  if (!dbPromise) dbPromise = SQLite.openDatabaseAsync(DB_NAME);
  return dbPromise;
}

/** Create tables and seed defaults. Safe to call repeatedly. */
export async function initDb(): Promise<void> {
  if (initialized) return;
  const db = await getDb();

  await db.execAsync(`
    PRAGMA journal_mode = WAL;
    CREATE TABLE IF NOT EXISTS tags (
      id TEXT PRIMARY KEY NOT NULL,
      name TEXT NOT NULL,
      color TEXT NOT NULL,
      icon TEXT NOT NULL,
      created_at INTEGER NOT NULL
    );
    CREATE TABLE IF NOT EXISTS sessions (
      id TEXT PRIMARY KEY NOT NULL,
      tag_id TEXT,
      planned_sec INTEGER NOT NULL,
      actual_sec INTEGER NOT NULL,
      started_at INTEGER NOT NULL,
      ended_at INTEGER NOT NULL,
      completed INTEGER NOT NULL,
      cancel_reason TEXT
    );
    CREATE INDEX IF NOT EXISTS idx_sessions_started_at ON sessions (started_at);
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY NOT NULL,
      value TEXT
    );
  `);

  const row = await db.getFirstAsync<{ count: number }>('SELECT COUNT(*) as count FROM tags');
  if (!row || row.count === 0) {
    const now = Date.now();
    for (const t of DEFAULT_TAGS) {
      await db.runAsync(
        'INSERT INTO tags (id, name, color, icon, created_at) VALUES (?, ?, ?, ?, ?)',
        t.id,
        t.name,
        t.color,
        t.icon,
        now,
      );
    }
  }

  initialized = true;
}

export { genId };
