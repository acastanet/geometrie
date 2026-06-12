import type { Choice, ChoiceId } from "../types/exercise";
import GeoGebraRenderer from "./GeoGebraRenderer";

interface ExerciseCardProps {
  choice: Choice;
  label: ChoiceId;
  isSelected: boolean;
  isDisabled: boolean;
  isHighlighted: boolean;
  onClick: () => void;
  exerciseId: string;
  coordSystem?: [number, number, number, number];
  appName?: string;
}

export default function ExerciseCard({
  choice,
  label,
  isSelected,
  isDisabled,
  isHighlighted,
  onClick,
  exerciseId,
  coordSystem,
  appName,
}: ExerciseCardProps) {
  let cardClass = "bg-white border-2 border-transparent shadow-md hover:shadow-xl hover:-translate-y-1";
  let labelClass = "text-slate-400 bg-slate-50";

  if (isHighlighted) {
    cardClass = "bg-white border-2 border-emerald-400 shadow-lg shadow-emerald-500/20 ring-4 ring-emerald-100 scale-[1.02] z-10";
    labelClass = "text-emerald-700 bg-emerald-50 font-bold";
  } else if (isSelected) {
    cardClass = "bg-white border-2 border-klein shadow-lg shadow-klein/20 ring-4 ring-klein/10 scale-[1.02] z-10";
    labelClass = "text-klein bg-klein/5 font-bold";
  } else if (isDisabled) {
    cardClass = "bg-white border-2 border-slate-100 opacity-40 grayscale-[50%] saturate-50";
    labelClass = "text-slate-300 bg-slate-50";
  }

  return (
    <button
      onClick={onClick}
      disabled={isDisabled && !isHighlighted}
      className={`
        flex flex-col items-center p-4
        transition-all duration-300 ease-out cursor-pointer select-none
        ${cardClass}
        ${isDisabled && !isHighlighted ? "cursor-not-allowed hover:-translate-y-0 hover:shadow-md" : ""}
      `}
    >
      <div className={`mb-3 px-4 py-1.5 text-sm font-semibold tracking-wide transition-colors ${labelClass}`}>
        Figure {label}
      </div>
      <div className="overflow-hidden bg-white">
        <GeoGebraRenderer
          key={`${exerciseId}-${label}`}
          containerId={`ggb-${exerciseId}-${label}`}
          commands={choice.construction_commands}
          width={240}
          height={240}
          coordSystem={coordSystem}
          appName={appName}
        />
      </div>
    </button>
  );
}
