import type { MisconceptionId, MisconceptionEntry } from "../types/misconception";

/**
 * Registre des misconceptions (erreurs fréquentes d'élèves) avec feedback
 * à deux niveaux : indice (1er essai) et correction (2e essai).
 *
 * CONVENTION PLACEHOLDERS : instantiateFeedback() remplace {key} par la valeur
 * de params[key] dans les templates ci-dessous. Pour éviter les collisions
 * avec les accolades LaTeX :
 *   - Les noms de params font ≥ 2 caractères
 *   - Les noms ne coïncident jamais avec un argument de macro LaTeX écrit en dur
 *   - Les expressions complexes (fractions, racines) sont pré-formatées
 *     côté générateur et passées comme une seule chaîne (ex. AB_latex)
 */

export const SLOPE_DOMAIN = [-3, -2, -1, -0.5, 0.5, 1, 2, 3] as const;
export const INTERCEPT_DOMAIN = [-4, -3, -2, -1, 1, 2, 3, 4] as const;

export const MISCONCEPTION_REGISTRY: Record<MisconceptionId, MisconceptionEntry> = {
  // ────────────────────────────────────────────────────────────────────────────
  // Équations de droites (existantes, conservées)
  // ────────────────────────────────────────────────────────────────────────────
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
      "Tu as inversé le signe de l'ordonnée à l'origine. La droite coupe l'axe des ordonnées au point $(0\\ ;\\ {b})$, pas en $(0\\ ;\\ {neg_b})$.",
  },
  slope_intercept_swap: {
    indice:
      "Vérifie chacun des deux nombres de l'équation. Lequel donne la pente, lequel donne le point de départ sur l'axe vertical ?",
    correction:
      "Tu as échangé les rôles des deux coefficients. Dans $y = ax + b$, c'est $a = {a}$ qui donne la pente et $b = {b}$ qui donne l'ordonnée à l'origine.",
  },

  // ── Lecture graphique ─────────────────────────────────────────────────────
  graph_reading_inverse_slope: {
    indice:
      "Pour trouver le coefficient directeur sur un graphique, on calcule $\\frac{\\Delta y}{\\Delta x}$. Dans quel ordre places-tu la variation verticale et horizontale ?",
    correction:
      "Le coefficient directeur se calcule par $\\frac{\\Delta y}{\\Delta x}$ (variation verticale sur variation horizontale). Ici $\\frac{{{yB}-{yA}}}{{{xB}-{xA}}} = {a}$, pas l'inverse.",
  },
  vertical_as_y: {
    indice:
      "Une droite verticale a-t-elle une équation de la forme $y = mx + p$ ? Tous les points de cette droite ont la même abscisse.",
    correction:
      "Une droite verticale a pour équation $x = c$ (tous ses points ont la même abscisse). Ce n'est pas une fonction de $x$, elle ne peut pas s'écrire $y = mx + p$.",
  },

  // ── Cartésienne → réduite ─────────────────────────────────────────────────
  cart_sign_error: {
    indice:
      "Quand tu fais passer le terme en $x$ de l'autre côté du signe égal, que devient son signe ? Et que se passe-t-il quand tu divises par le coefficient de $y$ ?",
    correction:
      "Erreur de signe. En isolant $y$ dans ${cart_eq_latex}$, on obtient $y = {m_latex}x + {p_latex}$ : le coefficient de $x$ change de signe en passant dans l'autre membre, puis on divise tout par le coefficient de $y$.",
  },
  cart_no_div: {
    indice:
      "Après avoir isolé le terme en $y$, il faut encore diviser par son coefficient pour obtenir $y = \\dots$ As-tu bien fait cette division ?",
    correction:
      "Tu as oublié de diviser par le coefficient de $y$. Dans ${cart_eq_latex}$, on isole $y$ : $y = \\frac{{-{a}}}{{{b}}}x + \\frac{{-{c}}}{{{b}}}$, soit $y = {m_latex}x + {p_latex}$.",
  },

  // ── Vecteur directeur ─────────────────────────────────────────────────────
  dir_vector_ab: {
    indice:
      "Repense à la définition du vecteur directeur : pour une droite d'équation $ax + by + c = 0$, quel couple de coordonnées vérifie $a \\cdot x + b \\cdot y = 0$ ?",
    correction:
      "Un vecteur directeur de $ax + by + c = 0$ est $\\vec{u}(-b\\ ;\\ a)$, soit ici $\\vec{u}({vx}\\ ;\\ {vy})$. Tu as répondu $(a\\ ;\\ b) = ({a}\\ ;\\ {b})$ : c'est le vecteur normal, pas directeur.",
  },
  dir_vector_sign: {
    indice:
      "Vérifie l'ordre et les signes des coordonnées du vecteur directeur. Pour $ax + by + c = 0$, le vecteur est $(-b\\ ;\\ a)$, pas $(b\\ ;\\ a)$.",
    correction:
      "Attention à l'ordre et au signe. Le vecteur directeur de $ax + by + c = 0$ est $\\vec{u}(-b\\ ;\\ a) = ({vx}\\ ;\\ {vy})$. On prend $-b$ en première coordonnée et $a$ en seconde.",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Géométrie repérée
  // ────────────────────────────────────────────────────────────────────────────
  dist_no_sqrt: {
    indice:
      "Tu as bien calculé la somme des carrés des différences de coordonnées. Mais est-ce déjà la distance ? Quelle opération manque-t-il ?",
    correction:
      "Tu as oublié la racine carrée. $AB = \\sqrt{({xB}-{xA})^2 + ({yB}-{yA})^2} = \\sqrt{{{sum_sq}}} = {AB_latex}$, et non ${sum_sq}$.",
  },
  dist_add_coords: {
    indice:
      "La distance n'est pas la somme des différences de coordonnées. Repense à la formule : on fait la racine carrée d'une somme de carrés.",
    correction:
      "On ne peut pas additionner directement les écarts. $AB = \\sqrt{({xB}-{xA})^2 + ({yB}-{yA})^2} = {AB_latex}$. La distance est l'hypoténuse d'un triangle rectangle dont les côtés sont les écarts en $x$ et en $y$.",
  },
  dist_subtract_squares: {
    indice:
      "Dans la formule de la distance, combine-t-on les carrés par une addition ou une soustraction ?",
    correction:
      "Dans la formule $AB = \\sqrt{({xB}-{xA})^2 + ({yB}-{yA})^2}$, on additionne les carrés des différences, on ne les soustrait pas. Ici $AB = {AB_latex}$.",
  },

  midpoint_difference: {
    indice:
      "Le milieu est au centre du segment. Pour trouver ses coordonnées, additionne-t-on ou soustrait-on les coordonnées des extrémités ?",
    correction:
      "Les coordonnées du milieu s'obtiennent en additionnant (pas en soustrayant) celles des extrémités : $I\\left(\\frac{{{xA}+{xB}}}{2}\\ ;\\ \\frac{{{yA}+{yB}}}{2}\\right) = I({mx_latex}\\ ;\\ {my_latex})$.",
  },
  midpoint_no_half: {
    indice:
      "Le milieu est à mi-chemin entre $A$ et $B$. As-tu bien partagé en deux ?",
    correction:
      "Tu as oublié de diviser par 2. $I\\left(\\frac{{{xA}+{xB}}}{2}\\ ;\\ \\frac{{{yA}+{yB}}}{2}\\right) = I({mx_latex}\\ ;\\ {my_latex})$, et non $I({xA}+{xB}\\ ;\\ {yA}+{yB})$.",
  },

  proj_wrong_axis: {
    indice:
      "Le projeté orthogonal d'un point sur un axe conserve une coordonnée et annule l'autre. Laquelle est conservée sur cet axe ?",
    correction:
      "Le projeté orthogonal de $M(x\\ ;\\ y)$ sur l'axe des abscisses est $(x\\ ;\\ 0)$ : on conserve l'abscisse et l'ordonnée devient 0. Sur l'axe des ordonnées, c'est $(0\\ ;\\ y)$.",
  },
  proj_keep_coord: {
    indice:
      "Pour projeter orthogonalement sur une droite $x = c$, quelle coordonnée change et laquelle est conservée ?",
    correction:
      "Le projeté orthogonal de $M({x}\\ ;\\ {y})$ sur la droite $x = {c}$ est le point $({c}\\ ;\\ {y})$. L'abscisse devient celle de la droite, l'ordonnée est inchangée.",
  },

  // ────────────────────────────────────────────────────────────────────────────
  // Vecteurs
  // ────────────────────────────────────────────────────────────────────────────
  vec_reversed: {
    indice:
      "Pour les coordonnées de $\\vec{AB}$, dans quel ordre soustrait-on les coordonnées de $A$ et de $B$ ? Rappelle-toi : « extrémité moins origine ».",
    correction:
      "$\\vec{AB}$ se calcule par « extrémité moins origine » : $({xB} - {xA}\\ ;\\ {yB} - {yA})$, soit $({vx}\\ ;\\ {vy})$. Tu as calculé $A - B$ au lieu de $B - A$.",
  },
  vec_swapped: {
    indice:
      "Dans les coordonnées d'un vecteur, la première coordonnée correspond à l'axe des abscisses, la seconde à celui des ordonnées. Les as-tu bien placées ?",
    correction:
      "Tu as échangé les coordonnées. $\\vec{AB}({xB}-{xA}\\ ;\\ {yB}-{yA}) = ({vx}\\ ;\\ {vy})$. La première coordonnée est la différence des abscisses, la seconde celle des ordonnées.",
  },
  vec_sum_subtract: {
    indice:
      "Pour additionner deux vecteurs, additionne-t-on ou soustrait-on leurs coordonnées ?",
    correction:
      "On additionne les coordonnées : $\\vec{u}+\\vec{v}({ux}+{vx2}\\ ;\\ {uy}+{vy2}) = ({sum_x}\\ ;\\ {sum_y})$. Tu as soustrait au lieu d'additionner.",
  },
  chasles_wrong_extremity: {
    indice:
      "La relation de Chasles dit que $\\vec{AB} + \\vec{BC} = \\vec{AC}$. Le point de départ est $A$ et le point d'arrivée est $C$, quel est le vecteur résultant ?",
    correction:
      "Par la relation de Chasles, $\\vec{AB} + \\vec{BC} = \\vec{AC}$. Le vecteur résultant va du point de départ du premier vecteur au point d'arrivée du second.",
  },
  chasles_reversed: {
    indice:
      "Quand tu appliques la relation de Chasles, l'ordre des points est important. $\\vec{AB} + \\vec{BC}$ ne donne pas $\\vec{CA}$.",
    correction:
      "$\\vec{AB} + \\vec{BC} = \\vec{AC}$, pas $\\vec{CA}$. Pour obtenir $\\vec{CA}$, il faudrait changer l'ordre : $\\vec{CB} + \\vec{BA} = \\vec{CA}$.",
  },
  colin_det_plus: {
    indice:
      "Revois la formule du déterminant de deux vecteurs : c'est une différence de produits en croix, pas une somme.",
    correction:
      "Le critère de colinéarité est $xy' - x'y = 0$. Ici le déterminant est ${det}$, pas ${det_plus}. Les vecteurs sont {verdict_colin} car le déterminant {is_zero_colin}.",
  },
  colin_det_xx_yy: {
    indice:
      "Le déterminant fait intervenir les produits croisés $xy'$ et $x'y$, pas les produits $xx'$ et $yy'$.",
    correction:
      "Le déterminant de $\\vec{u}(x\\ ;\\ y)$ et $\\vec{v}(x'\\ ;\\ y')$ est $xy' - x'y = {ux} \\times {vy2} - {uy} \\times {vx2} = {det}$. Ce sont les produits en croix, pas $xx' - yy'$.",
  },
  align_uses_distance: {
    indice:
      "Pour prouver que trois points sont alignés en Seconde, quel outil utilise-t-on ? Indice : ce n'est pas en additionnant des distances.",
    correction:
      "En Seconde, on prouve l'alignement par colinéarité de vecteurs : $A$, $B$, $C$ sont alignés si $\\vec{AB}$ et $\\vec{AC}$ sont colinéaires ($\\det = 0$). La condition $AB + BC = AC$ est vraie pour des points alignés dans cet ordre, mais n'est pas la méthode attendue.",  },

  // ────────────────────────────────────────────────────────────────────────────
  // Positions relatives
  // ────────────────────────────────────────────────────────────────────────────
  par_intercept_based: {
    indice:
      "Qu'est-ce qui détermine la direction d'une droite : son coefficient directeur ou son ordonnée à l'origine ?",
    correction:
      "Deux droites sont parallèles si et seulement si elles ont le même coefficient directeur. Ici $m_1 = {m1}$ et $m_2 = {m2}$, donc elles sont {verdict}. L'ordonnée à l'origine $p$ ne détermine que la position verticale, pas la direction.",
  },
  par_secant_confusion: {
    indice:
      "Compare les coefficients directeurs des deux droites. Que signifie le fait qu'ils soient égaux ou différents ?",
    correction:
      "Quand $m_1 = m_2 = {m1}$, les droites ont la même direction donc sont parallèles. Si $m_1 \\neq m_2$, elles sont sécantes. Ici $m_1 = {m1}$ et $m_2 = {m2}$.",
  },
  inter_x_sign: {
    indice:
      "En résolvant le système pour trouver l'abscisse du point d'intersection, vérifie le signe de chaque terme après avoir passé de l'autre côté du signe égal.",
    correction:
      "Erreur de signe dans la résolution. En résolvant ${eq1} = ${eq2}, on obtient $x = {x0}$ puis $y = {y0}$. Le point d'intersection est $({x0}\\ ;\\ {y0})$. Vérifie chaque étape du calcul.",
  },
  inter_swap_xy: {
    indice:
      "Dans les coordonnées d'un point, on écrit toujours l'abscisse en premier et l'ordonnée en second.",
    correction:
      "Tu as échangé l'abscisse et l'ordonnée. Le point d'intersection est $({x0}\\ ;\\ {y0})$ : l'abscisse d'abord, l'ordonnée ensuite.",
  },
  inter_wrong_subst: {
    indice:
      "Après avoir trouvé $x$, il faut le remplacer dans l'une des équations de droite pour trouver $y$. As-tu utilisé la bonne équation de droite ?",
    correction:
      "Une fois $x = {x0}$ trouvé, on reporte dans l'équation d'une des deux droites : $y = {m1} \\times {x0} + {p1} = {y0}$. Le point d'intersection est $({x0}\\ ;\\ {y0})$.",
  },
};
