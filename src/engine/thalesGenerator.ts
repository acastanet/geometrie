import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import { mulberry32 } from "./exerciseGenerator";

// Configurations Thalès : [AD, DB, AE] → EC = AE * DB / AD (entier)
const THALES_CONFIGS: [number, number, number][] = [
  [1, 2, 2], // EC = 4
  [1, 3, 2], // EC = 6
  [2, 3, 4], // EC = 6
  [2, 4, 3], // EC = 6
  [3, 4, 6], // EC = 8
  [1, 2, 3], // EC = 6
  [2, 3, 6], // EC = 9
  [3, 2, 6], // EC = 4
  [4, 3, 8], // EC = 6
];

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Construit la figure Thalès :
 *   A au sommet (3, 5), B en bas gauche (0,0), C en bas droite (6,0)
 *   D sur AB et E sur AC au même rapport AD/AB
 *   Segments légendés avec les valeurs données
 */
function buildThalesCommands(
  AD: number,
  DB: number,
  AE: number,
  EC_label: string
): string[] {
  const ratio = AD / (AD + DB);

  // Coordonnées des sommets
  const Ax = 3, Ay = 5;
  const Bx = 0, By = 0;
  const Cx = 6, Cy = 0;

  // D sur AB, E sur AC
  const Dx = parseFloat((Ax + ratio * (Bx - Ax)).toFixed(3));
  const Dy = parseFloat((Ay + ratio * (By - Ay)).toFixed(3));
  const Ex = parseFloat((Ax + ratio * (Cx - Ax)).toFixed(3));
  const Ey = parseFloat((Ay + ratio * (Cy - Ay)).toFixed(3));

  // Positions des étiquettes (milieux des segments légèrement décalés)
  const lblADx = ((Ax + Dx) / 2 - 0.7).toFixed(2);
  const lblADy = ((Ay + Dy) / 2 + 0.2).toFixed(2);
  const lblDBx = ((Dx + Bx) / 2 - 0.7).toFixed(2);
  const lblDBy = ((Dy + By) / 2).toFixed(2);
  const lblAEx = ((Ax + Ex) / 2 + 0.4).toFixed(2);
  const lblAEy = ((Ay + Ey) / 2 + 0.2).toFixed(2);
  const lblECx = ((Ex + Cx) / 2 + 0.4).toFixed(2);
  const lblECy = ((Ey + Cy) / 2).toFixed(2);

  return [
    `A = (${Ax}, ${Ay})`,
    `B = (${Bx}, ${By})`,
    `C = (${Cx}, ${Cy})`,
    `D = (${Dx}, ${Dy})`,
    `E = (${Ex}, ${Ey})`,
    `Segment(A, B)`,
    `Segment(A, C)`,
    `Segment(B, C)`,
    `Segment(D, E)`,
    `Text("AD=${AD}", (${lblADx}, ${lblADy}))`,
    `Text("DB=${DB}", (${lblDBx}, ${lblDBy}))`,
    `Text("AE=${AE}", (${lblAEx}, ${lblAEy}))`,
    `Text("EC=${EC_label}", (${lblECx}, ${lblECy}))`,
  ];
}

export function generateThalesExercise(seed: number, difficulty: 1 | 2 = 1): Exercise {
  const rng = mulberry32(seed);
  const [AD, DB, AE] = pickRandom(THALES_CONFIGS, rng);
  const EC = (AE * DB) / AD;

  // Distracteurs selon les misconceptions
  const thales_inverse = parseFloat((AE * AD / DB).toFixed(2));     // inverse du rapport
  const thales_full = parseFloat((AE * (AD + DB) / AD).toFixed(2)); // utilise AB au lieu de DB
  const thales_add = AD + DB;                                         // additionne à tort

  const positions: ChoiceId[] = ["A", "B", "C"];
  const correctPos = positions[Math.floor(rng() * 3)];
  const wrongPos = positions.filter((p) => p !== correctPos);

  if (difficulty === 1) {
    // Niveau 1 : trouver EC
    const distractors: [number, string][] = [
      [thales_inverse, "thales_inverse_ratio"],
      [thales_full, "thales_full_base"],
      [thales_add, "thales_add_segments"],
    ].filter(([v]) => (v as number) !== EC && (v as number) > 0) as [number, string][];

    const d1 = distractors[0] ?? [EC + 1, "thales_inverse_ratio"];
    const d2 = distractors[1] ?? [EC + 2, "thales_full_base"];

    const choices: Choice[] = positions.map((pos) => {
      if (pos === correctPos) {
        return {
          choice_id: pos,
          is_correct: true,
          misconception_id: null,
          construction_commands: buildThalesCommands(AD, DB, AE, String(EC)),
        };
      }
      const i = wrongPos.indexOf(pos);
      const [val, mis] = i === 0 ? d1 : d2;
      return {
        choice_id: pos,
        is_correct: false,
        misconception_id: mis as string,
        construction_commands: buildThalesCommands(AD, DB, AE, String(val)),
      };
    });

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "thales_find_ec",
      difficulty: 1,
      concept: "thales",
      statement: `Dans la figure ci-dessous, (DE) est parallèle à (BC). On donne AD = ${AD}, DB = ${DB} et AE = ${AE}. Sélectionne la figure montrant la valeur correcte de EC.`,
      choices,
      correct_choice_id: correctPos,
      params: { AD, DB, AE, EC },
      coord_system: [-1, 7, -1, 6] as [number, number, number, number],
      appName: "geometry",
    };
  } else {
    // Niveau 2 : trouver AE sachant AD, DB, EC
    const AE_correct = EC * AD / DB;
    const d1_val = EC * DB / AD;   // inverse
    const d2_val = EC + AD;        // additionne à tort

    const choices: Choice[] = positions.map((pos) => {
      if (pos === correctPos) {
        return {
          choice_id: pos,
          is_correct: true,
          misconception_id: null,
          construction_commands: buildThalesCommands(AD, DB, parseFloat(AE_correct.toFixed(1)), String(EC)),
        };
      }
      const i = wrongPos.indexOf(pos);
      const val = i === 0 ? d1_val : d2_val;
      const mis = i === 0 ? "thales_inverse_ratio" : "thales_add_segments";
      return {
        choice_id: pos,
        is_correct: false,
        misconception_id: mis,
        construction_commands: buildThalesCommands(AD, DB, parseFloat(val.toFixed(1)), String(EC)),
      };
    });

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "thales_find_ae",
      difficulty: 2,
      concept: "thales",
      statement: `Dans la figure ci-dessous, (DE) est parallèle à (BC). On donne AD = ${AD}, DB = ${DB} et EC = ${EC}. Sélectionne la figure montrant la valeur correcte de AE.`,
      choices,
      correct_choice_id: correctPos,
      params: { AD, DB, AE: AE_correct, EC },
      coord_system: [-1, 7, -1, 6] as [number, number, number, number],
      appName: "geometry",
    };
  }
}
