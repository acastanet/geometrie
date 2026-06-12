import type { MisconceptionId } from "../types/misconception";

export function computeMisconceptionParams(
  type: MisconceptionId,
  a: number,
  b: number
): [number, number] {
  switch (type) {
    case "slope_sign_confusion":
      return [-a, b];
    case "intercept_sign_confusion":
      return [a, -b];
    case "slope_intercept_swap":
      return [b, a];
    default:
      return [a, b];
  }
}

const ALL_MISCONCEPTIONS: MisconceptionId[] = [
  "slope_sign_confusion",
  "intercept_sign_confusion",
  "slope_intercept_swap",
];

export function selectTwoMisconceptions(
  rng: () => number
): [MisconceptionId, MisconceptionId] {
  // slope_intercept_swap garanti dans >= 50% des cas
  const includeSwap = rng() < 0.7;

  if (includeSwap) {
    const others = ALL_MISCONCEPTIONS.filter((m) => m !== "slope_intercept_swap");
    const other = others[Math.floor(rng() * others.length)];
    // randomiser l'ordre
    return rng() < 0.5
      ? ["slope_intercept_swap", other]
      : [other, "slope_intercept_swap"];
  } else {
    const shuffled = [...ALL_MISCONCEPTIONS].sort(() => rng() - 0.5);
    return [shuffled[0], shuffled[1]];
  }
}
