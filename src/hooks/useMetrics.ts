import { useState } from "react";
import type { AttemptRecord } from "../types/metrics";

export function useMetrics() {
  const [records, setRecords] = useState<AttemptRecord[]>([]);

  function recordAttempt(record: AttemptRecord) {
    setRecords((prev) => [...prev, record]);
  }

  return { records, recordAttempt };
}
