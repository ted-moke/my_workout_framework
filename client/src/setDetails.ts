import type { SetDetails } from "./types";

export const WEIGHT_UNIT = "lb";

// "135 lb × 8", "135 lb", "8 reps", or "" when neither is set.
export function formatSetDetails({ weight, reps }: SetDetails): string {
  const hasWeight = weight != null;
  const hasReps = reps != null;
  if (hasWeight && hasReps) return `${weight} ${WEIGHT_UNIT} × ${reps}`;
  if (hasWeight) return `${weight} ${WEIGHT_UNIT}`;
  if (hasReps) return `${reps} ${reps === 1 ? "rep" : "reps"}`;
  return "";
}

// "Oct 8" from a YYYY-MM-DD date, read as a local date.
export function formatShortDay(date: string): string {
  const [y, m, d] = date.split("-").map(Number);
  return new Date(y, m - 1, d).toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
  });
}

// Parse an input's text into a field value: "" clears it, invalid input yields undefined.
export function parseDetailInput(text: string, integer: boolean): number | null | undefined {
  const trimmed = text.trim();
  if (trimmed === "") return null;
  const n = Number(trimmed);
  if (!Number.isFinite(n) || n < 0) return undefined;
  if (integer && !Number.isInteger(n)) return undefined;
  return n;
}
