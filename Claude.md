# Claude Project Context & Init Prompt

This file is the **project context / scope / memory bank** and the **initialization prompt** for Claude when working in VS Code on this repo. It captures the architecture, constraints, folder layout, APIs, data model, job system, and DX rules. Claude should read this file *first* before making changes.

**IMPORTANT**: For implementation guidance and roadmap, refer to:
- **PR-Roadmap.md** - The authoritative 15-PR implementation checklist and specifications
- **TDD.md** - The complete technical design document with data models, API surface, and formulas

These files are the source of truth for all implementation decisions.

**GIT WORKFLOW NOTE**: The repository remote should use HTTPS (not SSH) due to deploy key configuration:
```bash
git remote set-url origin https://github.com/TheColorPlum/fantasy-quant-app.git
```

---

## 0) One‑liner

Build a local‑first dev setup using **Claude Code** with a clean separation between **UI (Next.js)**, **API (Vercel Functions)**, **background jobs (worker loop + Vercel Cron)**, and a deterministic **trade engine** package. Keep production on **Vercel + Supabase**; keep the engine pure (no I/O) and versioned.

---

## 1) Goals & Non‑Goals

**Goals**

* Iterate locally with Claude Code without incurring hosted LLM costs.
* Preserve Vercel + Supabase for preview/prod deploys.
* Isolate a testable, fast, reproducible **trade engine** (pure TS).
* Deterministic builds; strict env validation; idempotent APIs.
* Add background job pattern for ingestion + valuations.

**Non‑Goals**

* No complex queue infra at first. Use a simple jobs table.
* No client‑side secrets. Service role keys live only in API/worker.
* No Edge runtime for compute‑heavy tasks (use Node runtime).

---

## 2) Tech Stack

* **Frontend**: Next.js (App Router), shadcn/ui, Tailwind.
* **Backend**: Next.js API routes on Vercel (Node runtime), Vercel Cron.
* **DB**: Supabase Postgres, Prisma ORM + Prisma migrations.
* **Auth**: Supabase Auth.
* **Architecture**: Standard Next.js application (not monorepo).
* **Tests**: Vitest + Jest + Playwright.

---

## 3) Application Structure (Standard Next.js)

```
/app            # Next.js App Router pages and API routes
  /api/*        # API route handlers (Vercel Functions)
  /(pages)      # UI pages
/lib            # Shared utilities and business logic
  /auth.ts      # Supabase authentication helpers
  /database.ts  # Prisma client singleton
  /env.ts       # Environment validation
/prisma         # Database schema and migrations
  /schema.prisma
/scripts        # Database seeding and maintenance
/tests          # Test files organized by type
  /unit         # Vitest unit tests
  /e2e          # Playwright e2e tests
```

**Rationale**: Standard Next.js structure following TDD.md specification. All business logic in /lib, API routes in /app/api, database schema in /prisma.

---

## 4) Environments & Secrets

Define **local**, **preview**, **prod**. Never expose server secrets to the client.

**Env vars** (examples):

```
# Supabase
SUPABASE_URL=
SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=   # only server-side (api/worker)

# External APIs (e.g., golf, fantasy, etc.)
EXT_API_BASE_URL=
EXT_API_KEY=

# Misc
NODE_ENV=
```

Environment validation handled in `/lib/env.ts` via `zod`, throwing on missing keys in server contexts.

---

## 5) Local Dev with Claude Code (VS Code)

* Open the repo root in VS Code. Claude should use this file to understand scope.
* Preferred scripts at root `package.json`:

```json
{
  "scripts": {
    "dev": "next dev",
    "build": "next build", 
    "start": "next start",
    "lint": "next lint",
    "typecheck": "tsc --noEmit",
    "test:unit": "vitest",
    "test:contract": "jest", 
    "test:e2e": "playwright test",
    "db:generate": "prisma generate",
    "db:migrate": "prisma migrate dev",
    "db:seed": "tsx scripts/seed.ts"
  }
}
```

* **Database setup**: Use Supabase for hosted Postgres or local setup with `supabase start`.
* **Development**: Run `npm run dev` for Next.js development server.
* **Database**: Use `npm run db:migrate` and `npm run db:seed` for schema management.

**Claude Working Style**

* Work primarily in `/lib` for business logic and API integrations.
* Always write/update tests first (Vitest for unit, Jest for contract, Playwright for e2e).
* Keep changes small and incremental; ensure typecheck passes.

---

## 6) Data Model (Prisma + Supabase)

**Tables** (implemented in `/prisma/schema.prisma`):

* `User`, `League`, `Team`, `TeamClaim` - Core fantasy sports structure
* `Player`, `RosterSlot` - Player data and team rosters
* `Projection`, `GameLog`, `AuctionPrice`, `ReplacementBaseline` - Performance data
* `Valuation` - Calculated player values and components
* `TradeProposal`, `TradeItem`, `ProposalShare` - Trade management
* `SyncJob`, `RateLimit` - Background processing and API protection

**Key Constraints & Indexes**

* `League.espnLeagueId` unique
* `Team` unique on `(leagueId, espnTeamId)`
* `TeamClaim` unique on `(leagueId, teamId)` and `(leagueId, userId)`
* `Player.espnPlayerId` unique
* `Valuation` indexed on `(leagueId, playerId, ts)`
* `ProposalShare.token` unique

---

## 7) Trade Engine (Pure TS)

`/lib/trade-engine.ts`

* No network, no DB, no env. Deterministic math only.
* Input = normalized domain data (via zod schemas).
* Output = valuations + explainability diagnostics.
* Export a version string. Bump on logic changes and write to DB with results.

**Performance target**: <100ms for \~1k players on a laptop for basic valuation.

**Testing**: Golden tests against fixtures in `/tests/unit/`.

---

## 8) API Endpoints (/app/api)

**Runtime**: Node (not Edge) for ingestion + engine.

* `POST /api/ingest/snapshot` → Pull external data; minimally normalize; write to `market_inputs`; enqueue `revalue_all`.
* `POST /api/engine/revalue` → Run engine for a subset; write to `valuations`; idempotent by `(engine_version, inputs_hash)`.
* `POST /api/trades/generate` → Accept scenario params; call engine; return candidate trades; optionally persist to `trade_results`.
* `GET  /api/valuations?since=...` → Fast reads for UI; cache with `s-maxage` 30–60s.
* `POST /api/cron/tick` → Cron entrypoint that processes N jobs.

**Idempotency & Retry**

* Accept `x-idempotency-key` header; short-circuit on duplicate.
* Rewrap handlers with retry-safe logic.

---

## 9) Background Jobs (apps/worker + Vercel Cron)

**Option A (default)**: Jobs table + Vercel Cron + worker loop.

* Worker loop:

  1. `SELECT ... FOR UPDATE SKIP LOCKED` next queued job where `scheduled_for <= now()`
  2. Execute handler; update status; attempts; error on fail.
* Vercel Cron hits `/api/cron/tick` every minute to nudge processing in prod.
* Locally: `pnpm dev:worker` runs an infinite loop with small sleep.

**Job Types**

* `revalue_all: { ts }`
* `revalue_player: { playerId, ts }`
* `ingest_snapshot: { source }`

---

## 10) Ingestion Strategy

1. **Pull & Normalize Quickly**: fetch from external API; write raw→lightly normalized rows to `market_inputs`. Compute `source_checksum` to dedupe.
2. **Fan Out**: enqueue `revalue_all` or per-player jobs depending on dataset size.
3. **Deterministic Revaluation**: compute `inputs_hash` (stable JSON, sorted keys) as part of valuation; write to `valuations` with unique constraint.
4. **Cache for UI**: serve `/api/valuations` with short CDN cache.

---

## 11) Testing Strategy

* **Engine**: Vitest, golden fixtures, performance budget, deterministic.
* **API**: supertest integration with local Supabase (seed script in `/scripts/seed.ts`).
* **Worker**: run fake queue in-memory; assert idempotency and retry semantics.
* **CI**: `npm run test:unit` and `npm run typecheck` gate all PRs.

---

## 12) Deployment

* Standard Next.js application deployed to Vercel.
* **Cron**: Vercel Cron → `POST /api/cron/tick` every minute.
* **Migrations**: run Prisma migrations via CI (Vercel build step or GitHub Action) before exposing new code paths.

---

## 13) Guardrails & Conventions

* **Engine is pure**: never import `node:fs`, `fetch`, or env.
* **Version everything**: `engine_version` persisted with outputs.
* **Idempotency**: use unique DB constraints; short-circuit on conflicts.
* **Observability**: minimal structured logs (json) + `job_executions` table if needed.
* **Feature flags**: simple `feature_flags` table or env toggles (e.g., `FF_ENGINE_V2`).
* **Rate limits**: simple token bucket in API for external calls; exponential backoff.

---

## 14) Minimal Code Sketches

**Engine test**

```ts
import { describe, it, expect } from "vitest";
import { valuePlayers } from "@fantasy-quant/engine";
import fixture from "./fixtures/inputs.small.json";

describe("valuePlayers", () => {
  it("stable values under fixture", () => {
    const out = valuePlayers(fixture, { version: "1.0.0" });
    expect(out.items.length).toBe(fixture.players.length);
    expect(out.items.find(x => x.playerId === "123")?.value).toBeCloseTo(42.31, 2);
  });
});
```

**API ingestion route**

```ts
// apps/api/src/app/api/ingest/snapshot/route.ts
import { NextRequest, NextResponse } from "next/server";
import { z } from "zod";

export const runtime = "nodejs";

export async function POST(req: NextRequest) {
  const Params = z.object({ source: z.string().default("ext") });
  const { source } = Params.parse(await req.json().catch(() => ({})));

  // 1) fetch external
  const raw = await fetch(process.env.EXT_API_BASE_URL + "/snapshot", {
    headers: { Authorization: `Bearer ${process.env.EXT_API_KEY}` }
  }).then(r => r.json());

  // 2) normalize & insert into market_inputs (batched)
  // ... implement via drizzle

  // 3) enqueue revaluation job
  // await enqueue("revalue_all", { ts: Date.now() });

  return NextResponse.json({ ok: true, source, count: raw?.length ?? 0 });
}
```

**Worker loop**

```ts
// apps/worker/src/index.ts
const sleep = (ms: number) => new Promise(r => setTimeout(r, ms));

async function loop() {
  while (true) {
    const job = await claimJob(); // SELECT ... FOR UPDATE SKIP LOCKED
    if (!job) { await sleep(2000); continue; }
    try {
      await handlers[job.type](job.payload);
      await completeJob(job.id);
    } catch (e: any) {
      await failJob(job.id, e?.message ?? "unknown");
    }
  }
}

loop().catch(e => { console.error("Worker crashed", e); process.exit(1); });
```

---

## 15) Rollout Plan (1 Sprint)

1. Set up Prisma schema and database; add seed script; engine v1 with tests.
2. Ingestion endpoint → write to `market_inputs`; `jobs` table + worker loop locally.
3. Implement `revalue_all` job; write `valuations` with unique key `(engine_version, inputs_hash)`.
4. UI reads from `GET /api/valuations`; add Vercel Cron; deploy preview.
5. Hardening: idempotency, retries, perf budget, logs, basic jobs admin view.

---

## 16) Prompts & Playbooks (for Claude)

**General Constraints**

* Never introduce I/O inside the engine package.
* Do not touch client env with server secrets.
* Prefer small PRs with tests; update this file if scope changes.

**Init Prompt (paste into Claude Code on open)**

> You are the repo's coding assistant. Follow *Claude.md* as the single source of truth. Before any change: (1) read `/lib`, `/prisma/schema.prisma`, (2) run typecheck and tests, (3) propose a minimal diff plan. Constraints: engine is pure and versioned; APIs are idempotent; all env validated via zod. Deliver: code + tests; no speculative refactors. If unclear, open a TODO and stop.

**Playbook: Add a new factor to valuation**

1. Edit zod input/output schemas in `/lib`.
2. Bump `engine_version` and implement logic in `/lib/trade-engine.ts`.
3. Update fixtures + golden tests in `/tests/unit`.
4. Add Prisma migration if persisted diagnostics shape changes.
5. Rewire API to include the new normalized field during ingestion.

**Playbook: New ingestion source**

1. Add normalizer in `/lib/normalize/<source>.ts`.
2. Map fields to Prisma models; compute `source_checksum`.
3. Extend `/app/api/ingest/snapshot` switch.
4. Add basic rate limit + backoff.

**Playbook: Debug a job**

1. Check `jobs` table row + `attempts` + `last_error`.
2. Reproduce locally by crafting payload and calling handler directly.
3. Write a failing test; fix; re-run worker.

---

## 17) Editing Conventions

* TypeScript strict mode on; no `any` unless justified.
* Paths use TS path aliases (`@/*`).
* Keep functions small and pure; explain complex math in comments.
* Update this file when architecture decisions change (add a short ADR section).

---

## 18) ADR Log (append)

* **ADR-001**: Chose jobs table + Vercel Cron over managed queues to keep initial infra simple and portable. Will migrate to Vercel Queues when throughput demands it.
* **ADR-002**: Engine is a pure package for determinism and testability; all I/O lives in API/worker.
* **ADR-003**: Use Prisma instead of Drizzle for better TypeScript integration and mature ecosystem. Use standard Next.js structure instead of Turborepo monorepo for simplicity.

---

## 19) Open Questions / TODOs

* Define minimal `players` domain for first release.
* Decide exact external API schema(s) and normalization rules.
* Establish perf SLOs for valuations and trade generation.

---

**End of Claude.md**