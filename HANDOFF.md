# TimeT — Handoff

Continuity notes for picking the project back up (e.g. a fresh Claude Code session on the Mac).

## What this is
A Forest-inspired, Pomodoro-style focus timer with an isometric tree-planting game, built with
**Expo SDK 57 + React Native 0.86 + TypeScript + expo-router**. **iOS-only** right now (Android was
removed during development; see "Extras" in [implementation-plan.md](./implementation-plan.md)).

Read these first: [requirements.md](./requirements.md), [game-design.md](./game-design.md),
[implementation-plan.md](./implementation-plan.md).

## Status (done)
- **M1** Timer core — presets (30/60/90/120) + ±5 stepper, pause/resume/give-up, completion.
- **M2** Persistence & tags — `expo-sqlite`; tags CRUD; give-up reason flow; sessions saved.
- **M3** Summary — week/month/year, donut + trend, tap a bar to drill into a day's sessions,
  give-up reason stats.
- **M4** Notifications — "Focus complete" local notification (needs a real build, not Expo Go).
- **M5** Forest game — pick a tree per session; completing plants it on a random tile + earns seeds;
  giving up plants a withered tree; decorations scatter; island grows when full; seed shop; tap a
  tree for a hint (tag + spent time). Built on the `iso-forest-assets` pack.

## Not done / next
- **M4b — iOS Live Activity** (deferred): needs a native ActivityKit widget extension + config plugin
  + a dev build. Now that there's a Mac, this is buildable.
- **M6 — polish**: settings screen, accessibility pass, sound, richer empty states, light/dark review.
- **Android** (end-of-roadmap extra): re-add the `android` config + native notification bits.
- **Tuning/ideas**: seed/tree-cost balance; pinch-zoom/pan for a large forest island; a dev "reseed"
  button; optionally a weekly sub-summary when tapping a year bar.

## Architecture (where things live)
```
src/app/            expo-router screens: _layout (tabs), index (Timer), summary, forest
src/features/
  timer/timerStore.ts     timestamp-based timer state machine (Zustand)
  tags/                   tag store + options
  summary/                dateRange (week/month/year buckets) + aggregate
  forest/                 sprites.ts (pack), forestConfig, forestStore (seeds/trees/island)
  notifications/          schedule/cancel the completion notification
src/components/
  DurationPicker, TimerProgress, TagSelector, TagEditorModal, GiveUpModal
  charts/ (DonutChart, BarChart)   forest/ (IsoForest, TreeThumb, TreeSelector, ForestShopModal)
src/db/             expo-sqlite layer (index/tags/sessions/settings/types) + *.web.ts in-memory stubs + seed.ts
src/theme/          tokens + useAppTheme (light/dark)
iso-forest-assets/  source sprite pack + generator (not imported at runtime except sprites.ts copy)
```

## Conventions / gotchas
- **Verify after changes** (keep all three clean):
  ```bash
  npx tsc --noEmit
  npm run lint
  npx expo export -p ios --output-dir /tmp/export-check   # catches Metro/import errors
  ```
- **Web** uses in-memory DB stubs (`src/db/*.web.ts`) because `expo-sqlite` can't run in the browser;
  `npm run web` is for UI preview only (data resets on reload). Device builds persist via SQLite.
- **Demo seed data**: `src/db/seed.ts` runs once on first launch, gated by `__DEV__` + a `demoSeeded`
  setting. It appends ~50 varied sessions + a started forest. To re-seed, clear the `demoSeeded` row
  (or reinstall). Do NOT ship it in a production build (it's `__DEV__`-gated).
- `react-hooks/refs` (lint) rejects reading a ref during render — keep gesture/Animated setup in
  `useMemo`/`useState`/`useCallback`, not `useRef(...).current` read in the render body.
- `react-native-svg` on web: don't use `<G rotation origin>` (emits bad DOM prop) — use a `transform`
  string instead.

## Build & install on iPhone (Mac, free Apple ID)
Full steps are in [README.md](./README.md) → "Install on your iPhone". Short version:
```bash
npm install
npx expo prebuild -p ios
open ios/TimeT.xcworkspace      # set Signing → your Apple ID team, once
npx expo run:ios --device --configuration Release
```
Standalone Release build (no dev server). Free cert expires after 7 days → rerun to renew.
`com.apavel.timet` is the bundle id (in app.json).

## Resuming with Claude Code on the Mac
1. `git clone <repo>` then `cd timet && npm install`.
2. Start `claude` in the project; point it here and at `implementation-plan.md`.
3. Typical next task: **M4b Live Activity** (native build now possible) or **M6 polish**.
