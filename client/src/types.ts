export interface FocusArea {
  id: number;
  name: string;
  isForToday?: boolean;
}

export interface Exercise {
  id: number;
  name: string;
  focus_area_id: number;
  last_done: string | null;
  suggested: boolean;
}

export interface ExerciseGroup {
  focusArea: FocusArea;
  exercises: Exercise[];
}

export interface DayInfo {
  day_id: number;
  day_number: number;
  optional: boolean;
  focus_areas: FocusArea[];
}

export interface ActiveWorkout {
  id: number;
  started_at: string;
  day_number: number;
  day_id: number;
}

export interface StatusResponse {
  nextDay: DayInfo;
  allExerciseGroups: ExerciseGroup[];
  activeWorkout: ActiveWorkout | null;
  activeExerciseIds: number[];
  lastWorkout: {
    id: number;
    completed_at: string;
    day_number: number;
  } | null;
}

export interface WorkoutLog {
  id: number;
  completed_at: string;
  workout_date: string | null;
  day_number: number;
  focus_areas: FocusArea[];
  exercises: { id: number; name: string; focus_area: string }[];
}

export interface DayOption {
  day_id: number;
  day_number: number;
  optional: boolean;
  focus_areas: FocusArea[];
}
