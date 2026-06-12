import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import { mulberry32 } from "./exerciseGenerator";
import { fmtPoint, fmtVecCoords, fmtVec, REPERE } from "./mathFormat";
import {
  twoPointsFigure, threePointsFigure, twoVectorsFigure, computeCoordSystem,
  vectorCmd,
} from "./geoGebraCommands";

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

const COORDS = [-5, -4, -3, -2, -1, 1, 2, 3, 4, 5] as const;

export function generateVectorExercise(seed: number, difficulty: 1 | 2): Exercise {
  const rng = mulberry32(seed);
  if (difficulty === 1) {
    const template = rng() < 0.5 ? "vecteur_coords" : "somme_vecteurs";
    return template === "vecteur_coords"
      ? generateVecteurCoords(seed, rng)
      : generateSommeVecteurs(seed, rng);
  } else {
    const template = rng() < 0.5 ? "colinearite_det" : "alignement_points";
    return template === "colinearite_det"
      ? generateColineariteDet(seed, rng)
      : generateAlignementPoints(seed, rng);
  }
}

// ── Template 1 : vecteur_coords ─────────────────────────────────────────────

function generateVecteurCoords(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const xA = pickRandom(COORDS, rng);
    const yA = pickRandom(COORDS, rng);
    const xB = pickRandom(COORDS, rng);
    const yB = pickRandom(COORDS, rng);
    const vx = xB - xA;
    const vy = yB - yA;
    if (vx === 0 && vy === 0) continue;

    const correctLatex = fmtVecCoords("AB", vx, vy);
    const A = fmtPoint("A", xA, yA);
    const B = fmtPoint("B", xB, yB);

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      { latex: fmtVecCoords("AB", xA - xB, yA - yB), misId: "vec_reversed" as MisconceptionId },
      { latex: fmtVecCoords("AB", vy, vx), misId: "vec_swapped" as MisconceptionId },
    ];

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère $${REPERE}$, on donne $${A}$ et $${B}$ représentés ci-dessous. Quelles sont les coordonnées du vecteur $\\vec{AB}$ ?`;

    const coordSys = computeCoordSystem([[xA, yA], [xB, yB]]);
    const figCommands = [
      ...twoPointsFigure(xA, yA, xB, yB, false),
      vectorCmd("A", "B"),
    ];

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "vecteur_coords",
      difficulty: 1,
      concept: "vecteurs",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { xA, yA, xB, yB, vx, vy },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateVecteurCoords(seed + 100, mulberry32(seed + 100));
}

// ── Template 2 : somme_vecteurs ─────────────────────────────────────────────

function generateSommeVecteurs(seed: number, rng: () => number): Exercise {
  return rng() < 0.5
    ? generateSommeCoords(seed, rng)
    : generateChasles(seed, rng);
}

function generateSommeCoords(seed: number, rng: () => number): Exercise {
  const ux = pickRandom(COORDS, rng);
  const uy = pickRandom(COORDS, rng);
  const vx = pickRandom(COORDS, rng);
  const vy = pickRandom(COORDS, rng);
  const sumX = ux + vx;
  const sumY = uy + vy;
  if (sumX === 0 && sumY === 0)
    return generateSommeCoords(seed + 1, rng);

  const correctLatex = String.raw`\vec{u}+\vec{v}\,(${sumX}\ ;\ ${sumY})`;

  const distractors: { latex: string; misId: MisconceptionId }[] = [
    { latex: String.raw`\vec{u}+\vec{v}\,(${ux - vx}\ ;\ ${uy - vy})`, misId: "vec_sum_subtract" as MisconceptionId },
    { latex: String.raw`\vec{u}+\vec{v}\,(${sumY}\ ;\ ${sumX})`, misId: "vec_swapped" as MisconceptionId },
  ];

  const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
  if (filtered.length < 2) return generateSommeCoords(seed + 1, rng);

  const positions: ChoiceId[] = ["A", "B", "C"];
  const correctPos = positions[Math.floor(rng() * 3)];
  const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
  const statement = `Dans un repère $${REPERE}$, on donne $\\vec{u}\\ (${ux}\\ ;\\ ${uy})$ et $\\vec{v}\\ (${vx}\\ ;\\ ${vy})$ représentés ci-dessous. Quelles sont les coordonnées de $\\vec{u}+\\vec{v}$ ?`;

  const coordSys = computeCoordSystem([[0, 0], [ux, uy], [vx, vy], [sumX, sumY]]);
  const figCommands = twoVectorsFigure(ux, uy, vx, vy);

  return {
    exercise_id: uuidv4(),
    seed,
    template_id: "somme_vecteurs",
    difficulty: 1,
    concept: "vecteurs",
    statement,
    choices,
    correct_choice_id: correctPos,
    choice_type: "text",
    params: { ux, uy, vx2: vx, vy2: vy, sum_x: sumX, sum_y: sumY },
    coord_system: coordSys,
    statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
  };
}

function generateChasles(seed: number, rng: () => number): Exercise {
  // Créer un triangle ABC pour illustrer Chasles
  const xA = pickRandom(COORDS, rng);
  const yA = pickRandom(COORDS, rng);
  const xB = pickRandom(COORDS, rng);
  const yB = pickRandom(COORDS, rng);
  if (xA === xB && yA === yB) return generateChasles(seed + 1, rng);
  const xC = pickRandom(COORDS, rng);
  const yC = pickRandom(COORDS, rng);
  if ((xC === xA && yC === yA) || (xC === xB && yC === yB)) return generateChasles(seed + 1, rng);

  const correctLatex = fmtVec("AC");
  const distractors: { latex: string; misId: MisconceptionId }[] = [
    { latex: fmtVec("CA"), misId: "chasles_reversed" as MisconceptionId },
    { latex: fmtVec("CB"), misId: "chasles_wrong_extremity" as MisconceptionId },
  ];

  const positions: ChoiceId[] = ["A", "B", "C"];
  const correctPos = positions[Math.floor(rng() * 3)];
  const choices = buildTextChoices(correctPos, correctLatex, distractors, positions);
  const statement = `En utilisant la relation de Chasles, simplifier l'expression vectorielle : $\\vec{AB} + \\vec{BC}$. Observer la figure ci-dessous.`;

  const coordSys = computeCoordSystem([[xA, yA], [xB, yB], [xC, yC]]);
  const figCommands = [
    ...threePointsFigure(xA, yA, xB, yB, xC, yC, false),
    vectorCmd("A", "B"),
    vectorCmd("B", "C"),
    // Dessiner AC en pointillé pour suggérer le résultat
    `SetLineStyle(Vector(A, C), 2)`,
    vectorCmd("A", "C"),
    // Colorer AC différemment
    `SetColor(Vector(A, C), 0.2, 0.7, 0.3)`,
  ];

  return {
    exercise_id: uuidv4(),
    seed,
    template_id: "somme_vecteurs",
    difficulty: 1,
    concept: "vecteurs",
    statement,
    choices,
    correct_choice_id: correctPos,
    choice_type: "text",
    params: {},
    coord_system: coordSys,
    statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
  };
}

// ── Template 3 : colinéarité (déterminant) ──────────────────────────────────

function generateColineariteDet(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const ux = pickRandom(COORDS, rng);
    const uy = pickRandom(COORDS, rng);
    const isColinear = rng() < 0.5;
    let vx: number, vy: number;

    if (isColinear) {
      const k = pickRandom([-2, -0.5, 2, 3] as const, rng);
      vx = Math.round(k * ux);
      vy = Math.round(k * uy);
      if (vx === 0 && vy === 0) continue;
    } else {
      vx = pickRandom(COORDS, rng);
      vy = pickRandom(COORDS, rng);
      const det = ux * vy - uy * vx;
      if (det === 0) continue;
    }

    const det = ux * vy - uy * vx;
    const detPlus = ux * vy + uy * vx;
    const detXXYY = ux * vx - uy * vy;
    const verdictColin = isColinear ? "colinéaires" : "non colinéaires";
    const isZeroColin = isColinear ? "$= 0$" : `$= ${det} \\neq 0$`;

    const correctLatex = isColinear
      ? String.raw`\text{Oui},\ \det = ${det} = 0`
      : String.raw`\text{Non},\ \det = ${det} \neq 0`;

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      {
        latex: isColinear
          ? String.raw`\text{Non},\ \det = ${detPlus} \neq 0`
          : String.raw`\text{Oui},\ \det = ${detPlus} = 0`,
        misId: "colin_det_plus" as MisconceptionId,
      },
      {
        latex: isColinear
          ? String.raw`\text{Non},\ \det = ${detXXYY} \neq 0`
          : String.raw`\text{Oui},\ \det = ${detXXYY} = 0`,
        misId: "colin_det_xx_yy" as MisconceptionId,
      },
    ];

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère $${REPERE}$, on donne $\\vec{u}\\ (${ux}\\ ;\\ ${uy})$ et $\\vec{v}\\ (${vx}\\ ;\\ ${vy})$ représentés ci-dessous. Les vecteurs $\\vec{u}$ et $\\vec{v}$ sont-ils colinéaires ?`;

    const coordSys = computeCoordSystem([[0, 0], [ux, uy], [vx, vy]]);
    const figCommands = twoVectorsFigure(ux, uy, vx, vy);

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "colinearite_det",
      difficulty: 2,
      concept: "vecteurs",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { ux, uy, vx2: vx, vy2: vy, det, det_plus: detPlus, verdict_colin: verdictColin, is_zero_colin: isZeroColin },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateColineariteDet(seed + 100, mulberry32(seed + 100));
}

// ── Template 4 : alignement de points ───────────────────────────────────────

function generateAlignementPoints(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const xA = pickRandom(COORDS, rng);
    const yA = pickRandom(COORDS, rng);
    const xB = pickRandom(COORDS, rng);
    const yB = pickRandom(COORDS, rng);
    if (xA === xB && yA === yB) continue;

    const isAligned = rng() < 0.5;
    let xC: number, yC: number;
    if (isAligned) {
      const k = pickRandom([-2, -1, 2, 3] as const, rng);
      xC = xB + k * (xB - xA);
      yC = yB + k * (yB - yA);
    } else {
      xC = pickRandom(COORDS, rng);
      yC = pickRandom(COORDS, rng);
      const detAB_AC = (xB - xA) * (yC - yA) - (yB - yA) * (xC - xA);
      if (detAB_AC === 0) continue;
    }

    const detAB_AC = (xB - xA) * (yC - yA) - (yB - yA) * (xC - xA);
    const verdict = isAligned ? "alignés" : "non alignés";
    const correctLatex = isAligned
      ? String.raw`\text{Oui},\ \det(\vec{AB},\vec{AC}) = 0`
      : String.raw`\text{Non},\ \det(\vec{AB},\vec{AC}) = ${detAB_AC} \neq 0`;

    const detXXYY = (xB - xA) * (xC - xA) - (yB - yA) * (yC - yA);
    const distractors: { latex: string; misId: MisconceptionId }[] = [
      {
        latex: isAligned
          ? String.raw`\text{Non},\ \det = ${detXXYY} \neq 0`
          : String.raw`\text{Oui},\ \det = ${detXXYY} = 0`,
        misId: "colin_det_xx_yy" as MisconceptionId,
      },
      {
        latex: isAligned
          ? `\\text{Non car } AB + BC \\neq AC`
          : `\\text{Oui car } AB + BC = AC`,
        misId: "align_uses_distance" as MisconceptionId,
      },
    ];

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const A = fmtPoint("A", xA, yA);
    const B = fmtPoint("B", xB, yB);
    const C = fmtPoint("C", xC, yC);
    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère $${REPERE}$, on donne $${A}$, $${B}$ et $${C}$ représentés ci-dessous. Les points $A$, $B$ et $C$ sont-ils alignés ? Justifier.`;

    const coordSys = computeCoordSystem([[xA, yA], [xB, yB], [xC, yC]]);
    const figCommands = [
      ...threePointsFigure(xA, yA, xB, yB, xC, yC, false),
      vectorCmd("A", "B"),
      vectorCmd("A", "C"),
    ];

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "alignement_points",
      difficulty: 2,
      concept: "vecteurs",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { xA, yA, xB, yB, xC, yC, det: detAB_AC, verdict },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateAlignementPoints(seed + 100, mulberry32(seed + 100));
}

// ── Helpers ─────────────────────────────────────────────────────────────────

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
