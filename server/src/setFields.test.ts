import { test } from "node:test";
import assert from "node:assert/strict";
import { parseSetFields } from "./setFields";

test("omitted fields are left out", () => {
  assert.deepEqual(parseSetFields({}), { fields: {} });
});

test("null and empty string clear a field", () => {
  assert.deepEqual(parseSetFields({ weight: null, reps: "" }), {
    fields: { weight: null, reps: null },
  });
});

test("accepts numbers and numeric strings", () => {
  assert.deepEqual(parseSetFields({ weight: "135.5", reps: 8 }), {
    fields: { weight: 135.5, reps: 8 },
  });
  assert.deepEqual(parseSetFields({ weight: 0, reps: "0" }), {
    fields: { weight: 0, reps: 0 },
  });
});

test("rounds weight to two decimals", () => {
  assert.deepEqual(parseSetFields({ weight: 22.499 }).fields, { weight: 22.5 });
});

test("rejects negative, non-numeric and out-of-range values", () => {
  assert.ok(parseSetFields({ weight: -1 }).error);
  assert.ok(parseSetFields({ weight: "heavy" }).error);
  assert.ok(parseSetFields({ weight: 100000 }).error);
  assert.ok(parseSetFields({ weight: true }).error);
  assert.ok(parseSetFields({ reps: -3 }).error);
  assert.ok(parseSetFields({ reps: Infinity }).error);
});

test("rejects fractional reps", () => {
  assert.match(parseSetFields({ reps: 8.5 }).error ?? "", /whole number/);
});
