# CLAUDE.md — Execution Guide for Fantasy Quant (Ultra‑Detailed)

This file gives you (the coding agent) everything needed to implement the backend/services with **tests first**, no UI inventions, and zero ambiguity.

> **Hard rules**
>
> * Do **not** add new pages or flows. Only wire to existing screens under `app/`.
> * Default trade mode is **balanced needs** (both sides’ NeedScore decreases) with ≤3% value give‑up tolerance.
> * Keep costs low: DB‑based rate limits; in‑app notifications only.
> * Use **TypeScript** everywhere.
> * Use **Zod** for runtime validation on inputs.
> * Use **Prisma** for DB access.
> * Never lower test coverage to pass a build. Do not hit ESPN in unit/contract tests (use fixtures).

---

## Development Loop (follow *every* time)

1. `git checkout main && git pull origin main`
2. Pick **next unchecked PR** from the checklist below
3. `git checkout -b feat/prXX-short-title`
4. **Write tests first** (unit/contract/e2e as specified) so they **fail**
5. Implement just enough code to pass
6. Run all checks:

   * `npm run typecheck`
   * `npm run lint`
   * `npm run test:unit` (use `npx vitest run` for single-run, avoid watch mode)
   * `npm run test:contract`
   * `npm run test:e2e` (only for PRs that require it)
7. Self‑review: small diffs, no dead code, no UI changes except atoms in PR14/PR15
8. Create PR using CLI: `gh pr create --title "PRXX - Title" --body "Summary, test plan, implementation details"`
9. Await human validation and approval on GitHub
10. After approval: **Squash merge**, **delete branch**, **tick the checklist**

**Commit style**: Conventional Commits (e.g., `feat(api): add /api/leagues/join`)

---

## Project Scripts (ensure in PR01)

* `npm run dev` — Next dev server
* `npm run build` — Next build
* `npm run lint` — ESLint
* `npm run typecheck` — `tsc --noEmit`
* `npm run test:unit` — Vitest
* `npm run test:contract` — Jest (API shape)
* `npm run test:e2e` — Playwright

---

## PR Checklist & Tracking

Mark `[x]` when merged to `main`.

* [ ] **PR01 — Repo Hygiene & Env + Test Tooling**
* [ ] **PR02 — Supabase Auth Wiring (JWT)**
* [ ] **PR03 — Prisma + DB Schema (Phase 1)**
* [ ] **PR04 — ESPN Client Wrapper (Node mkreiser)**
* [ ] **PR05 — League Join API & Bulk Sync Job**
* [ ] **PR06 — Team Claim API**
* [ ] **PR07 — Players API (valuations & ownership)**
* [ ] **PR08 — Valuation Engine v0**
* [ ] **PR09 — Weakness Scoring API**
* [ ] **PR10 — Trade Generation API (balanced default)**
* [ ] **PR11 — Proposals Persistence + Share Links**
* [ ] **PR12 — Rate Limiting (DB‑based)**
* [ ] **PR13 — Observability & Health**
* [ ] **PR14 — UI Atoms & Feedback (bundle 1)**
* [ ] **PR15 — UI Atoms & Explainability (bundle 2)**

---

## Exact PR Specifications (copy sections directly into PR descriptions)

### PR01 — Repo Hygiene & Env + Test Tooling

**Objective**: Establish env loader + testing frameworks; do not touch UX.

**Dependencies**:

* `zod`, `@types/node`, `typescript` (dev)
* `vitest`, `@vitest/coverage-v8` (dev)
* `jest`, `ts-jest`, `@types/jest` (dev)
* `playwright` (dev)

**Files & contents**:

* `lib/env.ts`

```ts
import { z } from 'zod';
export const EnvSchema = z.object({
  DATABASE_URL: z.string().url(),
  NEXT_PUBLIC_POSTHOG_KEY: z.string().optional(),
  SENTRY_DSN: z.string().optional(),
  ESPNAUTH_ENCRYPTION_KEY: z.string().length(64, '32-byte hex key (64 chars)').optional(),
});
export const env = EnvSchema.parse(process.env);
```

* `.env.example`

```
DATABASE_URL=
NEXT_PUBLIC_POSTHOG_KEY=
SENTRY_DSN=
ESPNAUTH_ENCRYPTION_KEY= # 32-byte hex (64 chars) used for ESPN cookie encryption
```

* `vitest.config.ts`, `jest.config.ts`, `playwright.config.ts` with minimal runnable configs
* `tests/unit/env.spec.ts` (failing→passing zod test)
* `package.json` add scripts listed above

**Acceptance**:

* `npm run typecheck`/`lint`/`test:unit`/`test:contract` run successfully with placeholder tests

**Tests**:

* Unit: malformed env fails validation; well‑formed passes

---

### PR02 — Supabase Auth Wiring (JWT)

**Objective**: Gate protected routes; expose `getSessionUser()` for APIs.

**Dependencies**: `@supabase/supabase-js`

**Files & contents**:

* `lib/supabase.ts`

```ts
import { createClient } from '@supabase/supabase-js';
export const supabase = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL!, process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!);
```

* `lib/auth.ts`

```ts
import { cookies } from 'next/headers';
export async function getSessionUser() {
  // Read Supabase cookie or JWT header and return { id, email }
  // Stub for tests; fill integration as needed
}
```

* `middleware.ts` — redirect unauth from `/(dashboard|players|rosters|trades|proposals|league-setup|settings)` to `/login`

**Acceptance**:

* Unauthed users are redirected; authed users pass
* API handlers can read `user.id` via helper

**Tests**:

* E2E: redirect works; Unit: `getSessionUser` returns null when no cookie

---

### PR03 — Prisma + DB Schema (Phase 1)

**Objective**: Create DB models & migrations matching TDD.

**Dependencies**: `prisma`, `@prisma/client`

**Files & contents**:

* `prisma/schema.prisma` (models abbreviated here; implement exactly)

```prisma
model User { id String @id @default(cuid()); email String @unique; handle String?; createdAt DateTime @default(now()) }
model League { id String @id @default(cuid()); espnLeagueId String @unique; season Int; name String; scoringJson Json; rosterRulesJson Json; auctionBudget Int?; firstLoadedAt DateTime?; createdBy String?; teams Team[] }
model Team { id String @id @default(cuid()); leagueId String; league League @relation(fields: [leagueId], references: [id]); espnTeamId Int; name String; ownerUserId String?; @@unique([leagueId, espnTeamId]) }
model TeamClaim { id String @id @default(cuid()); leagueId String; teamId String; userId String; claimedAt DateTime @default(now()); @@unique([leagueId, teamId]); @@unique([leagueId, userId]) }
model Player { id String @id @default(cuid()); espnPlayerId Int @unique; name String; posPrimary String; posEligibility String[]; teamAbbr String? }
model RosterSlot { id String @id @default(cuid()); teamId String; playerId String; slotType String; week Int; }
model Projection { id String @id @default(cuid()); playerId String; week Int; source String; ptsMean Float; ptsP10 Float?; ptsP90 Float?; updatedAt DateTime @default(now()) }
model GameLog { id String @id @default(cuid()); playerId String; week Int; statsJson Json; ptsActual Float; updatedAt DateTime @default(now()) }
model AuctionPrice { id String @id @default(cuid()); leagueId String; playerId String; amount Float; source String; createdAt DateTime @default(now()) }
model ReplacementBaseline { id String @id @default(cuid()); season Int; pos String; baselineRank Int; ptsPerGame Float; source String; updatedAt DateTime @default(now()) }
model Valuation { id String @id @default(cuid()); leagueId String; playerId String; price Float; components Json; ts DateTime @default(now()); @@index([leagueId, playerId, ts]) }
model TradeProposal { id String @id @default(cuid()); leagueId String; fromTeamId String; toTeamId String; status String; valueDeltaFrom Float; valueDeltaTo Float; createdAt DateTime @default(now()) }
model TradeItem { id String @id @default(cuid()); proposalId String; playerId String; direction String }
model ProposalShare { id String @id @default(cuid()); proposalId String; token String @unique; createdAt DateTime @default(now()); revokedAt DateTime? }
model SyncJob { id String @id @default(cuid()); leagueId String; jobType String; status String; scheduledFor DateTime?; startedAt DateTime?; finishedAt DateTime?; error String? }
model RateLimit { id String @id @default(cuid()); userId String; routeKey String; windowStart DateTime; count Int }
```

* `lib/database.ts` — Prisma client singleton
* `scripts/seed.ts` — seed one league, two teams, sample players

**Acceptance**:

* `prisma migrate dev` runs; tables exist; seed script succeeds

**Tests**:

* Unit: unique constraints on TeamClaim via Prisma error code

---

### PR04 — ESPN Client Wrapper (Node mkreiser)

**Objective**: Type‑safe wrapper for mkreiser client; fixtures for tests.

**Dependencies**: `espn-fantasy-football-api` (Node import path)

**Files & contents**:

* `lib/espn/types.ts` — TS types for the subset of fields we consume (League, Team, Player, Boxscore, DraftPlayer)
* `lib/espn/client.ts`

```ts
import Client from 'espn-fantasy-football-api/node';
export function getClient(leagueId: number, cookies?: { espnS2: string; SWID: string }) {
  const c = new Client({ leagueId });
  if (cookies) c.setCookies(cookies);
  return c;
}
export async function fetchLeagueInfo(args:{ leagueId:number; seasonId:number; cookies?:{espnS2:string;SWID:string} }){/* ... */}
export async function fetchTeamsAtWeek(/* ... */){}
export async function fetchBoxscores(/* ... */){}
export async function fetchDraftInfo(/* ... */){}
export async function fetchFreeAgents(/* ... */){}
```

* `tests/fixtures/espn/*.json` — recorded JSON for each method

**Acceptance**:

* Can call wrapper with fixtures in tests; no live calls

**Tests**:

* Unit: each wrapper maps fields as expected (using fixtures)

---

### PR05 — League Join API & Bulk Sync Job

**Objective**: First `join` triggers **bulk load**; idempotent; later joins are instant.

**Files & contents**:

* `app/api/leagues/join/route.ts`

  * Validate body with Zod: `{ leagueId: string, season: number, espnS2?: string, SWID?: string }`
  * Rate limit: 3/hr per user via `lib/rate-limit.ts`
  * If league not found: create `SyncJob(queued)` → run `lib/ingest/bulk.ts` with advisory lock
  * Return `{ leagueId, name, season, wasBulkLoaded, teams:[{espnTeamId,name,claimable}] }`
* `lib/ingest/bulk.ts`

  * Steps:

    1. League: `fetchLeagueInfo` → upsert
    2. Teams/Rosters: `fetchTeamsAtWeek`(current scoring period) → upsert teams, players, roster\_slots(week)
    3. Draft/Auction: `fetchDraftInfo` → insert AuctionPrice when `bidAmount` present
    4. Boxscores (recent N weeks): `fetchBoxscores` → insert GameLog and provisional projections
    5. Free agents (optional): `fetchFreeAgents` → enrich ownership
    6. Baselines: compute ReplacementBaseline from league roster rules
    7. Finish SyncJob
  * Advisory lock example (Prisma): `await prisma.$executeRawUnsafe('SELECT pg_advisory_xact_lock($1,$2)', leagueId, season)`
* `lib/rate-limit.ts` — sliding window counters in `RateLimit`

**Acceptance**:

* Unknown league triggers bulk load and returns teams; known league returns teams with `wasBulkLoaded=false`
* Duplicate concurrent calls do not duplicate data (advisory lock)

**Tests**:

* Contract: response shape
* Integration (with fixtures): bulk job writes expected rows; duplicate join is a no‑op
* Unit: rate limit 429 path

**Sample request/response**:

```http
POST /api/leagues/join
{ "leagueId":"12345", "season":2025 }
→ { "leagueId":"l_abc", "name":"My League", "season":2025, "wasBulkLoaded":true,
    "teams":[{"espnTeamId":1,"name":"Team A","claimable":true}] }
```

---

### PR06 — Team Claim API

**Objective**: Enforce exclusive claim per team and per user in a league.

**Files & contents**:

* `app/api/leagues/[id]/claim/route.ts`

  * Validate body `{ espnTeamId: number }`
  * Insert into `TeamClaim`; handle Prisma unique constraint errors
  * 200 `{ ok:true, teamId }` on success; 409 on conflict

**Acceptance**:

* First claimer succeeds; second claimer gets 409

**Tests**:

* Unit: simulate double claim → expect 409

**Sample request**:

```http
POST /api/leagues/l_abc/claim
{ "espnTeamId": 3 }
```

---

### PR07 — Players API (valuations & ownership)

**Objective**: Power `app/players` with real data.

**Files & contents**:

* `app/api/leagues/[id]/players/route.ts`

  * Query params: `search`, `pos`, `owned`, `sort`, `cursor`
  * Join `Player` + latest `Valuation` (by ts desc) + ownership from `RosterSlot`
  * Return shape:

```json
{ "items": [ { "playerId":"p1", "name":"...", "pos":"WR", "team":"CIN",
  "ownedByTeamId": null, "valuation": { "price": 27.4, "components": { "anchor":12.1, "deltaPerf":4.2, "vorp":6.8, "global":2.3 } } } ],
  "nextCursor": null }
```

* `lib/players/query.ts` — query builder

**Acceptance**:

* Search & filters work; pagination stable

**Tests**:

* Contract shape; sorting by price; pagination cursors

---

### PR08 — Valuation Engine v0

**Objective**: Compute per‑player price & attribution.

**Files & contents**:

* `lib/valuation/compute.ts`

  * Inputs: leagueId
  * For each player: compute `Price = 0.45*A + 0.20*(A + f*ΔPerf) + 0.25*VORP + 0.10*G`
  * Clamp by position; write `Valuation { price, components }`
* `app/api/leagues/[id]/valuations/rebuild/route.ts` (admin guard)

**Acceptance**:

* After run, `/players` shows prices; components sum to price

**Tests**:

* Unit: EMA half‑life math; clamps; sum(components)==price

---

### PR09 — Weakness Scoring API

**Objective**: Return deficits by position and overall NeedScore.

**Files & contents**:

* `app/api/leagues/[id]/weakness/route.ts`

  * Params: `teamId`
  * Returns `{ needScore, items:[{pos, deficitPts, deficitValue, drivers[]}] }`
* `lib/teams/weakness.ts` — starters selection, baselines, bye/injury adjustments

**Acceptance**:

* Deterministic output for seeded league

**Tests**:

* Unit: synthetic rosters → expected deficits; handles BYE

---

### PR10 — Trade Generation API (balanced default)

**Objective**: Suggest realistic win‑win trades.

**Files & contents**:

* `app/api/leagues/[id]/trades/generate/route.ts`

  * Body: `{ fromTeamId, toTeamId?, targets?, sendables?, mode?: 'balanced'|'strict' }`
  * Balanced filter: both teams’ NeedScore decreases; `ΔValue ≥ −3%` for both
  * Rank by shared need improvement; tie‑break minimal value give‑up
  * Return 3–5 proposals with:

```json
{
  "proposalId": "temp-1",
  "give": [{"playerId":"pA"}],
  "get":  [{"playerId":"pB"}],
  "valueDelta": {"you": 6.2, "them": 3.9 },
  "needDelta": {
    "you":  {"byPos":{"WR":-3.2}, "before": 8.1, "after": 4.9},
    "them":  {"byPos":{"RB":-2.4}, "before": 6.0, "after": 3.6}
  },
  "rationale": "..."
}
```

* `lib/trades/generate.ts` — algorithm & types

**Acceptance**:

* Returns proposals for seeded league; strict mode yields fewer

**Tests**:

* Unit: filter & ranking; Strict vs Balanced

---

### PR11 — Proposals Persistence + Share Links

**Objective**: Save proposals; share via tokenized read‑only links.

**Files & contents**:

* `app/api/proposals/route.ts` (POST) → create `TradeProposal` + `TradeItem[]`
* `app/api/proposals/[id]/route.ts` (PATCH) → update status
* `app/api/trades/[id]/share-link/route.ts` (POST) → insert `ProposalShare{token}` and return URL `/proposals?token=...`
* `app/proposals/page.tsx` — detect `token` query → render read‑only state (no edit controls)

**Acceptance**:

* Token opens read‑only proposal; no mutations allowed

**Tests**:

* Unit: token creation/revocation; scope; read‑only enforcement by token path

---

### PR12 — Rate Limiting (DB‑based)

**Objective**: Protect expensive routes without Redis.

**Files & contents**:

* `lib/rate-limit.ts`

```ts
export async function checkAndIncrement(userId:string, routeKey:string, limit:number, windowMs:number): Promise<'ok'|'limited'> {/* impl via RateLimit table */}
```

* Wrap `/leagues/join` (3/hr) and `/trades/generate` (20/hr)

**Acceptance**:

* Returns 429 with friendly message when over cap

**Tests**:

* Unit: sliding window increments & expiry

---

### PR13 — Observability & Health

**Objective**: Minimal but useful ops visibility.

**Files & contents**:

* `app/api/health/route.ts` → `{ ok:true, version, dbMs }`
* `lib/log.ts` → `withRequestId(handler)` wrapper adds `x-request-id`
* `lib/sentry.ts` (optional) → no‑op if DSN absent

**Acceptance**:

* Health returns 200; logs include requestId

**Tests**:

* Unit: health JSON shape

---

### PR14 — UI Atoms & Feedback (bundle 1)

**Objective**: Inline polish (no new pages).

**Files & contents**:

* `components/ui/SyncChip.tsx` — shows “Synced Xm ago”, click → calls `/api/leagues/:id/sync` (stub or later)
* `components/ui/CopyButton.tsx` — copies text + toast
* Skeleton rows for dashboard/players/proposals

**Acceptance**:

* Visible atoms, no layout shifts

**Tests**:

* Component tests (render, click)

---

### PR15 — UI Atoms & Explainability (bundle 2)

**Objective**: Explain valuations/trades succinctly.

**Files & contents**:

* `components/valuation/PriceBreakdown.tsx` — shows components in a popover
* Trades page: label aggressiveness (Low/Med/High); disclosure caret to show `rationale`

**Acceptance**:

* Popover shows correct component numbers; rationale toggles per card

**Tests**:

* Component tests with test ids

---

## ESPN Usage Rules for Tests

* Use **fixtures** under `tests/fixtures/espn/` for wrapper tests
* Do **not** call live ESPN endpoints in unit/contract tests
* Integration tests may call live endpoints only when `ESPNUSE_LIVE=1` (default off)

---

## Environment Variables (see `.env.example`)

* `DATABASE_URL` — Postgres
* `NEXT_PUBLIC_POSTHOG_KEY` — optional
* `SENTRY_DSN` — optional
* `ESPNAUTH_ENCRYPTION_KEY` — 32‑byte hex for cookie encryption

---

**Stop and ask** if any requirement conflicts with the existing UX files or if private leagues require additional user inputs (espnS2/SWID).
