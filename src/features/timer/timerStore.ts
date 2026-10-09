import { create } from 'zustand';

export type TimerStatus = 'idle' | 'running' | 'paused' | 'completed';

export const DURATION_MIN = 5;
export const DURATION_MAX = 120;
export const DURATION_STEP = 5;

interface TimerState {
  status: TimerStatus;
  /** Configured duration (minutes) while idle. */
  durationMin: number;
  /** Planned session length in ms (set at start). */
  plannedMs: number;
  /** Epoch ms when the session first started. */
  startedAt: number | null;
  /** Epoch ms when the current running segment began; null while paused. */
  segmentStartedAt: number | null;
  /** Focused ms accrued in completed segments (excludes paused time). */
  accumulatedMs: number;
  /** Reactive elapsed focused ms, refreshed by syncTick(). */
  elapsedMs: number;

  setDurationMin: (min: number) => void;
  start: () => void;
  pause: () => void;
  resume: () => void;
  /** Recompute elapsed from timestamps; auto-completes when planned time is reached. */
  syncTick: () => void;
  cancel: () => void;
  reset: () => void;
}

const clampDuration = (min: number) =>
  Math.max(DURATION_MIN, Math.min(DURATION_MAX, Math.round(min / DURATION_STEP) * DURATION_STEP));

/** Focused ms elapsed as of `now`, derived purely from timestamps. */
function elapsedAt(
  s: Pick<TimerState, 'status' | 'accumulatedMs' | 'segmentStartedAt'>,
  now: number,
): number {
  const live = s.status === 'running' && s.segmentStartedAt != null ? now - s.segmentStartedAt : 0;
  return s.accumulatedMs + live;
}

export const useTimerStore = create<TimerState>((set, get) => ({
  status: 'idle',
  durationMin: 30,
  plannedMs: 30 * 60_000,
  startedAt: null,
  segmentStartedAt: null,
  accumulatedMs: 0,
  elapsedMs: 0,

  setDurationMin: (min) => {
    if (get().status !== 'idle') return;
    set({ durationMin: clampDuration(min) });
  },

  start: () => {
    const now = Date.now();
    const plannedMs = get().durationMin * 60_000;
    set({
      status: 'running',
      plannedMs,
      startedAt: now,
      segmentStartedAt: now,
      accumulatedMs: 0,
      elapsedMs: 0,
    });
  },

  pause: () => {
    const s = get();
    if (s.status !== 'running') return;
    const now = Date.now();
    set({
      status: 'paused',
      accumulatedMs: elapsedAt(s, now),
      segmentStartedAt: null,
      elapsedMs: elapsedAt(s, now),
    });
  },

  resume: () => {
    if (get().status !== 'paused') return;
    set({ status: 'running', segmentStartedAt: Date.now() });
  },

  syncTick: () => {
    const s = get();
    if (s.status !== 'running') return;
    const now = Date.now();
    const elapsed = elapsedAt(s, now);
    if (elapsed >= s.plannedMs) {
      set({
        status: 'completed',
        elapsedMs: s.plannedMs,
        accumulatedMs: s.plannedMs,
        segmentStartedAt: null,
      });
    } else {
      set({ elapsedMs: elapsed });
    }
  },

  cancel: () => {
    // M1: no persistence yet — just end the session and return to config.
    // (M2 adds the reason prompt and saves the actual time spent.)
    get().reset();
  },

  reset: () => {
    set((s) => ({
      status: 'idle',
      plannedMs: s.durationMin * 60_000,
      startedAt: null,
      segmentStartedAt: null,
      accumulatedMs: 0,
      elapsedMs: 0,
    }));
  },
}));

/** Remaining ms for display. */
export function remainingMs(plannedMs: number, elapsedMs: number): number {
  return Math.max(0, plannedMs - elapsedMs);
}
