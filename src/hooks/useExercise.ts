import { useState, useCallback, useEffect, useRef } from "react";
import type { Exercise, FeedbackState, Concept } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import type { AttemptRecord } from "../types/metrics";
import { getFeedbackText } from "../engine/exerciseGenerator";
import {
  generateExerciseForTopic,
  generateExerciseForTopicAsync,
  getCorrectFeedbackForConcept,
} from "../engine/topicGenerator";

interface UseExerciseReturn {
  exercise: Exercise | null;
  isLoading: boolean;
  error: string | null;
  attemptCount: 1 | 2;
  selectedChoice: string | null;
  disabledChoices: string[];
  feedbackState: FeedbackState | null;
  isFinished: boolean;
  selectChoice: (id: string) => void;
  validate: (recordAttempt: (r: AttemptRecord) => void) => void;
  nextExercise: () => void;
  newExercise: () => void;
  retry: () => void;
}

export function useExercise(
  concept: Concept,
  difficulty: 1 | 2
): UseExerciseReturn {
  const isIa = concept === "ia";

  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [exercise, setExercise] = useState<Exercise | null>(() =>
    isIa
      ? null
      : generateExerciseForTopic(
          concept as Exclude<Concept, "ia">,
          difficulty,
          Math.floor(Math.random() * 1_000_000)
        )
  );
  const [isLoading, setIsLoading] = useState(isIa);
  const [error, setError] = useState<string | null>(null);
  const [attemptCount, setAttemptCount] = useState<1 | 2>(1);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [disabledChoices, setDisabledChoices] = useState<string[]>([]);
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  const abortRef = useRef<AbortController | null>(null);

  // ── Effect principal : changement de concept ou difficulté ───────────────
  useEffect(() => {
    const controller = new AbortController();
    abortRef.current = controller;
    let cancelled = false;

    setAttemptCount(1);
    setSelectedChoice(null);
    setDisabledChoices([]);
    setFeedbackState(null);
    setIsFinished(false);

    if (isIa) {
      const newSeed = Math.floor(Math.random() * 1_000_000);
      setSeed(newSeed);
      setExercise(null);
      setIsLoading(true);
      setError(null);

      generateExerciseForTopicAsync("ia", difficulty, newSeed, controller.signal)
        .then((ex) => {
          if (!cancelled) setExercise(ex);
        })
        .catch((e: unknown) => {
          if (!cancelled && !controller.signal.aborted) {
            setError(e instanceof Error ? e.message : "Erreur inconnue");
          }
        })
        .finally(() => {
          if (!cancelled) setIsLoading(false);
        });
    } else {
      // Comportement strictement inchangé pour les concepts algorithmiques
      const newSeed = Math.floor(Math.random() * 1_000_000);
      setSeed(newSeed);
      setExercise(
        generateExerciseForTopic(
          concept as Exclude<Concept, "ia">,
          difficulty,
          newSeed
        )
      );
      setError(null);
      // isLoading reste false (jamais activé pour les concepts sync)
    }

    return () => {
      cancelled = true;
      controller.abort();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [concept, difficulty]);

  // ── resetWithSeed ────────────────────────────────────────────────────────
  const resetWithSeed = useCallback(
    (newSeed: number) => {
      // Annuler tout fetch IA en cours
      abortRef.current?.abort();
      const controller = new AbortController();
      abortRef.current = controller;

      setSeed(newSeed);
      setAttemptCount(1);
      setSelectedChoice(null);
      setDisabledChoices([]);
      setFeedbackState(null);
      setIsFinished(false);

      if (isIa) {
        setExercise(null);
        setIsLoading(true);
        setError(null);

        generateExerciseForTopicAsync("ia", difficulty, newSeed, controller.signal)
          .then((ex) => {
            setExercise(ex);
          })
          .catch((e: unknown) => {
            if (!controller.signal.aborted) {
              setError(e instanceof Error ? e.message : "Erreur inconnue");
            }
          })
          .finally(() => {
            setIsLoading(false);
          });
      } else {
        setExercise(
          generateExerciseForTopic(
            concept as Exclude<Concept, "ia">,
            difficulty,
            newSeed
          )
        );
      }
    },
    [concept, difficulty, isIa]
  );

  // ── Actions utilisateur ──────────────────────────────────────────────────
  const selectChoice = useCallback(
    (id: string) => {
      if (isFinished || disabledChoices.includes(id) || isLoading) return;
      setSelectedChoice(id);
    },
    [isFinished, disabledChoices, isLoading]
  );

  const validate = useCallback(
    (recordAttempt: (r: AttemptRecord) => void) => {
      if (!exercise || !selectedChoice) return;

      const chosen = exercise.choices.find((c) => c.choice_id === selectedChoice)!;
      const correct = exercise.choices.find((c) => c.is_correct)!;
      const params = exercise.params;

      recordAttempt({
        exercise_id: exercise.exercise_id,
        attempt: attemptCount,
        selected_choice: selectedChoice,
        is_correct: chosen.is_correct,
        misconception_id: chosen.misconception_id as MisconceptionId | null,
        timestamp: new Date().toISOString(),
      });

      if (chosen.is_correct) {
        // Feedback inline LLM prioritaire, fallback sur le switch statique
        const msg =
          exercise.correct_feedback ??
          getCorrectFeedbackForConcept(
            exercise.concept,
            params,
            exercise.template_id,
            attemptCount
          );
        setFeedbackState({
          type: attemptCount === 1 ? "correct_1" : "correct_2",
          message: msg,
        });
        setIsFinished(true);
      } else {
        if (attemptCount === 1) {
          // Indice : inline LLM prioritaire, fallback registre statique
          const indice =
            chosen.feedback_indice ??
            getFeedbackText(
              chosen.misconception_id as MisconceptionId,
              "indice",
              params
            );
          setFeedbackState({ type: "wrong_1", message: indice });
          setDisabledChoices([selectedChoice]);
          setSelectedChoice(null);
          setAttemptCount(2);
        } else {
          // Correction : inline LLM prioritaire, fallback registre statique
          const correction =
            chosen.feedback_correction ??
            getFeedbackText(
              chosen.misconception_id as MisconceptionId,
              "correction",
              params
            );
          setFeedbackState({ type: "wrong_2", message: correction });
          setIsFinished(true);
          setDisabledChoices(
            exercise.choices
              .filter((c) => !c.is_correct)
              .map((c) => c.choice_id)
          );
          setSelectedChoice(correct.choice_id);
        }
      }
    },
    [exercise, selectedChoice, attemptCount]
  );

  const nextExercise = useCallback(() => {
    resetWithSeed(seed + 1);
  }, [seed, resetWithSeed]);

  const newExercise = useCallback(() => {
    resetWithSeed(Math.floor(Math.random() * 1_000_000));
  }, [resetWithSeed]);

  const retry = useCallback(() => {
    resetWithSeed(seed);
  }, [seed, resetWithSeed]);

  return {
    exercise,
    isLoading,
    error,
    attemptCount,
    selectedChoice,
    disabledChoices,
    feedbackState,
    isFinished,
    selectChoice,
    validate,
    nextExercise,
    newExercise,
    retry,
  };
}
