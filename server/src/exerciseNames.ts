// Exercise names are unique within a body area, ignoring case and surrounding
// whitespace. Equipment doesn't matter: an exercise hidden at home still counts.

export function exerciseNameKey(name: string): string {
  return name.trim().toLowerCase();
}

export function findDuplicateExercise<T extends { name: string }>(
  existing: T[],
  name: string
): T | undefined {
  const key = exerciseNameKey(name);
  return existing.find((e) => exerciseNameKey(e.name) === key);
}
