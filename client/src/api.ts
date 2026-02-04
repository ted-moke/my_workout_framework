import type {
  User,
  BodyArea,
  Exercise,
  Workout,
  WorkoutSet,
  SuggestionsResponse,
  PlanWithFocusAreas,
  WorkoutWithSets,
  ActiveWorkoutResponse,
  CreatePlanBody,
} from "./types";

const BASE = "/api";

async function json<T>(res: Response): Promise<T> {
  if (!res.ok) {
    const body = await res.text().catch(() => "");
    throw new Error(body || res.statusText);
  }
  return res.json();
}

// --- Users ---

export function fetchUsers(): Promise<User[]> {
  return fetch(`${BASE}/users`).then((r) => json<User[]>(r));
}

export function createUser(name: string): Promise<User> {
  return fetch(`${BASE}/users`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name }),
  }).then((r) => json<User>(r));
}

export function setActivePlan(userId: number, planId: number | null): Promise<User> {
  return fetch(`${BASE}/users/${userId}/active-plan`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ planId }),
  }).then((r) => json<User>(r));
}

// --- Plans ---

export function fetchPlans(userId: number): Promise<PlanWithFocusAreas[]> {
  return fetch(`${BASE}/users/${userId}/plans`).then((r) =>
    json<PlanWithFocusAreas[]>(r)
  );
}

export function createPlan(
  userId: number,
  plan: CreatePlanBody
): Promise<PlanWithFocusAreas> {
  return fetch(`${BASE}/users/${userId}/plans`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  }).then((r) => json<PlanWithFocusAreas>(r));
}

export function updatePlan(
  planId: number,
  plan: CreatePlanBody
): Promise<PlanWithFocusAreas> {
  return fetch(`${BASE}/plans/${planId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(plan),
  }).then((r) => json<PlanWithFocusAreas>(r));
}

export function deletePlan(planId: number): Promise<void> {
  return fetch(`${BASE}/plans/${planId}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("Failed to delete plan");
  });
}

// --- Body Areas & Exercises ---

export function fetchBodyAreas(): Promise<BodyArea[]> {
  return fetch(`${BASE}/body-areas`).then((r) => json<BodyArea[]>(r));
}

export function fetchExercises(): Promise<(Exercise & { body_area_name: string })[]> {
  return fetch(`${BASE}/exercises`).then((r) =>
    json<(Exercise & { body_area_name: string })[]>(r)
  );
}

export function createExercise(
  name: string,
  bodyAreaId: number
): Promise<Exercise & { body_area_name: string }> {
  return fetch(`${BASE}/exercises`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, bodyAreaId }),
  }).then((r) => json<Exercise & { body_area_name: string }>(r));
}

export function updateExercise(
  id: number,
  name: string,
  bodyAreaId: number
): Promise<Exercise & { body_area_name: string }> {
  return fetch(`${BASE}/exercises/${id}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ name, bodyAreaId }),
  }).then((r) => json<Exercise & { body_area_name: string }>(r));
}

export function deleteExercise(id: number): Promise<void> {
  return fetch(`${BASE}/exercises/${id}`, { method: "DELETE" }).then(async (r) => {
    if (!r.ok) {
      const body = await r.json().catch(() => ({ error: "Failed to delete exercise" }));
      throw new Error(body.error || "Failed to delete exercise");
    }
  });
}

// --- Suggestions ---

export function fetchSuggestions(userId: number): Promise<SuggestionsResponse> {
  return fetch(`${BASE}/users/${userId}/suggestions`).then((r) =>
    json<SuggestionsResponse>(r)
  );
}

// --- Workouts ---

export function startWorkout(userId: number, workoutDate?: string): Promise<Workout> {
  return fetch(`${BASE}/users/${userId}/workouts/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workoutDate }),
  }).then((r) => json<Workout>(r));
}

export function finishWorkout(workoutId: number): Promise<Workout> {
  return fetch(`${BASE}/workouts/${workoutId}/finish`, {
    method: "POST",
  }).then((r) => json<Workout>(r));
}

export function abortWorkout(workoutId: number): Promise<void> {
  return fetch(`${BASE}/workouts/${workoutId}/abort`, {
    method: "POST",
  }).then((r) => {
    if (!r.ok) throw new Error("Failed to abort workout");
  });
}

export function fetchActiveWorkout(
  userId: number
): Promise<ActiveWorkoutResponse | null> {
  return fetch(`${BASE}/users/${userId}/workouts/active`).then((r) =>
    json<ActiveWorkoutResponse | null>(r)
  );
}

export function updateWorkoutDate(workoutId: number, workoutDate: string): Promise<Workout> {
  return fetch(`${BASE}/workouts/${workoutId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ workoutDate }),
  }).then((r) => json<Workout>(r));
}

export function deleteWorkout(workoutId: number): Promise<void> {
  return fetch(`${BASE}/workouts/${workoutId}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("Failed to delete workout");
  });
}

export function fetchHistory(userId: number): Promise<WorkoutWithSets[]> {
  return fetch(`${BASE}/users/${userId}/history`).then((r) =>
    json<WorkoutWithSets[]>(r)
  );
}

// --- Sets ---

export function addSet(
  workoutId: number,
  exerciseId: number,
  pts: number
): Promise<WorkoutSet> {
  return fetch(`${BASE}/workouts/${workoutId}/sets`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId, pts }),
  }).then((r) => json<WorkoutSet>(r));
}

export function removeSet(setId: number): Promise<void> {
  return fetch(`${BASE}/sets/${setId}`, { method: "DELETE" }).then((r) => {
    if (!r.ok) throw new Error("Failed to remove set");
  });
}

export function updateSet(setId: number, pts: number): Promise<WorkoutSet> {
  return fetch(`${BASE}/sets/${setId}`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ pts }),
  }).then((r) => json<WorkoutSet>(r));
}
