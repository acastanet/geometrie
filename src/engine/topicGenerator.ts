import type { Exercise, Concept } from "../types/exercise";
import { generateExercise } from "./exerciseGenerator";
import { generateCircleExercise } from "./circleGenerator";
import { generatePythagorasExercise } from "./pythagorasGenerator";
import { generateThalesExercise } from "./thalesGenerator";

export function generateExerciseForTopic(
  concept: Concept,
  difficulty: 1 | 2,
  seed: number
): Exercise {
  switch (concept) {
    case "equation_droite":
      return generateExercise(seed);
    case "cercle":
      return generateCircleExercise(seed);
    case "pythagore":
      return generatePythagorasExercise(seed, difficulty);
    case "thales":
      return generateThalesExercise(seed, difficulty);
  }
}

export function getCorrectFeedbackForConcept(
  concept: Concept,
  params: Record<string, number | string>,
  attemptCount: 1 | 2
): string {
  if (attemptCount === 2) return "Bonne réponse au deuxième essai. Continue comme ça !";

  switch (concept) {
    case "equation_droite": {
      const a = params.a as number;
      const b = params.b as number;
      const dir = a < 0 ? "décroissante" : "croissante";
      const pos = b > 0 ? "au-dessus de l'origine" : "en dessous de l'origine";
      return `Exact ! Coefficient directeur a = ${a} (droite ${dir}), ordonnée à l'origine b = ${b} — droite ${pos}.`;
    }
    case "cercle": {
      const { cx, cy, r } = params;
      return `Exact ! Le cercle a bien pour centre (${cx} ; ${cy}) et pour rayon ${r}.`;
    }
    case "pythagore": {
      const { a, b, c } = params;
      return `Exact ! Par Pythagore : c² = ${a}² + ${b}² = ${(Number(a) ** 2 + Number(b) ** 2)}, donc c = ${c}.`;
    }
    case "thales": {
      const { AD, DB, AE, EC } = params;
      return `Exact ! Par Thalès : AD/DB = AE/EC, soit EC = ${AE} × ${DB} / ${AD} = ${EC}.`;
    }
  }
}
