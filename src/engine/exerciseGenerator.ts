import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import { SLOPE_DOMAIN, INTERCEPT_DOMAIN, MISCONCEPTION_REGISTRY } from "./misconceptionRegistry";
import { isValidPair, arePairsDistinct } from "./parameterValidator";
import { computeMisconceptionParams, selectTwoMisconceptions } from "./misconceptionEngine";

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

export function buildConstructionCommands(a: number, b: number): string[] {
  return [`f(x) = ${formatEquation(a, b)}`];
}

function formatEquation(a: number, b: number): string {
  const aPart = a === 1 ? "x" : a === -1 ? "-x" : `${a}x`;
  const bPart = b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  return `${aPart}${bPart}`;
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateExercise(seed: number): Exercise {
  let currentSeed = seed;
  const MAX_RETRIES = 20;

  for (let attempt = 0; attempt < MAX_RETRIES; attempt++) {
    const rng = mulberry32(currentSeed);

    // Tirer (a, b) valides
    let a: number, b: number;
    let paramAttempts = 0;
    do {
      a = pickRandom(SLOPE_DOMAIN, rng);
      b = pickRandom(INTERCEPT_DOMAIN, rng);
      paramAttempts++;
      if (paramAttempts > 50) break;
    } while (!isValidPair(a, b));

    // Sélectionner 2 misconceptions
    const [mis1, mis2] = selectTwoMisconceptions(rng);

    // Calculer les paramètres des détrompeurs
    const [a1, b1] = computeMisconceptionParams(mis1, a, b);
    const [a2, b2] = computeMisconceptionParams(mis2, a, b);

    // Vérifier la distinction des 3 droites
    const pairs: [number, number][] = [[a, b], [a1, b1], [a2, b2]];
    if (!arePairsDistinct(pairs)) {
      currentSeed += 1;
      continue;
    }

    // Placer la bonne réponse aléatoirement
    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPosition = positions[Math.floor(rng() * 3)];

    // Ordonner les choix
    const orderSwap = rng() < 0.5;
    const distractorOrder: [MisconceptionId, [number, number]][] = orderSwap
      ? [[mis1, [a1, b1]], [mis2, [a2, b2]]]
      : [[mis2, [a2, b2]], [mis1, [a1, b1]]];

    const choices: Choice[] = buildChoices(
      correctPosition,
      [a, b],
      distractorOrder
    );

    const statement = buildStatement(a, b);

    return {
      exercise_id: uuidv4(),
      seed: currentSeed,
      template_id: "line_equation",
      difficulty: 1,
      concept: "equation_droite",
      statement,
      choices,
      correct_choice_id: correctPosition,
      params: { a, b, neg_b: -b },
      coord_system: [-6, 6, -6, 6] as [number, number, number, number],
    };
  }

  // Fallback garanti valide
  return generateExercise(seed + 100);
}

function buildStatement(a: number, b: number): string {
  const aPart = a === 1 ? "" : a === -1 ? "-" : `${a}`;
  const bPart = b > 0 ? ` + ${b}` : ` - ${Math.abs(b)}`;
  return `Sélectionne la figure représentant la droite d'équation : y = ${aPart}x${bPart}`;
}

function buildChoices(
  correctPosition: ChoiceId,
  correct: [number, number],
  distractors: [MisconceptionId, [number, number]][]
): Choice[] {
  const positions: ChoiceId[] = ["A", "B", "C"];
  const wrongPositions = positions.filter((p) => p !== correctPosition);

  const allChoices: Choice[] = positions.map((pos) => {
    if (pos === correctPosition) {
      return {
        choice_id: pos,
        is_correct: true,
        misconception_id: null,
        construction_commands: buildConstructionCommands(correct[0], correct[1]),
      };
    }
    const idx = wrongPositions.indexOf(pos);
    const [misId, [da, db]] = distractors[idx];
    return {
      choice_id: pos,
      is_correct: false,
      misconception_id: misId,
      construction_commands: buildConstructionCommands(da, db),
    };
  });

  return allChoices;
}

export function getFeedbackText(
  misconceptionId: MisconceptionId,
  level: "indice" | "correction",
  params: Record<string, number | string>
): string {
  const entry = MISCONCEPTION_REGISTRY[misconceptionId];
  const template = entry[level];
  return instantiateFeedback(template, params);
}

export function getCorrectFeedback(a: number, b: number): string {
  const direction = a < 0 ? "décroissante" : "croissante";
  const bPart = b > 0 ? `au-dessus de l'origine` : `en dessous de l'origine`;
  return `Exact ! Le coefficient directeur est ${a} (droite ${direction}) et l'ordonnée à l'origine est ${b} — la droite coupe l'axe des ordonnées ${bPart}.`;
}

export function getCorrectFeedbackAttempt2(): string {
  return "Bonne réponse au deuxième essai. Continue comme ça !";
}
