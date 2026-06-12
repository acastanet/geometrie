export type ChoiceId = "A" | "B" | "C";
export type Concept = "equation_droite" | "cercle" | "pythagore" | "thales";

export interface Choice {
  choice_id: ChoiceId;
  is_correct: boolean;
  misconception_id: string | null;
  construction_commands: string[];
}

export type FeedbackType = "correct_1" | "wrong_1" | "correct_2" | "wrong_2";

export interface FeedbackState {
  type: FeedbackType;
  message: string;
}

export interface Exercise {
  exercise_id: string;
  seed: number;
  template_id: string;
  difficulty: 1 | 2;
  concept: Concept;
  statement: string;
  choices: Choice[];
  correct_choice_id: ChoiceId;
  /** Paramètres pour instancier les templates de feedback */
  params: Record<string, number | string>;
  /** Système de coordonnées GeoGebra [xMin, xMax, yMin, yMax] */
  coord_system: [number, number, number, number];
  /** App GeoGebra : "graphing" (défaut) ou "geometry" */
  appName?: string;
}
