import type { MisconceptionId } from "./misconception";

export interface AttemptRecord {
  exercise_id: string;
  attempt: 1 | 2;
  selected_choice: string;
  is_correct: boolean;
  misconception_id: MisconceptionId | null;
  timestamp: string;
}
