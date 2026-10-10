// Validation for the optional per-set fields (weight, reps).
//
// Each field may be omitted (leave unchanged), null or "" (clear it), or a
// non-negative number. Reps must be a whole number.

export interface SetFields {
  weight?: number | null;
  reps?: number | null;
}

export const MAX_WEIGHT = 99999.99; // NUMERIC(7, 2)
export const MAX_REPS = 100000;

function parseField(
  value: unknown,
  name: string,
  opts: { integer: boolean; max: number }
): { value?: number | null; error?: string } {
  if (value === undefined) return {};
  if (value === null || (typeof value === "string" && value.trim() === "")) {
    return { value: null };
  }
  const n = typeof value === "string" ? Number(value) : value;
  if (typeof n !== "number" || !Number.isFinite(n) || n < 0 || n > opts.max) {
    return { error: `${name} must be a number between 0 and ${opts.max}` };
  }
  if (opts.integer && !Number.isInteger(n)) {
    return { error: `${name} must be a whole number` };
  }
  return { value: opts.integer ? n : Math.round(n * 100) / 100 };
}

export function parseSetFields(body: {
  weight?: unknown;
  reps?: unknown;
}): { fields: SetFields; error?: string } {
  const weight = parseField(body.weight, "weight", { integer: false, max: MAX_WEIGHT });
  if (weight.error) return { fields: {}, error: weight.error };
  const reps = parseField(body.reps, "reps", { integer: true, max: MAX_REPS });
  if (reps.error) return { fields: {}, error: reps.error };

  const fields: SetFields = {};
  if ("value" in weight) fields.weight = weight.value;
  if ("value" in reps) fields.reps = reps.value;
  return { fields };
}
