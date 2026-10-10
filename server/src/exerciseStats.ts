// Per-exercise weight/reps history: the best set ever, and the most recent
// earlier session to compare against.

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

export interface ExerciseStats {
  // Best set ever: highest weight, ties broken by most reps, then most recent.
  max: StatSet & { date: string };
  // Sets from the most recent workout with recorded weight/reps. If that
  // workout contains the max set, this is the workout before it instead
  // (isPrevious = true), so the two lines never repeat the same set.
  // Null when there is no such workout.
  last: { date: string; sets: StatSet[]; isPrevious: boolean } | null;
}

// Null sorts below any value.
function compareSets(a: StatSet, b: StatSet): number {
  const wa = a.weight ?? -1;
  const wb = b.weight ?? -1;
  if (wa !== wb) return wa - wb;
  return (a.reps ?? -1) - (b.reps ?? -1);
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

    // Workouts in most-recent-first order.
    const workoutIds: number[] = [];
    for (const row of list) {
      if (!workoutIds.includes(row.workout_id)) workoutIds.push(row.workout_id);
    }
    const isPrevious = workoutIds[0] === max.workout_id;
    const lastWorkoutId = isPrevious ? workoutIds[1] : workoutIds[0];
    const lastRows = list.filter((r) => r.workout_id === lastWorkoutId);

    result.set(exerciseId, {
      max: { weight: max.weight, reps: max.reps, date: max.workout_date },
      last:
        lastRows.length > 0
          ? {
              date: lastRows[0].workout_date,
              sets: lastRows.map((r) => ({ weight: r.weight, reps: r.reps })),
              isPrevious,
            }
          : null,
    });
  }
  return result;
}
