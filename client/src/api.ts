import type { StatusResponse, WorkoutLog } from "./types";

const BASE = "/api";

export async function fetchStatus(): Promise<StatusResponse> {
  const res = await fetch(`${BASE}/status`);
  if (!res.ok) throw new Error("Failed to fetch status");
  return res.json();
}

export async function fetchHistory(): Promise<WorkoutLog[]> {
  const res = await fetch(`${BASE}/history`);
  if (!res.ok) throw new Error("Failed to fetch history");
  return res.json();
}

export async function startWorkout(dayId: number): Promise<{ id: number; started_at: string }> {
  const res = await fetch(`${BASE}/workouts/start`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ dayId }),
  });
  if (!res.ok) throw new Error("Failed to start workout");
  return res.json();
}

export async function toggleExercise(workoutId: number, exerciseId: number): Promise<{ toggled: boolean }> {
  const res = await fetch(`${BASE}/workouts/${workoutId}/toggle`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ exerciseId }),
  });
  if (!res.ok) throw new Error("Failed to toggle exercise");
  return res.json();
}

export async function finishWorkout(workoutId: number): Promise<void> {
  const res = await fetch(`${BASE}/workouts/${workoutId}/finish`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to finish workout");
}

export async function abortWorkout(workoutId: number): Promise<void> {
  const res = await fetch(`${BASE}/workouts/${workoutId}/abort`, {
    method: "POST",
  });
  if (!res.ok) throw new Error("Failed to abort workout");
}

export async function fetchSettings(): Promise<Record<string, unknown>> {
  const res = await fetch(`${BASE}/settings`);
  if (!res.ok) throw new Error("Failed to fetch settings");
  return res.json();
}

export async function updateSettings(settings: Record<string, unknown>): Promise<void> {
  const res = await fetch(`${BASE}/settings`, {
    method: "PUT",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(settings),
  });
  if (!res.ok) throw new Error("Failed to update settings");
}
