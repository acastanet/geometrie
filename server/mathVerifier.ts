import type { LlmExerciseType } from "./generatePrompt";
import type { LlmResponse } from "./validateLlmResponse";

/**
 * Vérifie la cohérence mathématique de la réponse LLM.
 *
 * Recalcule la bonne réponse à partir de data.points (et data.m, data.p si applicable),
 * compare avec la value du choix marqué correct.
 * Rejette si :
 * - la réponse correcte ne correspond pas au calcul
 * - un distracteur donne la même value que la réponse correcte
 * - deux distracteurs ont la même value
 *
 * Retourne null si tout est OK, ou un message d'erreur descriptif.
 */
export function verifyMath(llmResponse: LlmResponse): string | null {
  const { exercise_type, data, choices } = llmResponse;

  const correctChoice = choices.find((c) => c.is_correct)!;
  const wrongChoices = choices.filter((c) => !c.is_correct);

  let expectedValue: string;

  try {
    expectedValue = computeCorrectValue(exercise_type, data);
  } catch (e) {
    return `Erreur de calcul : ${e instanceof Error ? e.message : String(e)}`;
  }

  // Vérifier que la réponse correcte correspond
  if (!valuesMatch(expectedValue, correctChoice.value)) {
    return `Réponse incorrecte : attendu "${expectedValue}", le LLM dit "${correctChoice.value}" (choix ${correctChoice.id})`;
  }

  // Vérifier qu'aucun distracteur n'a la même value que la bonne réponse
  for (const wc of wrongChoices) {
    if (valuesMatch(expectedValue, wc.value)) {
      return `Le distracteur ${wc.id} a la même value que la réponse correcte ("${wc.value}")`;
    }
  }

  // Vérifier que les deux distracteurs sont distincts
  if (wrongChoices.length >= 2) {
    if (valuesMatch(wrongChoices[0].value, wrongChoices[1].value)) {
      return `Les deux distracteurs ${wrongChoices[0].id} et ${wrongChoices[1].id} ont la même value ("${wrongChoices[0].value}")`;
    }
  }

  return null; // OK
}

/** Calcule la value canonique pour un type d'exercice donné */
function computeCorrectValue(
  type: LlmExerciseType,
  data: { points: Record<string, [number, number]>; [key: string]: unknown }
): string {
  const points = data.points;

  switch (type) {
    case "milieu_symetrique": {
      const A = points["A"];
      const B = points["B"];
      if (!A || !B) throw new Error("Points A et B requis pour milieu_symetrique");
      const mx = (A[0] + B[0]) / 2;
      const my = (A[1] + B[1]) / 2;
      const mxStr = Number.isInteger(mx) ? String(mx) : formatFraction(A[0] + B[0], 2);
      const myStr = Number.isInteger(my) ? String(my) : formatFraction(A[1] + B[1], 2);
      return `milieu:${mxStr},${myStr}`;
    }

    case "distance_comparaison": {
      const A = points["A"];
      const B = points["B"];
      if (!A || !B) throw new Error("Points A et B requis pour distance_comparaison");
      const ab2 = (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2;
      const sqrt = Math.sqrt(ab2);
      if (Number.isInteger(sqrt)) {
        return `distance_AB:${sqrt}`;
      }
      return `distance_AB:sqrt(${ab2})`;
    }

    case "nature_triangle": {
      const A = points["A"];
      const B = points["B"];
      const C = points["C"];
      if (!A || !B || !C) throw new Error("Points A, B, C requis pour nature_triangle");

      const ab2 = (A[0] - B[0]) ** 2 + (A[1] - B[1]) ** 2;
      const bc2 = (B[0] - C[0]) ** 2 + (B[1] - C[1]) ** 2;
      const ac2 = (A[0] - C[0]) ** 2 + (A[1] - C[1]) ** 2;

      // Rectangle ? (Pythagore)
      if (ab2 + bc2 === ac2) return "nature:rectangle_en_B";
      if (ab2 + ac2 === bc2) return "nature:rectangle_en_A";
      if (bc2 + ac2 === ab2) return "nature:rectangle_en_C";

      // Isocèle ?
      if (ab2 === ac2) return "nature:isocele_en_A";
      if (ab2 === bc2) return "nature:isocele_en_B";
      if (ac2 === bc2) return "nature:isocele_en_C";

      // Équilatéral ?
      if (ab2 === bc2 && bc2 === ac2) return "nature:equilateral";

      return "nature:quelconque";
    }

    case "est_parallelogramme": {
      const A = points["A"];
      const B = points["B"];
      const C = points["C"];
      const D = points["D"];
      if (!A || !B || !C || !D) throw new Error("Points A, B, C, D requis");

      const abX = B[0] - A[0];
      const abY = B[1] - A[1];
      const dcX = C[0] - D[0];
      const dcY = C[1] - D[1];

      return abX === dcX && abY === dcY
        ? "parallelogramme:oui"
        : "parallelogramme:non";
    }

    case "quatrieme_sommet": {
      const A = points["A"];
      const B = points["B"];
      const C = points["C"];
      if (!A || !B || !C) throw new Error("Points A, B, C requis");

      const dx = A[0] + C[0] - B[0];
      const dy = A[1] + C[1] - B[1];
      return `sommet_D:${dx},${dy}`;
    }

    case "alignement_points": {
      const A = points["A"];
      const B = points["B"];
      const K = points["K"];
      if (!A || !B || !K) throw new Error("Points A, B, K requis");

      const det = (B[0] - A[0]) * (K[1] - A[1]) - (B[1] - A[1]) * (K[0] - A[0]);
      return `alignes:${det === 0 ? "oui" : "non"}`;
    }

    case "equation_reduite_2pts": {
      const A = points["A"];
      const B = points["B"];
      if (!A || !B) throw new Error("Points A et B requis");
      if (A[0] === B[0]) throw new Error("Droite verticale non supportée");

      const mNum = B[1] - A[1];
      const mDen = B[0] - A[0];
      const [mNumRed, mDenRed] = reduceFraction(mNum, mDen);

      const pNum = A[1] * mDenRed - mNumRed * A[0];
      const pDen = mDenRed;
      const [pNumRed, pDenRed] = reduceFraction(pNum, pDen);

      return `equation:${mNumRed}/${mDenRed},${pNumRed}/${pDenRed}`;
    }

    case "appartenance_droite": {
      const K = points["K"];
      if (!K) throw new Error("Point K requis");
      const m = data.m;
      const p = data.p;
      if (typeof m !== "number" || typeof p !== "number") {
        throw new Error("m et/ou p manquants dans data pour appartenance_droite");
      }

      const yExpected = m * K[0] + p;
      return `appartient:${yExpected === K[1] ? "oui" : "non"}`;
    }

    default:
      throw new Error(`Type d'exercice inconnu : ${type}`);
  }
}

/** Compare deux values canoniques (égalité exacte, sans comparaison de LaTeX) */
function valuesMatch(expected: string, actual: string): boolean {
  return expected.trim() === actual.trim();
}

/** Réduit une fraction (num, den). Le signe est porté par le numérateur. */
function reduceFraction(num: number, den: number): [number, number] {
  if (den < 0) {
    num = -num;
    den = -den;
  }
  const g = gcd(Math.abs(num), Math.abs(den));
  return [num / g, den / g];
}

function gcd(a: number, b: number): number {
  while (b) {
    [a, b] = [b, a % b];
  }
  return a || 1;
}

/** Formate un rationnel en fraction réduite (string) */
function formatFraction(num: number, den: number): string {
  const [n, d] = reduceFraction(num, den);
  if (d === 1) return String(n);
  return `${n}/${d}`;
}
