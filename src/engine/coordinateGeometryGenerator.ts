import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import { mulberry32 } from "./exerciseGenerator";
import { fmtPoint, fmtSqrt, REPERE } from "./mathFormat";
import { twoPointsFigure, cercleFigure, projeteFigure, computeCoordSystem } from "./geoGebraCommands";

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

const DIST_PAIRS: [number, number][] = [
  [3, 4], [4, 3], [6, 8], [8, 6], [1, 2], [2, 1],
  [2, 3], [3, 2], [2, 4], [4, 2],
];

function computeDistance(dx: number, dy: number): number {
  return Math.sqrt(dx * dx + dy * dy);
}

export function generateCoordinateGeometryExercise(seed: number, difficulty: 1 | 2): Exercise {
  const rng = mulberry32(seed);
  if (difficulty === 1) {
    const template = rng() < 0.5 ? "distance_points" : "milieu_segment";
    return template === "distance_points"
      ? generateDistancePoints(seed, rng)
      : generateMilieuSegment(seed, rng);
  } else {
    const template = rng() < 0.5 ? "rayon_cercle" : "projete_orthogonal";
    return template === "rayon_cercle"
      ? generateRayonCercle(seed, rng)
      : generateProjeteOrthogonal(seed, rng);
  }
}

// ── Template 1 : distance_points ────────────────────────────────────────────

function generateDistancePoints(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const xA = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    const yA = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    let xB: number, yB: number;
    if (rng() < 0.5) {
      const [dx, dy] = pickRandom(DIST_PAIRS, rng);
      const signDx = rng() < 0.5 ? 1 : -1;
      const signDy = rng() < 0.5 ? 1 : -1;
      xB = xA + signDx * dx;
      yB = yA + signDy * dy;
    } else {
      xB = xA + pickRandom([-4, -3, -2, -1, 1, 2, 3, 4] as const, rng);
      yB = yA + pickRandom([-4, -3, -2, -1, 1, 2, 3, 4] as const, rng);
    }

    const dx = xB - xA;
    const dy = yB - yA;
    if (dx === 0 && dy === 0) continue;

    const dist = computeDistance(dx, dy);
    const sumSq = dx * dx + dy * dy;
    const AB_latex = dist === Math.floor(dist) ? String(Math.floor(dist)) : fmtSqrt(sumSq);

    const A = fmtPoint("A", xA, yA);
    const B = fmtPoint("B", xB, yB);
    const correctLatex = `AB = ${AB_latex}`;

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      { latex: `AB = ${sumSq}`, misId: "dist_no_sqrt" as MisconceptionId },
      { latex: `AB = ${Math.abs(dx) + Math.abs(dy)}`, misId: "dist_add_coords" as MisconceptionId },
    ];
    const subSq = Math.abs(dx * dx - dy * dy);
    if (subSq > 0) {
      distractors.push({ latex: `AB = \\sqrt{${subSq}}`, misId: "dist_subtract_squares" as MisconceptionId });
    }

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère orthonormé $${REPERE}$, on considère les points $${A}$ et $${B}$ représentés ci-dessous. Calculer la distance $AB$.`;

    const coordSys = computeCoordSystem([[xA, yA], [xB, yB]]);
    const figCommands = twoPointsFigure(xA, yA, xB, yB, false);

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "distance_points",
      difficulty: 1,
      concept: "geometrie_repere",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { xA, yA, xB, yB, sum_sq: sumSq, AB_latex },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateDistancePoints(seed + 100, mulberry32(seed + 100));
}

// ── Template 2 : milieu_segment ─────────────────────────────────────────────

function generateMilieuSegment(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const xA = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    const yA = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    const xB = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    const yB = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    if (xA === xB && yA === yB) continue;

    const mx = (xA + xB) / 2;
    const my = (yA + yB) / 2;
    const mxStr = Number.isInteger(mx) ? String(mx) : String.raw`\frac{${xA + xB}}{2}`;
    const myStr = Number.isInteger(my) ? String(my) : String.raw`\frac{${yA + yB}}{2}`;
    const correctLatex = String.raw`I\left(${mxStr}\ ;\ ${myStr}\right)`;

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      { latex: String.raw`I\left(${xA - xB}\ ;\ ${yA - yB}\right)`, misId: "midpoint_difference" as MisconceptionId },
      { latex: String.raw`I\left(${xA + xB}\ ;\ ${yA + yB}\right)`, misId: "midpoint_no_half" as MisconceptionId },
    ];

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const A = fmtPoint("A", xA, yA);
    const B = fmtPoint("B", xB, yB);
    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère $${REPERE}$, on donne $${A}$ et $${B}$ représentés ci-dessous. Déterminer les coordonnées du milieu $I$ du segment $[AB]$.`;

    const coordSys = computeCoordSystem([[xA, yA], [xB, yB]]);
    const figCommands = twoPointsFigure(xA, yA, xB, yB, false);

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "milieu_segment",
      difficulty: 1,
      concept: "geometrie_repere",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { xA, yA, xB, yB, mx_latex: mxStr, my_latex: myStr },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateMilieuSegment(seed + 100, mulberry32(seed + 100));
}

// ── Template 3 : rayon_cercle ───────────────────────────────────────────────

function generateRayonCercle(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const cx = pickRandom([-4, -3, -2, -1, 0, 1, 2, 3, 4] as const, rng);
    const cy = pickRandom([-4, -3, -2, -1, 0, 1, 2, 3, 4] as const, rng);
    const [dx, dy] = pickRandom(DIST_PAIRS, rng);
    const signDx = rng() < 0.5 ? 1 : -1;
    const signDy = rng() < 0.5 ? 1 : -1;
    const xB = cx + signDx * dx;
    const yB = cy + signDy * dy;
    if (xB === cx && yB === cy) continue;

    const dist = computeDistance(dx, dy);
    const sumSq = dx * dx + dy * dy;
    const r_latex = dist === Math.floor(dist) ? String(Math.floor(dist)) : fmtSqrt(sumSq);

    const A = fmtPoint("A", cx, cy);
    const B = fmtPoint("B", xB, yB);
    const correctLatex = `r = ${r_latex}`;

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      { latex: `r = ${sumSq}`, misId: "dist_no_sqrt" as MisconceptionId },
      { latex: `r = ${Math.abs(dx) + Math.abs(dy)}`, misId: "dist_add_coords" as MisconceptionId },
    ];

    const filtered = distractors.filter((d) => d.latex !== correctLatex).slice(0, 2);
    if (filtered.length < 2) continue;

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, filtered, positions);
    const statement = `Dans un repère orthonormé $${REPERE}$, on considère le cercle $\\mathscr{C}$ de centre $${A}$ passant par $${B}$ représenté ci-dessous. Quel est le rayon de $\\mathscr{C}$ ?`;

    const coordSys = computeCoordSystem([[cx, cy], [xB, yB]]);
    const figCommands = cercleFigure(cx, cy, xB, yB);

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "rayon_cercle",
      difficulty: 2,
      concept: "geometrie_repere",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { xA: cx, yA: cy, xB, yB, sum_sq: sumSq, AB_latex: r_latex },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateRayonCercle(seed + 100, mulberry32(seed + 100));
}

// ── Template 4 : projeté orthogonal ─────────────────────────────────────────

function generateProjeteOrthogonal(seed: number, rng: () => number): Exercise {
  for (let attempt = 0; attempt < 20; attempt++) {
    const x = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    const y = pickRandom([-5, -4, -3, -2, -1, 0, 1, 2, 3, 4, 5] as const, rng);
    if (x === 0 && y === 0) continue;

    const M = fmtPoint("M", x, y);
    const onAbscisse = rng() < 0.5;
    const hx = onAbscisse ? x : 0;
    const hy = onAbscisse ? 0 : y;
    const correctLatex = fmtPoint("H", hx, hy);
    const correctAxis = onAbscisse ? "abscisses" : "ordonnées";

    const wrongH = onAbscisse
      ? fmtPoint("H", 0, y)
      : fmtPoint("H", x, 0);
    const swapH = fmtPoint("H", y, x);

    const distractors: { latex: string; misId: MisconceptionId }[] = [
      { latex: wrongH, misId: "proj_wrong_axis" as MisconceptionId },
      { latex: swapH, misId: "proj_keep_coord" as MisconceptionId },
    ];

    const positions: ChoiceId[] = ["A", "B", "C"];
    const correctPos = positions[Math.floor(rng() * 3)];
    const choices = buildTextChoices(correctPos, correctLatex, distractors, positions);
    const statement = `Dans un repère $${REPERE}$, on considère le point $${M}$ représenté ci-dessous. Quel est le projeté orthogonal de $M$ sur l'axe des ${correctAxis} ?`;

    const coordSys = computeCoordSystem([[x, y], [hx, hy]]);
    const figCommands = projeteFigure(x, y, hx, hy);

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "projete_orthogonal",
      difficulty: 2,
      concept: "geometrie_repere",
      statement,
      choices,
      correct_choice_id: correctPos,
      choice_type: "text",
      params: { x, y, c: 0 },
      coord_system: coordSys,
      statement_figure: { commands: figCommands, coord_system: coordSys, appName: "geometry" },
    };
  }
  return generateProjeteOrthogonal(seed + 100, mulberry32(seed + 100));
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
