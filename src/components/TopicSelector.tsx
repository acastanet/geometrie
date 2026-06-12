import type { Concept } from "../types/exercise";

interface Topic {
  id: Concept;
  label: string;
  shortLabel: string;
  hasLevel2: boolean;
}

const TOPICS: Topic[] = [
  { id: "geometrie_repere", label: "Géométrie repérée (distance, milieu, projeté)", shortLabel: "Géométrie repérée", hasLevel2: true },
  { id: "vecteurs", label: "Vecteurs et colinéarité", shortLabel: "Vecteurs", hasLevel2: true },
  { id: "equation_droite", label: "Équations de droites (réduite, cartésienne, graphique)", shortLabel: "Droites", hasLevel2: true },
  { id: "positions_relatives", label: "Positions relatives de droites", shortLabel: "Positions relatives", hasLevel2: true },
  { id: "ia", label: "Exercices générés par IA (Mistral)", shortLabel: "IA ✨", hasLevel2: true },
];

interface TopicSelectorProps {
  concept: Concept;
  difficulty: 1 | 2;
  onConceptChange: (concept: Concept) => void;
  onDifficultyChange: (difficulty: 1 | 2) => void;
}

export default function TopicSelector({
  concept,
  difficulty,
  onConceptChange,
  onDifficultyChange,
}: TopicSelectorProps) {
  const activeTopic = TOPICS.find((t) => t.id === concept)!;

  return (
    <div className="flex flex-col gap-2 w-full max-w-4xl mx-auto px-4">
      {/* Sélection du sujet */}
      <div className="flex gap-2 flex-wrap">
        {TOPICS.map((topic) => {
          const isActive = topic.id === concept;
          return (
            <button
              key={topic.id}
              onClick={() => onConceptChange(topic.id)}
              className={`px-4 py-2 rounded-xl text-sm font-semibold transition-all duration-200 ${
                isActive
                  ? "bg-klein text-white shadow-md shadow-klein/30"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-klein/40 hover:text-klein"
              }`}
            >
              {topic.shortLabel}
            </button>
          );
        })}
      </div>

      {/* Sélection du niveau */}
      {activeTopic.hasLevel2 && (
        <div className="flex gap-2 items-center">
          <span className="text-xs font-medium text-slate-400 uppercase tracking-wide">Niveau</span>
          {([1, 2] as const).map((lvl) => (
            <button
              key={lvl}
              onClick={() => onDifficultyChange(lvl)}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200 ${
                difficulty === lvl
                  ? "bg-mimo-red text-white shadow-sm shadow-mimo-red/30"
                  : "bg-white border border-slate-200 text-slate-500 hover:border-mimo-red/40 hover:text-mimo-red"
              }`}
            >
              {lvl === 1 ? "Découverte" : "Approfondissement"}
            </button>
          ))}
        </div>
      )}
    </div>
  );
}
