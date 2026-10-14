import { test } from "node:test";
import assert from "node:assert/strict";
import { exerciseNameKey, findDuplicateExercise } from "./exerciseNames";

const area = [
  { id: 1, name: "Bench Press" },
  { id: 2, name: "Cable Fly" },
  { id: 3, name: "General" },
];

test("name key ignores case and surrounding whitespace", () => {
  assert.equal(exerciseNameKey("  Bench PRESS \t"), "bench press");
});

test("finds an exact match", () => {
  assert.equal(findDuplicateExercise(area, "Cable Fly")?.id, 2);
});

test("finds a match differing only in case or surrounding whitespace", () => {
  assert.equal(findDuplicateExercise(area, "bench press")?.id, 1);
  assert.equal(findDuplicateExercise(area, "  BENCH PRESS  ")?.id, 1);
});

test("matches the placeholder name too", () => {
  assert.equal(findDuplicateExercise(area, "general")?.id, 3);
});

test("different names are not duplicates", () => {
  assert.equal(findDuplicateExercise(area, "Bench"), undefined);
  assert.equal(findDuplicateExercise(area, "Incline Bench Press"), undefined);
  assert.equal(findDuplicateExercise(area, "Bench  Press"), undefined);
  assert.equal(findDuplicateExercise([], "Bench Press"), undefined);
});
