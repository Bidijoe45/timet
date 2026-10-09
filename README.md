# TimeT

A Forest-inspired, Pomodoro-style focus timer with a datacenter-building game. Built with Expo +
React Native + TypeScript.

- **[requirements.md](./requirements.md)** — what the app does.
- **[game-design.md](./game-design.md)** — the "your focus powers the datacenter" gamification.
- **[implementation-plan.md](./implementation-plan.md)** — milestones and progress.

## Run it

```bash
npm install          # if dependencies aren't installed yet
npm start            # then press i / a, or scan the QR with Expo Go
```

Open on a device with [Expo Go](https://expo.dev/go), or `npm run ios` / `npm run android` for a
simulator/emulator. (A custom dev build is only needed from Milestone 4 onward, for the iOS Live
Activity.)

## Install on your iPhone for real-world testing (Mac, free Apple ID)

Builds a standalone **Release** app (JS is bundled in — no Metro/dev server needed). A free Apple ID
signing cert lasts **7 days**; after that, reconnect and rebuild to renew. Free accounts allow up to
3 sideloaded apps and 10 devices.

**On the Mac, once:**
1. Install **Xcode** (App Store), open it once to finish component install, and add your Apple ID in
   **Xcode → Settings → Accounts**.
2. Install Node (e.g. `brew install node`).
3. Copy this project over (without `node_modules`), then:
   ```bash
   cd timet
   npm install
   npx expo prebuild -p ios        # generates the native ios/ project
   open ios/TimeT.xcworkspace
   ```
4. In Xcode: select the **TimeT** target → **Signing & Capabilities** → tick **Automatically manage
   signing** → set **Team** to your personal Apple ID. (One-time; fixes the bundle id signing.)

**Build onto the phone:**
```bash
npx expo run:ios --device --configuration Release
```
Pick your connected iPhone when prompted (unlock it, tap **Trust**). This builds a Release app and
installs it — no dev server afterwards.

**First launch on the phone:** Settings → General → **VPN & Device Management** → trust your developer
certificate. Then quit the build; the app runs on its own all week.

> Renew after 7 days: reconnect and run the `expo run:ios` command again.
> Notifications work in this build (they don't in Expo Go). The iOS Live Activity (M4b) is not built yet.

## Run during development

`npm run web` also works for quick UI previews, but the browser can't run `expo-sqlite`, so the web
build uses an in-memory data layer (`src/db/*.web.ts`) — tags and sessions there reset on reload.
Device builds persist everything via SQLite.

## Status — Milestones 1–5 complete (iOS; Live Activity + Android deferred)

The Timer tab is live: pick a category tag, pick a duration with presets (30/60/90/120) plus a
±5-minute stepper, start, pause/resume, and watch a minimal countdown with a thin progress bar. Tags
can be created/edited/deleted (name, color, icon) and the selection persists. Every completed session
is saved to SQLite; giving up asks why and records an abandoned session with only the time actually
spent. The Summary tab breaks your time down by Week / Month / Year with a per-tag donut, a trend bar
chart, and a list of given-up sessions with their reasons. A local notification fires when a session
completes (scheduled at start, cancelled on pause/give-up). The Forest tab is a Forest-style
isometric game: you pick a tree on the Timer, and finishing a session plants it on a random tile of
your island and earns seeds (giving up plants a withered tree). Seeds unlock new tree types in the
shop; a random decoration drops after each plant and the island grows when full. The iOS Live Activity
and Android support are the remaining items (the Live Activity needs a custom dev build).

## Project layout

```
src/
  app/              expo-router screens (tabs)
    _layout.tsx       tab navigator
    index.tsx         Timer screen
    summary.tsx       Summary / stats screen
    forest.tsx        Isometric Forest game (island, seeds, shop)
  components/
    DurationPicker.tsx  presets + stepper duration selector
    TimerProgress.tsx   running countdown + thin progress bar
    TagSelector.tsx     category chips on the Timer screen
    TagEditorModal.tsx  create / edit / delete tags
    GiveUpModal.tsx     reason prompt when abandoning a session
    charts/             SVG DonutChart + BarChart (no chart library)
    forest/             IsoForest renderer, TreeThumb, TreeSelector, ForestShopModal
  db/                 expo-sqlite layer: schema + migrations + seed
    index.ts            open db, create tables, seed default tags
    tags.ts             tag queries (CRUD)
    sessions.ts         session queries (insert, by range)
    settings.ts         key/value settings (e.g. selected tag)
    types.ts            Tag / SessionRecord types + id helper
  features/
    timer/timerStore.ts   Zustand timer state machine (timestamp-based)
    tags/tagStore.ts      Zustand tag store (loads from db, CRUD, selection)
    tags/options.ts       color + icon choices for the tag editor
    summary/dateRange.ts  week/month/year ranges + trend buckets
    summary/aggregate.ts  rolls sessions into totals, per-tag, trend, abandoned
    notifications/        schedule/cancel the "session complete" notification
    forest/sprites.ts     iso sprite pack (trees/ground/decor as SVG strings)
    forest/forestConfig.ts  tree types, costs, tile helpers
    forest/forestStore.ts   Zustand forest store (seeds/trees/island, persisted)
  theme/              design tokens + useAppTheme
  lib/                helpers (time formatting)
```
