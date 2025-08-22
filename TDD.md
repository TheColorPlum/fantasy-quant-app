# Fantasy Quant — Full Technical Design (v1.0)

**Scope:** Ship a web‑only MVP that connects to ESPN leagues (NodeJS client), supports join → claim flow with bulk first‑load, runs valuation + weakness scoring, generates/saves trade proposals, and provides in‑app notifications. No realtime chat, no mobile, no paid features, never a draft assistant.

**Principles:**

* Reuse the existing screens you already built; do not add pages.
* Single‑language stack (TypeScript/Node) for speed and simplicity.
* ESPN ingestion isolated but callable from Next API routes.
* Keep costs low (DB‑based rate limits; in‑app only notifications).

---

## 1) Architecture

* **Frontend:** Next.js (TS), Tailwind, shadcn/ui. Existing pages in `app/` drive all flows.
* **API:** Next.js **route handlers** under `app/api/*`. All server logic lives here.
* **ESPN Ingestion:** Node/TS module that wraps the mkreiser client; invoked by `/api/leagues/join` and job handlers.
* **DB:** Supabase Postgres (Prisma client). Optional Supabase Storage for exports.
* **Rate limiting:** DB counters (table `rate_limits`).
* **Observability:** Sentry + structured logs. Health endpoint `/api/health`.
* **Notifications:** In‑app toasts/badges only (no email/SMS in MVP).
* **Analytics (nice‑to‑have):** PostHog browser SDK behind a settings flag.

---

## 2) ESPN Node API Client — Confirmed Surface (mkreiser)

**Import:**

```ts
// Node build
import Client from "espn-fantasy-football-api/node"; // or require(".../node")
```

**Auth for private leagues:**

```ts
const client = new Client({ leagueId, espnS2, SWID });
client.setCookies({ espnS2, SWID });
```

**Methods (from `src/client/client.js`):**

* `getLeagueInfo({ seasonId }) => League`
* `getTeamsAtWeek({ seasonId, scoringPeriodId }) => Team[]`
* `getHistoricalTeamsAtWeek({ seasonId < 2018, scoringPeriodId }) => Team[]`
* `getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId }) => Boxscore[]`
* `getHistoricalScoreboardForWeek({ ... })` (legacy equivalent)
* `getFreeAgents({ seasonId, scoringPeriodId }) => FreeAgentPlayer[]`
* `getDraftInfo({ seasonId, scoringPeriodId = 0 }) => DraftPlayer[]` (contains `bidAmount` for auction)
* `getNFLGamesForPeriod({ startDate:"YYYYMMDD", endDate:"YYYYMMDD" }) => NFLGame[]`

**Notable object fields (from models):**

* **League:** `currentMatchupPeriodId`, `currentScoringPeriodId`, `lineupSlotCounts`, `rosterSettings`, `scoringSettings.scoringItems` (points per stat), etc.
* **Team:** id, name, owner displayName (when available), record slices, roster (players) at a given `scoringPeriodId`.
* **Player:** `id`, `fullName`, `defaultPosition`, `eligiblePositions[]`, `proTeamAbbreviation`, injury/availability flags, ownership %, ADP/auction averages when present.
* **Boxscore/BoxscorePlayer:** actual + projected points for the current scoring period (used for ΔPerf and EMA).
* **DraftPlayer:** auction `bidAmount` (when auction draft), pick metadata.
* **FreeAgentPlayer:** includes projected stats at a scoring period; treat as available pool.

**ESPN parameters:**

* `leagueId` — your league id.
* `seasonId` — NFL season year.
* `matchupPeriodId` — matchup number this season.
* `scoringPeriodId` — NFL week (0 = preseason; 18 = post‑season end in many setups).

---

## 3) Data Model (ERD‑lite)

```txt
users(id, email, handle, created_at)

leagues(id UUID, espn_league_id UNIQUE, season, name, scoring_json, roster_rules_json,
        first_loaded_at, created_by, auction_budget)

teams(id, league_id FK, espn_team_id, name, owner_user_id NULL, UNIQUE(league_id, espn_team_id))

team_claims(id, league_id FK, team_id FK, user_id FK, claimed_at,
            UNIQUE(league_id, team_id), UNIQUE(league_id, user_id))

players(id, espn_player_id, name, pos_primary, pos_eligibility[], team_abbr)

roster_slots(id, team_id FK, player_id FK, slot_type, week)

projections(player_id FK, week, source, pts_mean, pts_p10, pts_p90, updated_at)

game_logs(player_id FK, week, stats_json, pts_actual, updated_at)

auction_prices(league_id FK, player_id FK, amount, source, created_at)

replacement_baselines(season, pos, baseline_rank, pts_per_game, source, updated_at)

valuations(id, league_id FK, player_id FK, price, price_components_json, ts)

trade_proposals(id, league_id, from_team_id, to_team_id, status ENUM('draft','sent','accepted','declined'),
                value_delta_from, value_delta_to, created_at)

trade_items(id, proposal_id FK, player_id FK, direction ENUM('from','to'))

proposal_shares(id, proposal_id FK, token UNIQUE, created_at, revoked_at NULL)

sync_jobs(id, league_id, job_type ENUM('bulk_load','nightly'), status ENUM('queued','running','succeeded','failed'),
          scheduled_for, started_at, finished_at, error)

rate_limits(user_id, route_key, window_start, count)
```

**Indexes:** `(league_id, player_id, week)`; `(league_id, espn_team_id)`; `(espn_player_id)`; status/ts on proposals.
txt
users(id, email, handle, created\_at)

leagues(id UUID, espn\_league\_id UNIQUE, season, name, scoring\_json, roster\_rules\_json,
first\_loaded\_at, created\_by)

teams(id, league\_id FK, espn\_team\_id, name, owner\_user\_id NULL, UNIQUE(league\_id, espn\_team\_id))

team\_claims(id, league\_id FK, team\_id FK, user\_id FK, claimed\_at,
UNIQUE(league\_id, team\_id), UNIQUE(league\_id, user\_id))

players(id, espn\_player\_id, name, pos\_primary, pos\_eligibility\[], team\_abbr)

roster\_slots(id, team\_id FK, player\_id FK, slot\_type, week)

projections(player\_id FK, week, source, pts\_mean, pts\_p10, pts\_p90, updated\_at)

game\_logs(player\_id FK, week, stats\_json, pts\_actual, updated\_at)

auction\_prices(league\_id FK, player\_id FK, amount, source, created\_at)

replacement\_baselines(season, pos, baseline\_rank, pts\_per\_game, source, updated\_at)

valuations(id, league\_id FK, player\_id FK, price, price\_components\_json, ts)

trade\_proposals(id, league\_id, from\_team\_id, to\_team\_id, status ENUM('draft','sent','accepted','declined'),
value\_delta\_from, value\_delta\_to, created\_at)

trade\_items(id, proposal\_id FK, player\_id FK, direction ENUM('from','to'))

sync\_jobs(id, league\_id, job\_type ENUM('bulk\_load','nightly'), status ENUM('queued','running','succeeded','failed'),
scheduled\_for, started\_at, finished\_at, error)

rate\_limits(user\_id, route\_key, window\_start, count)

```
**Indexes:** `(league_id, player_id, week)`; `(league_id, espn_team_id)`; `(espn_player_id)`; status/ts on proposals.

---

## 4) Ingestion & Mapping (Initial Bulk Load → Ongoing)
**Trigger:** first user calls `/api/leagues/join` with `{ leagueId, season }`.

**Steps:**
1) **League:** `client.getLeagueInfo({ seasonId })` → upsert `leagues`
   - Save `scoring_json` (raw `scoringItems`) and `roster_rules_json` (slot counts + eligibility).
   - Capture `auction_budget` from `draftSettings.auctionBudget` when present (used to normalize prices/value_per_point).
   - Capture `currentMatchupPeriodId`, `currentScoringPeriodId` in `sync_jobs` context.
2) **Teams & rosters:** `client.getTeamsAtWeek({ seasonId, scoringPeriodId: current })`
   - Upsert `teams` (id, name). For each team, roster entries → upsert `players` and `roster_slots(week=current)`.
3) **Draft / Auction anchors:** `client.getDraftInfo({ seasonId })`
   - When present and league used auction: insert `auction_prices(amount=bidAmount, source='espn_draft')`.
   - If snake draft: skip or record `source='none'` and let global anchors fill in later.
4) **Game logs / projections:**
   - MVP: populate **actuals** and **projected** for current/recent weeks from `getBoxscoreForWeek` (`totalPointsLive` / `totalProjectedPointsLive`).
   - If deeper projections needed, we will add a dedicated projection source later; the mkreiser client does not directly expose a standalone projections view.
5) **Free agents (optional):** `getFreeAgents({ seasonId, scoringPeriodId: current })` → enrich player pool and ownership context.
6) **Baselines:** compute `replacement_baselines` per position from league roster rules (e.g., RB baseline at RB#(teams × starters per team)).
7) Mark `sync_jobs` → `succeeded`; set `first_loaded_at`.

**Idempotency & safety:**
- Advisory lock per `(leagueId, season)` during bulk load; ignore duplicate requests.
- Upsert keys use ESPN ids + week; dedupe via unique constraints.
- DB‑based rate limit on `/join`.

**Auth:** If the league is private, require `espnS2` + `SWID` at join/claim time; encrypt at rest and scope usage to this league only (see §10).

---

## 5) Valuation Engine (v0)
**Priceᵢ = 0.45·Aᵢ + 0.20·(Aᵢ + f·ΔPerfᵢ) + 0.25·VORPᵢ + 0.10·Gᵢ**
- `Aᵢ` local auction anchor (from `auction_prices`), fallback to global auction average normalized to this league budget.
- `ΔPerfᵢ` EMA(actual − projected) half‑life ≈ 3 games; if projections unavailable, use ESPN projected from boxscore `totalProjectedPointsLive`.
- `VORPᵢ` computed from `replacement_baselines` vs player’s position.
- `Gᵢ` global auction average (if you store cross‑league means later; MVP can start as 0 until you have data).
- Clamp by position floors/caps; persist `price_components_json` per upsert.

**Cadence:** compute after bulk load; allow manual `/sync` to re‑compute; cron later.

---

## 6) Team Weakness Scoring (v0)
For a `teamId` at current week:
- Pick valid starters by slot; compute `S_p` = sum of projected (or actual to date) points for starters at position `p`.
- Let `R_p` be baseline points for `p` from `replacement_baselines`.
- `Deficit_p = max(0, R_p − S_p)` and `$gap = Deficit_p × valuePerPoint` (league‑normalized via `auction_budget`).
- **Team need score:** `NeedScore = Σ_p Deficit_p` (lower is better). Used by the trade engine (§7).
- Return ordered list of deficits with short drivers (e.g., "RB2 below baseline; BYE W9").

---

## 7) Trade Generation (v0)
**Default “win‑win” = *balanced needs*, not total value.**

**Inputs:** `{ fromTeamId, toTeamId?, targets?: string[], sendables?: string[], mode?: 'balanced'|'strict' }`

**Definitions:**
- **Need score (per team):** sum of positive position deficits from §6 before/after trade. Lower is better.
- **Total value change (per team):** `ΔValue = value_in − value_out` using current valuations.

**Algorithm:**
1) Compute **pre‑trade need score** for both teams.
2) Generate candidate swaps/packages under slot/bye/injury eligibility.
3) **Balanced win‑win filter (default):**
   - `needScore_after_A < needScore_before_A` **AND** `needScore_after_B < needScore_before_B`, and
   - `ΔValue_A ≥ −τ` **AND** `ΔValue_B ≥ −τ` where **τ = 3%** of each team’s roster value.
4) **Strict mode (optional):** `ΔValue_A > 0` **AND** `ΔValue_B > 0`.
5) **Ranking:** Pareto by `max( min( need improvement A, need improvement B ) )`; tie‑break by minimal value give‑up and near‑term schedule.
6) **Output:** 3–5 proposals with per‑team: `{ needDeltaByPos, needScoreBefore, needScoreAfter, deltaValue }` and a rationale blurb.

**Persistence:** save on user action (draft/sent) to `trade_proposals` + `trade_items`.

---

## 8) API Surface (your app’s Next routes)
**Auth:** Supabase JWT; middleware for protected routes.

- `POST /api/leagues/join`
  - Body: `{ leagueId: string, season: number, espnS2?: string, SWID?: string }`
  - Returns: `{ leagueId: uuid, name, season, wasBulkLoaded: boolean, teams: [{ espnTeamId, name, claimable }] }`

- `POST /api/leagues/:id/claim`
  - Body: `{ espnTeamId: string }`
  - 409 if already claimed; returns `{ ok: true, teamId }` on success.

- `GET /api/leagues/:id/status`
  - Returns `lastSync`, `currentWeek`, `teamClaimed`, counts.

- `GET /api/leagues/:id/players?search=&pos=&owned=&sort=&cursor=`
  - Joins `players` + latest `valuations` + ownership. Include injury/bye flags when present.

- `GET /api/leagues/:id/rosters?teamId=`
  - Returns starters/bench with bye/injury annotations.

- `GET /api/leagues/:id/weakness?teamId=`
  - Returns `{ needScore, items:[ { pos, deficitPts, deficitValue, drivers[] } ] }`.

- `POST /api/leagues/:id/trades/generate`
  - Body: `{ fromTeamId, toTeamId?, targets?, sendables?, mode?: 'balanced'|'strict' }`
  - Returns proposals: `{ proposalId (temp), give[], get[], valueDelta:{ you, them }, needDelta:{ you:{ byPos, before, after }, them:{ ... } }, rationale }`.

- `POST /api/proposals`
  - Creates proposal (status "draft" or "sent").

- `PATCH /api/proposals/:id`
  - Update status to accepted/declined.

- `POST /api/trades/:id/share-link`
  - Creates token in `proposal_shares`; returns URL of form `/proposals?token=...` that renders read‑only mode using the existing page (no new screen).

- `GET /api/health`

**Rate limits (per user):** `/leagues/join` ≤ 3/hr, `/trades/generate` ≤ 20/hr.

---

## 9) Mapping UI → API/Data
- `league-setup` → `/api/leagues/join`, `/api/leagues/:id/claim`; progress from `sync_jobs`.
- `dashboard` → `/api/leagues/:id/status` (+ top deltas optional).
- `players` → `/api/leagues/:id/players` with valuation popovers.
- `rosters` → `/api/leagues/:id/rosters`, optional `/weakness` for selected team.
- `trades` → `/api/leagues/:id/trades/generate` (`mode` defaults to `'balanced'`), `/api/proposals` when saving.
- `proposals` → `/api/leagues/:id/proposals`, share links route to `proposals?token=...` in **read‑only mode** (reuse same component, no new screen).
- `settings` → profile toggle for PostHog; no billing.

---

## 10) Security & Access Control
- Every read/write scoped by `league_id` and the user’s `team_claim`.
- Users see only their league’s data; free agent lists scoped per league.
- **Private leagues:** `espnS2`/`SWID` accepted on join/claim; stored **encrypted**, scoped to that league/team, and rotated on user action. Accessed only during ingestion/sync for that league.
- **Tokens:** share links use opaque tokens stored in `proposal_shares`; tokens reveal only the proposal payload (read‑only) and nothing else.

---

## 11) Observability & Errors
- Log correlation id per request; include `leagueId` and `sync_job_id` in logs.
- Sentry capture on API and client; sourcemaps on Vercel.
- Graceful 4xx for invalid league/team/claim; 429 for rate‑limit; 5xx masked.

---

## 12) Testing Strategy
- **Unit (Vitest):** valuation (EMA, clamps), weakness scoring, trade ranking; unique claim enforcement; token generator.
- **Contract tests (Jest):** verify JSON shapes for endpoints (include `mode` in `/trades/generate` and `needDelta` fields in responses).
- **Integration:** seeded league end‑to‑end bulk load; proposals persistence; share‑link resolves read‑only mode.
- **E2E (Playwright):** join → claim → players/rosters → trade generate (balanced vs strict) → share link; verify no chat UI.

---

## 13) Open Questions / Decisions
- For private leagues, do we store `espnS2/SWID` per user (on claim) or only accept them on demand per sync?
- Do we want projections at MVP (via ESPN `kona_player_info`) or defer and use boxscore projected fields only?
- Per‑position valuation weights now vs. later?

---

## Appendix A — ESPN Client Quick Reference (from source)
**Constructor:** `new Client({ leagueId, espnS2?, SWID? })`

**Methods:**
- `getLeagueInfo({ seasonId })` → League (settings + status)
- `getTeamsAtWeek({ seasonId, scoringPeriodId })` → Team[] (rosters at week)
- `getBoxscoreForWeek({ seasonId, matchupPeriodId, scoringPeriodId })` → Boxscore[] (actual & projected)
- `getFreeAgents({ seasonId, scoringPeriodId })` → FreeAgentPlayer[]
- `getDraftInfo({ seasonId, scoringPeriodId=0 })` → DraftPlayer[] (auction `bidAmount`)
- `getNFLGamesForPeriod({ startDate, endDate })` → NFLGame[]
- `setCookies({ espnS2, SWID })` for private leagues

**Object fields (non‑exhaustive):**
- Player: `id, fullName, defaultPosition, eligiblePositions[], proTeamAbbreviation, injuryStatus, percentOwned, percentStarted`
- Team: `id, name, rosterForCurrentScoringPeriod`, record slices
- League: `lineupSlotCounts, scoringSettings.scoringItems, status.currentMatchupPeriod`
- Boxscore: `home/away projected/total points`, `rosterForCurrentScoringPeriod.entries[]`
- DraftPlayer: `bidAmount` (auction)

```
Appendix — Exact Formulas for Valuation, Weakness, and Trades (authoritative)
A1) Inputs & constants

N_teams, lineupSlotCounts[p], flexSlots, F (FLEX‑eligible positions)

PPG_proj_i (next scoring period projection from ESPN boxscore; fallback below)

PPG_actual_i[w] (actual points by week)

A_i (local auction anchor via getDraftInfo().bidAmount, else 0)

G_i (normalized global anchor, 0 in MVP if absent)

EMA half‑life h=3 → α = 1 − 2^(−1/h) ≈ 0.2063

Replacement smoothing K=3; epsilon ε=0.1

Horizons: H_perf=3 weeks, H_vorp=1 week

A2) Injury & BYE multipliers (apply to PPG_proj_i first)
Active: 1.00;  Q: 0.85;  D: 0.50;  O/IR: 0.00;  BYE: 0.00
PPG_proj_i := PPG_proj_i × m_status
A3) Replacement baseline per position R_p

Base starters: base_p = N_teams × lineupSlotCounts[p]

FLEX: take top N_teams × flexSlots across F by PPG_proj; count per‑position → flexCount_p

Baseline rank: baseline_rank_p = base_p + (flexCount_p || 0)

Replacement PPG (sorted by PPG_proj within p), idx = baseline_rank_p:

R_p = mean( PPG_proj at ranks [idx .. idx+K−1] )

Fallback projection if missing: PPG_fallback_i = 0.6×rolling_avg_actual_3w + 0.4×pos_mean_proj.

A4) Value‑per‑point calibration vpp

Let S = { i | A_i > 0 }.

vpp_sum = ( Σ_{i∈S} A_i ) / ( Σ_{i∈S} max(ε, PPG_proj_i − R_{pos(i)}) )
vpp_med = median_{i∈S} ( A_i / max(ε, PPG_proj_i − R_{pos(i)}) )
vpp = 0.5*vpp_sum + 0.5*vpp_med

If |S| small → fallback to conservative default (e.g., $1.0/pt).

A5) Performance delta (EMA)

Weekly error: e_i[w] = PPG_actual_i[w] − PPG_proj_i[w]

ΔPerf_i[0] = 0
ΔPerf_i[w] = α*e_i[w] + (1−α)*ΔPerf_i[w−1]

Currency tilt: C_perf_i = vpp × H_perf × ΔPerf_i.

A6) VORP component

VORP_pts_i = PPG_proj_i − R_{pos(i)}
C_vorp_i = vpp × H_vorp × VORP_pts_i

A7) Anchors

C_anchor_i = A_i (0 if missing); G_i as normalized global anchor in $.

A8) Final price & clamps
RawPrice_i = 0.45*C_anchor_i
           + 0.20*(C_anchor_i + C_perf_i)
           + 0.25*C_vorp_i
           + 0.10*G_i

Per‑position clamps: compute p05, p95 over anchors A_i for position p; set floor_p = 0.5*p05, cap_p = 1.15*p95. Price_i = min(cap_p, max(floor_p, RawPrice_i)).

Persist price_components_json = { vpp, R_p, PAR_pts_i, C_anchor_i, C_perf_i, C_vorp_i, G_i, weights } where PAR_pts_i = VORP_pts_i.

A9) Team Weakness & NeedScore

For team T:

Pick starters (incl. FLEX) to maximize total PPG_proj (greedy).

B_p_team = lineupSlotCounts[p] × R_p

S_p_team = Σ PPG_proj_i of chosen starters at p

Deficit_p = max(0, B_p_team − S_p_team) (points)

$Deficit_p = vpp × Deficit_p

NeedScore_T = Σ_p Deficit_p

A10) Trade deltas & Balanced win‑win

For trade between A and B:

ΔValue_A = Σ Price(get_A) − Σ Price(give_A)
ΔValue_B = Σ Price(get_B) − Σ Price(give_B)
ΔNeed_A  = NeedScore_after_A − NeedScore_before_A
ΔNeed_B  = NeedScore_after_B − NeedScore_before_B

Balanced win‑win (default):

ΔNeed_A < 0  AND  ΔNeed_B < 0
AND ΔValue_A ≥ −τ·TeamValue_A
AND ΔValue_B ≥ −τ·TeamValue_B

with τ=0.03, TeamValue_X = Σ Price(all rostered players of X).

Ranking:

score = max( −ΔNeed_A, −ΔNeed_B )
# tie-breaks: minimize max(0, −ΔValue_A)+max(0, −ΔValue_B), then target worst pre‑trade deficit