// Domain types

export type PtsType = "effort" | "active_minutes";

export type WorkoutLocation = "home" | "gym";

export interface User {
  id: number;
  name: string;
  active_plan_id: number | null;
  workout_location: WorkoutLocation;
}

export interface BodyArea {
  id: number;
  name: string;
}

export interface Equipment {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  body_area_id: number;
  name: string;
  is_placeholder: boolean;
  daysSinceLast: number | null;
  equipment: Equipment[];
}

export interface WorkoutPlan {
  id: number;
  name: string;
  user_id: number;
}

export interface FocusArea {
  id: number;
  plan_id: number;
  body_area_id: number;
  pts_per_period: number;
  pts_type: PtsType;
  period_length_days: number;
  color_index: number;
}

export interface Workout {
  id: number;
  user_id: number;
  workout_date: string;
  started_at: string;
  completed_at: string | null;
  finished: boolean;
}

export interface WorkoutSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  pts: number;
  weight: number | null;
  reps: number | null;
}

export interface StatSet {
  weight: number | null;
  reps: number | null;
}

// Past weight/reps for one exercise, from finished workouts only.
export interface ExerciseStats {
  max: StatSet & { date: string };
  // Most recent workout's sets, or the one before it when that workout holds
  // the max (isPrevious = true).
  last: { date: string; sets: StatSet[]; isPrevious: boolean } | null;
}

export interface SetDetails {
  weight?: number | null;
  reps?: number | null;
}

// API response types

export interface SetWithDetails extends WorkoutSet {
  exercise_name: string;
  body_area_name: string;
}

export interface FocusAreaSuggestion {
  focusArea: {
    id: number;
    bodyArea: BodyArea;
    ptsPerPeriod: number;
    ptsType: PtsType;
    periodLengthDays: number;
    colorIndex: number;
  };
  ptsFulfilled: number;
  ptsExpiring1d: number;
  ptsExpiring2d: number;
  daysSinceLast: number | null;
  overdueFraction: number;
  fulfillmentFraction: number;
  priority: number;
  exercises: Exercise[];
}

export interface ActiveWorkoutResponse {
  workout: Workout;
  sets: SetWithDetails[];
}

export interface SuggestionsResponse {
  suggestions: FocusAreaSuggestion[];
  activeWorkout: ActiveWorkoutResponse | null;
}

export interface PlanWithFocusAreas extends WorkoutPlan {
  focusAreas: (FocusArea & { body_area_name: string })[];
}

export interface WorkoutWithSets extends Workout {
  sets: SetWithDetails[];
}

export interface CreatePlanBody {
  name: string;
  focusAreas: {
    bodyAreaId: number;
    ptsPerPeriod: number;
    ptsType: PtsType;
    periodLengthDays: number;
    colorIndex: number;
  }[];
}
