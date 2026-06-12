import {
  pointCmd,
  segmentCmd,
  vectorCmd,
  threePointsFigure,
  computeCoordSystem,
} from "../src/engine/geoGebraCommands";
import type { StatementFigure } from "../src/types/exercise";

/**
 * Types de scénarios d'exercice. Doit correspondre au catalogue dans generatePrompt.ts.
 */
export type LlmExerciseType =
  | "nature_triangle"
  | "est_parallelogramme"
  | "quatrieme_sommet"
  | "alignement_points"
  | "milieu_symetrique"
  | "distance_comparaison"
  | "equation_reduite_2pts"
  | "appartenance_droite";

interface PointData {
  [name: string]: [number, number];
}

/**
 * Construit les commandes GeoGebra et le système de coordonnées
 * pour la figure d'énoncé, à partir du type d'exercice et des données.
 *
 * Le LLM ne produit jamais de commandes GeoGebra — la figure est
 * toujours construite côté serveur, garantissant la cohérence avec l'énoncé.
 */
export function buildFigure(
  exerciseType: LlmExerciseType,
  data: { points: PointData; [key: string]: unknown }
): StatementFigure | null {
  const points = Object.entries(data.points);
  if (points.length === 0) return null;

  const coords: [number, number][] = points.map(([, c]) => c);
  const coordSystem = computeCoordSystem(coords, 2);

  let commands: string[];

  switch (exerciseType) {
    case "nature_triangle": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      const pC = getPt(data, "C");
      if (!pA || !pB || !pC) return null;
      commands = threePointsFigure(
        pA[0], pA[1], pB[0], pB[1], pC[0], pC[1], false
      );
      break;
    }

    case "est_parallelogramme": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      const pC = getPt(data, "C");
      const pD = getPt(data, "D");
      if (!pA || !pB || !pC || !pD) return null;
      commands = [
        pointCmd("A", pA[0], pA[1]),
        pointCmd("B", pB[0], pB[1]),
        pointCmd("C", pC[0], pC[1]),
        pointCmd("D", pD[0], pD[1]),
        segmentCmd("A", "B"),
        segmentCmd("B", "C"),
        segmentCmd("C", "D"),
        segmentCmd("D", "A"),
      ];
      break;
    }

    case "quatrieme_sommet": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      const pC = getPt(data, "C");
      if (!pA || !pB || !pC) return null;
      commands = threePointsFigure(
        pA[0], pA[1], pB[0], pB[1], pC[0], pC[1], false
      );
      break;
    }

    case "alignement_points": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      const pK = getPt(data, "K");
      if (!pA || !pB || !pK) return null;
      commands = threePointsFigure(
        pA[0], pA[1], pB[0], pB[1], pK[0], pK[1], false
      );
      break;
    }

    case "milieu_symetrique": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      if (!pA || !pB) return null;
      commands = [
        pointCmd("A", pA[0], pA[1]),
        pointCmd("B", pB[0], pB[1]),
        segmentCmd("A", "B"),
      ];
      const pI = getPt(data, "I");
      if (pI) {
        commands.push(pointCmd("I", pI[0], pI[1]));
      }
      break;
    }

    case "distance_comparaison": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      if (!pA || !pB) return null;
      commands = [
        pointCmd("A", pA[0], pA[1]),
        pointCmd("B", pB[0], pB[1]),
        segmentCmd("A", "B"),
      ];
      const pC = getPt(data, "C");
      if (pC) {
        commands.push(pointCmd("C", pC[0], pC[1]));
        commands.push(segmentCmd("B", "C"));
      }
      break;
    }

    case "equation_reduite_2pts": {
      const pA = getPt(data, "A");
      const pB = getPt(data, "B");
      if (!pA || !pB) return null;
      commands = [
        pointCmd("A", pA[0], pA[1]),
        pointCmd("B", pB[0], pB[1]),
        segmentCmd("A", "B"),
        vectorCmd("A", "B"),
      ];
      break;
    }

    case "appartenance_droite": {
      const pK = getPt(data, "K");
      if (!pK) return null;
      const m = (data.m as number) ?? 1;
      const p = (data.p as number) ?? 0;
      const aPart = m === 1 ? "x" : m === -1 ? "-x" : `${m}x`;
      const bPart = p > 0 ? ` + ${p}` : p < 0 ? ` - ${Math.abs(p)}` : "";
      commands = [
        pointCmd("K", pK[0], pK[1]),
        `f(x) = ${aPart}${bPart}`,
      ];
      break;
    }

    default:
      return null;
  }

  return { commands, coord_system: coordSystem };
}

/** Extrait les coordonnées d'un point nommé depuis data.points */
function getPt(
  data: { points: PointData; [key: string]: unknown },
  name: string
): [number, number] | undefined {
  const pt = data.points[name];
  if (pt && Array.isArray(pt) && pt.length === 2) {
    return [pt[0], pt[1]];
  }
  return undefined;
}
