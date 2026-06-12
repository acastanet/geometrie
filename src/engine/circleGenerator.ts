import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import { mulberry32 } from "./exerciseGenerator";

const CENTER_DOMAIN = [-3, -2, -1, 1, 2, 3] as const;
const RADIUS_DOMAIN = [1, 1.5, 2, 2.5, 3] as const;

type CircleMisId =
  | "circle_center_sign_x"
  | "circle_center_sign_y"
  | "circle_radius_squared"
  | "circle_center_swap";

function buildCircleCommands(cx: number, cy: number, r: number): string[] {
  // Équation implicite compatible avec l'app "graphing"
  const r2 = r * r;
  const xTerm = cx === 0 ? "x^2" : cx > 0 ? `(x - ${cx})^2` : `(x + ${Math.abs(cx)})^2`;
  const yTerm = cy === 0 ? "y^2" : cy > 0 ? `(y - ${cy})^2` : `(y + ${Math.abs(cy)})^2`;
  return [`${xTerm} + ${yTerm} = ${r2}`];
}

function applyMisconception(
  mis: CircleMisId,
  cx: number,
  cy: number,
  r: number
): [number, number, number] {
  switch (mis) {
    case "circle_center_sign_x":
      return [-cx, cy, r];
    case "circle_center_sign_y":
      return [cx, -cy, r];
    case "circle_radius_squared":
      return [cx, cy, r * r];
    case "circle_center_swap":
      return [cy, cx, r];
  }
}

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

export function generateCircleExercise(seed: number): Exercise {
  const rng = mulberry32(seed);

  const cx = pickRandom(CENTER_DOMAIN, rng);
  const cy = pickRandom(CENTER_DOMAIN, rng);
  const r = pickRandom(RADIUS_DOMAIN, rng);

  const allMis: CircleMisId[] = [
    "circle_center_sign_x",
    "circle_center_sign_y",
    "circle_radius_squared",
    "circle_center_swap",
  ];

  // Filtre les misconceptions qui donneraient la même figure que la correcte
  const validMis = allMis.filter((m) => {
    const [dcx, dcy, dr] = applyMisconception(m, cx, cy, r);
    return !(dcx === cx && dcy === cy && dr === r);
  });

  const idx1 = Math.floor(rng() * validMis.length);
  const mis1 = validMis[idx1];
  const remaining = validMis.filter((_, i) => i !== idx1);
  const mis2 = remaining[Math.floor(rng() * remaining.length)];

  const [cx1, cy1, r1] = applyMisconception(mis1, cx, cy, r);
  const [cx2, cy2, r2] = applyMisconception(mis2, cx, cy, r);

  const positions: ChoiceId[] = ["A", "B", "C"];
  const correctPos = positions[Math.floor(rng() * 3)];
  const wrongPos = positions.filter((p) => p !== correctPos);

  const choices: Choice[] = positions.map((pos) => {
    if (pos === correctPos) {
      return {
        choice_id: pos,
        is_correct: true,
        misconception_id: null,
        construction_commands: buildCircleCommands(cx, cy, r),
      };
    }
    const i = wrongPos.indexOf(pos);
    const [dcx, dcy, dr] = i === 0 ? [cx1, cy1, r1] : [cx2, cy2, r2];
    const mis: MisconceptionId = i === 0 ? mis1 : mis2;
    return {
      choice_id: pos,
      is_correct: false,
      misconception_id: mis,
      construction_commands: buildCircleCommands(dcx, dcy, dr),
    };
  });

  // Système de coordonnées : englobe tous les cercles
  const maxR = Math.max(r, r1, r2);
  const maxAbsX = Math.max(Math.abs(cx) + r, Math.abs(cx1) + r1, Math.abs(cx2) + r2, 4);
  const maxAbsY = Math.max(Math.abs(cy) + r, Math.abs(cy1) + r1, Math.abs(cy2) + r2, 4);
  const range = Math.max(maxAbsX, maxAbsY) + 1.5;
  // On utilise r aussi pour la borne inférieure
  void maxR;

  return {
    exercise_id: uuidv4(),
    seed,
    template_id: "circle",
    difficulty: 1,
    concept: "cercle",
    statement: buildStatement(cx, cy, r),
    choices,
    correct_choice_id: correctPos,
    params: { cx, cy, r },
    coord_system: [-range, range, -range, range],
  };
}

function buildStatement(cx: number, cy: number, r: number): string {
  return `Sélectionne la figure représentant le cercle de centre (${cx} ; ${cy}) et de rayon ${r}.`;
}
