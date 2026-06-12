import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import { SLOPE_DOMAIN, INTERCEPT_DOMAIN, MISCONCEPTION_REGISTRY } from "./misconceptionRegistry";
import { isValidPair, arePairsDistinct } from "./parameterValidator";
import { computeMisconceptionParams, selectTwoMisconceptions } from "./misconceptionEngine";
import { fmtReducedEqCoeff, fmtReducedEqLatex, fmtCartesianEq, REPERE } from "./mathFormat";

// ── RNG & helpers réutilisés entre tous les générateurs ──────────────────────

export function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

export function instantiateFeedback(
  template: string,
  params: Record<string, number | string>
): string {
  return Object.entries(params).reduce(
    (str, [key, val]) => str.replace(new RegExp(`\\{${key}\\}`, "g"), String(val)),
    template
  );
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

// ── Construction de commandes GeoGebra ─────────────────────────────────────

function buildConstructionCommands(a: number, b: number): string[] {
  return [`f(x) = ${formatEquation(a, b)}`];
}

/** Commande GeoGebra pour une droite verticale x = c */
function buildVerticalCommand(c: number): string[] {
  return [`x = ${c}`];
}

function formatEquation(a: number, b: number): string {
  const aPart = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  const bPart = b > 0 ? ` + ${b}` : b < 0 ? ` - ${Math.abs(b)}` : "";
  return `${aPart}${bPart}`;
}

// ── Feedback ───────────────────────────────────────────────────────────────

export function getFeedbackText(
  misconceptionId: MisconceptionId,
  level: "indice" | "correction",
  params: Record<string, number | string>
): string {
  const entry = MISCONCEPTION_REGISTRY[misconceptionId];
  if (!entry) return "Feedback non disponible.";
  return instantiateFeedback(entry[level], params);
}

export function getCorrectFeedback(a: number, b: number): string {
  const direction = a < 0 ? "décroissante" : "croissante";
  const bSign = b > 0 ? "au-dessus de l'origine" : "en dessous de l'origine";
  return `Exact ! Le coefficient directeur est ${a} (droite ${direction}) et l'ordonnée à l'origine est ${b} — la droite coupe l'axe des ordonnées ${bSign}.`;
}

export function getCorrectFeedbackAttempt2(): string {
  return "Bonne réponse au deuxième essai. Continue comme ça !";
}

// ── Dispatch principal ─────────────────────────────────────────────────────

export function generateExercise(seed: number, difficulty: 1 | 2 = 1): Exercise {
  const rng = mulberry32(seed);

  if (difficulty === 1) {
    const template = rng() < 0.5 ? "droite_figure" : "lecture_graphique";
    return template === "droite_figure"
      ? generateDroiteFigure(seed, rng)
      : generateLectureGraphique(seed, rng);
  } else {
    const template = rng() < 0.5 ? "cart_to_reduite" : "vecteur_directeur";
    return template === "cart_to_reduite"
      ? generateCartToReduite(seed, rng)
      : generateVecteurDirecteur(seed, rng);
  }
}

// ────────────────────────────────────────────────────────────────────────────
// Template 1 : droite_figure (3 figures GeoGebra)
// ────────────────────────────────────────────────────────────────────────────

function generateDroiteFigure(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    let a: number, b: number;
    let paramAttempts = 0;
    do {
      a = pickRandom(SLOPE_DOMAIN, rng);
      b = pickRandom(INTERCEPT_DOMAIN, rng);
      paramAttempts++;
      if (paramAttempts > 50) break;
    } while (!isValidPair(a, b));

    const [mis1, mis2] = selectTwoMisconceptions(rng);
    const [a1, b1] = computeMisconceptionParams(mis1, a, b);
    const [a2, b2] = computeMisconceptionParams(mis2, a, b);

    const pairs: [number, number][] = [[a, b], [a1, b1], [a2, b2]];
    if (!arePairsDistinct(pairs)) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const orderSwap = rng() < 0.5;
    const distractorOrder: [MisconceptionId, [number, number]][] = orderSwap
      ? [[mis1, [a1, b1]], [mis2, [a2, b2]]]
      : [[mis2, [a2, b2]], [mis1, [a1, b1]]];

    const choices = buildFigureChoices(correctPos, [a, b], distractorOrder);
    const eqLatex = fmtReducedEqLatex(a, b);
    const statement = `On considère la droite $(d)$ d'équation réduite $${eqLatex}$ dans un repère orthonormé $${REPERE}$. Sélectionne la figure représentant $(d)$.`;

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "droite_figure",
      difficulty: 1,
      concept: "equation_droite",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "figure",
      params: { a, b, neg_b: -b },
      coord_system: [-6, 6, -6, 6],
    };
  }
  return generateDroiteFigure(seed + 100, mulberry32(seed + 100));
}

function buildFigureChoices(
  correctPos: ChoiceId,
  correct: [number, number],
  distractors: [MisconceptionId, [number, number]][]
): Choice[] {
  const positions: ChoiceId[] = ["A", "B", "C"];
  const wrongPos = positions.filter((p) => p !== correctPos);

  return positions.map((pos) => {
    if (pos === correctPos) {
      return {
        choice_id: pos,
        is_correct: true,
        misconception_id: null,
        construction_commands: buildConstructionCommands(correct[0], correct[1]),
      };
    }
    const idx = wrongPos.indexOf(pos);
    const [misId, [da, db]] = distractors[idx];
    return {
      choice_id: pos,
      is_correct: false,
      misconception_id: misId,
      construction_commands: buildConstructionCommands(da, db),
    };
  });
}

// ────────────────────────────────────────────────────────────────────────────
// Template 2 : lecture_graphique (figure d'énoncé + 3 choix textes)
// ────────────────────────────────────────────────────────────────────────────

/** Pentes incluant des fractions simples (0.5, -0.5, etc.) */
const ALL_SLOPES = [-3, -2, -1, -0.5, 0.5, 1, 2, 3] as const;

function generateLectureGraphique(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    // ~15% de chance d'avoir une droite verticale
    const isVertical = rng() < 0.15;

    if (isVertical) {
      const c = pickRandom([-4, -3, -2, -1, 1, 2, 3, 4] as const, rng);
      const eqLatex = `x = ${c}`;
      const distractors = generateVerticalDistractors(c);

      const positions: ChoiceId[] = ["A", "B", "C"];
      const correctPos = positions[Math.floor(rng() * 3)];

      const choices = buildTextChoices(correctPos, eqLatex, distractors, positions);
      const statement = `La droite $(d)$ est représentée ci-dessous dans un repère orthonormé $${REPERE}$. Quelle est son équation ?`;

      return {
        exercise_id: uuidv4(),
        seed,
        template_id: "lecture_graphique",
        difficulty: 1,
        concept: "equation_droite",
        statement,
        choices,
        correct_choice_id: correctPos,
        choice_type: "text",
        params: { c },
        coord_system: [-6, 6, -6, 6],
        statement_figure: {
          commands: buildVerticalCommand(c),
          coord_system: [-6, 6, -6, 6],
        },
      };
    }

    // Droite classique y = mx + p
    let a: number, b: number;
    let paramAttempts = 0;
    do {
      a = pickRandom(ALL_SLOPES, rng);
      b = pickRandom(INTERCEPT_DOMAIN, rng);
      paramAttempts++;
      if (paramAttempts > 50) break;
    } while (!isValidPair(a, b));

    const eqLatex = fmtReducedEqLatex(a, b);
    const distractors = generateGraphReadingDistractors(a, b, rng);
    if (!distractors) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];

    const choices = buildTextChoices(correctPos, eqLatex, distractors, positions);
    const statement = `La droite $(d)$ est représentée ci-dessous dans un repère orthonormé $${REPERE}$. Quelle est l'équation réduite de $(d)$ ?`;

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "lecture_graphique",
      difficulty: 1,
      concept: "equation_droite",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { a, b, neg_b: -b },
      coord_system: [-6, 6, -6, 6],
      statement_figure: {
        commands: buildFigureCommandsForGraph(a, b),
        coord_system: [-6, 6, -6, 6],
      },
    };
  }
  return generateLectureGraphique(seed + 100, mulberry32(seed + 100));
}

/** Commandes GeoGebra pour la figure d'énoncé : droite + grille seule */
function buildFigureCommandsForGraph(a: number, b: number): string[] {
  const cmd = formatEquation(a, b);
  // On dessine la droite avec un style distinct (épaisse) et on cache son équation
  // Note : GeoGebra affiche automatiquement l'équation en légende quand on fait f(x)=...
  // On la garde car on ne peut pas facilement la cacher sans JS complexe
  return [`f(x) = ${cmd}`];
}

function generateGraphReadingDistractors(
  a: number,
  b: number,
  rng: () => number
): { latex: string; misId: MisconceptionId }[] | null {
  const candidates: { latex: string; misId: MisconceptionId }[] = [];

  // Inversion du signe de la pente
  const invA = -a;
  if (isValidPair(invA, b)) {
    candidates.push({
      latex: `y = ${fmtReducedEqCoeff(invA)}${formatBPart(b)}`,
      misId: "slope_sign_confusion" as MisconceptionId,
    });
  }

  // Échange pente / ordonnée
  if (isValidPair(b, a)) {
    candidates.push({
      latex: `y = ${fmtReducedEqCoeff(b)}${formatBPart(a)}`,
      misId: "slope_intercept_swap" as MisconceptionId,
    });
  }

  // Inversion du signe de l'ordonnée
  if (isValidPair(a, -b)) {
    candidates.push({
      latex: `y = ${fmtReducedEqCoeff(a)}${formatBPart(-b)}`,
      misId: "intercept_sign_confusion" as MisconceptionId,
    });
  }

  // Pente inverse : lire Δx/Δy au lieu de Δy/Δx
  candidates.push({
    latex: `y = ${fmtReducedEqCoeff(Math.round(100 / a) / 100)}${formatBPart(b)}`,
    misId: "graph_reading_inverse_slope" as MisconceptionId,
  });

  if (candidates.length < 2) return null;

  // Sélectionner 2 distracteurs distincts
  const shuffled = candidates.sort(() => rng() - 0.5);
  // Garder ceux qui ne donnent pas la même équation que la correcte
  const correctLatex = `y = ${fmtReducedEqCoeff(a)}${formatBPart(b)}`;
  const filtered = shuffled.filter((c) => c.latex.trim() !== correctLatex.trim());
  if (filtered.length < 2) return null;

  return [filtered[0], filtered[1]];
}

function generateVerticalDistractors(
  c: number
): { latex: string; misId: MisconceptionId }[] {
  const candidates: { latex: string; misId: MisconceptionId }[] = [
    { latex: `x = ${c}`, misId: "vertical_as_y" as MisconceptionId }, // placeholder, ce sera le correct
    { latex: `y = ${c}`, misId: "vertical_as_y" as MisconceptionId },
    { latex: `y = ${c}x`, misId: "vertical_as_y" as MisconceptionId },
  ];
  // Mélanger pour avoir 2 distracteurs ≠ correct
  return candidates.filter((cand) => cand.latex !== `x = ${c}`).slice(0, 2);
}

function formatBPart(b: number): string {
  if (b > 0) return ` + ${b}`;
  if (b < 0) return ` - ${Math.abs(b)}`;
  return "";
}

// ────────────────────────────────────────────────────────────────────────────
// Template 3 : cart_to_reduite (3 choix textes)
// ────────────────────────────────────────────────────────────────────────────

/** Coefficients pour des fractions simples : m = -a/b avec b ∈ {2, 3} */
const CART_B_VALUES = [2, 3] as const;
const CART_A_VALUES = [-6, -4, -3, -2, -1, 1, 2, 3, 4, 6] as const;
const CART_C_VALUES = [-6, -4, -3, -2, -1, 1, 2, 3, 4, 6] as const;

function generateCartToReduite(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = pickRandom(CART_A_VALUES, rng);
    const b = pickRandom(CART_B_VALUES, rng);
    // Éviter a/b entier pour que la fraction soit visible
    if (a % b === 0) continue;
    const c = pickRandom(CART_C_VALUES, rng);

    const m = -a / b;
    const p = -c / b;

    const cartEq = fmtCartesianEq(a, b, c);
    const mDisplay = fmtReducedEqCoeff(m);
    const pDisplay = formatBPart(p);
    const correctLatex = `y = ${mDisplay}${pDisplay}`;

    // Distracteurs
    const distractors: { latex: string; misId: MisconceptionId }[] = [];
    // cart_sign_error : m = a/b (oubli du signe)
    const mWrong = a / b;
    distractors.push({
      latex: `y = ${fmtReducedEqCoeff(mWrong)}${pDisplay}`,
      misId: "cart_sign_error" as MisconceptionId,
    });
    // cart_no_div : y = -ax - c (oubli de diviser par b)
    distractors.push({
      latex: `y = ${fmtReducedEqCoeff(-a)}${formatBPart(-c)}`,
      misId: "cart_no_div" as MisconceptionId,
    });

    if (distractors.some((d) => d.latex === correctLatex)) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];

    const choices = buildTextChoices(correctPos, correctLatex, distractors, positions);
    const statement = `On considère la droite $(d)$ d'équation cartésienne $${cartEq}$ dans un repère $${REPERE}$. Déterminer l'équation réduite de $(d)$.`;

    // Figure : la droite tracée dans le repère
    const figCommands = [`f(x) = ${formatEquation(m, p)}`];

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "cart_to_reduite",
      difficulty: 2,
      concept: "equation_droite",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { a, b, c, m_latex: mDisplay.replace(/^(\d)/, "$1"), p_latex: pDisplay.trim(), cart_eq_latex: cartEq },
      coord_system: [-6, 6, -6, 6],
      statement_figure: { commands: figCommands, coord_system: [-6, 6, -6, 6] },
    };
  }
  return generateCartToReduite(seed + 100, mulberry32(seed + 100));
}

// ────────────────────────────────────────────────────────────────────────────
// Template 4 : vecteur_directeur (3 choix textes)
// ────────────────────────────────────────────────────────────────────────────

const DIR_A_VALUES = [-4, -3, -2, -1, 1, 2, 3, 4] as const;
const DIR_B_VALUES = [-4, -3, -2, -1, 1, 2, 3, 4] as const;
const DIR_C_VALUES = [-6, -4, -3, -2, -1, 1, 2, 3, 4, 6] as const;

function generateVecteurDirecteur(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const a = pickRandom(DIR_A_VALUES, rng);
    const b = pickRandom(DIR_B_VALUES, rng);
    if (a === b && a === -b) continue; // éviter a = ±b (peu intéressant)
    const c = pickRandom(DIR_C_VALUES, rng);

    const cartEq = fmtCartesianEq(a, b, c);
    const vx = -b;
    const vy = a;
    const correctLatex = String.raw`\vec{u}\,(${vx}\ ;\ ${vy})`;

    // Distracteurs
    const distractors: { latex: string; misId: MisconceptionId }[] = [
      {
        latex: String.raw`\vec{u}\,(${a}\ ;\ ${b})`,
        misId: "dir_vector_ab" as MisconceptionId,
      },
      {
        latex: String.raw`\vec{u}\,(${b}\ ;\ ${a})`,
        misId: "dir_vector_sign" as MisconceptionId,
      },
    ];

    if (distractors.some((d) => d.latex === correctLatex)) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];

    const choices = buildTextChoices(correctPos, correctLatex, distractors, positions);
    const statement = `Soit $(d)$ la droite d'équation cartésienne $${cartEq}$ dans un repère $${REPERE}$. Donner un vecteur directeur de $(d)$.`;

    // Figure : la droite tracée + un vecteur directeur (sans ses coordonnées)
    const m = -a / b;
    const p = -c / b;
    const figCommands = [
      `f(x) = ${formatEquation(m, p)}`,
      `u = Vector((0, 0), (${vx}, ${vy}))`,
      `SetColor(u, 0.8, 0.2, 0.2)`,
    ];

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "vecteur_directeur",
      difficulty: 2,
      concept: "equation_droite",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { a, b, c, vx, vy, cart_eq_latex: cartEq },
      coord_system: [-6, 6, -6, 6],
      statement_figure: { commands: figCommands, coord_system: [-6, 6, -6, 6] },
    };
  }
  return generateVecteurDirecteur(seed + 100, mulberry32(seed + 100));
}

// ────────────────────────────────────────────────────────────────────────────
// Helpers communs
// ────────────────────────────────────────────────────────────────────────────

function buildTextChoices(
  correctPos: ChoiceId,
  correctLatex: string,
  distractors: { latex: string; misId: MisconceptionId }[],
  positions: ChoiceId[]
): Choice[] {
  const wrongPos = positions.filter((p) => p !== correctPos);

  return positions.map((pos) => {
    if (pos === correctPos) {
      return {
        choice_id: pos,
        is_correct: true,
        misconception_id: null,
        construction_commands: [],
        latex: correctLatex,
      };
    }
    const idx = wrongPos.indexOf(pos);
    const d = distractors[idx];
    return {
      choice_id: pos,
      is_correct: false,
      misconception_id: d.misId,
      construction_commands: [],
      latex: d.latex,
    };
  });
}
