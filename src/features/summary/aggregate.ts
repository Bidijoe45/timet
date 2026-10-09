import type { SessionRecord, Tag } from '@/db/types';
import type { Bucket } from '@/features/summary/dateRange';

export interface TagSlice {
  id: string;
  name: string;
  color: string;
  sec: number;
  pct: number; // 0..1
}

export interface AbandonedItem {
  id: string;
  reason: string;
  tagName: string;
  tagColor: string;
  sec: number;
  at: number;
}

export interface BucketValue {
  label: string;
  sec: number;
}

export interface ReasonCount {
  reason: string;
  count: number;
  sec: number;
}

export interface Summary {
  totalSec: number;
  sessionCount: number;
  perTag: TagSlice[];
  trend: BucketValue[];
  abandoned: AbandonedItem[];
  completedCount: number;
  abandonedCount: number;
  abandonedSec: number;
  reasons: ReasonCount[];
}

const UNTAGGED = { name: 'Untagged', color: '#94a3b8' };

/**
 * Roll up sessions into totals, a per-tag breakdown, trend buckets, and the
 * abandoned list. Actual focused time (`actualSec`) counts for both completed
 * and abandoned sessions.
 */
export function summarize(sessions: SessionRecord[], tags: Tag[], buckets: Bucket[]): Summary {
  const tagById = new Map(tags.map((t) => [t.id, t]));

  let totalSec = 0;
  const perTagSec = new Map<string, number>();
  const abandoned: AbandonedItem[] = [];

  for (const s of sessions) {
    totalSec += s.actualSec;
    const key = s.tagId ?? '__untagged__';
    perTagSec.set(key, (perTagSec.get(key) ?? 0) + s.actualSec);

    if (!s.completed) {
      const tag = s.tagId ? tagById.get(s.tagId) : undefined;
      abandoned.push({
        id: s.id,
        reason: s.cancelReason ?? 'No reason',
        tagName: tag?.name ?? UNTAGGED.name,
        tagColor: tag?.color ?? UNTAGGED.color,
        sec: s.actualSec,
        at: s.startedAt,
      });
    }
  }

  const perTag: TagSlice[] = [...perTagSec.entries()]
    .map(([key, sec]) => {
      const tag = key === '__untagged__' ? undefined : tagById.get(key);
      return {
        id: key,
        name: tag?.name ?? UNTAGGED.name,
        color: tag?.color ?? UNTAGGED.color,
        sec,
        pct: totalSec > 0 ? sec / totalSec : 0,
      };
    })
    .sort((a, b) => b.sec - a.sec);

  const trend: BucketValue[] = buckets.map((b) => {
    let sec = 0;
    for (const s of sessions) {
      if (s.startedAt >= b.start && s.startedAt < b.end) sec += s.actualSec;
    }
    return { label: b.label, sec };
  });

  abandoned.sort((a, b) => b.at - a.at);

  // Reason breakdown across abandoned sessions.
  const reasonMap = new Map<string, { count: number; sec: number }>();
  for (const a of abandoned) {
    const cur = reasonMap.get(a.reason) ?? { count: 0, sec: 0 };
    cur.count += 1;
    cur.sec += a.sec;
    reasonMap.set(a.reason, cur);
  }
  const reasons: ReasonCount[] = [...reasonMap.entries()]
    .map(([reason, v]) => ({ reason, count: v.count, sec: v.sec }))
    .sort((a, b) => b.count - a.count);

  const abandonedCount = abandoned.length;
  const abandonedSec = abandoned.reduce((sum, a) => sum + a.sec, 0);

  return {
    totalSec,
    sessionCount: sessions.length,
    perTag,
    trend,
    abandoned,
    completedCount: sessions.length - abandonedCount,
    abandonedCount,
    abandonedSec,
    reasons,
  };
}
