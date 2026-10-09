export type PeriodType = 'week' | 'month' | 'year';

export interface Bucket {
  label: string;
  start: number; // epoch ms, inclusive
  end: number; // epoch ms, exclusive
}

export interface Range {
  start: number; // epoch ms, inclusive
  end: number; // epoch ms, exclusive
  label: string;
  isCurrent: boolean; // true when offset === 0 (disables "next")
  buckets: Bucket[];
}

const DAY = 86_400_000;
const MONTHS = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
const WEEKDAYS = ['M', 'T', 'W', 'T', 'F', 'S', 'S'];

/** Monday 00:00 of the week containing `d` (local time). */
function startOfWeek(d: Date): Date {
  const x = new Date(d.getFullYear(), d.getMonth(), d.getDate());
  const day = x.getDay(); // 0 Sun … 6 Sat
  const diff = day === 0 ? -6 : 1 - day;
  x.setDate(x.getDate() + diff);
  return x;
}

function dayLabel(d: Date): string {
  return `${MONTHS[d.getMonth()]} ${d.getDate()}`;
}

/**
 * Resolve a period type + offset (0 = current, -1 = previous, …) into a concrete
 * range with display label and the trend buckets for that period.
 */
export function getRange(type: PeriodType, offset: number, now = new Date()): Range {
  if (type === 'week') {
    const base = startOfWeek(now);
    const start = new Date(base);
    start.setDate(base.getDate() + offset * 7);
    const end = new Date(start);
    end.setDate(start.getDate() + 7);

    const buckets: Bucket[] = Array.from({ length: 7 }, (_, i) => {
      const bs = new Date(start);
      bs.setDate(start.getDate() + i);
      const be = new Date(bs);
      be.setDate(bs.getDate() + 1);
      return { label: WEEKDAYS[i], start: bs.getTime(), end: be.getTime() };
    });

    const last = new Date(end.getTime() - DAY);
    const label =
      offset === 0 ? 'This week' : offset === -1 ? 'Last week' : `${dayLabel(start)} – ${dayLabel(last)}`;

    return { start: start.getTime(), end: end.getTime(), label, isCurrent: offset === 0, buckets };
  }

  if (type === 'month') {
    const start = new Date(now.getFullYear(), now.getMonth() + offset, 1);
    const end = new Date(now.getFullYear(), now.getMonth() + offset + 1, 1);
    const days = Math.round((end.getTime() - start.getTime()) / DAY);

    const buckets: Bucket[] = Array.from({ length: days }, (_, i) => {
      const bs = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i);
      const be = new Date(start.getFullYear(), start.getMonth(), start.getDate() + i + 1);
      const dayNum = i + 1;
      const label = dayNum === 1 || dayNum % 5 === 0 || dayNum === days ? String(dayNum) : '';
      return { label, start: bs.getTime(), end: be.getTime() };
    });

    const label = `${MONTHS[start.getMonth()]} ${start.getFullYear()}`;
    return { start: start.getTime(), end: end.getTime(), label, isCurrent: offset === 0, buckets };
  }

  // year
  const year = now.getFullYear() + offset;
  const start = new Date(year, 0, 1);
  const end = new Date(year + 1, 0, 1);

  const buckets: Bucket[] = Array.from({ length: 12 }, (_, i) => {
    const bs = new Date(year, i, 1);
    const be = new Date(year, i + 1, 1);
    return { label: MONTHS[i][0], start: bs.getTime(), end: be.getTime() };
  });

  return { start: start.getTime(), end: end.getTime(), label: String(year), isCurrent: offset === 0, buckets };
}
