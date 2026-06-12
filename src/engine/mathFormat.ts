/**
 * Helpers de formatage LaTeX pour les énoncés mathématiques de niveau Seconde.
 *
 * Tous les retours sont du LaTeX PUR (sans délimiteurs $),
 * destiné à être utilisé avec LatexText ou injecté dans un template.
 */

/** Repère orthonormé standard, réutilisé dans les énoncés */
export const REPERE = String.raw`(O\ ;\ \vec{\imath},\ \vec{\jmath})`;

/** Coordonnées d'un point style scolaire (point-virgule, espace fine) */
export function fmtPoint(
  name: string,
  x: number | string,
  y: number | string
): string {
  const sx = typeof x === "number" ? String(x) : x;
  const sy = typeof y === "number" ? String(y) : y;
  return `${name}(${sx}\\ ;\\ ${sy})`;
}

/** Vecteur nommé : \vec{AB} */
export function fmtVec(name: string): string {
  return String.raw`\vec{${name}}`;
}

/** Coordonnées de vecteur : \vec{AB}\,(3\ ;\ -2) */
export function fmtVecCoords(
  name: string,
  x: number | string,
  y: number | string
): string {
  const sx = typeof x === "number" ? String(x) : x;
  const sy = typeof y === "number" ? String(y) : y;
  return String.raw`\vec{${name}}\,(${sx}\ ;\ ${sy})`;
}

/** PGCD de deux entiers */
function gcd(a: number, b: number): number {
  a = Math.abs(Math.round(a));
  b = Math.abs(Math.round(b));
  while (b) { [a, b] = [b, a % b]; }
  return a || 1;
}

/** Fraction réduite en LaTeX, le signe toujours devant.
 *  fmtFrac(-2, 4) → "-\frac{1}{2}" ; fmtFrac(3, 1) → "3" */
export function fmtFrac(num: number, den: number): string {
  if (den === 0) return String(num);
  const sign = (num < 0) !== (den < 0) ? "-" : "";
  let n = Math.abs(num);
  let d = Math.abs(den);
  const g = gcd(n, d);
  n /= g;
  d /= g;
  if (d === 1) return `${sign}${n}`;
  return `${sign}\\frac{${n}}{${d}}`;
}

/** Racine carrée simplifiée (extraction du plus grand carré).
 *  fmtSqrt(20) → "2\sqrt{5}" ; fmtSqrt(16) → "4" */
export function fmtSqrt(radicand: number): string {
  if (radicand < 0) return String.raw`\sqrt{${radicand}}`;
  if (Number.isInteger(radicand) && radicand >= 0) {
    // Extraire le plus grand carré
    let outside = 1;
    let inside = radicand;
    for (let k = 2; k * k <= inside; k++) {
      while (inside % (k * k) === 0) {
        outside *= k;
        inside /= k * k;
      }
    }
    if (inside === 1) return String(outside);
    if (outside === 1) return String.raw`\sqrt{${inside}}`;
    return `${outside}\\sqrt{${inside}}`;
  }
  return String.raw`\sqrt{${radicand}}`;
}

/** Équation réduite y = mx + p */
export function fmtReducedEq(
  m: number | string,
  p: number | string,
  showY: boolean = true
): string {
  const mx =
    typeof m === "string"
      ? m
      : m === 1
        ? "x"
        : m === -1
          ? "-x"
          : `${m}x`;
  const pp =
    typeof p === "string"
      ? Number(p) >= 0
        ? ` + ${p}`
        : ` - ${Math.abs(Number(p))}`
      : p > 0
        ? ` + ${p}`
        : p < 0
          ? ` - ${Math.abs(p)}`
          : "";
  const lhs = showY ? "y = " : "";
  return `${lhs}${mx}${pp}`;
}

/** Version LaTeX de l'équation réduite avec fractions éventuelles */
export function fmtReducedEqLatex(m: number, p: number): string {
  const mDisplay = fmtReducedEqCoeff(m);
  const pDisplay =
    p > 0
      ? ` + ${p}`
      : p < 0
        ? ` - ${Math.abs(p)}`
        : "";
  return `y = ${mDisplay}${pDisplay}`;
}

/** Coefficient directeur formaté pour LaTeX (exporté pour usage dans les générateurs) */
export function fmtReducedEqCoeff(m: number): string {
  if (m === 1) return "x";
  if (m === -1) return "-x";
  if (Number.isInteger(m)) return `${m}x`;
  // Fractions simples
  const commonFractions: Record<string, string> = {
    "0.5": String.raw`\frac{1}{2}x`,
    "-0.5": String.raw`-\frac{1}{2}x`,
    "0.3333333333333333": String.raw`\frac{1}{3}x`,
    "-0.3333333333333333": String.raw`-\frac{1}{3}x`,
    "0.6666666666666666": String.raw`\frac{2}{3}x`,
    "-0.6666666666666666": String.raw`-\frac{2}{3}x`,
    "0.25": String.raw`\frac{1}{4}x`,
    "-0.25": String.raw`-\frac{1}{4}x`,
    "0.75": String.raw`\frac{3}{4}x`,
    "-0.75": String.raw`-\frac{3}{4}x`,
    "1.5": String.raw`\frac{3}{2}x`,
    "-1.5": String.raw`-\frac{3}{2}x`,
  };
  if (commonFractions[String(m)]) return commonFractions[String(m)];
  // Fallback
  return `${m}x`;
}

/** Équation cartésienne ax + by + c = 0 */
export function fmtCartesianEq(
  a: number,
  b: number,
  c: number
): string {
  const parts: string[] = [];
  // terme en x
  if (a !== 0) {
    if (a === 1) parts.push("x");
    else if (a === -1) parts.push("-x");
    else parts.push(`${a}x`);
  }
  // terme en y
  if (b !== 0) {
    if (b === 1) parts.push(` + y`);
    else if (b === -1) parts.push(` - y`);
    else if (b > 0) parts.push(` + ${b}y`);
    else parts.push(` - ${Math.abs(b)}y`);
  }
  // constante
  if (c > 0) parts.push(` + ${c}`);
  else if (c < 0) parts.push(` - ${Math.abs(c)}`);
  parts.push(" = 0");
  return parts.join("").replace(/^\+ /, "");
}

/** Nom d'une droite : $(d)$ */
export const fmtDroite = (label: string) => `$(d_${label})$`;

/** Ensemble vide ou accolades LaTeX */
export function fmtSet(inside: string): string {
  return String.raw`\{${inside}\}`;
}
