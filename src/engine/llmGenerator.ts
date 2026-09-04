import { v4 as uuidv4 } from "uuid";
import type { Exercise, Choice, ChoiceId } from "../types/exercise";
import type { StatementFigure } from "../types/exercise";

/**
 * Structure de la réponse serveur après validation,
 * mélange des choix et construction de la figure.
 */
interface LlmServerResponse {
  exercise_type: string;
  data: { points: Record<string, [number, number]>; [key: string]: unknown };
  statement: string;
  choices: LlmServerChoice[];
  correct_choice_id: string;
  correct_feedback: string;
  statement_figure: StatementFigure | null;
}

interface LlmServerChoice {
  id: string;
  latex: string;
  value: string;
  is_correct: boolean;
  misconception_id: string | null;
  indice: string;
  correction: string;
}

/**
 * Appelle le serveur Express pour générer un exercice via Mistral AI.
 *
 * @param seed Graine de génération (reproductibilité approximative)
 * @param difficulty 1 = Découverte, 2 = Approfondissement
 * @param signal Signal d'annulation (AbortController)
 * @returns Un Exercise complet, prêt à être affiché
 */
export async function generateLlmExercise(
  seed: number,
  difficulty: 1 | 2,
  signal?: AbortSignal
): Promise<Exercise> {
  const resp = await fetch("/mimo/api/generate", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ seed, difficulty }),
    signal,
  });

  if (!resp.ok) {
    const body = await resp.json().catch(() => ({}));
    throw new Error(
      (body as { error?: string }).error ??
        `Erreur serveur ${resp.status}`
    );
  }

  const data = (await resp.json()) as LlmServerResponse;

  return mapToExercise(data, seed, difficulty);
}

/** Mappe la réponse serveur validée en Exercise complet */
function mapToExercise(
  data: LlmServerResponse,
  seed: number,
  difficulty: 1 | 2
): Exercise {
  const choices: Choice[] = data.choices.map((c) => ({
    choice_id: c.id as ChoiceId,
    is_correct: c.is_correct,
    misconception_id: c.misconception_id,
    construction_commands: [],
    latex: c.latex,
    feedback_indice: c.is_correct ? undefined : c.indice,
    feedback_correction: c.is_correct ? undefined : c.correction,
  }));

  return {
    exercise_id: uuidv4(),
    seed,
    template_id: `llm_${data.exercise_type}`,
    difficulty,
    concept: "ia",
    statement: data.statement,
    choices,
    correct_choice_id: data.correct_choice_id as ChoiceId,
    choice_type: "text",
    params: {},
    coord_system: data.statement_figure?.coord_system ?? [-5, 5, -5, 5],
    appName: data.exercise_type === "est_parallelogramme" ? "geometry" : "graphing",
    statement_figure: data.statement_figure ?? undefined,
    correct_feedback: data.correct_feedback,
  };
}
