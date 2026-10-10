import { test } from "node:test";
import assert from "node:assert/strict";
import { computeExerciseStats, type StatSetRow } from "./exerciseStats";

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
