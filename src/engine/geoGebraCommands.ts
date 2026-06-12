/**
 * Commandes GeoGebra réutilisables pour les figures d'énoncé.
 * Chaque fonction retourne un tableau de commandes (strings)
 * à passer à GeoGebraRenderer via StatementFigure.commands.
 */

/** Points avec labels dans un repère */
export function pointCmd(name: string, x: number, y: number): string {
  return `${name} = (${x}, ${y})`;
}

/** Segment entre deux points */
export function segmentCmd(a: string, b: string): string {
  return `Segment(${a}, ${b})`;
}

/** Vecteur de A vers B (flèche) */
export function vectorCmd(a: string, b: string): string {
  return `Vector(${a}, ${b})`;
}

/** Vecteur depuis l'origine : u = (x, y) */
export function vectorFromOriginCmd(name: string, x: number, y: number): string {
  return `${name} = Vector((0, 0), (${x}, ${y}))`;
}

/** Droite définie par deux points */
export function lineThroughCmd(name: string, a: string, b: string): string {
  return `${name} = Line(${a}, ${b})`;
}

/** Droite d'équation réduite y = mx + p (mode graphing) */
export function lineEquationCmd(m: number, p: number): string {
  const aPart = m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
  const bPart = p > 0 ? ` + ${p}` : p < 0 ? ` - ${Math.abs(p)}` : "";
  return `f(x) = ${aPart}${bPart}`;
}

/** Droite verticale x = c */
export function verticalLineCmd(c: number): string {
  return `x = ${c}`;
}

/** Cercle de centre A passant par B */
export function circleCmd(a: string, b: string): string {
  return `Circle(${a}, ${b})`;
}

/** Étiquette texte positionnée (décalée par rapport au point) */
export function labelCmd(text: string, x: number, y: number, offsetX: number = 0, offsetY: number = 0.4): string {
  return `Text("${text}", (${x + offsetX}, ${y + offsetY}))`;
}

/**
 * Crée les commandes pour afficher deux points, leur segment
 * et optionnellement leurs coordonnées en étiquette.
 */
export function twoPointsFigure(
  xA: number, yA: number,
  xB: number, yB: number,
  showCoords: boolean = true
): string[] {
  const cmds = [
    pointCmd("A", xA, yA),
    pointCmd("B", xB, yB),
    segmentCmd("A", "B"),
  ];
  if (showCoords) {
    cmds.push(labelCmd(`A(${xA}\\ ;\\ ${yA})`, xA, yA));
    cmds.push(labelCmd(`B(${xB}\\ ;\\ ${yB})`, xB, yB));
  }
  return cmds;
}

/**
 * Figure avec 3 points A, B, C et segments AB, AC.
 * Utilisé pour alignement et milieu.
 */
export function threePointsFigure(
  xA: number, yA: number,
  xB: number, yB: number,
  xC: number, yC: number,
  showCoords: boolean = true
): string[] {
  const cmds = [
    pointCmd("A", xA, yA),
    pointCmd("B", xB, yB),
    pointCmd("C", xC, yC),
    segmentCmd("A", "B"),
    segmentCmd("A", "C"),
    segmentCmd("B", "C"),
  ];
  if (showCoords) {
    cmds.push(labelCmd(`A(${xA}\\ ;\\ ${yA})`, xA, yA));
    cmds.push(labelCmd(`B(${xB}\\ ;\\ ${yB})`, xB, yB));
    cmds.push(labelCmd(`C(${xC}\\ ;\\ ${yC})`, xC, yC));
  }
  return cmds;
}

/**
 * Deux vecteurs depuis l'origine.
 */
export function twoVectorsFigure(
  ux: number, uy: number,
  vx: number, vy: number
): string[] {
  const cmds = [
    pointCmd("O", 0, 0),
    pointCmd("U", ux, uy),
    pointCmd("V", vx, vy),
    vectorCmd("O", "U"),
    vectorCmd("O", "V"),
    labelCmd(String.raw`\vec{u}`, ux / 2, uy / 2 + 0.3),
    labelCmd(String.raw`\vec{v}`, vx / 2, vy / 2 + 0.3),
  ];
  return cmds;
}

/**
 * Deux droites sur le même graphe pour visualisation positions relatives.
 * En mode "graphing" (pas "geometry"), on utilise f(x) et g(x).
 */
export function twoLinesFigure(
  m1: number, p1: number,
  m2: number, p2: number
): string[] {
  const a1Part = m1 === 1 ? "x" : m1 === -1 ? "-x" : `${m1}x`;
  const b1Part = p1 > 0 ? ` + ${p1}` : p1 < 0 ? ` - ${Math.abs(p1)}` : "";
  const a2Part = m2 === 1 ? "x" : m2 === -1 ? "-x" : `${m2}x`;
  const b2Part = p2 > 0 ? ` + ${p2}` : p2 < 0 ? ` - ${Math.abs(p2)}` : "";
  // Renommer les fonctions pour que les étiquettes apparaissent
  return [
    `f(x) = ${a1Part}${b1Part}`,
    `g(x) = ${a2Part}${b2Part}`,
    // Colorer la 2e droite
    `SetColor(g, 0.2, 0.6, 0.9)`,
  ];
}

/**
 * Point projeté sur un axe : M + point H cible
 */
export function projeteFigure(
  x: number, y: number,
  hx: number, hy: number
): string[] {
  const cmds = [
    pointCmd("M", x, y),
    pointCmd("H", hx, hy),
    segmentCmd("M", "H"),
    // Ligne pointillée pour le projeté
    `SetLineStyle(Segment(M, H), 2)`,
    labelCmd(`M(${x}\\ ;\\ ${y})`, x, y),
  ];
  return cmds;
}

/**
 * Cercle de centre A passant par B.
 */
export function cercleFigure(
  cx: number, cy: number,
  bx: number, by: number
): string[] {
  return [
    pointCmd("A", cx, cy),
    pointCmd("B", bx, by),
    segmentCmd("A", "B"),
    circleCmd("A", "B"),
    labelCmd(`A(${cx}\\ ;\\ ${cy})`, cx, cy),
    labelCmd(`B(${bx}\\ ;\\ ${by})`, bx, by),
  ];
}

/**
 * Calcule un système de coordonnées [xMin, xMax, yMin, yMax]
 * qui englobe tous les points donnés avec une marge.
 */
export function computeCoordSystem(
  points: [number, number][],
  margin: number = 2
): [number, number, number, number] {
  const xs = points.map(([x]) => x);
  const ys = points.map(([, y]) => y);
  const xMin = Math.min(...xs) - margin;
  const xMax = Math.max(...xs) + margin;
  const yMin = Math.min(...ys) - margin;
  const yMax = Math.max(...ys) + margin;
  return [Math.floor(xMin), Math.ceil(xMax), Math.floor(yMin), Math.ceil(yMax)];
}
