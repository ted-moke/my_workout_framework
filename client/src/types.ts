// Domain types

export type PtsType = "effort" | "active_minutes";

export interface User {
  id: number;
  name: string;
  active_plan_id: number | null;
}

export interface BodyArea {
  id: number;
  name: string;
}

export interface Exercise {
  id: number;
  body_area_id: number;
  name: string;
  daysSinceLast: number | null;
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
  };
  ptsFulfilled: number;
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
  }[];
}
