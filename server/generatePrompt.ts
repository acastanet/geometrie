import type { MistralMessage } from "./mistralClient";

/**
 * Catalogue des scénarios d'exercices — tous vérifiables mathématiquement.
 *
 * Chaque scénario correspond à un type d'exercice classique
 * des manuels de Seconde en géométrie repérée.
 */
export const EXERCISE_CATALOG = [
  {
    type: "nature_triangle" as const,
    label: "Nature d'un triangle",
    description:
      "Déterminer si le triangle ABC est rectangle, isocèle ou quelconque",
    points: ["A", "B", "C"] as const,
    difficulty: 2,
  },
  {
    type: "est_parallelogramme" as const,
    label: "Parallélogramme",
    description: "Déterminer si ABCD est un parallélogramme",
    points: ["A", "B", "C", "D"] as const,
    difficulty: 2,
  },
  {
    type: "quatrieme_sommet" as const,
    label: "Quatrième sommet d'un parallélogramme",
    description: "Déterminer les coordonnées de D tel que ABCD soit un parallélogramme",
    points: ["A", "B", "C"] as const,
    difficulty: 2,
  },
  {
    type: "alignement_points" as const,
    label: "Alignement de points",
    description: "Déterminer si les points A, B et K sont alignés",
    points: ["A", "B", "K"] as const,
    difficulty: 2,
  },
  {
    type: "milieu_symetrique" as const,
    label: "Milieu / Symétrique",
    description:
      "Déterminer les coordonnées du milieu de [AB] ou du symétrique de A par rapport à I",
    points: ["A", "B"] as const,
    difficulty: 1,
  },
  {
    type: "distance_comparaison" as const,
    label: "Distance / Comparaison",
    description:
      "Calculer la distance AB ou comparer des distances entre points",
    points: ["A", "B"] as const,
    difficulty: 1,
  },
  {
    type: "equation_reduite_2pts" as const,
    label: "Équation réduite d'une droite passant par deux points",
    description: "Déterminer l'équation réduite de la droite (AB)",
    points: ["A", "B"] as const,
    difficulty: 2,
  },
  {
    type: "appartenance_droite" as const,
    label: "Appartenance d'un point à une droite",
    description:
      "Déterminer si un point K appartient à une droite d'équation donnée",
    points: ["K"] as const,
    difficulty: 1,
  },
] as const;

export type LlmExerciseType = (typeof EXERCISE_CATALOG)[number]["type"];

/** Niveaux de difficulté filtrant le catalogue */
type DifficultyLevel = 1 | 2;

function catalogForDifficulty(difficulty: DifficultyLevel) {
  return EXERCISE_CATALOG.filter((s) =>
    difficulty === 1 ? s.difficulty <= 1 : true
  );
}

// ── Exemples few-shot (style manuel Sésamath) ──────────────────────────────

const FEW_SHOT_EXAMPLES = `
### Exemple 1 (niveau Découverte — milieu)
\`\`\`json
{
  "exercise_type": "milieu_symetrique",
  "data": { "points": { "A": [-3, 2], "B": [5, -4] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(-3\\\\ ;\\\\ 2)$ et $B(5\\\\ ;\\\\ -4)$.\\\\n\\\\nDéterminer les coordonnées du milieu $I$ du segment $[AB]$.",
  "choices": [
    { "id": "A", "latex": "I(1\\\\ ;\\\\ -1)", "value": "milieu:1,-1", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "I(1\\\\ ;\\\\ 1)", "value": "milieu:1,1", "is_correct": false, "misconception_id": "midpoint_difference", "indice": "Attention au signe de l'ordonnée. Revois la formule : $I\\\\left(\\\\frac{x_A+x_B}{2}\\\\;\\\\;\\\\frac{y_A+y_B}{2}\\\\right)$.", "correction": "L'ordonnée du milieu est $\\\\frac{y_A+y_B}{2} = \\\\frac{2+(-4)}{2} = \\\\frac{-2}{2} = -1$, et non $1$. La bonne réponse est $I(1\\\\ ;\\\\ -1)$." },
    { "id": "C", "latex": "I(4\\\\ ;\\\\ 3)", "value": "milieu:4,3", "is_correct": false, "misconception_id": "midpoint_no_half", "indice": "N'oublie pas de diviser par 2. La formule du milieu n'est pas la somme des coordonnées.", "correction": "On a $I\\\\left(\\\\frac{-3+5}{2}\\\\;\\\\;\\\\frac{2+(-4)}{2}\\\\right) = I(1\\\\ ;\\\\ -1)$. Tu as utilisé la somme sans diviser par 2." }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Exact ! Le milieu $I$ de $[AB]$ a pour coordonnées $\\\\left(\\\\frac{x_A+x_B}{2}\\\\;\\\\;\\\\frac{y_A+y_B}{2}\\\\right) = \\\\left(\\\\frac{-3+5}{2}\\\\;\\\\;\\\\frac{2+(-4)}{2}\\\\right) = I(1\\\\ ;\\\\ -1)$.",
  "with_figure": true
}
\`\`\`

### Exemple 2 (niveau Approfondissement — nature du triangle)
\`\`\`json
{
  "exercise_type": "nature_triangle",
  "data": { "points": { "A": [-2, 3], "B": [4, 1], "C": [0, -3] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(-2\\\\ ;\\\\ 3)$, $B(4\\\\ ;\\\\ 1)$ et $C(0\\\\ ;\\\\ -3)$.\\\\n\\\\nQuelle est la nature du triangle $ABC$ ?",
  "choices": [
    { "id": "A", "latex": "Le triangle $ABC$ est rectangle en $B$", "value": "nature:rectangle_en_B", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "Le triangle $ABC$ est isocèle en $A$", "value": "nature:isocele_en_A", "is_correct": false, "misconception_id": "dist_no_sqrt", "indice": "Calcule les trois longueurs $AB$, $BC$ et $AC$ (ou leurs carrés) et compare-les.", "correction": "$AB^2 = (-2-4)^2 + (3-1)^2 = 36 + 4 = 40$, $BC^2 = (4-0)^2 + (1-(-3))^2 = 16 + 16 = 32$, $AC^2 = (-2-0)^2 + (3-(-3))^2 = 4 + 36 = 40$. On a $AB^2 = AC^2$ donc $AB = AC$ : le triangle est isocèle en $A$. Mais on a aussi $AB^2 + BC^2 = 40 + 32 = 72 \\\\neq 40 = AC^2$. Donc il n'est pas rectangle. En réalité, vérifions $BC^2 + AC^2 = 32 + 40 = 72 \\\\neq 40 = AB^2$ non plus, et $AB^2 + AC^2 = 80 \\\\neq BC^2$. Le triangle est isocèle en A, pas rectangle." },
    { "id": "C", "latex": "Le triangle $ABC$ est quelconque", "value": "nature:quelconque", "is_correct": false, "misconception_id": "dist_add_coords", "indice": "Calcule $AB^2$, $BC^2$ et $AC^2$ séparément. Si deux carrés sont égaux, le triangle est isocèle.", "correction": "$AB^2 = 40$, $BC^2 = 32$, $AC^2 = 40$. Puisque $AB^2 = AC^2$, on a $AB = AC$ : le triangle est isocèle en $A$, pas quelconque." }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Exact ! $AB^2 = 40$, $BC^2 = 32$, $AC^2 = 40$. On a $AB^2 + BC^2 = 72 \\\\neq 40 = AC^2$ donc le triangle n'est pas rectangle. En revanche $AB^2 = AC^2$ donc $AB = AC$ : le triangle est isocèle en $A$. En réalité, vérifions la propriété de Pythagore avec le bon sommet : $AB^2 + BC^2 = 40 + 32 = 72 \\\\neq 40$ — non. $BC^2 + AC^2 = 32 + 40 = 72 \\\\neq 40$ — non. $AB^2 + AC^2 = 80 \\\\neq 32$ — non. Donc le triangle n'est pas rectangle. Il est isocèle en A.",
  "with_figure": true
}
\`\`\`

### Exemple 3 (niveau Approfondissement — alignement)
\`\`\`json
{
  "exercise_type": "alignement_points",
  "data": { "points": { "A": [-3, -1], "B": [1, 2], "K": [5, 5] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(-3\\\\ ;\\\\ -1)$, $B(1\\\\ ;\\\\ 2)$ et $K(5\\\\ ;\\\\ 5)$.\\\\n\\\\nLes points $A$, $B$ et $K$ sont-ils alignés ?",
  "choices": [
    { "id": "A", "latex": "Oui, les points $A$, $B$ et $K$ sont alignés", "value": "alignes:oui", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "Non, les points $A$, $B$ et $K$ ne sont pas alignés", "value": "alignes:non", "is_correct": false, "misconception_id": "align_uses_distance", "indice": "Pour tester l'alignement, utilise le déterminant des vecteurs $\\\\vec{AB}$ et $\\\\vec{AK}$ (ou $\\\\vec{AB}$ et $\\\\vec{BK}$).", "correction": "$\\\\vec{AB}(4\\\\ ;\\\\ 3)$ et $\\\\vec{BK}(4\\\\ ;\\\\ 3)$. Le déterminant est $4 \\\\times 3 - 4 \\\\times 3 = 0$. Les vecteurs sont colinéaires, donc $A$, $B$ et $K$ sont alignés." },
    { "id": "C", "latex": "On ne peut pas savoir avec ces informations", "value": "alignes:indetermine", "is_correct": false, "misconception_id": "err_indetermine", "indice": "Avec les coordonnées de trois points, on peut toujours tester l'alignement via le déterminant.", "correction": "On peut toujours déterminer si trois points sont alignés avec leurs coordonnées. Il suffit de calculer $\\\\vec{AB}$ et $\\\\vec{AK}$ et de vérifier la colinéarité." }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Exact ! $\\\\vec{AB}(4\\\\ ;\\\\ 3)$ et $\\\\vec{BK}(4\\\\ ;\\\\ 3)$. Les deux vecteurs sont égaux donc colinéaires : $A$, $B$ et $K$ sont alignés.",
  "with_figure": true
}
\`\`\`
`;

// ── Construction du prompt ─────────────────────────────────────────────────

/**
 * Construit le system prompt et le user prompt pour l'API Mistral.
 *
 * @param difficulty 1 = Découverte, 2 = Approfondissement
 * @param retryReason Raison de l'échec précédent (si retry), injectée dans le user prompt
 */
export function buildMistralMessages(
  difficulty: 1 | 2,
  retryReason?: string
): MistralMessage[] {
  const systemPrompt = buildSystemPrompt();
  const userPrompt = buildUserPrompt(difficulty, retryReason);

  return [
    { role: "system", content: systemPrompt },
    { role: "user", content: userPrompt },
  ];
}

function buildSystemPrompt(): string {
  const catalogStr = catalogForDifficulty(2)
    .map(
      (s) =>
        `- **${s.type}** : ${s.description}. Points nécessaires : ${s.points.join(", ")}.`
    )
    .join("\n");

  return `Tu es un professeur de mathématiques en classe de Seconde, expert en géométrie repérée.
Tu crées des exercices de type QCM (3 choix) conformes au programme français.

## Règles impératives

1. **Catalogue fermé** : tu dois choisir un exercise_type parmi la liste ci-dessous et fournir TOUTES les données numériques nécessaires. Ne propose JAMAIS de type hors catalogue.
2. **Coordonnées** : entières, comprises entre −6 et 6. Tous les points fournis doivent être deux à deux distincts.
3. **Style manuel scolaire** : l'énoncé doit commencer par « Dans un repère orthonormé $(O\\ ;\\ \\vec{\\imath},\\ \\vec{\\jmath})$… » (ou variante) et poser une question de conclusion géométrique. Noms de points variés (A, B, C, D, E, F, G, H, I, J, K, L, M, N, P, Q, R, S…).
4. **LaTeX** : ne JAMAIS utiliser de délimiteurs $ dans les champs latex (ils sont ajoutés par l'UI). Le LaTeX doit être pur : \\\\vec{AB}, \\\\frac{1}{2}, \\\\sqrt{40}, etc.
5. **Format JSON** : respecte EXACTEMENT la structure ci-dessous.
6. **Distracteurs crédibles** : chaque choix incorrect doit correspondre à une erreur d'élève classique (inversion de signe, oubli de diviser par 2, confusion milieu/somme…).

## Catalogue des scénarios

${catalogStr}

## Format JSON attendu

\`\`\`json
{
  "exercise_type": "<un des types du catalogue>",
  "data": { "points": { "A": [x, y], "B": [x, y], ... } },
  "statement": "Énoncé en LaTeX pur...",
  "choices": [
    {
      "id": "A",
      "latex": "Réponse A en LaTeX pur",
      "value": "<forme canonique machine-readable>",
      "is_correct": true,
      "misconception_id": null,
      "indice": "",
      "correction": ""
    },
    {
      "id": "B",
      "latex": "Réponse B en LaTeX pur",
      "value": "<forme canonique machine-readable>",
      "is_correct": false,
      "misconception_id": "err_xxx",
      "indice": "Indice pédagogique en français...",
      "correction": "Correction complète en français..."
    },
    {
      "id": "C",
      "latex": "Réponse C en LaTeX pur",
      "value": "<forme canonique machine-readable>",
      "is_correct": false,
      "misconception_id": "err_yyy",
      "indice": "Indice pédagogique en français...",
      "correction": "Correction complète en français..."
    }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Message de félicitations détaillé avec la démarche de résolution en LaTeX...",
  "with_figure": true
}
\`\`\`

## Format des champs "value" (IMPORTANT — utilisé pour la vérification automatique)

La valeur machine-readable doit respecter EXACTEMENT l'un de ces formats :
- **milieu_symetrique** : "milieu:<x>,<y>" ou "symetrique:<x>,<y>"
- **distance_comparaison** : "distance_AB:sqrt(<n>)" où n est un entier (ex: "distance_AB:sqrt(40)")
- **nature_triangle** : "nature:<verdict>" où verdict ∈ {rectangle_en_A, rectangle_en_B, rectangle_en_C, isocele_en_A, isocele_en_B, isocele_en_C, equilateral, quelconque}
- **est_parallelogramme** : "parallelogramme:<oui|non>"
- **quatrieme_sommet** : "sommet_D:<x>,<y>"
- **alignement_points** : "alignes:<oui|non>"
- **equation_reduite_2pts** : "equation:<m_num>/<m_den>,<p_num>/<p_den>" (fractions irréductibles, ex: "equation:3/4,-1/2" pour y = 3/4 x - 1/2)
- **appartenance_droite** : "appartient:<oui|non>"

## Exemples (few-shot)

${FEW_SHOT_EXAMPLES}
`;
}

function buildUserPrompt(
  difficulty: 1 | 2,
  retryReason?: string
): string {
  const catalogForLvl = catalogForDifficulty(difficulty);
  const typeList = catalogForLvl.map((s) => `"${s.type}"`).join(", ");

  let prompt = `Génère un exercice de mathématiques de niveau Seconde.

Niveau : ${difficulty === 1 ? "Découverte (milieu, distance, coordonnées)" : "Approfondissement (nature de triangle, parallélogramme, alignement, équations)"}

## Contraintes spécifiques

- Choisis un exercise_type parmi : ${typeList}
- Assure-toi que la réponse marquée correcte est mathématiquement juste (vérification automatique côté serveur)
- Les deux distracteurs doivent représenter des erreurs d'élèves crédibles
- Sois créatif dans le choix des noms de points et de l'habillage, mais GARDE LE STYLE MANUEL SCOLAIRE
- L'énoncé doit être rédigé en français naturel, comme dans un vrai manuel (Sésamath, Hyperbole, etc.)
`;

  if (retryReason) {
    prompt += `\n## ATTENTION — Tentative précédente rejetée\n\nL'exercice précédent a été rejeté pour la raison suivante : **${retryReason}**\n\nCorrige ce problème impérativement.`;
  }

  prompt += `\nRéponds UNIQUEMENT avec l'objet JSON. Pas de texte avant ou après.`;

  return prompt;
}
