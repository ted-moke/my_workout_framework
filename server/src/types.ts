// Database row types

export interface DbUser {
  id: number;
  name: string;
  active_plan_id: number | null;
}

export interface DbBodyArea {
  id: number;
  name: string;
}

export interface DbExercise {
  id: number;
  body_area_id: number;
  name: string;
  daysSinceLast: number | null;
}

export interface DbWorkoutPlan {
  id: number;
  name: string;
  user_id: number;
}

export interface DbFocusArea {
  id: number;
  plan_id: number;
  body_area_id: number;
  pts_per_period: number;
  pts_type: "effort" | "active_minutes";
  period_length_days: number;
}

export interface DbWorkout {
  id: number;
  user_id: number;
  workout_date: string;
  started_at: string;
  completed_at: string | null;
  finished: boolean;
}

export interface DbSet {
  id: number;
  workout_id: number;
  exercise_id: number;
  pts: number;
}

// API response types

export type PtsType = "effort" | "active_minutes";

export interface FocusAreaSuggestion {
  focusArea: {
    id: number;
    bodyArea: DbBodyArea;
    ptsPerPeriod: number;
    ptsType: PtsType;
    periodLengthDays: number;
  };
  ptsFulfilled: number;
  daysSinceLast: number | null;
  overdueFraction: number;
  fulfillmentFraction: number;
  priority: number;
  exercises: DbExercise[];
}

export interface SuggestionsResponse {
  suggestions: FocusAreaSuggestion[];
  activeWorkout: ActiveWorkoutResponse | null;
}

export interface ActiveWorkoutResponse {
  workout: DbWorkout;
  sets: SetWithDetails[];
}

export interface SetWithDetails {
  id: number;
  workout_id: number;
  exercise_id: number;
  pts: number;
  exercise_name: string;
  body_area_name: string;
}

export interface PlanWithFocusAreas extends DbWorkoutPlan {
  focusAreas: (DbFocusArea & { body_area_name: string })[];
}

export interface WorkoutWithSets extends DbWorkout {
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
