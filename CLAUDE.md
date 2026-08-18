# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Commands

```bash
npm run dev      # vite dev server on port 3000 (--host 0.0.0.0)
npm run build    # vite production build
npm run preview  # preview the production build
npm run lint      # tsc --noEmit — this is the only "test"/check in the project
npm run clean     # rm -rf dist
```

There is no test suite and no ESLint config — `npm run lint` is strictly a TypeScript type-check. Always run it after non-trivial edits.

`xlsx` is installed from a CDN tarball URL (`https://cdn.sheetjs.com/...`) in `package.json`, not from the npm registry — don't "fix" this to a version-numbered spec without checking why.

## Architecture

Single-page React 19 + TypeScript app (Vite, Tailwind v4), no router. All navigation is a hand-rolled tab switch: `App.tsx` owns `activeTab: 'cra' | 'layout' | 'constraints' | 'result' | 'raffleAndVote'` and every screen is prop-drilled from there — there is no global store. `@` resolves to the project root (see `vite.config.ts`).

The app walks a teacher through 4 steps, each its own component under `src/components/`, wired in `App.tsx`:
1. **`CraDataModal`** — upload/edit the student roster and optional CRA relationship data (xlsx/csv via `xlsx`, parsed with fuzzy Korean header matching, e.g. `str.includes('학번')`).
2. **`LayoutSetup`** — desk grid layout (rows/cols, aisle gaps, pod groupings).
3. **`ConstraintSetup`** — fixed seats, must-together/must-separate pairs, gender rule, CRA algorithm weight sliders.
4. **`ResultView`** — compare/edit generated candidate arrangements, save to history, print.

A 5th tab (`raffleAndVote` → `RaffleAndVotingView`) is a student-facing reveal/lottery screen layered on top of the same candidate data.

### CRA (Classroom Relationship Analysis) data model

`CraStudent` (`src/types.ts`) carries a roster field set (name/gender/studentNumber/notes) plus **5 optional sociometric domains**, each with 4 sub-fields (`Nominated`/`Weighted`/`Mediator`/`Group`): `total`, `intimacy` (정서적 친밀감), `cooperation` (기능적 협력), `influence` (사회적 영향력), `expansion` (교우관계 확장). `hasCraData()` in `craAlgorithm.ts` decides whether any of this is actually populated; if not, seating generation falls back to a constraints-only mode.

### Seating algorithm (`src/utils/craAlgorithm.ts`)

- `generateDeskLayout(layoutType, studentCount)` builds the desk/pod grid for a layout preset (`pairs` | `single` | `pods4` | `pods6` | `custom`).
- `evaluateArrangement(...)` scores a candidate assignment: a **constraint-satisfaction score** (fixed seats, pair rules, gender rule, avoid-past-neighbors) combined with a **CRA-weighted score** (intimacy dispersion / expansion / influence balance, weighted by the teacher's `AlgorithmWeights` sliders). Final `overallScore = constraintSatisfactionScore * 0.3 + craWeightedScore * 0.7`.
- Arrangements are produced by greedy seeding (fixed seats → must-together pairs → gender-alternating fill → CRA-priority sort) followed by **randomized hill-climbing**: `generateSingleArrangement`/`optimizeArrangement` run ~150 random pairwise desk swaps, keeping each swap only if it improves the score.
- `generateCandidateArrangements(...)` returns up to 4 named candidates when CRA data is present (different priority modes), or a single constraints-only candidate when it isn't.

### Restore / persistence quirks (`src/utils/seatingRestore.ts`)

Student IDs are re-minted (`Date.now()`-based) on every roster upload, so a saved `SeatingResult.assignments` map (desk id → student id) almost never matches student IDs from a later session — even for the same class. `SeatingResult` therefore also snapshots a `studentRoster` (id/name/studentNumber/gender) at save time. `resolveAssignmentsToCurrentStudents` / `resolveDisplayAssignments` re-match a restored/uploaded result against the *currently loaded* roster, preferring the `studentRoster` snapshot, then a direct ID match, then a legacy `s_basic_<idx>_...` upload-order guess for pre-snapshot backups. Seating history persists to `localStorage` under `cra_seating_history`.

### Printing (`src/utils/printUtils.ts`)

`printSeatingChart(...)` builds a standalone HTML document (inline CSS, A4 landscape) and opens it via `window.open` + `.print()`, with an iframe fallback if the popup is blocked. There is no PDF/image export — browser print-to-PDF is the only path.
