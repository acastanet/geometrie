export type MisconceptionId =
  // ── Équations de droites ──────────────────────────────────────────────────────
  | "slope_sign_confusion"
  | "intercept_sign_confusion"
  | "slope_intercept_swap"
  // Lecture graphique
  | "graph_reading_inverse_slope"
  | "vertical_as_y"
  // Cartésienne → réduite
  | "cart_sign_error"
  | "cart_no_div"
  // Vecteur directeur
  | "dir_vector_ab"
  | "dir_vector_sign"
  // ── Géométrie repérée ──────────────────────────────────────────────────────────
  | "dist_no_sqrt"
  | "dist_add_coords"
  | "dist_subtract_squares"
  | "midpoint_difference"
  | "midpoint_no_half"
  | "proj_wrong_axis"
  | "proj_keep_coord"
  // ── Vecteurs ───────────────────────────────────────────────────────────────────
  | "vec_reversed"
  | "vec_swapped"
  | "vec_sum_subtract"
  | "chasles_wrong_extremity"
  | "chasles_reversed"
  | "colin_det_plus"
  | "colin_det_xx_yy"
  | "align_uses_distance"
  // ── Positions relatives ────────────────────────────────────────────────────────
  | "par_intercept_based"
  | "par_secant_confusion"
  | "inter_x_sign"
  | "inter_swap_xy"
  | "inter_wrong_subst";

export interface MisconceptionEntry {
  indice: string;
  correction: string;
}
