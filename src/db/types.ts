export interface Tag {
  id: string;
  name: string;
  color: string;
  icon: string; // Ionicons glyph name
  createdAt: number; // epoch ms
}

export interface SessionRecord {
  id: string;
  tagId: string | null;
  plannedSec: number;
  actualSec: number; // actual focused time (excludes paused), what counts toward totals
  startedAt: number; // epoch ms
  endedAt: number; // epoch ms
  completed: boolean; // reached zero vs. abandoned
  cancelReason: string | null;
}

export type NewSession = Omit<SessionRecord, 'id'>;
export type NewTag = Omit<Tag, 'id' | 'createdAt'>;

/** Short, collision-resistant local id (no native crypto dependency). */
export function genId(): string {
  return `${Date.now().toString(36)}-${Math.random().toString(36).slice(2, 10)}`;
}
