# Piggability Study Tool

A production-quality **piggability study** web app — **Module 0** of a wider pipeline-integrity platform.

It decides whether a pipeline can take an in-line inspection (ILI) tool and selects the right technology from the market, then exports a per-line client deliverable. Ships with the 10-line ADNOC pilot fleet as seed data.

> **Screening study only.** Tool envelopes are *indicative of the current market* and must be verified against vendor datasheets. Vendor lists are representative, not endorsements. Final piggability requires trap verification, a proving run, and operator-confirmed bend radii, flow velocity and as-built wall thickness. Not for operational decisions without qualified engineering sign-off.

## What it does

- Manage projects, each with one or more pipeline segments.
- Per segment: capture design data, derive geometry (`ID = OD − 2·WT`, D/t), and capture survey study inputs.
- Run a deterministic **piggability engine** → verdict, per-technology suitability matrix, recommended primary tool + market vendors, blockers, pre-inspection actions, recommended scope.
- Fleet rollup across all segments, live-recomputed on every input change.
- Export a per-line **piggability study report** (PDF) client-side.

### Domain logic highlights

- **Wall thickness:** when as-built WT is missing (9 of 10 pilot lines), the engine computes the **ASME B31.4 minimum wall** as a stand-in and flags it everywhere:
  `tMin = (DP_barg · 0.1 · OD_mm) / (2 · SMYS_MPa · F) + CA_mm`.
- **Liquid lines → UT primary:** the pilot lines carry treated sea water, so UT wall-measurement (direct wall, handles heavy wall) is the natural primary tool.
- **Heavy-wall MFL surfacing:** on the 36"/40" LP headers, MFL trends **Marginal / Not suitable** because the wall approaches/exceeds magnetic saturation — exactly the finding a piggability study exists to surface.
- Every **assumed** or **computed** value is visibly flagged in the UI and the report.

## Stack

- React 18 + TypeScript + Vite + Tailwind CSS, `lucide-react` icons.
- **Engine** (`src/engine/`): pure TypeScript, zero UI/IO deps, unit-tested with **vitest** (the UI only renders engine output).
- **Persistence** (`src/repo/`): a `PiggabilityRepo` interface with two adapters — localStorage (default) and **Supabase** (Postgres, multi-tenant RLS by `tenant_id`) behind env flags. **Runs fully without Supabase configured.**
- **PDF** (`src/report/`): client-side via `pdfmake` (lazy-loaded).

## Getting started

```bash
npm install
npm run dev      # no env vars required — seeds the ADNOC pilot fleet
npm test         # engine unit tests (vitest)
npm run build    # typecheck (tsc -b) + production build
```

### Managing projects & segments

- **Project bar:** create, rename, switch, and delete projects (the last project can't be deleted).
- **Add segment** opens a design-data editor (nominal bore, grade, pressures, medium, wall thickness, etc.). Leave wall thickness blank to compute the B31.4 minimum; the medium can be marked *Unknown (assume Liquid)*. Validation blocks save unless a wall thickness **or** a design pressure is provided.
- **Edit / Delete** act on the selected segment. Everything persists through the active repo (localStorage or Supabase).

### Optional: Supabase persistence

Copy `.env.example` to `.env` and set `VITE_SUPABASE_URL` + `VITE_SUPABASE_ANON_KEY` (a publishable / anon key — these are client-safe). Two ways to host the schema:

- **Dedicated project** — apply `supabase/migrations/0001_init.sql`, leave `VITE_SUPABASE_TABLE_PREFIX` empty.
- **Shared project** (reuse an existing Supabase project alongside another app) — apply `supabase/migrations/0002_shared_prefixed.sql` and set `VITE_SUPABASE_TABLE_PREFIX=pgy_`. All tables are namespaced `pgy_*` so they don't collide with the host app.

Multi-tenant RLS scopes every row by `tenant_id` (from the JWT `tenant_id` claim; anonymous access resolves to `default`). Without any env, the app uses localStorage.

> **Note on the live demo:** the GitHub Pages build intentionally ships **without** Supabase env, so the public site uses localStorage (the shared database isn't exposed to the open internet). To point a deployment at Supabase, add the env as GitHub Actions secrets and pass them in the build step.

## Project structure

```
src/
  engine/      OD/SMYS constants, B31.4 wall calc, ILI tech knowledge base,
               pure assess() + evalTech(), tests
  data/        10-line ADNOC pilot fleet seed
  repo/        PiggabilityRepo interface + local + supabase adapters
  ui/          FleetTable, SegmentForm, VerdictCard, SuitabilityMatrix,
               ScopeCard, ActionsCard, badges, Disclaimer
  report/      PiggabilityReport — client-side PDF export
  App.tsx
```

## Deployment

Pushing to `main` builds, tests, and deploys to **GitHub Pages** via `.github/workflows/deploy.yml`. Enable Pages → Source: GitHub Actions in the repo settings. The Vite `base` defaults to `/<repo>/` for project-page hosting (override with `VITE_BASE=/`).

## Roadmap (not built here)

Module 0 Piggability (this) → M1 Ingestion/QC → M2 Detection → M3 Classification + Sizing → M4 Fitness-for-Service (B31G / Modified B31G → ERF) → M5 Insights → M6 Report. The `engine/` is modular so an `ffs/` sibling can be added without touching this one.
