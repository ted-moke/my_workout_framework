// Per-exercise weight/reps history: the best set ever, the most recent
// earlier session to compare against, the best weight per rep range, and the
// recent sessions.

export interface StatSetRow {
  set_id: number;
  workout_id: number;
  exercise_id: number;
  workout_date: string; // YYYY-MM-DD
  weight: number | null;
  reps: number | null;
}

export interface StatSet {
  weight: number | null;
  reps: number | null;
}

// Fixed rep ranges for the per-range maxes, so a heavy low-rep set isn't
// hidden by a lighter high-rep one.
export const REP_RANGES = [
  { key: "low", min: 1, max: 5 },
  { key: "mid", min: 6, max: 10 },
  { key: "high", min: 11, max: Infinity },
] as const;

export type RepRangeKey = (typeof REP_RANGES)[number]["key"];

// Number of recent sessions returned in history.
export const HISTORY_LIMIT = 10;

export interface ExerciseStats {
  // Best set ever: highest weight, ties broken by most reps, then most recent.
  max: StatSet & { date: string };
  // Sets from the most recent workout with recorded weight/reps. If that
  // workout contains the max set, this is the workout before it instead
  // (isPrevious = true), so the two lines never repeat the same set.
  // Null when there is no such workout.
  last: { date: string; sets: StatSet[]; isPrevious: boolean } | null;
  // Best set per rep range, by weight then reps then recency. Only sets with
  // both weight and reps count. Null when a range has no such set.
  rangeMaxes: Record<RepRangeKey, (StatSet & { date: string }) | null>;
  // Recorded sets of the most recent workouts, most recent first, at most
  // HISTORY_LIMIT of them.
  history: { date: string; sets: StatSet[] }[];
}

// Null sorts below any value.
function compareSets(a: StatSet, b: StatSet): number {
  const wa = a.weight ?? -1;
  const wb = b.weight ?? -1;
  if (wa !== wb) return wa - wb;
  return (a.reps ?? -1) - (b.reps ?? -1);
}

function toStatSet(row: StatSetRow): StatSet {
  return { weight: row.weight, reps: row.reps };
}

// Rows must be ordered most recent workout first (date, then workout id
// descending) and by set id within a workout. Rows without weight or reps
// are ignored.
export function computeExerciseStats(rows: StatSetRow[]): Map<number, ExerciseStats> {
  const byExercise = new Map<number, StatSetRow[]>();
  for (const row of rows) {
    if (row.weight == null && row.reps == null) continue;
    const list = byExercise.get(row.exercise_id) ?? [];
    list.push(row);
    byExercise.set(row.exercise_id, list);
  }

  const result = new Map<number, ExerciseStats>();
  for (const [exerciseId, list] of byExercise) {
    // Strict ">" keeps the earliest-seen (most recent) row on ties.
    let max = list[0];
    for (const row of list) {
      if (compareSets(row, max) > 0) max = row;
    }

    // Rows grouped by workout, most recent workout first.
    const workouts: StatSetRow[][] = [];
    for (const row of list) {
      const current = workouts[workouts.length - 1];
      if (current && current[0].workout_id === row.workout_id) current.push(row);
      else workouts.push([row]);
    }
    const isPrevious = workouts[0][0].workout_id === max.workout_id;
    const lastRows = (isPrevious ? workouts[1] : workouts[0]) ?? [];

    const rangeMaxes = {} as ExerciseStats["rangeMaxes"];
    for (const range of REP_RANGES) {
      let best: StatSetRow | null = null;
      for (const row of list) {
        if (row.weight == null || row.reps == null) continue;
        if (row.reps < range.min || row.reps > range.max) continue;
        if (!best || compareSets(row, best) > 0) best = row;
      }
      rangeMaxes[range.key] = best
        ? { weight: best.weight, reps: best.reps, date: best.workout_date }
        : null;
    }

    result.set(exerciseId, {
      max: { weight: max.weight, reps: max.reps, date: max.workout_date },
      last:
        lastRows.length > 0
          ? {
              date: lastRows[0].workout_date,
              sets: lastRows.map(toStatSet),
              isPrevious,
            }
          : null,
      rangeMaxes,
      history: workouts.slice(0, HISTORY_LIMIT).map((rows) => ({
        date: rows[0].workout_date,
        sets: rows.map(toStatSet),
      })),
    });
  }
  return result;
}
