import { useState, useCallback, useEffect } from "react";
import type { Exercise, FeedbackState, Concept } from "../types/exercise";
import type { MisconceptionId } from "../types/misconception";
import type { AttemptRecord } from "../types/metrics";
import { getFeedbackText } from "../engine/exerciseGenerator";
import {
  generateExerciseForTopic,
  getCorrectFeedbackForConcept,
} from "../engine/topicGenerator";

interface UseExerciseReturn {
  exercise: Exercise | null;
  attemptCount: 1 | 2;
  selectedChoice: string | null;
  disabledChoices: string[];
  feedbackState: FeedbackState | null;
  isFinished: boolean;
  selectChoice: (id: string) => void;
  validate: (recordAttempt: (r: AttemptRecord) => void) => void;
  nextExercise: () => void;
  newExercise: () => void;
}

export function useExercise(
  concept: Concept,
  difficulty: 1 | 2
): UseExerciseReturn {
  const [seed, setSeed] = useState(() => Math.floor(Math.random() * 1_000_000));
  const [exercise, setExercise] = useState<Exercise | null>(() =>
    generateExerciseForTopic(concept, difficulty, Math.floor(Math.random() * 1_000_000))
  );
  const [attemptCount, setAttemptCount] = useState<1 | 2>(1);
  const [selectedChoice, setSelectedChoice] = useState<string | null>(null);
  const [disabledChoices, setDisabledChoices] = useState<string[]>([]);
  const [feedbackState, setFeedbackState] = useState<FeedbackState | null>(null);
  const [isFinished, setIsFinished] = useState(false);

  // Quand le sujet ou la difficulté change, générer un nouvel exercice
  useEffect(() => {
    const newSeed = Math.floor(Math.random() * 1_000_000);
    setSeed(newSeed);
    setExercise(generateExerciseForTopic(concept, difficulty, newSeed));
    setAttemptCount(1);
    setSelectedChoice(null);
    setDisabledChoices([]);
    setFeedbackState(null);
    setIsFinished(false);
  }, [concept, difficulty]);

  const selectChoice = useCallback(
    (id: string) => {
      if (isFinished || disabledChoices.includes(id)) return;
      setSelectedChoice(id);
    },
    [isFinished, disabledChoices]
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
        const msg = getCorrectFeedbackForConcept(exercise.concept, params, attemptCount);
        setFeedbackState({ type: attemptCount === 1 ? "correct_1" : "correct_2", message: msg });
        setIsFinished(true);
      } else {
        if (attemptCount === 1) {
          const indice = getFeedbackText(
            chosen.misconception_id as MisconceptionId,
            "indice",
            params
          );
          setFeedbackState({ type: "wrong_1", message: indice });
          setDisabledChoices([selectedChoice]);
          setSelectedChoice(null);
          setAttemptCount(2);
        } else {
          const correction = getFeedbackText(
            chosen.misconception_id as MisconceptionId,
            "correction",
            params
          );
          setFeedbackState({ type: "wrong_2", message: correction });
          setIsFinished(true);
          setDisabledChoices(
            exercise.choices.filter((c) => !c.is_correct).map((c) => c.choice_id)
          );
          setSelectedChoice(correct.choice_id);
        }
      }
    },
    [exercise, selectedChoice, attemptCount]
  );

  const resetWithSeed = useCallback(
    (newSeed: number) => {
      setSeed(newSeed);
      setExercise(generateExerciseForTopic(concept, difficulty, newSeed));
      setAttemptCount(1);
      setSelectedChoice(null);
      setDisabledChoices([]);
      setFeedbackState(null);
      setIsFinished(false);
    },
    [concept, difficulty]
  );

  const nextExercise = useCallback(() => {
    resetWithSeed(seed + 1);
  }, [seed, resetWithSeed]);

  const newExercise = useCallback(() => {
    resetWithSeed(Math.floor(Math.random() * 1_000_000));
  }, [resetWithSeed]);

  return {
    exercise,
    attemptCount,
    selectedChoice,
    disabledChoices,
    feedbackState,
    isFinished,
    selectChoice,
    validate,
    nextExercise,
    newExercise,
  };
}
