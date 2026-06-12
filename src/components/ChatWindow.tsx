import { useState } from "react";
import type { ChoiceId, Concept } from "../types/exercise";
import { useExercise } from "../hooks/useExercise";
import { useMetrics } from "../hooks/useMetrics";
import ExerciseCard from "./ExerciseCard";
import FeedbackMessage from "./FeedbackMessage";
import TopicSelector from "./TopicSelector";
import { ArrowRight, CheckCircle2, RefreshCw } from "lucide-react";

interface ChatWindowProps {
  ggbReady: boolean;
}

export default function ChatWindow({ ggbReady }: ChatWindowProps) {
  const [concept, setConcept] = useState<Concept>("equation_droite");
  const [difficulty, setDifficulty] = useState<1 | 2>(1);

  const {
    exercise,
    selectedChoice,
    disabledChoices,
    feedbackState,
    isFinished,
    selectChoice,
    validate,
    nextExercise,
    newExercise,
  } = useExercise(concept, difficulty);

  const { recordAttempt } = useMetrics();

  if (!exercise) return null;

  const choiceIds: ChoiceId[] = ["A", "B", "C"];

  return (
    <div className="flex flex-col gap-4 w-full max-w-4xl mx-auto px-4 py-4 animate-fade-in-up">

      {/* Sélecteur de sujet et niveau */}
      <TopicSelector
        concept={concept}
        difficulty={difficulty}
        onConceptChange={(c) => { setConcept(c); setDifficulty(1); }}
        onDifficultyChange={setDifficulty}
      />

      {/* Énoncé compact */}
      <div className="glass px-5 py-4 border border-slate-200/60 shadow-sm relative overflow-hidden">
        <div className="absolute left-0 top-0 h-full w-1 bg-klein"></div>
        <p className="text-[11px] font-bold text-klein uppercase tracking-widest mb-1">Énoncé</p>
        <p className="text-slate-800 font-medium text-base leading-snug">{exercise.statement}</p>
      </div>

      {/* Grille 3 cartes */}
      {ggbReady ? (
        <div className="grid grid-cols-3 gap-4">
          {choiceIds.map((id) => {
            const choice = exercise.choices.find((c) => c.choice_id === id)!;
            return (
              <ExerciseCard
                key={`${exercise.exercise_id}-${id}`}
                choice={choice}
                label={id}
                isSelected={selectedChoice === id}
                isDisabled={disabledChoices.includes(id)}
                isHighlighted={isFinished && choice.is_correct}
                onClick={() => selectChoice(id)}
                exerciseId={exercise.exercise_id}
                coordSystem={exercise.coord_system}
                appName={exercise.appName}
              />
            );
          })}
        </div>
      ) : (
        <div className="flex justify-center items-center h-64 text-slate-400 text-base font-medium animate-pulse">
          Chargement de l'environnement interactif…
        </div>
      )}

      {/* Feedback */}
      {feedbackState && (
        <div className="animate-fade-in-up">
          <FeedbackMessage feedbackState={feedbackState} />
        </div>
      )}

      {/* Boutons d'action */}
      <div className="flex justify-between items-center">
        <button
          onClick={newExercise}
          className="flex items-center gap-2 px-4 py-2.5 border border-slate-200 bg-white text-slate-500 text-sm font-medium
            hover:bg-slate-50 hover:text-slate-700 hover:border-slate-300 transition-all duration-200"
        >
          <RefreshCw size={15} />
          Nouvel exercice
        </button>

        {!isFinished ? (
          <button
            disabled={!selectedChoice}
            onClick={() => validate(recordAttempt)}
            className="flex items-center gap-2 px-6 py-3 bg-klein text-white text-base font-semibold
              shadow-lg shadow-klein/20 hover:shadow-klein/40 hover:-translate-y-0.5 active:translate-y-0
              disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-none transition-all duration-200"
          >
            <CheckCircle2 size={18} />
            Valider
          </button>
        ) : (
          <button
            onClick={nextExercise}
            className="flex items-center gap-2 px-6 py-3 bg-mimo-red text-white text-base font-semibold
              shadow-lg shadow-mimo-red/20 hover:shadow-mimo-red/40 hover:-translate-y-0.5 active:translate-y-0 transition-all duration-200 animate-scale-in"
          >
            Exercice suivant
            <ArrowRight size={18} />
          </button>
        )}
      </div>
    </div>
  );
}
