import { test } from "node:test";
import assert from "node:assert/strict";
import { computeExerciseStats, HISTORY_LIMIT, type StatSetRow } from "./exerciseStats";

let nextId = 1;
function row(
  workout_id: number,
  workout_date: string,
  weight: number | null,
  reps: number | null,
  exercise_id = 1
): StatSetRow {
  return { set_id: nextId++, workout_id, exercise_id, workout_date, weight, reps };
}

test("no recorded weight/reps yields no stats", () => {
  const stats = computeExerciseStats([row(1, "2026-10-01", null, null)]);
  assert.equal(stats.size, 0);
});

test("max is highest weight, ties broken by most reps", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 130, 10),
    row(2, "2026-10-05", 135, 6),
    row(1, "2026-10-01", 135, 8),
  ]).get(1)!;
  assert.deepEqual(stats.max, { weight: 135, reps: 8, date: "2026-10-01" });
});

test("exact max ties go to the most recent set", () => {
  const stats = computeExerciseStats([
    row(2, "2026-10-05", 135, 8),
    row(1, "2026-10-01", 135, 8),
  ]).get(1)!;
  assert.equal(stats.max.date, "2026-10-05");
});

test("weight beats reps, and any weight beats none", () => {
  const stats = computeExerciseStats([
    row(2, "2026-10-05", null, 30),
    row(1, "2026-10-01", 10, 1),
  ]).get(1)!;
  assert.deepEqual(stats.max, { weight: 10, reps: 1, date: "2026-10-01" });
});

test("reps-only exercises use reps for max", () => {
  const stats = computeExerciseStats([
    row(2, "2026-10-05", null, 12),
    row(1, "2026-10-01", null, 15),
  ]).get(1)!;
  assert.deepEqual(stats.max, { weight: null, reps: 15, date: "2026-10-01" });
});

test("last is every recorded set of the most recent workout", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 125, 10),
    row(3, "2026-10-08", null, null), // ignored: nothing recorded
    row(3, "2026-10-08", 125, 9),
    row(2, "2026-10-05", 135, 8),
  ]).get(1)!;
  assert.deepEqual(stats.last, {
    date: "2026-10-08",
    sets: [
      { weight: 125, reps: 10 },
      { weight: 125, reps: 9 },
    ],
    isPrevious: false,
  });
});

test("when the last workout holds the max, last is the workout before it", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 140, 5),
    row(3, "2026-10-08", 120, 10),
    row(2, "2026-10-05", 135, 8),
    row(1, "2026-10-01", 130, 8),
  ]).get(1)!;
  assert.deepEqual(stats.max, { weight: 140, reps: 5, date: "2026-10-08" });
  assert.deepEqual(stats.last, {
    date: "2026-10-05",
    sets: [{ weight: 135, reps: 8 }],
    isPrevious: true,
  });
});

test("a single workout holding the max has no last", () => {
  const stats = computeExerciseStats([row(1, "2026-10-01", 135, 8)]).get(1)!;
  assert.equal(stats.last, null);
});

test("workouts without recorded data are skipped when finding last", () => {
  const stats = computeExerciseStats([
    row(4, "2026-10-09", null, null),
    row(3, "2026-10-08", 140, 5),
    row(2, "2026-10-07", null, null),
    row(1, "2026-10-01", 130, 8),
  ]).get(1)!;
  assert.equal(stats.last?.date, "2026-10-01");
  assert.equal(stats.last?.isPrevious, true);
});

test("exercises are computed independently", () => {
  const stats = computeExerciseStats([
    row(2, "2026-10-05", 50, 10, 7),
    row(1, "2026-10-01", 200, 3, 9),
  ]);
  assert.equal(stats.get(7)!.max.weight, 50);
  assert.equal(stats.get(9)!.max.weight, 200);
});

test("rep-range maxes keep a heavy low-rep set visible", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 100, 20),
    row(2, "2026-10-05", 150, 3),
    row(1, "2026-10-01", 120, 8),
  ]).get(1)!;
  assert.deepEqual(stats.rangeMaxes, {
    low: { weight: 150, reps: 3, date: "2026-10-05" },
    mid: { weight: 120, reps: 8, date: "2026-10-01" },
    high: { weight: 100, reps: 20, date: "2026-10-08" },
  });
});

test("rep-range boundaries are 1-5, 6-10 and 11+", () => {
  const stats = computeExerciseStats([
    row(1, "2026-10-01", 50, 5),
    row(1, "2026-10-01", 40, 6),
    row(1, "2026-10-01", 30, 10),
    row(1, "2026-10-01", 20, 11),
  ]).get(1)!;
  assert.equal(stats.rangeMaxes.low?.reps, 5);
  assert.deepEqual(stats.rangeMaxes.mid, { weight: 40, reps: 6, date: "2026-10-01" });
  assert.equal(stats.rangeMaxes.high?.reps, 11);
});

test("rep-range ties go to most reps, then the most recent set", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 135, 7),
    row(2, "2026-10-05", 135, 9),
    row(1, "2026-10-01", 135, 9),
  ]).get(1)!;
  assert.deepEqual(stats.rangeMaxes.mid, { weight: 135, reps: 9, date: "2026-10-05" });
});

test("rep ranges without a set with both weight and reps are null", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 200, null),
    row(2, "2026-10-05", null, 3),
    row(1, "2026-10-01", 50, 0),
    row(1, "2026-10-01", 60, 12),
  ]).get(1)!;
  assert.deepEqual(stats.rangeMaxes, {
    low: null,
    mid: null,
    high: { weight: 60, reps: 12, date: "2026-10-01" },
  });
});

test("history lists recorded sets per workout, most recent first", () => {
  const stats = computeExerciseStats([
    row(3, "2026-10-08", 140, 5),
    row(3, "2026-10-08", null, null), // ignored: nothing recorded
    row(3, "2026-10-08", 120, 10),
    row(2, "2026-10-05", null, null), // workout with nothing recorded
    row(1, "2026-10-01", 130, 8),
  ]).get(1)!;
  assert.deepEqual(stats.history, [
    {
      date: "2026-10-08",
      sets: [
        { weight: 140, reps: 5 },
        { weight: 120, reps: 10 },
      ],
    },
    { date: "2026-10-01", sets: [{ weight: 130, reps: 8 }] },
  ]);
});

test("history keeps two workouts on the same date apart", () => {
  const stats = computeExerciseStats([
    row(2, "2026-10-05", 100, 5),
    row(1, "2026-10-05", 90, 5),
  ]).get(1)!;
  assert.equal(stats.history.length, 2);
});

test("history is capped at the most recent HISTORY_LIMIT workouts", () => {
  const rows: StatSetRow[] = [];
  for (let w = HISTORY_LIMIT + 3; w >= 1; w--) {
    rows.push(row(w, `2026-09-${String(w).padStart(2, "0")}`, 100 + w, 5));
  }
  const history = computeExerciseStats(rows).get(1)!.history;
  assert.equal(history.length, HISTORY_LIMIT);
  assert.equal(history[0].date, `2026-09-${HISTORY_LIMIT + 3}`);
  assert.equal(history[HISTORY_LIMIT - 1].date, "2026-09-04");
});
