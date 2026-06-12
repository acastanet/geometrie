import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import { mulberry32 } from "./exerciseGenerator";

// Triplets pythagoriciens (a, b, c) avec c = hypoténuse
const TRIPLES: [number, number, number][] = [
  [3, 4, 5],
  [5, 12, 13],
  [6, 8, 10],
  [8, 15, 17],
  [9, 12, 15],
  [4, 3, 5],
  [12, 5, 13],
];

function pickRandom<T>(arr: readonly T[], rng: () => number): T {
  return arr[Math.floor(rng() * arr.length)];
}

/**
 * Construit les commandes GeoGebra pour un triangle rectangle :
 *  - Angle droit en A=(0,0), B=(a,0), C=(0,b)
 *  - Segments légendés avec les côtés connus
 *  - Hypoténuse légendée avec la valeur proposée (peut être fausse)
 */
function buildTriangleCommands(
  a: number,
  b: number,
  hypLabel: string,
  knownLabel: "hyp" | "leg_b"  // ce qui est donné vs ce qui est cherché
): string[] {
  const midHypX = (a / 2 + 0.5).toFixed(2);
  const midHypY = (b / 2 + 0.3).toFixed(2);
  const midAX = (a / 2).toFixed(2);
  const midBY = (b / 2).toFixed(2);

  const cmds: string[] = [
    `A = (0, 0)`,
    `B = (${a}, 0)`,
    `C = (0, ${b})`,
    `Segment(A, B)`,
    `Segment(A, C)`,
    `Segment(B, C)`,
    `Angle(B, A, C)`,
  ];

  if (knownLabel === "hyp") {
    // Niveau 1 : on connaît a et b, on cherche c
    cmds.push(`Text("${a}", (${midAX}, -0.6))`);
    cmds.push(`Text("${b}", (-1.0, ${midBY}))`);
    cmds.push(`Text("c = ${hypLabel}", (${midHypX}, ${midHypY}))`);
  } else {
    // Niveau 2 : on connaît c et a, on cherche b
    cmds.push(`Text("${a}", (${midAX}, -0.6))`);
    cmds.push(`Text("${b}", (-1.0, ${midBY}))`);
    cmds.push(`Text("c = ${hypLabel}", (${midHypX}, ${midHypY}))`);
  }

  return cmds;
}

export function generatePythagorasExercise(seed: number, difficulty: 1 | 2 = 1): Exercise {
  const rng = mulberry32(seed);
  const [a, b, c] = pickRandom(TRIPLES, rng);

  const positions: ChoiceId[] = ["A", "B", "C"];
  const correctPos = positions[Math.floor(rng() * 3)];
  const wrongPos = positions.filter((p) => p !== correctPos);

  if (difficulty === 1) {
    // Niveau 1 : trouver l'hypoténuse c sachant a et b
    const wrong1 = a + b;                         // misconception : additionner
    const wrong2 = parseFloat((Math.sqrt(Math.abs(a * a - b * b))).toFixed(1)); // misconception : soustraire
    const wrong3 = a * a + b * b;                  // misconception : oublier la racine

    // Choisir 2 distracteurs parmi les 3 qui ne valent pas c
    const distractors = [wrong1, wrong2, wrong3]
      .filter((v) => v !== c && v > 0 && isFinite(v))
      .slice(0, 2);

    // Compléter avec un fallback si besoin
    while (distractors.length < 2) {
      distractors.push(c + distractors.length + 1);
    }

    const [d1, d2] = distractors;
    const mis1 = a + b === d1 ? "pythagoras_add_legs" : a * a + b * b === d1 ? "pythagoras_no_sqrt" : "pythagoras_subtract";
    const mis2 = a + b === d2 ? "pythagoras_add_legs" : a * a + b * b === d2 ? "pythagoras_no_sqrt" : "pythagoras_subtract";

    const choices: Choice[] = positions.map((pos) => {
      if (pos === correctPos) {
        return {
          choice_id: pos,
          is_correct: true,
          misconception_id: null,
          construction_commands: buildTriangleCommands(a, b, String(c), "hyp"),
        };
      }
      const i = wrongPos.indexOf(pos);
      const val = i === 0 ? d1 : d2;
      const mis = i === 0 ? mis1 : mis2;
      return {
        choice_id: pos,
        is_correct: false,
        misconception_id: mis,
        construction_commands: buildTriangleCommands(a, b, String(val), "hyp"),
      };
    });

    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "pythagoras_find_hyp",
      difficulty: 1,
      concept: "pythagore",
      statement: `Dans un triangle rectangle (angle droit en A), avec les deux côtés de l'angle droit mesurant ${a} et ${b}. Sélectionne la figure montrant la valeur correcte de l'hypoténuse c.`,
      choices,
      correct_choice_id: correctPos,
      params: { a, b, c },
      coord_system: [-1, a + 2, -1, b + 2] as [number, number, number, number],
      appName: "geometry",
    };
  } else {
    // Niveau 2 : trouver un côté de l'angle droit sachant c et l'autre côté
    // Chercher b sachant a et c
    const bCorrect = parseFloat(Math.sqrt(c * c - a * a).toFixed(1));
    const wrong1 = parseFloat(Math.sqrt(c * c + a * a).toFixed(1)); // ajoute au lieu de soustraire
    const wrong2 = c - a;                                            // soustrait directement
    const wrong3 = parseFloat((c * a / Math.sqrt(c * c - a * a)).toFixed(1)); // formule incorrecte

    const distractors = [wrong1, wrong2, wrong3]
      .filter((v) => v !== bCorrect && v > 0 && isFinite(v) && !isNaN(v))
      .slice(0, 2);

    while (distractors.length < 2) {
      distractors.push(bCorrect + distractors.length + 1);
    }

    const [d1, d2] = distractors;

    const choices: Choice[] = positions.map((pos) => {
      if (pos === correctPos) {
        return {
          choice_id: pos,
          is_correct: true,
          misconception_id: null,
          construction_commands: buildTriangleCommands(a, bCorrect, String(c), "leg_b"),
        };
      }
      const i = wrongPos.indexOf(pos);
      const val = i === 0 ? d1 : d2;
      const mis = i === 0 ? "pythagoras_subtract" : "pythagoras_add_legs";
      return {
        choice_id: pos,
        is_correct: false,
        misconception_id: mis,
        construction_commands: buildTriangleCommands(a, val, String(c), "leg_b"),
      };
    });

    const maxB = Math.max(bCorrect, d1, d2);
    return {
      exercise_id: uuidv4(),
      seed,
      template_id: "pythagoras_find_leg",
      difficulty: 2,
      concept: "pythagore",
      statement: `Dans un triangle rectangle (angle droit en A), l'hypoténuse mesure c = ${c} et un côté de l'angle droit mesure ${a}. Sélectionne la figure montrant la valeur correcte du côté manquant b.`,
      choices,
      correct_choice_id: correctPos,
      params: { a, b: bCorrect, c },
      coord_system: [-1, a + 2, -1, maxB + 2] as [number, number, number, number],
      appName: "geometry",
    };
  }
}
