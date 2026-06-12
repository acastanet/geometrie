import type { MisconceptionId, MisconceptionEntry } from "../types/misconception";

export const SLOPE_DOMAIN = [-3, -2, -1, -0.5, 0.5, 1, 2, 3] as const;
export const INTERCEPT_DOMAIN = [-4, -3, -2, -1, 1, 2, 3, 4] as const;

export const MISCONCEPTION_REGISTRY: Record<MisconceptionId, MisconceptionEntry> = {
  // ── Droites affines ────────────────────────────────────────────────────────
  slope_sign_confusion: {
    indice:
      "Observe le sens de variation de la droite que tu as choisie. Compare-le avec le signe du coefficient dans l'équation.",
    correction:
      "Tu as confondu le signe du coefficient directeur. Un coefficient négatif ({a}) donne une droite décroissante (elle descend quand x augmente).",
  },
  intercept_sign_confusion: {
    indice:
      "Regarde en quel point la droite que tu as choisie coupe l'axe des ordonnées.",
    correction:
      "Tu as inversé le signe de l'ordonnée à l'origine. La droite coupe l'axe des ordonnées au point (0 ; {b}), pas en (0 ; {neg_b}).",
  },
  slope_intercept_swap: {
    indice:
      "Vérifie chacun des deux nombres de l'équation. Lequel donne la pente, lequel donne le point de départ sur l'axe vertical ?",
    correction:
      "Tu as échangé les rôles des deux coefficients. Dans y = ax + b, c'est a = {a} qui donne la pente et b = {b} qui donne l'ordonnée à l'origine.",
  },

  // ── Cercles ────────────────────────────────────────────────────────────────
  circle_center_sign_x: {
    indice:
      "Regarde la position du centre par rapport à l'axe vertical. Est-il du bon côté de l'axe des abscisses ?",
    correction:
      "Tu as inversé le signe de l'abscisse du centre. Dans (x − {cx})² + (y − {cy})² = r², le centre est en ({cx} ; {cy}), pas en ({neg_cx} ; {cy}).",
  },
  circle_center_sign_y: {
    indice:
      "Regarde la position du centre par rapport à l'axe horizontal. Est-il du bon côté de l'axe des ordonnées ?",
    correction:
      "Tu as inversé le signe de l'ordonnée du centre. Le centre est en ({cx} ; {cy}), pas en ({cx} ; {neg_cy}).",
  },
  circle_radius_squared: {
    indice:
      "Quelle est la valeur du rayon dans l'équation du cercle ? Attention à ce que représente le nombre dans l'équation.",
    correction:
      "Dans l'équation (x−a)² + (y−b)² = r², le nombre à droite est r², pas r. Ici r² = {r_sq}, donc le rayon est r = {r}.",
  },
  circle_center_swap: {
    indice:
      "Vérifie l'ordre des coordonnées du centre : est-ce bien (abscisse ; ordonnée) ?",
    correction:
      "Tu as inversé les coordonnées du centre. Le centre est en ({cx} ; {cy}), c'est-à-dire abscisse {cx} et ordonnée {cy}.",
  },

  // ── Pythagore ──────────────────────────────────────────────────────────────
  pythagoras_add_legs: {
    indice:
      "Le théorème de Pythagore ne consiste pas à additionner les longueurs. Que fait-on avec les carrés des côtés ?",
    correction:
      "On ne peut pas additionner directement les longueurs. Le théorème de Pythagore donne c² = {a}² + {b}², donc c = √({a_sq} + {b_sq}) = {c}.",
  },
  pythagoras_no_sqrt: {
    indice:
      "Tu as bien calculé c², mais c n'est pas c². Quelle opération permet de passer de c² à c ?",
    correction:
      "Tu as oublié de prendre la racine carrée. On a c² = {a}² + {b}² = {c_sq}, donc c = √{c_sq} = {c}.",
  },
  pythagoras_subtract: {
    indice:
      "Dans le théorème de Pythagore, comment combiner les deux côtés connus pour trouver l'hypoténuse ?",
    correction:
      "Pour trouver l'hypoténuse, on additionne les carrés (pas on les soustrait) : c = √({a}² + {b}²) = {c}.",
  },

  // ── Thalès ─────────────────────────────────────────────────────────────────
  thales_inverse_ratio: {
    indice:
      "Vérifie l'ordre de la fraction. Quel segment est au numérateur dans le rapport AD/DB = AE/EC ?",
    correction:
      "Tu as inversé le rapport. Le théorème de Thalès donne AD/DB = AE/EC, soit EC = AE × DB / AD = {AE} × {DB} / {AD} = {EC}.",
  },
  thales_full_base: {
    indice:
      "Fais attention : le rapport ne fait pas intervenir AB en entier. Quel segment utilises-tu réellement au dénominateur ?",
    correction:
      "Le rapport est AD/DB (pas AD/AB). On a EC = AE × DB / AD = {AE} × {DB} / {AD} = {EC}.",
  },
  thales_add_segments: {
    indice:
      "Le théorème de Thalès est une égalité de rapports, pas une addition. Quelle formule utilises-tu ?",
    correction:
      "On ne peut pas additionner les segments. La bonne formule est EC = AE × DB / AD = {AE} × {DB} / {AD} = {EC}.",
  },
};
