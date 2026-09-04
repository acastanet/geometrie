# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
npm run dev              # Vite dev server (HMR, port 5173, proxies /api → localhost:3001)
npm run server           # Express backend (port 3001) — génération IA via Mistral
npm run dev:all          # Both client + server concurrently
npm run build            # tsc -b && vite build (production)
npm run preview          # Preview production build
npm run lint             # ESLint (flat config)
```

- `vite.config.ts` sets `base: '/mimo/'` and proxies `/api` → `http://localhost:3001`.
- No test runner is configured.
- The server requires `MISTRAL_API_KEY` in the environment (`.env` file, loaded via dotenv).

## High-Level Architecture

### Purpose

**mimo** is a mathematics tutoring app for the French Seconde curriculum (10th grade). It presents QCM exercises with GeoGebra visualizations and adaptive feedback based on student misconceptions. Five **concepts** are available via the topic selector:

| Concept | Generation | Description |
|---------|-----------|-------------|
| `equation_droite` | Algorithmic (seeded) | Linear equations: figure matching, graph reading, cartesian→reduced, direction vectors |
| `geometrie_repere` | Algorithmic (seeded) | Coordinate geometry: distances, midpoints, circle radius, orthogonal projection |
| `vecteurs` | Algorithmic (seeded) | Vectors: coordinates, sum, collinearity, alignment |
| `positions_relatives` | Algorithmic (seeded) | Relative positions: parallel/secant lines, intersection points |
| `ia` | **LLM (Mistral)** | Open-ended geometry exercises generated server-side with math verification |

### Dual-Path Exercise Generation

The `useExercise` hook dispatches through `topicGenerator.ts`:

- **Algorithmic concepts** (`src/engine/`): Deterministic seeded RNG (mulberry32). Exercises are pure functions of `(seed, difficulty)` — same seed = same exercise. No network call.
- **IA concept** (`src/engine/llmGenerator.ts` → `server/`): Calls `POST /api/generate` on the Express backend, which queries Mistral AI. The server validates structure, verifies math correctness, builds the statement figure, shuffles choices, and returns a complete `Exercise`. Up to 2 retries on validation/math failures.

### Server Backend (`server/`)

Express on port 3001. Single endpoint `POST /api/generate`:

1. **`generatePrompt.ts`** — Builds system + user prompts with an 8-scenario catalogue (milieu, distance, nature_triangle, parallelogramme, quatrieme_sommet, alignement, equation_reduite_2pts, appartenance_droite). Includes few-shot examples, value-format specifications for machine verification, and retry-reason injection.
2. **`mistralClient.ts`** — Calls Mistral API (`mistral-small-latest`, JSON mode, seeded, 30s timeout).
3. **`validateLlmResponse.ts`** — Structural validation: point bounds (±8), integer coords, distinct points, exactly 3 choices A/B/C, exactly 1 correct, distractors must have misconception_id/indice/correction.
4. **`mathVerifier.ts`** — Recomputes the correct answer from `data.points` using the same formulas students learn, then compares against the LLM's `value`. Rejects if the correct choice is wrong, a distractor matches the correct answer, or two distractors are identical.
5. **`buildFigure.ts`** — Builds GeoGebra commands for the statement figure from `data.points`. The LLM never produces GeoGebra — figures are always server-built, guaranteeing consistency with the énoncé.

Deployment: systemd unit `mimo-server.service` runs `npx tsx server/index.ts` from the repo root.

### Exercise Data Model

Two **choice types** determine how choices render:

- **`"figure"`** — Each choice is a GeoGebra graph (`construction_commands`). Used by `droite_figure` template.
- **`"text"`** — Each choice is LaTeX rendered via KaTeX (`latex` field, no `$` delimiters). Used by all other templates (including IA).

A **statement figure** (`statement_figure`) renders a single GeoGebra above the choices (graph reading, IA exercises).

### Feedback Priority Chain

When validating a student answer, feedback is resolved in this order:

1. **LLM inline** (IA exercises): `choice.feedback_indice` / `choice.feedback_correction` / `exercise.correct_feedback`
2. **Static registry** (algorithmic exercises): `MISCONCEPTION_REGISTRY[misconception_id]` for wrong answers, `getCorrectFeedbackForConcept()` for correct answers

The two-attempt system remains: attempt 1 wrong → hint + retry; attempt 2 wrong → full correction + highlight correct answer.

### IA Exercise Flow (end-to-end)

```
User selects "ia" concept
  → useExercise sets isLoading=true
  → llmGenerator.ts calls POST /api/generate {seed, difficulty}
  → server/index.ts builds prompt, calls Mistral
  → validateLlmResponse checks structure
  → mathVerifier recomputes correct answer, compares
  → buildFigure creates GeoGebra commands from points
  → Server shuffles choices with Fisher-Yates (seeded)
  → Returns Exercise with choice_type="text", statement_figure, correct_feedback
  → ChatWindow renders: statement (LaTeX), statement figure (GeoGebra), 3 text choices
  → Student clicks choice → validate() uses inline LLM feedback
```

### Adding a New Algorithmic Concept

1. Create `src/engine/yourGenerator.ts` exporting `generateYourExercise(seed, difficulty): Exercise`
2. Add `"your_concept"` to the `Concept` union in `src/types/exercise.ts`
3. Add a case in `generateExerciseForTopic()` and `getCorrectFeedbackForConcept()` in `src/engine/topicGenerator.ts`
4. Add misconception types (if any) to `src/types/misconception.ts` and register feedback templates in `src/engine/misconceptionRegistry.ts`

### Adding a New IA Exercise Type

1. Add scenario to `EXERCISE_CATALOG` in `server/generatePrompt.ts` with required points
2. Add `value` format spec to the system prompt
3. Add case in `validateLlmResponse.ts` → `getRequiredPoints()`
4. Add case in `mathVerifier.ts` → `computeCorrectValue()`
5. Add case in `buildFigure.ts` → `buildFigure()`
6. Add a few-shot example to `FEW_SHOT_EXAMPLES`

### GeoGebra Integration

- `GeoGebraRenderer.tsx` loads GeoGebra applets dynamically via the CDN `deployggb.js` script (loaded once in `App.tsx`).
- A `ggbReady` gate prevents rendering exercise cards before the CDN loads.
- `geoGebraCommands.ts` provides reusable command builders used by both `exerciseGenerator.ts` (algorithmic) and `buildFigure.ts` (IA server-side).
- App modes: `"graphing"` (default, for function plots) and `"geometry"` (for point/segment/vector constructions like parallelogramme).

### Styling & UI

- **Tailwind CSS 4** with `@tailwindcss/vite` plugin.
- Color palette: indigo/slate primary, emerald success, amber hints, rose errors, `klein` blue accent, `mimo-red` for CTA.
- `LatexText.tsx` renders inline LaTeX via KaTeX (splits on `$...$` delimiters).
- `shared.js`-style rendering is NOT used — this is a standalone React SPA, not part of the AnSu Flask/FastAPI ecosystem.
