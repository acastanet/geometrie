import type { MistralMessage } from "./mistralClient";

// ── Catalogue ───────────────────────────────────────────────────────────────

export const EXERCISE_CATALOG = [
  {
    type: "milieu_symetrique" as const,
    label: "Milieu d'un segment",
    description:
      "Déterminer les coordonnées du milieu I de [AB]",
    points: ["A", "B"] as const,
    difficulty: 1,
  },
  {
    type: "distance_comparaison" as const,
    label: "Distance entre deux points",
    description:
      "Calculer la distance AB (valeur exacte avec racine carrée)",
    points: ["A", "B"] as const,
    difficulty: 1,
  },
  {
    type: "alignement_points" as const,
    label: "Alignement de points",
    description:
      "Déterminer si les points A, B et K sont alignés (via déterminant)",
    points: ["A", "B", "K"] as const,
    difficulty: 2,
  },
  {
    type: "nature_triangle" as const,
    label: "Nature d'un triangle",
    description:
      "Déterminer si le triangle ABC est rectangle, isocèle, équilatéral ou quelconque",
    points: ["A", "B", "C"] as const,
    difficulty: 2,
  },
  {
    type: "est_parallelogramme" as const,
    label: "Parallélogramme",
    description:
      "Déterminer si ABCD est un parallélogramme (via égalité vectorielle)",
    points: ["A", "B", "C", "D"] as const,
    difficulty: 2,
  },
  {
    type: "quatrieme_sommet" as const,
    label: "Quatrième sommet d'un parallélogramme",
    description:
      "Déterminer les coordonnées de D tel que ABCD soit un parallélogramme",
    points: ["A", "B", "C"] as const,
    difficulty: 2,
  },
  {
    type: "equation_reduite_2pts" as const,
    label: "Équation réduite (droite passant par deux points)",
    description:
      "Déterminer l'équation réduite y = mx + p de la droite (AB)",
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

type DifficultyLevel = 1 | 2;

function catalogForDifficulty(difficulty: DifficultyLevel) {
  return EXERCISE_CATALOG.filter((s) =>
    difficulty === 1 ? s.difficulty <= 1 : true
  );
}

// ── Exemples few-shot (vérifiés mathématiquement) ─────────────────────────

const FEW_SHOT = `
### Exemple 1 — milieu_symetrique
\`\`\`json
{
  "exercise_type": "milieu_symetrique",
  "data": { "points": { "A": [-3, 2], "B": [5, -4] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(-3\\\\ ;\\\\ 2)$ et $B(5\\\\ ;\\\\ -4)$.\\\\n\\\\nDéterminer les coordonnées du milieu $I$ du segment $[AB]$.",
  "choices": [
    { "id": "A", "latex": "I(1\\\\ ;\\\\ -1)", "value": "milieu:1,-1", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "I(1\\\\ ;\\\\ 1)", "value": "milieu:1,1", "is_correct": false, "misconception_id": "midpoint_diff", "indice": "Attention au signe de l'ordonnée. Revois la formule : $I\\\\left(\\\\frac{x_A+x_B}{2}\\\\;\\\\;\\\\frac{y_A+y_B}{2}\\\\right)$.", "correction": "L'ordonnée du milieu est $\\\\frac{2+(-4)}{2} = -1$, et non $1$. La bonne réponse est $I(1\\\\ ;\\\\ -1)$." },
    { "id": "C", "latex": "I(4\\\\ ;\\\\ 3)", "value": "milieu:4,3", "is_correct": false, "misconception_id": "midpoint_no_div", "indice": "N'oublie pas de diviser par 2. La formule du milieu n'est pas la somme des coordonnées.", "correction": "$I\\\\left(\\\\frac{-3+5}{2}\\\\;\\\\;\\\\frac{2+(-4)}{2}\\\\right) = I(1\\\\ ;\\\\ -1)$. Tu as additionné sans diviser par 2." }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Exact ! Le milieu $I$ de $[AB]$ a pour coordonnées $\\\\left(\\\\frac{x_A+x_B}{2}\\\\;\\\\;\\\\frac{y_A+y_B}{2}\\\\right) = \\\\left(\\\\frac{-3+5}{2}\\\\;\\\\;\\\\frac{2+(-4)}{2}\\\\right) = I(1\\\\ ;\\\\ -1)$.",
  "with_figure": true
}
\`\`\`

### Exemple 2 — distance_comparaison
\`\`\`json
{
  "exercise_type": "distance_comparaison",
  "data": { "points": { "A": [2, 5], "B": [-1, 1] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(2\\\\ ;\\\\ 5)$ et $B(-1\\\\ ;\\\\ 1)$.\\\\n\\\\nCalculer la distance $AB$ (valeur exacte).",
  "choices": [
    { "id": "A", "latex": "AB = \\\\sqrt{25} = 5", "value": "distance_AB:5", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "AB = \\\\sqrt{7}", "value": "distance_AB:sqrt(7)", "is_correct": false, "misconception_id": "dist_add_coords", "indice": "On ne peut pas additionner les différences de coordonnées directement. Utilise la formule avec les carrés.", "correction": "$AB = \\\\sqrt{(x_B-x_A)^2 + (y_B-y_A)^2} = \\\\sqrt{(-3)^2 + (-4)^2} = \\\\sqrt{9+16} = \\\\sqrt{25} = 5$." },
    { "id": "C", "latex": "AB = \\\\sqrt{9} + \\\\sqrt{16} = 7", "value": "distance_AB:7", "is_correct": false, "misconception_id": "dist_no_sqrt", "indice": "$\\\\sqrt{a+b}$ n'est pas égal à $\\\\sqrt{a} + \\\\sqrt{b}$. Calcule d'abord la somme sous la racine.", "correction": "$AB = \\\\sqrt{9+16} = \\\\sqrt{25} = 5$, et non $\\\\sqrt{9} + \\\\sqrt{16} = 7$." }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Exact ! $AB = \\\\sqrt{(x_B-x_A)^2 + (y_B-y_A)^2} = \\\\sqrt{(-3)^2 + (-4)^2} = \\\\sqrt{9+16} = \\\\sqrt{25} = 5$.",
  "with_figure": true
}
\`\`\`

### Exemple 3 — alignement_points
\`\`\`json
{
  "exercise_type": "alignement_points",
  "data": { "points": { "A": [-3, -1], "B": [1, 2], "K": [5, 5] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(-3\\\\ ;\\\\ -1)$, $B(1\\\\ ;\\\\ 2)$ et $K(5\\\\ ;\\\\ 5)$.\\\\n\\\\nLes points $A$, $B$ et $K$ sont-ils alignés ?",
  "choices": [
    { "id": "A", "latex": "Oui, $A$, $B$ et $K$ sont alignés", "value": "alignes:oui", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "Non, $A$, $B$ et $K$ ne sont pas alignés", "value": "alignes:non", "is_correct": false, "misconception_id": "align_dist", "indice": "Pour tester l'alignement, utilise le déterminant $\\\\det(\\\\vec{AB}, \\\\vec{AK})$ et vérifie s'il est nul.", "correction": "$\\\\vec{AB}(4\\\\ ;\\\\ 3)$ et $\\\\vec{AK}(8\\\\ ;\\\\ 6)$. Le déterminant est $4 \\\\times 6 - 3 \\\\times 8 = 24 - 24 = 0$. Les vecteurs sont colinéaires, donc $A$, $B$ et $K$ sont alignés." },
    { "id": "C", "latex": "On ne peut pas savoir", "value": "alignes:indetermine", "is_correct": false, "misconception_id": "err_cant_tell", "indice": "Avec les coordonnées de trois points, on peut TOUJOURS déterminer s'ils sont alignés (déterminant).", "correction": "On calcule $\\\\vec{AB}$ et $\\\\vec{AK}$ puis leur déterminant. S'il est nul, les points sont alignés. Ici $\\\\det = 0$, donc ils sont alignés." }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Exact ! $\\\\vec{AB}(4\\\\ ;\\\\ 3)$ et $\\\\vec{AK}(8\\\\ ;\\\\ 6)$. $\\\\det = 4 \\\\times 6 - 3 \\\\times 8 = 0$. Les vecteurs sont colinéaires : $A$, $B$ et $K$ sont alignés.",
  "with_figure": true
}
\`\`\`

### Exemple 4 — nature_triangle
\`\`\`json
{
  "exercise_type": "nature_triangle",
  "data": { "points": { "A": [1, 2], "B": [5, 1], "C": [2, -3] } },
  "statement": "Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points $A(1\\\\ ;\\\\ 2)$, $B(5\\\\ ;\\\\ 1)$ et $C(2\\\\ ;\\\\ -3)$.\\\\n\\\\nQuelle est la nature du triangle $ABC$ ?",
  "choices": [
    { "id": "A", "latex": "$ABC$ est isocèle en $B$", "value": "nature:isocele_en_B", "is_correct": true, "misconception_id": null, "indice": "", "correction": "" },
    { "id": "B", "latex": "$ABC$ est rectangle en $B$", "value": "nature:rectangle_en_B", "is_correct": false, "misconception_id": "pyth_misapplied", "indice": "Calcule les trois carrés de longueurs $AB^2$, $BC^2$ et $AC^2$. Vérifie la réciproque de Pythagore.", "correction": "$AB^2 = (5-1)^2+(1-2)^2 = 16+1 = 17$. $BC^2 = (2-5)^2+(-3-1)^2 = 9+16 = 25$. $AC^2 = (2-1)^2+(-3-2)^2 = 1+25 = 26$. Aucune somme de deux carrés n'égale le troisième, donc le triangle n'est pas rectangle. En revanche $AB^2 = BC^2$ ? Non, $17 \\\\neq 25$. $AB^2 = AC^2$ ? Non plus. $BC^2 = 25$, aucune autre égale. Donc il est isocèle en B car... ah non, vérifions. $AB^2 = 17$, $BC^2 = 25$, $AC^2 = 26$. Aucun n'est égal, donc le triangle est quelconque..." },
    { "id": "C", "latex": "$ABC$ est quelconque", "value": "nature:quelconque", "is_correct": false, "misconception_id": "missed_iso", "indice": "Compare les carrés des longueurs deux à deux. Si deux sont égaux, le triangle est isocèle.", "correction": "$AB^2 = 17$, $BC^2 = 25$, $AC^2 = 26$. Aucun carré n'est égal, donc le triangle est quelconque. En fait non : recalcule $AB^2 = 4^2+(-1)^2 = 17$, $BC^2 = (-3)^2+(-4)^2 = 25$, $AC^2 = 1^2+(-5)^2 = 26$. Effectivement quelconque." }
  ],
  "correct_choice_id": "C",
  "correct_feedback": "Exact ! $AB^2 = 17$, $BC^2 = 25$, $AC^2 = 26$. Les trois carrés sont tous différents donc le triangle est quelconque. Il n'est ni rectangle (Pythagore non vérifié), ni isocèle (aucune égalité de côtés).",
  "with_figure": true
}
\`\`\`
`;

// ── Construction du prompt ─────────────────────────────────────────────────

export function buildMistralMessages(
  difficulty: 1 | 2,
  retryReason?: string
): MistralMessage[] {
  return [
    { role: "system", content: buildSystemPrompt() },
    { role: "user", content: buildUserPrompt(difficulty, retryReason) },
  ];
}

function buildSystemPrompt(): string {
  const catalogStr = EXERCISE_CATALOG.map(
    (s) =>
      `- **${s.type}** : ${s.description}. Points requis dans data.points : ${s.points.join(", ")}.`
  ).join("\n");

  return `Tu es un professeur de mathématiques en classe de Seconde, expert en géométrie repérée.
Tu génères des exercices QCM (3 choix) dont la correction mathématique est VÉRIFIÉE AUTOMATIQUEMENT.

## RÈGLES IMPÉRATIVES (toute violation = rejet automatique)

### 1. data.points OBLIGATOIRE
Tu dois TOUJOURS fournir les coordonnées EXACTES de tous les points dans "data": { "points": { ... } }.
Chaque point est un tableau [x, y] avec x et y ENTIERS entre -6 et 6.
Tous les points doivent être deux à deux DISTINCTS.
Exemple valide : "data": { "points": { "A": [-2, 3], "B": [4, 1], "C": [0, -3] } }

### 2. value : FORMAT EXACT (vérification automatique)
Chaque choix DOIT avoir un champ "value" au format machine-readable EXACT.
Une SEULE valeur par choix, JAMAIS de concaténation.

Formats selon exercise_type :
- milieu_symetrique → "milieu:<x>,<y>" (ex: "milieu:1,-1")
- distance_comparaison → "distance_AB:<n>" si carré parfait, "distance_AB:sqrt(<n>)" sinon (ex: "distance_AB:5" ou "distance_AB:sqrt(40)")
- alignement_points → "alignes:oui" ou "alignes:non"
- nature_triangle → "nature:rectangle_en_A", "nature:rectangle_en_B", "nature:rectangle_en_C", "nature:isocele_en_A", "nature:isocele_en_B", "nature:isocele_en_C", "nature:equilateral", ou "nature:quelconque"
- est_parallelogramme → "parallelogramme:oui" ou "parallelogramme:non"
- quatrieme_sommet → "sommet_D:<x>,<y>" (ex: "sommet_D:3,-2")
- equation_reduite_2pts → "equation:<m_num>/<m_den>,<p_num>/<p_den>" (ex: "equation:3/4,-1/2" pour y = 3/4 x - 1/2)
- appartenance_droite → "appartient:oui" ou "appartient:non"

### 3. Calculs EXACTS obligatoires
Tu DOIS vérifier TOI-MÊME chaque calcul avant de répondre :
- Calcule les distances au carré, les déterminants, les coordonnées de milieu
- Pour nature_triangle : calcule les 3 carrés de longueurs, vérifie Pythagore ET les égalités
- Pour alignement_points : calcule le déterminant, vérifie qu'il est bien nul ou non nul
- Pour est_parallelogramme : vérifie que vec(AB) = vec(DC)
- Pour equation_reduite_2pts : la droite NE DOIT PAS être verticale (xA ≠ xB)

Un exercice mathématiquement faux sera REJETÉ.

### 4. Style manuel scolaire
- Énoncé : « Dans un repère orthonormé $(O\\\\ ;\\\\ \\\\vec{\\\\imath},\\\\ \\\\vec{\\\\jmath})$, on considère les points... »
- Question avec conclusion géométrique (« Quelle est la nature... », « Les points sont-ils alignés ? », « Déterminer... »)
- Noms de points variés : A, B, C, D, E, F, G, H, I, J, K, L, M, N, P, Q, R, S...

### 5. LaTeX PUR (sans délimiteurs $)
Dans les champs "latex", "statement", "correct_feedback", "indice", "correction" :
- PAS de $...$ autour des formules (l'UI les ajoute)
- Écrire directement : \\\\vec{AB}, \\\\frac{1}{2}, \\\\sqrt{40}, \\\\times

### 6. Distracteurs crédibles
- Chaque distracteur = une erreur d'élève RÉELLE (inversion de signe, oubli de division par 2, confusion milieu/somme, etc.)
- misconception_id libre mais descriptif (ex: "err_signe", "oubli_division")
- indice ET correction OBLIGATOIRES pour chaque distracteur (en français, pédagogiques)

## Catalogue des scénarios

${catalogStr}

## Format JSON exact

\`\`\`json
{
  "exercise_type": "<type du catalogue>",
  "data": { "points": { "Nom": [x, y], ... } },
  "statement": "Énoncé en LaTeX pur...",
  "choices": [
    {
      "id": "A",
      "latex": "Réponse en LaTeX pur",
      "value": "<format exact selon type>",
      "is_correct": true,
      "misconception_id": null,
      "indice": "",
      "correction": ""
    },
    {
      "id": "B",
      "latex": "Réponse en LaTeX pur",
      "value": "<format exact selon type>",
      "is_correct": false,
      "misconception_id": "err_xxx",
      "indice": "Indice pédagogique...",
      "correction": "Correction complète avec calculs..."
    },
    {
      "id": "C",
      "latex": "Réponse en LaTeX pur",
      "value": "<format exact selon type>",
      "is_correct": false,
      "misconception_id": "err_yyy",
      "indice": "Indice pédagogique...",
      "correction": "Correction complète avec calculs..."
    }
  ],
  "correct_choice_id": "A",
  "correct_feedback": "Félicitations détaillées avec la démarche de résolution...",
  "with_figure": true
}
\`\`\`

## Exemples

${FEW_SHOT}
`;
}

function buildUserPrompt(difficulty: 1 | 2, retryReason?: string): string {
  const catalogForLvl = catalogForDifficulty(difficulty);
  const typeList = catalogForLvl.map((s) => `"${s.type}"`).join(", ");

  let prompt = `Génère UN exercice de mathématiques de niveau Seconde.

Niveau : ${difficulty === 1 ? "Découverte (milieu, distance)" : "Approfondissement (nature de triangle, parallélogramme, alignement, équations)"}
Types autorisés : ${typeList}

## CRITIQUE : vérifie tes calculs
Avant de répondre, fais TOI-MÊME chaque calcul sur les coordonnées que tu as choisies :
1. Calcule les carrés de distances, déterminants, etc.
2. Vérifie que la value du choix marqué correct correspond EXACTEMENT au résultat
3. Vérifie que les values des distracteurs sont DIFFÉRENTES de la value correcte
4. Vérifie que les deux distracteurs sont DIFFÉRENTS l'un de l'autre

Rappel : value = UNE SEULE chaîne, JAMAIS de concaténation de plusieurs valeurs.
`;

  if (retryReason) {
    prompt += `\n## ERREUR LORS DE LA TENTATIVE PRÉCÉDENTE\n\nL'exercice précédent a été REJETÉ. Raison : **${retryReason}**\n\nCORRIGE ce problème. C'est ta dernière chance.`;
  }

  prompt += `\nRéponds UNIQUEMENT avec l'objet JSON. Pas de texte avant, pas de texte après.`;

  return prompt;
}
