import type { FeedbackState } from "../types/exercise";
import { CheckCircle2, Lightbulb, XCircle } from "lucide-react";
import LatexText from "./LatexText";

interface FeedbackMessageProps {
  feedbackState: FeedbackState;
}

export default function FeedbackMessage({ feedbackState }: FeedbackMessageProps) {
  const isCorrect =
    feedbackState.type === "correct_1" || feedbackState.type === "correct_2";
  const isWrong1 = feedbackState.type === "wrong_1";

  let bgClass = "bg-emerald-50 border-emerald-300 text-emerald-800 shadow-emerald-500/10";
  let Icon = CheckCircle2;
  let iconColor = "text-emerald-500";

  if (isWrong1) {
    bgClass = "bg-amber-50 border-amber-300 text-amber-800 shadow-amber-500/10";
    Icon = Lightbulb;
    iconColor = "text-amber-500";
  } else if (!isCorrect) {
    bgClass = "bg-rose-50 border-rose-300 text-rose-800 shadow-rose-500/10";
    Icon = XCircle;
    iconColor = "text-rose-500";
  }

  return (
    <div className={`flex items-start gap-4 px-5 py-4 border shadow-sm ${bgClass} text-base leading-relaxed`}>
      <div className={`mt-0.5 shrink-0 ${iconColor}`}>
        <Icon size={24} strokeWidth={2.5} />
      </div>
      <p className="font-medium">
        <LatexText>{feedbackState.message}</LatexText>
      </p>
    </div>
  );
}
