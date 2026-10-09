# TimeT — Implementation Plan

Phased plan for building TimeT (see [[requirements]] and [[game-design]]). Each milestone is a
checkable, runnable increment.

## Locked decisions (defaults — say if you want to change any)
- **Framework:** Expo (managed) + TypeScript + `expo-router` (file-based tabs).
- **Storage:** `expo-sqlite` with a thin data layer.
- **Gamification generation:** focus-gated (pipeline runs only during sessions).
- **v1 pipeline wiring:** fixed 3-lane auto-adjacency (no free-form graph yet).
- **Live Activity (iOS):** deferred to its own milestone; needs a custom dev build (config plugin),
  not Expo Go. Android gets an ongoing notification as the equivalent.

## Tech stack
- `expo-router`, `react-native-reanimated`, `react-native-gesture-handler`, `react-native-svg`
- `expo-sqlite`, `expo-haptics`, `expo-keep-awake`, `expo-notifications`
- State: Zustand (lightweight). Charts: `react-native-gifted-charts` (or Victory) in M3.

---

## Milestone 1 — Foundation & Timer core  ✅ *complete*
A runnable app with the signature timer interaction. In-memory only (no DB/notifications yet).
- [x] Expo SDK 57 + TS scaffold, `expo-router` with three tabs: **Timer**, **Summary**, **Datacenter**.
- [x] Theme tokens (the teal/amber + light/dark palette from the sprite sample) and a `useAppTheme` hook.
- [x] **DurationPicker**: presets (15/25/45/60) + ±5-min stepper, 5–120 range, selection haptics.
- [x] Timer state machine (`idle → running ⇄ paused → completed`), **timestamp-based** elapsed calc
      (survives backgrounding), excludes paused time (`src/features/timer/timerStore.ts`).
- [x] Timer screen: dial → start; running view with countdown + depleting ring; pause/resume/give-up;
      completion state with success haptic. Keeps screen awake while running.
- [x] Summary & Datacenter tabs as styled placeholders.
- [x] Verified: `tsc --noEmit` clean + `expo export` bundles with no errors.
- **Check (yours):** `npm start`, open in Expo Go; set a duration, start, pause/resume, finish or give up.
- **Deferred to M2:** the give-up reason prompt (M1 give-up just resets); tag selector.

## Milestone 2 — Persistence & Tags  ✅ *complete*
- [x] `expo-sqlite` schema + data layer: `tags`, `sessions`, `settings` tables, migrations + seed
      (`src/db/`). Default tags: Work, Study, Exercise, Reading.
- [x] Tag CRUD with color + icon picker (`TagEditorModal`); tag selector chips on the Timer screen;
      selected tag persisted across launches.
- [x] Persist sessions (completed and abandoned). Give-up flow: pause → reason prompt (pick-list +
      "Other") → saves an abandoned session counting only actual focused seconds (`GiveUpModal`).
- [x] Verified: `tsc --noEmit` clean + `expo export` bundles with no errors.
- **Check (yours):** tags survive restart; completing or giving up records a session; the give-up
      sheet asks why and keeps your partial time.

## Milestone 3 — Summary / Stats  ✅ *complete*
- [x] Week / Month / Year ranges + prev/next navigation (`dateRange.ts`); "next" disabled at current.
- [x] Total time, per-tag breakdown (SVG donut + legend with %), trend bar chart (SVG, no new deps).
- [x] Abandoned-sessions section listing reasons, tag, and time spent. Actual time counts for both
      completed and abandoned sessions. Reloads on tab focus.
- [x] Screen-Time-style drill-in: tap a trend bar to see that day's sessions (start–end time, tag,
      duration, give-up reason). Give-up card shows totals + a per-reason breakdown.
- [x] Verified: `tsc` + lint clean; iOS and web bundles build.
- **Check (yours):** record some sessions (incl. a give-up), open Summary, switch Week/Month/Year and
      page back — totals, the donut, the trend bars, and the given-up list all reflect your sessions.

## Milestone 4 — Notifications  ✅ *complete*
- [x] `expo-notifications`: schedule completion notification at start; reschedule on resume; cancel on
      pause/give-up (`src/features/notifications/notifications.ts`). Android channel + permission flow.
- [x] Verified: `tsc` + lint clean; iOS and web bundles build.
- **Check (yours, needs a dev build or Expo Go dev notifications):** start a timer, background the app
      or lock the phone — a "Focus complete" notification fires at the end; pausing cancels it.

## Milestone 4b — Live Activity / ongoing progress  ⏳ *deferred to the dev-build phase*
Requires native code that can't run in Expo Go or be verified without an iOS build, so it's split out.
- [ ] iOS **Live Activity**: ActivityKit widget extension (Swift) + config plugin to add the target +
      a JS bridge to start/update/end the activity as the timer ticks.
- [ ] Android: ongoing/foreground-service notification showing live countdown (also native).
- **Needs:** `npx expo run:ios` / EAS dev build; done together with that setup, not in Expo Go.

## Milestone 5 — Gamification: Isometric Forest  ✅ *complete*
The datacenter game was scrapped; the Forest tab is now a Forest-style isometric planting game built
on the `iso-forest-assets` sprite pack (see [[game-design]]).
- [x] Sprite pack integrated (`src/features/forest/sprites.ts`), isometric renderer
      (`src/components/forest/IsoForest.tsx`) via `react-native-svg` `SvgXml`.
- [x] Forest store (seeds, unlocked trees, island size, placed tiles, selected tree), persisted to SQLite.
- [x] Per-session tree choice on the Timer (`TreeSelector`); completing plants the chosen tree on a
      random empty tile + earns seeds (≈ focused minutes); giving up plants a withered tree, no seeds.
- [x] A random decoration drops after each plant; the island grows a tile per side when full.
- [x] Seed shop (`ForestShopModal`) to unlock Pine/Birch/Sakura/Palm; start with Oak + 0 seeds.
- [x] Verified: `tsc` + lint clean; iOS and web bundles build.
- **Check (yours):** pick a tree on the Timer, finish a session → it appears on the Forest tab and you
      gain seeds; buy a new tree in the shop; give up once → a withered tree shows up.
- **Known v1 limits:** island scales to fit width (no pinch-zoom); tune seed/cost numbers later.

## Milestone 6 — Progression & polish
- [ ] Tiers/unlocks (Compute milestones), Compute sinks (research/upgrades), optional prestige.
- [ ] Haptics/sound polish, accessibility pass, settings, empty states, light/dark review.
- **Check:** a full loop — focus → earn → build → unlock — feels good end to end.

---

## Extras (end of roadmap)
- **Android support** — re-add the `android` config and native pieces (notification channel, ongoing
  progress). Removed during development to focus on iOS; the JS is already cross-platform.

## Notes
- Visual/device testing is done by you on a phone (Expo Go for M1–M3 and M5; a custom dev build from
  M4b for the Live Activity). I can't run a simulator here, so I keep code typechecking + bundling
  clean and give run steps.
