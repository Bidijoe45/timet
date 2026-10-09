import FocusActivity from './FocusActivity';

export type SessionActivity = ReturnType<typeof FocusActivity.start>;

/** Start the Lock Screen / Dynamic Island activity for a fresh session. */
export function startSessionActivity(
  plannedMs: number,
  tagName: string | undefined,
  treeLabel: string,
): SessionActivity | null {
  try {
    const now = Date.now();
    return FocusActivity.start({
      tagName: tagName ?? 'Focus session',
      treeLabel,
      status: 'running',
      startEpochMs: now,
      endEpochMs: now + plannedMs,
      frozenRemainingMs: plannedMs,
      progress: 0,
    });
  } catch {
    return null;
  }
}

/** Freeze the activity's countdown/progress while the timer is paused. */
export function pauseSessionActivity(
  activity: SessionActivity | null,
  remainingMs: number,
  plannedMs: number,
  tagName: string | undefined,
  treeLabel: string,
): void {
  const now = Date.now();
  activity
    ?.update({
      tagName: tagName ?? 'Focus session',
      treeLabel,
      status: 'paused',
      startEpochMs: now,
      endEpochMs: now,
      frozenRemainingMs: remainingMs,
      progress: plannedMs > 0 ? 1 - remainingMs / plannedMs : 0,
    })
    .catch(() => {});
}

/** Resume the live countdown from the current remaining time. */
export function resumeSessionActivity(
  activity: SessionActivity | null,
  remainingMs: number,
  tagName: string | undefined,
  treeLabel: string,
): void {
  const now = Date.now();
  activity
    ?.update({
      tagName: tagName ?? 'Focus session',
      treeLabel,
      status: 'running',
      startEpochMs: now,
      endEpochMs: now + remainingMs,
      frozenRemainingMs: remainingMs,
      progress: 0,
    })
    .catch(() => {});
}

/** End the activity on completion or give-up. */
export function endSessionActivity(
  activity: SessionActivity | null,
  completed: boolean,
  tagName: string | undefined,
  treeLabel: string,
): void {
  const now = Date.now();
  activity
    ?.end('default', {
      tagName: tagName ?? 'Focus session',
      treeLabel,
      status: completed ? 'done' : 'gaveUp',
      startEpochMs: now,
      endEpochMs: now,
      frozenRemainingMs: 0,
      progress: completed ? 1 : 0,
    })
    .catch(() => {});
}
