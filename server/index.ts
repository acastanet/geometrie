import "dotenv/config";
import express from "express";
import { callMistral } from "./mistralClient";
import { buildMistralMessages } from "./generatePrompt";
import { validateLlmResponse } from "./validateLlmResponse";
import { verifyMath } from "./mathVerifier";
import { buildFigure } from "./buildFigure";
// LlmResponse n'est utilisé que via la variable validated (inférée)

const app = express();
app.use(express.json());

const PORT = process.env.PORT ?? 3001;
const MAX_RETRIES = 3;

// ── Types ──────────────────────────────────────────────────────────────────

interface GenerateRequest {
  seed: number;
  difficulty: 1 | 2;
}

// ── RNG seedé pour le mélange des choix ────────────────────────────────────

/**
 * Mulberry32 — même algorithme que dans src/engine/exerciseGenerator.ts.
 * Permet un mélange déterministe des choix côté serveur.
 */
function mulberry32(seed: number): () => number {
  let s = seed;
  return () => {
    s |= 0;
    s = (s + 0x6d2b79f5) | 0;
    let t = Math.imul(s ^ (s >>> 15), 1 | s);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/** Mélange Fisher-Yates seedé */
function shuffleSeeded<T>(arr: readonly T[], rng: () => number): T[] {
  const result = [...arr];
  for (let i = result.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1));
    [result[i], result[j]] = [result[j], result[i]];
  }
  return result;
}

// ── Route POST /api/generate ───────────────────────────────────────────────

app.post("/api/generate", async (req, res) => {
  const { seed, difficulty } = req.body as GenerateRequest;

  if (typeof seed !== "number" || ![1, 2].includes(difficulty)) {
    res.status(400).json({ error: "Body invalide : { seed: number, difficulty: 1 | 2 }" });
    return;
  }

  // Utiliser un seed dérivé pour la génération LLM, et un autre pour le shuffle
  const llmSeed = seed;
  const shuffleSeed = seed + 1_000_000;

  let lastError: string | null = null;

  for (let attempt = 0; attempt <= MAX_RETRIES; attempt++) {
    try {
      // 1. Appeler Mistral
      const messages = buildMistralMessages(difficulty, lastError ?? undefined);
      const rawJson = await callMistral(messages, llmSeed);

      // 2. Parser le JSON
      let parsed: unknown;
      try {
        parsed = JSON.parse(rawJson);
      } catch {
        lastError = "JSON invalide — le LLM n'a pas retourné du JSON parseable";
        console.error(`[retry ${attempt}] ${lastError}`);
        console.error(`[retry ${attempt}] Raw (300 premiers caractères): ${rawJson.slice(0, 300)}`);
        continue;
      }

      // 3. Valider la structure
      const validated = validateLlmResponse(parsed);
      if (typeof validated === "string") {
        lastError = validated;
        console.error(`[retry ${attempt}] Validation échouée : ${validated}`);
        console.error(`[retry ${attempt}] JSON reçu : ${JSON.stringify(parsed).slice(0, 500)}`);
        continue;
      }

      // 4. Vérifier les maths
      const mathError = verifyMath(validated);
      if (mathError) {
        lastError = mathError;
        console.error(`[retry ${attempt}] Vérification mathématique échouée : ${mathError}`);
        continue;
      }

      // 5. Construire la figure d'énoncé
      let statementFigure = null;
      if (validated.with_figure) {
        statementFigure = buildFigure(validated.exercise_type, validated.data);
      }

      // 6. Re-mélanger les choix (seedé) pour éviter le biais "bonne réponse en A"
      const rng = mulberry32(shuffleSeed);
      const positions = ["A", "B", "C"] as const;
      const shuffledPositions = shuffleSeeded(positions, rng);

      // Mapper les anciennes positions vers les nouvelles
      const oldChoices = validated.choices;
      const oldToNew = new Map<string, string>();
      const newChoices = shuffledPositions.map((newId, i) => {
        const oldId = positions[i];
        oldToNew.set(oldId, newId);
        const oldChoice = oldChoices.find((c) => c.id === oldId)!;
        return { ...oldChoice, id: newId };
      });

      const newCorrectId = oldToNew.get(validated.correct_choice_id)!;

      // 7. Réponse finale
      const response = {
        exercise_type: validated.exercise_type,
        data: validated.data,
        statement: validated.statement,
        choices: newChoices,
        correct_choice_id: newCorrectId,
        correct_feedback: validated.correct_feedback,
        statement_figure: statementFigure,
      };

      res.json(response);
      return;
    } catch (err) {
      lastError = err instanceof Error ? err.message : String(err);
      console.error(`[retry ${attempt}] Erreur Mistral : ${lastError}`);
      // Continuer le retry
    }
  }

  // Toutes les tentatives ont échoué
  res.status(502).json({
    error: "Échec de la génération IA après plusieurs tentatives",
    detail: lastError,
  });
});

// ── Démarrage ──────────────────────────────────────────────────────────────

app.listen(PORT, () => {
  console.log(`🤖 Serveur IA mimo démarré sur http://localhost:${PORT}`);
});
