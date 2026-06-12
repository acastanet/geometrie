export type ChoiceId = "A" | "B" | "C";

/** Concepts du programme de Seconde (BO 2019, partie géométrie) */
export type Concept =
  | "geometrie_repere"
  | "vecteurs"
  | "equation_droite"
  | "positions_relatives"
  | "ia";

/** Type de rendu des choix : figure GeoGebra ou texte LaTeX */
export type ChoiceType = "figure" | "text";

export interface Choice {
  choice_id: ChoiceId;
  is_correct: boolean;
  misconception_id: string | null;
  /** Commandes GeoGebra (utilisé si l'exercice est de type "figure"). [] sinon. */
  construction_commands: string[];
  /** Contenu LaTeX (sans délimiteurs $). Utilisé si l'exercice est de type "text". */
  latex?: string;
  /** Feedback inline (LLM), prioritaire sur le registre statique — indice */
  feedback_indice?: string;
  /** Feedback inline (LLM), prioritaire sur le registre statique — correction */
  feedback_correction?: string;
}

export type FeedbackType =
  | "correct_1"
  | "wrong_1"
  | "correct_2"
  | "wrong_2";

export interface FeedbackState {
  type: FeedbackType;
  message: string;
}

/** Figure unique affichée dans l'énoncé (ex. lecture graphique) */
export interface StatementFigure {
  commands: string[];
  coord_system: [number, number, number, number];
  appName?: string;
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
  /** Type de rendu des choix : "figure" (GeoGebra) ou "text" (LaTeX) */
  choice_type: ChoiceType;
  /** Paramètres pour instancier les templates de feedback */
  params: Record<string, number | string>;
  /** Système de coordonnées GeoGebra [xMin, xMax, yMin, yMax] */
  coord_system: [number, number, number, number];
  /** App GeoGebra : "graphing" (défaut) ou "geometry" */
  appName?: string;
  /** Figure unique affichée dans l'énoncé (ex. lecture graphique d'une droite) */
  statement_figure?: StatementFigure;
  /** Feedback de réussite inline (LLM), prioritaire sur le switch statique */
  correct_feedback?: string;
}
