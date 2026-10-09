# TimeT — Gamification Design

## ✅ IMPLEMENTED: Isometric Forest (supersedes the Datacenter design below)

The datacenter concept was scrapped in favour of a Forest-style isometric game, built on the
`iso-forest-assets` sprite pack (6 trees, ground tiles, decorations).

- **Plant per session:** on the Timer screen you choose which unlocked tree to plant. Completing the
  session plants it on a **random empty tile** of your island; giving up plants a **withered tree**.
- **Economy:** you start with the Oak and **0 seeds**. A completed session earns seeds (≈ focused
  minutes); giving up earns none. Spend seeds in the **shop** to unlock more tree types (Pine, Birch,
  Sakura, Palm).
- **Variation:** after each plant, a random **decoration** (grass / flowers / rock) drops on another
  empty tile, so every island grows differently.
- **Growth:** location is always random (you pick the tree, not the spot). When the island fills up it
  **grows by one tile per side**.
- **Where:** the former Datacenter tab is now the **Forest** tab; the island renders with
  `react-native-svg` `SvgXml` from the pack's `sprites.ts`.

Everything below is the retired Datacenter design, kept only for history.

---

# TimeT — Gamification Design: "The Datacenter" (Round 2) — RETIRED

The gamification layer for TimeT. Analogous to Forest's growing tree, but themed as **building and
running a datacenter**, now modeled as a **throughput pipeline** rather than a flat shop.

> **Guiding principle:** _Your focus powers the datacenter._ The pipeline runs — and earns — only
> while you focus. You never get rewarded for leaving the app idle.

## 0. Inspiration: Upload Labs (what we take / leave)

[Upload Labs](https://www.wasdland.com/game/upload-labs-3606890/) is an idle/management game where you
build a computer as a **network of nodes** and route files through a **download → process → upload**
pipeline, upgrading nodes to raise throughput and earn money, then reinvesting
([overview](https://www.destructoid.com/ever-wondered-what-visual-programming-would-be-like-as-a-game-upload-labs-has-the-answer/)).
Related: [Data Center Tycoon](https://whitemarshgames.itch.io/datacenter-tycoon).

**Take:**
- The **pipeline / node-network** structure (ingest → process → deliver) and the **throughput +
  bottleneck** optimization it creates — richer than "buy more of X."
- The **plan ↔ run** rhythm: tinker/upgrade, then let it run to earn, then upgrade again.
- Animated **data flowing** through links as the core visual feedback.

**Leave / adapt (because this is a focus app, not a management sim):**
- No active micromanagement **during** a session — the pipeline runs itself while you focus; you only
  rearrange/upgrade **between** sessions.
- No pay-to-win / aggressive monetization.
- Earning is **gated by real focus time**, not wall-clock idle time.

## ★ Game Model — Free-form Canvas (CHOSEN, supersedes the fixed-lane model below)

The datacenter is a **diagram you build on a canvas**, not fixed lanes. You place components, wire
their ports together, and the fun is interconnecting them *efficiently*. The sections below (fixed
3-lane pipeline) are kept for history but are replaced by this.

**Surfaces**
- **Canvas:** a pannable board where component instances live at (x, y). Drag to move; grid-snap.
- **Tray (bottom):** a horizontally scrollable strip of components you **own but haven't placed**.
  Drag one up onto the canvas to place it; drag a placed node back to the tray (or tap → remove) to
  pick it up.
- **Shop:** spend **Credits** to buy more components into your tray.

**Components & ports** — every component has typed **input** and **output** ports; a wire may only
join an output to a compatible input (so you can't wire egress → ingress).

| Component    | In | Out | Role                                                             |
|--------------|----|-----|-----------------------------------------------------------------|
| **Ingress**  | –  | 1   | Produces `P` data/sec (a source)                                |
| **Switch**   | n  | n   | Routes data; total flow through it ≤ its **bandwidth `B`**      |
| **Processor**| 1  | 1   | Consumes ≤ `C` data/sec → produces results (server / GPU)       |
| **Egress**   | 1  | –   | Consumes results → **Credits/Compute** (a sink)                 |

**The puzzle (your example):** one Ingress producing 6/s can feed **three** Processors that each take
2/s — but only if the Switch wiring between them carries ≥ 6 bandwidth. Under-provision the switch and
flow throttles; add processors with no data and they sit idle. You're balancing sources, bandwidth,
and consumers.

**Flow & earnings** — the graph is solved as a **max-flow** from a virtual source (feeding all
ingress outputs at their `P`) to a virtual sink (draining all egress), with capacities from each
component (`P`, `C`, `B`) and each wire. The resulting **delivered throughput `T`** (units/sec reaching
egress) is what earns: a finished session pays `Credits = T × focused seconds × bonus` and
`Compute = T × focused seconds`. Better wiring → higher `T` → more earnings. **Efficiency %** =
`T / (total ingress production)` shows how much of what you generate actually gets delivered.

**Interactions** — tap a node to select (shows its rates + a delete control); tap a wire to delete it;
drag from a node's output port to another's input port to connect. Pan the canvas by dragging empty
space. (No free zoom in v1 — fixed scale, large scrollable board.)

**Still focus-gated:** the graph only *runs and earns* while a session is on. Between sessions you
build and rewire.

---

## 1. The Pipeline Model  *(superseded by the Free-form Canvas above — kept for history)*

The datacenter is a left-to-right processing pipeline. Work flows through three stages:

```
        Jobs                 Results               $$$
   ┌───────────┐   links   ┌───────────┐  links  ┌───────────┐
   │  INGEST   │ ────────▶ │  COMPUTE  │ ───────▶ │  DELIVER  │
   │ (requests)│           │(servers,  │          │ (network  │
   │           │           │  GPUs)    │          │  egress)  │
   └───────────┘           └───────────┘          └───────────┘
      rate rᵢ                 rate r_c                rate r_e
```

- **Ingest** produces **Jobs** (raw data units) at rate `rᵢ` — your incoming client requests.
- **Compute** (servers, GPUs) processes Jobs into **Results** at rate `r_c`.
- **Deliver** (network egress) converts Results into **Credits** at rate `r_e`.
- **Links** (switches/routers) move units between stages with a **bandwidth** cap.

### Ports & connections
Every component has **typed ports**, and the type is what enforces the pipeline order:

| Component        | Input   | Output              |
|------------------|---------|---------------------|
| Ingest           | —       | Jobs                |
| Compute (server/GPU) | Jobs | Results            |
| Switch (link)    | any     | same type (raises bandwidth) |
| Egress           | Results | Credits (sink)      |
| Cooling / Power  | —       | — (support: buffs nearby nodes, not in the flow) |

A link may only join an output to a **compatible** input, so an invalid topology (e.g. egress → ingest)
can't be built. **Cooling/power are the exception** — they don't sit in the flow with ports; they
attach to a node/zone and apply a buff ("aura"). Small **buffers** (queues) sit between stages so
bursts don't stall the line.

**How connections are made:**
- **v1 — auto-adjacency (recommended):** three fixed lanes (Ingest / Compute / Deliver). Drop a
  component into its lane and it wires automatically — no dragging wires on a small screen. Multiple
  components in a lane run **in parallel** and their rates **sum**; stage throughput is capped by its
  feed, so the bottleneck is always one lane.
- **Later — manual wiring:** nodes expose their ports as dots; tap an output then a compatible input
  to draw a link. Unlocks branching and parallel lanes (full Upload Labs style), but fiddlier on phone.

**Throughput = the bottleneck:** effective rate ≈ `min(rᵢ, r_c, r_e, bandwidth)`. Upgrading anything
that *isn't* the bottleneck does nothing — so the puzzle is "find and clear the bottleneck." Small
**buffers** between stages smooth out bursts. This is the whole strategy layer, and it's optional:
a balanced default pipeline still earns, tinkering just earns more.

### Plan ↔ Run rhythm
- **During a focus session (RUN):** the pipeline flows automatically — packets animate along links,
  meters fill, Credits/Compute tick up. You just focus and watch it come alive.
- **Between sessions (PLAN):** spend Credits to buy/upgrade/rearrange nodes and clear bottlenecks.

## 2. Currencies & Resources

| Name        | Kind        | How it moves                                   | Role                         |
|-------------|-------------|------------------------------------------------|------------------------------|
| **Jobs**    | ephemeral   | flow through the pipeline (not banked)         | the "data" you see moving    |
| **Results** | ephemeral   | output of Compute, consumed by Deliver         | intermediate throughput      |
| **Credits ($)** | banked  | earned at Deliver, during sessions             | spend on nodes/upgrades      |
| **Compute** | banked      | cumulative Results processed, during sessions  | progress / prestige / research |

Two wallets you actually spend (**Credits**, **Compute**); Jobs/Results are just the flow you watch.

### Earning formulas (starting point, to tune)
- **Effective throughput** `T = min(rᵢ, r_c, r_e, bandwidth) × efficiency` (efficiency from cooling/power).
- **Credits per session** = `T × focusedSeconds × completionBonus`
  - `completionBonus` = 1.25 if the session reached zero, 1.0 if abandoned.
  - Only `focusedSeconds` count (paused time excluded). Tags do not affect earnings (see §6).
- **Compute per session** = `(results processed during the session)` ≈ `T × focusedSeconds`.
- **Node cost curve** (geometric): `cost(n) = baseCost × growth^n`, `growth` ≈ 1.15.
- **Abandoned sessions** still earn proportional to time spent, at 1.0× (no completion bonus) —
  consistent with [[requirements]] §6.

## 3. Nodes / Gear Catalog

Each node is a small SVG tile with an upgrade level and a throughput meter.

| Node              | Stage   | Effect                                             | v1?  |
|-------------------|---------|----------------------------------------------------|------|
| **Request source**| Ingest  | raises `rᵢ` (more Jobs/sec)                         | ✅   |
| **Server**        | Compute | raises `r_c` (base processing)                     | ✅   |
| **GPU / accelerator** | Compute | high `r_c`, expensive (the modern flagship)    | ✅   |
| **Switch / router** | Link  | raises bandwidth between stages                    | ✅   |
| **Egress node**   | Deliver | raises `r_e` (Results → Credits faster)            | ✅   |
| **Cooling unit**  | support | efficiency multiplier (prevents thermal throttle)  | ✅ (light) |
| **Power / UPS**   | support | capacity cap — limits total running nodes          | later |
| **Storage buffer**| between | larger buffers; smooths bursts, enables bigger jobs| later |

### v1 vs. later structure
- **v1 (lite):** a **fixed 3-stage linear pipeline**; each stage is a row of upgradeable slots (add
  servers to Compute, routers to the Link, etc.). Captures the bottleneck puzzle with no graph editor.
- **Later:** **free-form node graph** on a grid (full Upload Labs style) — branching pipelines,
  parallel compute lanes, routing choices.

## 4. Passive Generation — the key alignment decision

**Recommended (v1): focus-gated.** The pipeline flows only while a session runs. Thematically the
datacenter "powers up" when you focus. This is what keeps the game from rewarding not-focusing.

**Alternative: capped offline trickle.** A small, hard-capped amount accrues between sessions (more
idle-game pull, but decouples reward from focus). If used, cap to a few minutes' worth so sessions
stay dominant.

> Decision needed — see §9.

## 5. Progression (the "growing" arc)

Hitting **Compute** milestones unlocks the next tier — a bigger SVG scene and new node types:

```
Closet → Rack → Row → Server Room → Data Hall → Datacenter(s) → Regions (the cloud)
```

New tiers raise caps, add node types, and (later) unlock the free-form graph.

## 6. Tags & the Game — intentionally separate

**Tags do not affect the game.** They exist only to categorize time for the [[requirements]] summary
(where your hours went). The datacenter is global: Credits and Compute come from total focused time,
regardless of which tag a session used. Two clean concerns — tags answer *"where did my time go?"*,
the game answers *"what did my focus build?"* — with no incentive to pick a tag for a bonus.

## 7. Prestige / Long-Term Replay (optional)

**"Migrate to the cloud" / "Open a new region"** — a soft reset that wipes nodes for a permanent
multiplier via a prestige currency (**Reputation** / **Shares**). Classic idle longevity; can ship later.

## 8. Assets & Visual Style

The node-pipeline model is **even friendlier to procedural art** than a shop:

- **Drawn in code with `react-native-svg`:** nodes are rounded-rect tiles with an icon and a small
  level/throughput meter; links are lines with **animated packets** (dots sliding along) while the
  pipeline runs; LEDs blink; fans spin; counters roll up.
- **Sourced SVGs only for distinctive hero icons** (GPU, router, cooling). Use permissively licensed,
  minimalist flat/line sets; verify the license before bundling.
- **Theming:** author with `currentColor` / tokenized fills so icons adapt to light/dark and can pick
  up tag colors. One consistent grid, 1–2 tone minimalist palette.
- **Animation:** `react-native-reanimated` for packet flow, blinking LEDs, meter fills, the "power-on"
  sequence at session start, and bottleneck warning pulses.

Packet-flow animation doubles as the "tree growing" feedback: a faster, fuller pipeline visibly means
a better focus streak.

## 9. Open Design Decisions

1. **Passive generation:** focus-gated only (recommended) vs. small capped offline trickle? (§4)
2. **v1 pipeline:** fixed 3-stage with upgrade slots (recommended) vs. free-form node graph now? (§3)
3. **Prestige/reset:** cloud-migration prestige now or later? (§7)
4. **Compute's sinks for v1:** research upgrades, tier unlocks, contracts — which combination?
5. **Naming/flavor:** currency names (Credits/Compute, Jobs/Results) and app/game codename.

## 10. Where It Lives in the App

- **Datacenter tab:** the PLAN view — the pipeline, buy/upgrade nodes, spend Compute.
- **Timer screen (during a session):** a live mini-view of the pipeline running — packets flowing,
  Credits/Compute ticking — the reward for staying focused.
- **Summary screen:** time stats, unchanged (see [[requirements]]).
