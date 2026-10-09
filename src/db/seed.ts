import { insertSession } from '@/db/sessions';
import { getSetting, setSetting } from '@/db/settings';
import { listTags } from '@/db/tags';

const SEED_FLAG = 'demoSeeded';
const REASONS = ['Interrupted', 'Lost focus', 'Emergency', 'Changed plans', 'Other'];
const DURATIONS = [25, 30, 45, 60, 90];

const rand = (n: number) => Math.floor(Math.random() * n);
const pick = <T>(a: T[]): T => a[rand(a.length)];

/** Start-of-day `daysAgo` days back, local time. */
function dayStart(daysAgo: number): number {
  const d = new Date();
  d.setHours(0, 0, 0, 0);
  d.setDate(d.getDate() - daysAgo);
  return d.getTime();
}

/** Populate the DB with varied demo sessions + a started forest. Runs once (dev only). */
export async function seedDemoData(): Promise<void> {
  if (!__DEV__) return;
  if (await getSetting(SEED_FLAG)) return;

  const tags = await listTags();
  if (tags.length === 0) return;

  // How many sessions land `daysAgo`: dense this week, lighter further back.
  const plan: number[] = [];
  for (let d = 0; d < 7; d++) plan.push(d, ...(Math.random() < 0.6 ? [d] : []), ...(Math.random() < 0.3 ? [d] : []));
  for (let d = 7; d < 30; d++) if (Math.random() < 0.5) plan.push(d);
  for (let d = 30; d < 360; d += 1) if (Math.random() < 0.08) plan.push(d);

  for (const daysAgo of plan) {
    const tag = pick(tags);
    const plannedMin = pick(DURATIONS);
    const plannedSec = plannedMin * 60;
    const completed = Math.random() < 0.78;
    const actualSec = completed ? plannedSec : Math.round(plannedSec * (0.2 + Math.random() * 0.6));
    const hour = 8 + rand(13); // 8:00–20:xx
    const startedAt = dayStart(daysAgo) + hour * 3_600_000 + rand(60) * 60_000;

    await insertSession({
      tagId: tag.id,
      plannedSec,
      actualSec,
      startedAt,
      endedAt: startedAt + actualSec * 1000,
      completed,
      cancelReason: completed ? null : pick(REASONS),
    });
  }

  // A forest with a few trees, decorations, a withered one, and some seeds.
  // Key must match forestStore's STATE_KEY ('forestState'); keys are "col,row".
  const now = Date.now();
  const tree = (sprite: string, daysAgo: number, mins: number) => {
    const t = pick(tags);
    return { sprite, at: now - daysAgo * 86_400_000, sec: mins * 60, tagName: t.name, tagColor: t.color };
  };
  const forest = {
    coins: 140,
    unlockedTrees: ['tree_oak', 'tree_pine', 'tree_sakura'],
    selectedTree: 'tree_pine',
    islandSize: 4,
    plants: {
      '0,0': tree('tree_oak', 6, 45),
      '1,0': tree('tree_pine', 4, 60),
      '3,0': { sprite: 'deco_grass' },
      '2,1': tree('tree_sakura', 2, 30),
      '1,2': { sprite: 'deco_flowers' },
      '2,2': { sprite: 'deco_rock' },
      '0,3': tree('tree_withered', 1, 11),
      '3,3': tree('tree_oak', 0, 90),
    },
  };
  await setSetting('forestState', JSON.stringify(forest));

  await setSetting(SEED_FLAG, '1');
}
