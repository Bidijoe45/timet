# TimeT — Requirements

A mobile time-tracking app inspired by **Forest**, built with **React Native**. The core idea is to track focused time in a Pomodoro style, tag that time by category, and review how time was spent over weeks, months, and years.

## 1. Overview

- **Platform:** iOS and Android (React Native).
- **Purpose:** Let users run configurable focus timers, label each session with a tag/category, and understand where their time goes through visual summaries.
- **Inspiration:** Forest — simple, calm, single-purpose, satisfying to use.

## 2. Goals & Non-Goals

### Goals
- Make starting a focus session fast and pleasant.
- Let users pick a duration with a smooth, native-feeling slider/dial.
- Attach a tag/category to every session so time is attributable.
- Provide clear week / month / year summaries with per-tag breakdowns.

### Non-Goals (v1)
- No social features, friends, or leaderboards.
- No account system or cloud sync (local-only storage in v1).
- No real-money or gamified rewards (trees, coins) — this can come later.

## 3. Primary User Stories

1. As a user, I want to open the app and immediately start a focus timer.
2. As a user, I want to set the session length with an intuitive slider/dial before starting.
3. As a user, I want to assign a tag/category (e.g. Work, Study, Reading) to the session.
4. As a user, I want to pause, resume, and cancel a running session.
5. As a user, I want to be told (and feel) when a session completes.
6. As a user, I want a notification when the timer finishes, even if the app is backgrounded.
7. As a user (iOS), I want to see the timer's progress on my lock screen via a Live Activity.
8. As a user, when I cancel a session, I want to record a reason, and still have the time I spent counted.
9. As a user, I want to see how much time I spent over a week/month/year.
10. As a user, I want a breakdown of that time by tag/category.
11. As a user, I want to see the reasons I abandoned sessions in the summary.

## 4. Screens

### 4.1 Timer Screen (Home)
The main landing screen.

- **Duration selector:** A circular dial or slider for choosing session length.
  - Behaves like the Apple time picker — smooth drag, haptic feedback on steps, snaps to increments (e.g. 5-minute steps, range 5–120 min).
  - Shows the selected duration prominently (e.g. `25:00`).
- **Tag/category selector:** Pick the category for this session (chips or a dropdown). Shows the currently selected tag with its color.
- **Start button:** Begins the session.
- **Running state:**
  - Large countdown display, visual progress indication (e.g. the dial fills/depletes).
  - **Pause / Resume** control — pausing stops accruing time; resuming continues from where it left off.
  - **Cancel/Give-up** control — opens the cancellation flow (see below).
  - Keep the screen awake while running.
- **Cancellation flow:** When the user cancels a running session:
  - Prompt for a **reason** (free-text and/or a short pick-list of common reasons, e.g. "Interrupted", "Lost focus", "Emergency", "Changed plans").
  - The session is saved as **abandoned** (`completed = false`) with the entered reason.
  - **Only the actual time spent** (elapsed up to the cancel moment, excluding paused time) is counted toward totals and the tag breakdown.
- **Completion:** On reaching zero, show a completion state with haptic + sound, fire a local notification, end the Live Activity, and persist the session as completed.
- **Notifications:** A local notification fires when the timer finishes, so the user is alerted even if the app is backgrounded or the phone is locked.
- **Live Activity (iOS):** While a session runs, show a Live Activity on the lock screen / Dynamic Island with the live countdown and progress. It updates as the timer runs and is dismissed on completion or cancel.

### 4.2 Summary Screen (Stats)
Review of tracked time.

- **Period toggle:** Week / Month / Year.
- **Total time** for the selected period, prominently displayed.
- **Breakdown by tag/category:**
  - List of tags with total time and percentage each.
  - A chart (e.g. donut or stacked bar) showing the distribution.
- **Trend over time:** A bar chart of time per day (week), per day/week (month), or per month (year).
- **Abandoned sessions:** A section listing cancelled sessions in the period with their recorded reasons, tag, and time spent. Optionally aggregate the most common reasons.
- **Navigation:** Move to previous/next period.

> Note: Totals and tag breakdowns include the actual time spent in abandoned sessions (not the planned duration). Abandoned sessions are additionally surfaced with their reasons in the dedicated section above.

### 4.3 Tags Management (supporting)
- Create, edit, delete tags/categories.
- Each tag has a **name** and a **color** (and optionally an icon).
- Default seed tags on first launch (e.g. Work, Study, Exercise, Reading).

## 5. The Duration Selector (key UX detail)

The headline interaction. It should feel like the iOS-style time wheel/dial:

- Draggable circular control (preferred) or a horizontal slider.
- Smooth, physics-y motion; **snaps to increments** (default 5 min).
- **Haptic feedback** on each increment while dragging.
- Clear large numeric readout bound to the control.
- Configurable min/max and step (default 5–120 min, 5-min steps).
- Candidate libraries to evaluate: `react-native-reanimated` + `react-native-gesture-handler` for a custom dial, `react-native-svg` for the arc, `expo-haptics` (or `react-native-haptic-feedback`) for feedback.

## 6. Data Model (v1, local)

**Session**
- `id`
- `tagId`
- `plannedDurationSec`
- `actualDurationSec` (elapsed time actually spent, excluding paused time — this is what counts toward totals)
- `startedAt` (timestamp)
- `endedAt` (timestamp)
- `completed` (bool — reached zero vs. cancelled)
- `cancelReason` (nullable string — set when `completed = false`)

**Tag**
- `id`
- `name`
- `color`
- `icon` (optional)
- `createdAt`

Cancelled sessions are stored with `completed = false` and a `cancelReason`. Their `actualDurationSec` **is counted** in totals and tag breakdowns, and they are also listed with their reasons in the Summary's abandoned-sessions section.

## 7. Technical Requirements

- **Framework:** React Native (Expo recommended for faster setup unless native modules force bare workflow).
- **Language:** TypeScript.
- **Navigation:** `@react-navigation` (bottom tabs: Timer, Summary; plus Tags).
- **Local storage:** On-device persistence — e.g. `expo-sqlite` / `WatermelonDB` / `react-native-mmkv` + a lightweight data layer. SQLite preferred for aggregation queries behind the summaries.
- **State management:** Lightweight (Zustand or React Context) — avoid heavy setup for v1.
- **Animations/gestures:** `react-native-reanimated`, `react-native-gesture-handler`.
- **Charts:** `victory-native` or `react-native-gifted-charts` for the summary visualizations.
- **Timer accuracy:** Compute elapsed time from timestamps (not tick-counting) so it survives backgrounding and is correct on resume. Track paused intervals so `actualDurationSec` excludes paused time.
- **Notifications:** Local notifications via `expo-notifications` (or `@notifee/react-native`). Schedule a notification for the session end time when the timer starts; cancel/reschedule it on pause, resume, or cancel so it always matches the real end time.
- **Live Activity (iOS):** Requires a native widget extension (ActivityKit) — not available in the Expo managed workflow without a config plugin/custom dev client. Options to evaluate: `@bacons/apple-targets` / a custom Expo config plugin, or the bare workflow with a SwiftUI Live Activity. Android equivalent is an ongoing notification with progress (acceptable fallback). This is the main driver for the Expo-vs-bare decision (§10).

## 8. Design & UX Principles

- Calm, minimal, single-purpose — like Forest.
- One obvious primary action per screen.
- Color comes from the tags; the rest of the UI stays neutral.
- Support light and dark mode.
- Haptics and subtle animation to make the timer satisfying.

## 9. Future Ideas (post-v1)

- Cloud sync and accounts.
- Streaks and gentle gamification (grow something per completed session).
- Daily/weekly goals and reminders.
- Widgets and background/live-activity timer.
- Export data (CSV).
- Break timers / long-break cycles (classic Pomodoro 25/5/15).

## 10. Open Questions

1. Dial vs. horizontal slider for the duration selector — build both and pick, or commit to the circular dial?
2. Default duration range and step (proposed: 5–120 min, 5-min steps)?
3. Should break/rest intervals be part of v1, or focus-only?
4. Expo (with a config plugin/dev client for the iOS Live Activity) vs. bare React Native? The Live Activity requirement pushes toward one of these; needs a decision early since it affects project setup.
5. Cancellation reason: free-text, a fixed pick-list, or both? (Proposed: both — pick-list with an "Other" free-text option.)
