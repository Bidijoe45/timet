import { genId, type NewSession, type SessionRecord } from '@/db/types';

// In-memory session store for the web preview (not persisted across reloads).
let sessions: SessionRecord[] = [];

export async function insertSession(s: NewSession): Promise<SessionRecord> {
  const full: SessionRecord = { id: genId(), ...s };
  sessions = [...sessions, full];
  return full;
}

export async function sessionsBetween(from: number, to: number): Promise<SessionRecord[]> {
  return sessions
    .filter((s) => s.startedAt >= from && s.startedAt < to)
    .sort((a, b) => b.startedAt - a.startedAt);
}

export async function recentSessions(limit = 20): Promise<SessionRecord[]> {
  return [...sessions].sort((a, b) => b.startedAt - a.startedAt).slice(0, limit);
}
