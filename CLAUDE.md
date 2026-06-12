# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build & Development Commands

```bash
# Development server with hot module replacement
npm run dev

# Production build (TypeScript + Vite bundling)
npm run build

# Lint TypeScript and React code
npm run lint

# Preview production build locally
npm run preview
```

**Key Notes:**
- The build command runs `tsc -b` first to compile TypeScript, then `vite build` to bundle
- No test runner is configured; the project currently has no test infrastructure
- ESLint uses the flat config format (eslint.config.js) with TypeScript and React plugins

## High-Level Architecture

### Purpose
**mimo** is a mathematics tutoring application that teaches linear equation concepts (Droites affines — Seconde/10th grade French curriculum). It presents multi-choice exercises with GeoGebra visualizations and provides adaptive feedback based on student misconceptions.

### Core System: Misconception-Driven Adaptive Feedback

The architecture revolves around **identifying and addressing specific student misconceptions** about linear equations (y = ax + b):

1. **Misconception Types** (`src/types/misconception.ts`):
   - `slope_sign_confusion`: Student confuses the sign of the slope coefficient
   - `intercept_sign_confusion`: Student inverts the sign of the y-intercept
   - `slope_intercept_swap`: Student exchanges the roles of slope and intercept

2. **Exercise Generation** (`src/engine/exerciseGenerator.ts`):
   - Uses a seeded random number generator (mulberry32) for deterministic, reproducible exercises
   - Selects two misconceptions and generates corresponding distractor lines
   - Validates that all three lines (correct + 2 distractors) are visually distinct
   - Randomly positions the correct answer among choices A/B/C
   - Guarantees "slope_intercept_swap" appears in ≥50% of exercises

3. **Parameter Validation** (`src/engine/parameterValidator.ts`):
   - Ensures slope (a) and intercept (b) values are non-zero and distinct
   - Prevents ratio imbalance (|b/a| > 6) that would make lines hard to distinguish visually

4. **Misconception Registry** (`src/engine/misconceptionRegistry.ts`):
   - Maps each misconception to two-level feedback: `indice` (hint) and `correction` (full explanation)
   - Feedback templates use `{a}` and `{b}` placeholders for dynamic parameter insertion
   - Domains: slopes ∈ {-3, -2, -1, -0.5, 0.5, 1, 2, 3}, intercepts ∈ {-4, -3, -2, -1, 1, 2, 3, 4}

### UI Flow

**Entry Point**: `src/App.tsx` loads the GeoGebra CDN script (asynchronous) and renders the main component.

**Main Component**: `src/components/ChatWindow.tsx`
- Displays exercise statement in a chat-like bubble
- Renders three `ExerciseCard` components (one per choice)
- Manages attempt count (1 or 2) and choice selection state
- Shows feedback via `FeedbackMessage` component
- Provides "Validate" and "Next Exercise" buttons

**Exercise Cards**: `src/components/ExerciseCard.tsx`
- Each card shows a GeoGebra graph with visual styling based on state (selected/disabled/highlighted/correct)
- Embeds `GeoGebraRenderer` component

**GeoGebra Integration**: `src/components/GeoGebraRenderer.tsx`
- Loads GeoGebra applet dynamically into container divs
- Executes construction commands (e.g., `f(x) = 2x + 3`) to draw the function
- Disables UI controls (toolbar, menus, right-click) for a clean student experience
- Cleans up applet instances on React StrictMode double-mounts

### State Management & Hooks

**`useExercise()` Hook** (`src/hooks/useExercise.ts`):
- Manages the entire exercise workflow: generation → selection → validation → feedback → next
- Tracks `attemptCount` (1 or 2) to determine feedback depth
- Implements two-attempt system:
  - Attempt 1 (wrong): Shows `indice` (hint), disables chosen distractor, allows retry
  - Attempt 2 (wrong): Shows `correction` (full explanation), disables all wrong choices, highlights correct answer
  - Either attempt (correct): Shows `correct_1` or `correct_2` feedback, marks exercise as finished
- Extracts slope and intercept from construction commands via regex parsing

**`useMetrics()` Hook** (`src/hooks/useMetrics.ts`):
- Simple state container for recording attempt history
- Each record includes: exercise_id, attempt number, selected choice, correctness, misconception_id, timestamp
- Data persists in component state (not persisted to backend/storage)

### Data Types

**Exercise** (`src/types/exercise.ts`):
```typescript
{
  exercise_id: string (UUID)
  seed: number (for reproducibility)
  template_id: "line_equation"
  difficulty: 1
  concept: "equation_droite"
  statement: string (in French, e.g., "Sélectionne la figure représentant...")
  choices: Choice[] (exactly 3, with is_correct flag)
  correct_choice_id: "A" | "B" | "C"
}
```

**Choice**:
```typescript
{
  choice_id: "A" | "B" | "C"
  is_correct: boolean
  misconception_id: string | null (null for correct choice)
  construction_commands: string[] (GeoGebra commands)
}
```

### Styling

- **Tailwind CSS**: Used exclusively for styling with the `@tailwindcss/vite` plugin
- **Color scheme**: Indigo/slate for primary UI, emerald for success, amber for hints, rose for errors
- **Responsive design**: Cards flex-wrap on smaller screens; max-width 5xl for readability

### Tech Stack

- **React 19**: Latest features; JSX syntax via Vite
- **TypeScript 6.0**: Strict compiler options (no unused locals/parameters)
- **Vite 8**: Fast dev server and optimized production builds
- **Tailwind CSS 4**: Utility-first CSS with Vite integration
- **GeoGebra CDN**: External library for graph visualization (loaded via `deployggb.js`)
- **UUID v14**: For generating unique exercise IDs
- **ESLint**: Flat config with TypeScript, React hooks, and React Refresh plugins

### Development Workflow Notes

1. **Reproducibility**: Exercises are fully deterministic via seeded RNG. Same seed = same exercise (important for debugging/testing)
2. **GeoGebra Commands**: Construction commands are simple: `f(x) = <equation>`. Extend by adding new commands to the array in `buildConstructionCommands()`
3. **Misconception Addition**: To add a new misconception type:
   - Add to `MisconceptionId` union in `src/types/misconception.ts`
   - Add compute function in `src/engine/misconceptionEngine.ts`
   - Register feedback in `MISCONCEPTION_REGISTRY`
   - Update `selectTwoMisconceptions()` logic if needed
4. **Feedback Customization**: Modify templates in `MISCONCEPTION_REGISTRY` or adjust hint vs. correction depth in `useExercise()` validate logic
5. **Seeding Strategy**: Current approach increments seed on retry; for batch generation, consider external seed management
