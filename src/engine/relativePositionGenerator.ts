import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import { mulberry32 } from "./exerciseGenerator";
import { fmtPoint, REPERE } from "./mathFormat";
import { twoLinesFigure } from "./geoGebraCommands";

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

const SMALL_INTS = [-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const;
const SLOPES = [-3, -2, -1, -0.5, 0.5, 1, 2, 3] as const;

export function generateRelativePositionExercise(seed: number, difficulty: 1 | 2): Exercise {
  const rng = mulberry32(seed);
  if (difficulty === 1) {
    return generateParalleleOuSecante(seed, rng);
  } else {
    return generatePointIntersection(seed, rng);
  }
}

// ── Template 1 : parallèle ou sécante ───────────────────────────────────────

function generateParalleleOuSecante(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const isParallel = rng() < 0.5;
    let m1: number, m2: number, p1: number, p2: number;

    if (isParallel) {
      m1 = pickRandom(SLOPES, rng);
      m2 = m1;
      p1 = pickRandom(SMALL_INTS, rng);
      do { p2 = pickRandom(SMALL_INTS, rng); } while (p2 === p1);
    } else {
      m1 = pickRandom(SLOPES, rng);
      do { m2 = pickRandom(SLOPES, rng); } while (m2 === m1);
      p1 = pickRandom(SMALL_INTS, rng);
      p2 = pickRandom(SMALL_INTS, rng);
    }

    const m1Display = formatCoeff(m1);
    const m2Display = formatCoeff(m2);
    const p1Display = formatConst(p1);
    const p2Display = formatConst(p2);
    const d1Eq = `y = ${m1Display}${p1Display}`;
    const d2Eq = `y = ${m2Display}${p2Display}`;

    const verdict = isParallel ? "parallèles" : "sécantes";
    const correctLatex = isParallel
      ? String.raw`\text{Parallèles, car } m_1 = m_2 = ${m1}`
      : String.raw`\text{Sécantes, car } m_1 = ${m1} \neq m_2 = ${m2}`;

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      {
        latex: isParallel
          ? String.raw`\text{Sécantes, car } p_1 = ${p1} \neq p_2 = ${p2}`
          : String.raw`\text{Parallèles, car } p_1 = p_2`,
        misId: "par_intercept_based" as MisconceptionId,
      },
      {
        latex: isParallel
          ? String.raw`\text{Sécantes, car elles n'ont pas la même équation}`
          : String.raw`\text{Parallèles, car elles ont la même forme}`,
        misId: "par_secant_confusion" as MisconceptionId,
      },
    ];

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère $${REPERE}$, on considère les droites $(d_1) : ${d1Eq}$ et $(d_2) : ${d2Eq}$ représentées ci-dessous. Les droites $(d_1)$ et $(d_2)$ sont-elles parallèles ou sécantes ?`;

    // Coord system qui montre bien les deux droites
    const coordSys: [number, number, number, number] = [-6, 6, -6, 6];
    const figCommands = twoLinesFigure(m1, p1, m2, p2);

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "parallele_ou_secante",
      difficulty: 1,
      concept: "positions_relatives",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { m1, m2, p1, p2, verdict, eq1: d1Eq, eq2: d2Eq },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys },
    };
  }
  return generateParalleleOuSecante(seed + 100, mulberry32(seed + 100));
}

// ── Template 2 : point d'intersection ───────────────────────────────────────

function generatePointIntersection(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const x0 = pickRandom([-4, -3, -2, -1, 0, 1, 2, 3, 4] as const, rng);
    const y0 = pickRandom([-4, -3, -2, -1, 1, 2, 3, 4] as const, rng);

    const m1 = pickRandom(SLOPES, rng);
    let m2: number;
    do { m2 = pickRandom(SLOPES, rng); } while (m2 === m1);

    const p1 = y0 - m1 * x0;
    const p2 = y0 - m2 * x0;

    if (!Number.isInteger(p1) || !Number.isInteger(p2)) continue;
    if (Math.abs(p1) > 10 || Math.abs(p2) > 10) continue;

    const m1Display = formatCoeff(m1);
    const m2Display = formatCoeff(m2);
    const p1Display = formatConst(p1);
    const p2Display = formatConst(p2);
    const d1Eq = `y = ${m1Display}${p1Display}`;
    const d2Eq = `y = ${m2Display}${p2Display}`;

    const correctLatex = fmtPoint("I", x0, y0);

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      { latex: fmtPoint("I", -x0, y0), misId: "inter_x_sign" as MisconceptionId },
      { latex: fmtPoint("I", y0, x0), misId: "inter_swap_xy" as MisconceptionId },
    ];

    if (pickRandom([true, false] as const, rng)) {
      distractors.push({ latex: fmtPoint("I", x0 + 1, y0), misId: "inter_wrong_subst" as MisconceptionId });
    } else {
      distractors.push({ latex: fmtPoint("I", x0, y0 + 1), misId: "inter_wrong_subst" as MisconceptionId });
    }

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2 || filtered.some((d) => d.latex === correctLatex)) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère $${REPERE}$, on considère les droites $(d_1) : ${d1Eq}$ et $(d_2) : ${d2Eq}$ représentées ci-dessous. Déterminer les coordonnées de leur point d'intersection.`;

    const coordSys: [number, number, number, number] = [-6, 6, -6, 6];
    const figCommands = [
      ...twoLinesFigure(m1, p1, m2, p2),
      // Ajouter le point d'intersection mais sans coordonnées pour ne pas donner la réponse
      `I = Intersect(f, g)`,
    ];

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "point_intersection",
      difficulty: 2,
      concept: "positions_relatives",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { x0, y0, m1, m2, p1, p2, eq1: d1Eq, eq2: d2Eq },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys },
    };
  }
  return generatePointIntersection(seed + 100, mulberry32(seed + 100));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

function formatCoeff(m: number): string {
  if (m === 1) return "x";
  if (m === -1) return "-x";
  if (m === 0.5) return String.raw`\frac{1}{2}x`;
  if (m === -0.5) return String.raw`-\frac{1}{2}x`;
  return `${m}x`;
}

function formatConst(p: number): string {
  if (p > 0) return ` + ${p}`;
  if (p < 0) return ` - ${Math.abs(p)}`;
  return "";
}

function buildTextChoices(
  correctPos: ChoiceId,
  correctLatex: string,
  distractors: { latex: string; misId: MisconceptionId }[],
  positions: ChoiceId[]
): Choice[] {
  const wrongPos = positions.filter((p) => p !== correctPos);
  return positions.map((pos) => {
    if (pos === correctPos) {
      return { choice_id: pos, is_correct: true, misconception_id: null, construction_commands: [], latex: correctLatex };
    }
    const idx = wrongPos.indexOf(pos);
    const d = distractors[idx];
    return { choice_id: pos, is_correct: false, misconception_id: d.misId, construction_commands: [], latex: d.latex };
  });
}
