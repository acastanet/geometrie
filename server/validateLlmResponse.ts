import type { LlmExerciseType } from "./generatePrompt";

/**
 * Structure JSON brute retournée par le LLM (avant mapping en Exercise).
 */
export interface LlmChoice {
  id: string;
  latex: string;
  value: string;
  is_correct: boolean;
  misconception_id: string | null;
  indice: string;
  correction: string;
}

export interface LlmResponse {
  exercise_type: LlmExerciseType;
  data: { points: Record<string, [number, number]>; [key: string]: unknown };
  statement: string;
  choices: LlmChoice[];
  correct_choice_id: string;
  correct_feedback: string;
  with_figure: boolean;
}

/**
 * Valide la structure de la réponse LLM.
 * Retourne l'objet typé ou une erreur descriptive (utilisée pour le retry).
 */
export function validateLlmResponse(parsed: unknown): LlmResponse | string {
  if (!parsed || typeof parsed !== "object") {
    return "La réponse n'est pas un objet JSON valide";
  }

  const r = parsed as Record<string, unknown>;

  // exercise_type
  if (typeof r.exercise_type !== "string") {
    return "exercise_type manquant ou invalide";
  }
  const validTypes = [
    "nature_triangle",
    "est_parallelogramme",
    "quatrieme_sommet",
    "alignement_points",
    "milieu_symetrique",
    "distance_comparaison",
    "equation_reduite_2pts",
    "appartenance_droite",
  ];
  if (!validTypes.includes(r.exercise_type)) {
    return `exercise_type "${String(r.exercise_type)}" hors catalogue. Types valides : ${validTypes.join(", ")}`;
  }

  // data.points
  if (!r.data || typeof r.data !== "object") {
    return "data manquant ou invalide";
  }
  const data = r.data as Record<string, unknown>;
  if (!data.points || typeof data.points !== "object") {
    return "data.points manquant ou invalide";
  }
  const points = data.points as Record<string, unknown>;

  // Vérifier les points requis selon le type
  const requiredPoints = getRequiredPoints(r.exercise_type as LlmExerciseType);
  for (const name of requiredPoints) {
    const pt = points[name];
    if (!Array.isArray(pt) || pt.length !== 2 || typeof pt[0] !== "number" || typeof pt[1] !== "number") {
      return `Point ${name} manquant ou invalide dans data.points`;
    }
    if (!Number.isInteger(pt[0]) || !Number.isInteger(pt[1])) {
      return `Coordonnées du point ${name} non entières : [${pt[0]}, ${pt[1]}]`;
    }
    if (Math.abs(pt[0]) > 8 || Math.abs(pt[1]) > 8) {
      return `Coordonnées du point ${name} hors bornes [−8, 8] : [${pt[0]}, ${pt[1]}]`;
    }
  }

  // Vérifier que tous les points sont distincts deux à deux
  const pointEntries = requiredPoints.map((name) => {
    const pt = points[name] as [number, number];
    return { name, pt };
  });
  for (let i = 0; i < pointEntries.length; i++) {
    for (let j = i + 1; j < pointEntries.length; j++) {
      if (
        pointEntries[i].pt[0] === pointEntries[j].pt[0] &&
        pointEntries[i].pt[1] === pointEntries[j].pt[1]
      ) {
        return `Les points ${pointEntries[i].name} et ${pointEntries[j].name} sont confondus`;
      }
    }
  }

  // Pour equation_reduite_2pts, vérifier que A ≠ B (déjà couvert) et que la droite n'est pas verticale
  if (r.exercise_type === "equation_reduite_2pts") {
    const A = points["A"] as [number, number];
    const B = points["B"] as [number, number];
    if (A[0] === B[0]) {
      return "La droite (AB) est verticale — choisis deux points d'abscisses différentes";
    }
  }

  // choices
  if (!Array.isArray(r.choices) || r.choices.length !== 3) {
    return "choices doit être un tableau d'exactement 3 éléments";
  }

  const choices = r.choices as LlmChoice[];
  const ids = choices.map((c) => c.id).sort();
  if (ids[0] !== "A" || ids[1] !== "B" || ids[2] !== "C") {
    return "Les ids des choix doivent être A, B, C (uniques)";
  }

  const correctCount = choices.filter((c) => c.is_correct).length;
  if (correctCount !== 1) {
    return `Exactement un choix doit être correct (${correctCount} trouvé(s))`;
  }

  const correctChoice = choices.find((c) => c.is_correct)!;
  if (correctChoice.id !== r.correct_choice_id) {
    return `correct_choice_id (${String(r.correct_choice_id)}) ne correspond pas au choix marqué is_correct (${correctChoice.id})`;
  }

  for (const c of choices) {
    if (typeof c.latex !== "string" || c.latex.trim().length === 0) {
      return `Choix ${c.id} : latex vide ou invalide`;
    }
    if (typeof c.value !== "string" || c.value.trim().length === 0) {
      return `Choix ${c.id} : value vide ou invalide`;
    }
    if (!c.is_correct) {
      if (!c.misconception_id || typeof c.misconception_id !== "string") {
        return `Choix incorrect ${c.id} : misconception_id manquant`;
      }
      if (!c.indice || typeof c.indice !== "string") {
        return `Choix incorrect ${c.id} : indice manquant`;
      }
      if (!c.correction || typeof c.correction !== "string") {
        return `Choix incorrect ${c.id} : correction manquant`;
      }
    }
  }

  // statement
  if (typeof r.statement !== "string" || r.statement.trim().length === 0) {
    return "statement manquant ou vide";
  }

  // correct_feedback
  if (typeof r.correct_feedback !== "string" || r.correct_feedback.trim().length === 0) {
    return "correct_feedback manquant ou vide";
  }

  // with_figure
  if (typeof r.with_figure !== "boolean") {
    return "with_figure doit être un booléen";
  }

  return r as unknown as LlmResponse;
}

function getRequiredPoints(type: LlmExerciseType): string[] {
  switch (type) {
    case "nature_triangle":
      return ["A", "B", "C"];
    case "est_parallelogramme":
      return ["A", "B", "C", "D"];
    case "quatrieme_sommet":
      return ["A", "B", "C"];
    case "alignement_points":
      return ["A", "B", "K"];
    case "milieu_symetrique":
      return ["A", "B"];
    case "distance_comparaison":
      return ["A", "B"];
    case "equation_reduite_2pts":
      return ["A", "B"];
    case "appartenance_droite":
      return ["K"];
  }
}
