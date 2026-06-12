import type { Exercise, Concept } from "../types/exercise";
import { generateExercise } from "./exerciseGenerator";
import { generateCoordinateGeometryExercise } from "./coordinateGeometryGenerator";
import { generateVectorExercise } from "./vectorGenerator";
import { generateRelativePositionExercise } from "./relativePositionGenerator";
import { generateLlmExercise } from "./llmGenerator";

/**
 * Génération synchrone pour les concepts algorithmiques (hors "ia").
 * Le switch est exhaustif — pas de default nécessaire.
 */
export function generateExerciseForTopic(
  concept: Exclude<Concept, "ia">,
  difficulty: 1 | 2,
  seed: number
): Exercise {
  switch (concept) {
    case "equation_droite":
      return generateExercise(seed, difficulty);
    case "geometrie_repere":
      return generateCoordinateGeometryExercise(seed, difficulty);
    case "vecteurs":
      return generateVectorExercise(seed, difficulty);
    case "positions_relatives":
      return generateRelativePositionExercise(seed, difficulty);
  }
}

/**
 * Génération unifiée (sync ou async selon le concept).
 * Le concept "ia" passe par le backend Express + Mistral.
 */
export function generateExerciseForTopicAsync(
  concept: Concept,
  difficulty: 1 | 2,
  seed: number,
  signal?: AbortSignal
): Promise<Exercise> {
  if (concept === "ia") return generateLlmExercise(seed, difficulty, signal);
  return Promise.resolve(
    generateExerciseForTopic(concept, difficulty, seed)
  );
}

/**
 * Retourne le feedback de réussite, avec LaTeX quand pertinent.
 * Le template_id permet de distinguer les sous-types d'exercice.
 */
export function getCorrectFeedbackForConcept(
  concept: Concept,
  params: Record<string, number | string>,
  templateId: string,
  attemptCount: 1 | 2
): string {
  if (attemptCount === 2) return "Bonne réponse au deuxième essai. Continue comme ça !";

  switch (concept) {
    // ── Équations de droites ──────────────────────────────────────────────
    case "equation_droite":
      if (templateId === "droite_figure" || templateId === "lecture_graphique") {
        const a = Number(params.a);
        const b = Number(params.b);
        const dir = a < 0 ? "décroissante" : "croissante";
        const pos = b > 0 ? "au-dessus de l'origine" : "en dessous de l'origine";
        return `Exact ! Le coefficient directeur est $a = ${a}$ (droite ${dir}) et l'ordonnée à l'origine est $b = ${b}$ — la droite coupe l'axe des ordonnées ${pos}.`;
      }
      if (templateId === "cart_to_reduite") {
        const m = String(params.m_latex);
        const p = String(params.p_latex);
        return `Exact ! L'équation réduite est $y = ${m}${p}$.`;
      }
      if (templateId === "vecteur_directeur") {
        return `Exact ! Un vecteur directeur est $\\vec{u}(-b\\ ;\\ a) = (${params.vx}\\ ;\\ ${params.vy})$.`;
      }
      return "Exact ! Bonne réponse.";

    // ── Géométrie repérée ─────────────────────────────────────────────────
    case "geometrie_repere":
      if (templateId === "distance_points") {
        return `Exact ! $AB = \\sqrt{(${params.xB} - ${params.xA})^2 + (${params.yB} - ${params.yA})^2} = ${params.AB_latex}$.`;
      }
      if (templateId === "milieu_segment") {
        return `Exact ! $I\\left(\\frac{${params.xA}+${params.xB}}{2}\\ ;\\ \\frac{${params.yA}+${params.yB}}{2}\\right) = I(${params.mx_latex}\\ ;\\ ${params.my_latex})$.`;
      }
      if (templateId === "rayon_cercle") {
        return `Exact ! Le rayon est la distance $AB = ${params.AB_latex}$.`;
      }
      if (templateId === "projete_orthogonal") {
        return `Exact ! Le projeté orthogonal conserve la coordonnée de l'axe sur lequel on projette et annule l'autre.`;
      }
      return "Exact ! Bonne réponse.";

    // ── Vecteurs ──────────────────────────────────────────────────────────
    case "vecteurs":
      if (templateId === "vecteur_coords") {
        return `Exact ! $\\vec{AB}\\ (${params.xB} - ${params.xA}\\ ;\\ ${params.yB} - ${params.yA}) = (${params.vx}\\ ;\\ ${params.vy})$.`;
      }
      if (templateId === "somme_vecteurs") {
        return params.sum_x !== undefined
          ? `Exact ! $\\vec{u}+\\vec{v}\\ (${params.sum_x}\\ ;\\ ${params.sum_y})$.`
          : "Exact ! Par la relation de Chasles, $\\vec{AB} + \\vec{BC} = \\vec{AC}$.";
      }
      if (templateId === "colinearite_det") {
        return `Exact ! Le déterminant est $xy' - x'y = ${params.det}$. Les vecteurs sont ${params.verdict_colin}.`;
      }
      if (templateId === "alignement_points") {
        return `Exact ! $\\det(\\vec{AB},\\vec{AC}) = ${params.det}$. Les points $A$, $B$ et $C$ sont ${params.verdict}.`;
      }
      return "Exact ! Bonne réponse.";

    // ── Positions relatives ───────────────────────────────────────────────
    case "positions_relatives":
      if (templateId === "parallele_ou_secante") {
        return `Exact ! ${params.m1 === params.m2 ? `Les droites ont le même coefficient directeur $m = ${params.m1}$, elles sont donc parallèles.` : `Les droites ont des coefficients directeurs différents ($m_1 = ${params.m1}$, $m_2 = ${params.m2}$), elles sont donc sécantes.`}`;
      }
      if (templateId === "point_intersection") {
        return `Exact ! Le point d'intersection est $I(${params.x0}\\ ;\\ ${params.y0})$.`;
      }
      return "Exact ! Bonne réponse.";

    // ── IA ────────────────────────────────────────────────────────────────
    case "ia":
      return "Exact ! Bonne réponse.";
  }
}
