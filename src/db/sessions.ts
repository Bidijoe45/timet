import { getDb, genId } from '@/db/index';
import type { NewSession, SessionRecord } from '@/db/types';

export async function insertSession(s: NewSession): Promise<SessionRecord> {
  const db = await getDb();
  const full: SessionRecord = { id: genId(), ...s };
  await db.runAsync(
    `INSERT INTO sessions
       (id, tag_id, planned_sec, actual_sec, started_at, ended_at, completed, cancel_reason)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    full.id,
    full.tagId,
    full.plannedSec,
    full.actualSec,
    full.startedAt,
    full.endedAt,
    full.completed ? 1 : 0,
    full.cancelReason,
  );
  return full;
}

interface SessionRow {
  id: string;
  tag_id: string | null;
  planned_sec: number;
  actual_sec: number;
  started_at: number;
  ended_at: number;
  completed: number;
  cancel_reason: string | null;
}

const toSession = (r: SessionRow): SessionRecord => ({
  id: r.id,
  tagId: r.tag_id,
  plannedSec: r.planned_sec,
  actualSec: r.actual_sec,
  startedAt: r.started_at,
  endedAt: r.ended_at,
  completed: r.completed === 1,
  cancelReason: r.cancel_reason,
});

/** Sessions whose start falls in [from, to). Used by the Summary screen (M3). */
export async function sessionsBetween(from: number, to: number): Promise<SessionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions WHERE started_at >= ? AND started_at < ? ORDER BY started_at DESC',
    from,
    to,
  );
  return rows.map(toSession);
}

export async function recentSessions(limit = 20): Promise<SessionRecord[]> {
  const db = await getDb();
  const rows = await db.getAllAsync<SessionRow>(
    'SELECT * FROM sessions ORDER BY started_at DESC LIMIT ?',
    limit,
  );
  return rows.map(toSession);
}
