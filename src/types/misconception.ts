export type MisconceptionId =
  // Droites affines
  | "slope_sign_confusion"
  | "intercept_sign_confusion"
  | "slope_intercept_swap"
  // Cercles
  | "circle_center_sign_x"
  | "circle_center_sign_y"
  | "circle_radius_squared"
  | "circle_center_swap"
  // Pythagore
  | "pythagoras_add_legs"
  | "pythagoras_no_sqrt"
  | "pythagoras_subtract"
  // Thalès
  | "thales_inverse_ratio"
  | "thales_full_base"
  | "thales_add_segments";

export interface MisconceptionEntry {
  indice: string;
  correction: string;
}
